package com.cryptotracker.server;

import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.cryptotracker.database.DatabaseManager;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;
import java.sql.*;
import java.util.*;

public class WebServer {
    // Endpoints del API
    private static final String STATUS_ENDPOINT = "/status";
    private static final String API_PRICES_CURRENT = "/prices/current";
    private static final String API_PRICES_HISTORY = "/prices/history";
    private static final String API_CRYPTOS = "/cryptos";
    
    private final int port;
    private HttpServer server;
    private final ObjectMapper objectMapper;
    private DatabaseManager dbManager;
    
    // Variable para indicar si este nodo es líder
    private boolean isLeader = false;
    
    public WebServer(int port) {
        this.port = port;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }
    
    public void setDatabaseManager(DatabaseManager dbManager) {
        this.dbManager = dbManager;
    }
    
    public void setLeaderStatus(boolean isLeader) {
        this.isLeader = isLeader;
    }
    
    public void startServer() {
        try {
            this.server = HttpServer.create(new InetSocketAddress(port), 0);
        } catch (IOException e) {
            e.printStackTrace();
            return;
        }
        
        // Crear contextos para cada endpoint
        HttpContext statusContext = server.createContext(STATUS_ENDPOINT);
        HttpContext currentPricesContext = server.createContext(API_PRICES_CURRENT);
        HttpContext historicalPricesContext = server.createContext(API_PRICES_HISTORY);
        HttpContext cryptosContext = server.createContext(API_CRYPTOS);
        
        // Asignar handlers
        statusContext.setHandler(this::handleStatusCheckRequest);
        currentPricesContext.setHandler(this::handleCurrentPricesRequest);
        historicalPricesContext.setHandler(this::handleHistoricalPricesRequest);
        cryptosContext.setHandler(this::handleCryptosListRequest);
        
        // Configurar pool de threads
        server.setExecutor(Executors.newFixedThreadPool(10));
        server.start();
        
        System.out.println("Servidor iniciado en puerto " + port);
    }
    
    private void handleStatusCheckRequest(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("get")) {
            exchange.close();
            return;
        }
        
        System.out.println("Se recibió el método HTTP " + exchange.getRequestMethod() + " al acceder al endpoint " + exchange.getRequestURI().getPath());
        
        String responseMessage = "El servidor está vivo\n";
        if (isLeader) {
            responseMessage += "Estado: LÍDER - Ejecutando scraper\n";
        } else {
            responseMessage += "Estado: SEGUIDOR - Sin ejecutar scraper\n";
        }
        
        sendResponse(responseMessage.getBytes(), exchange);
    }
    
    private void handleCurrentPricesRequest(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("get")) {
            exchange.close();
            return;
        }
        
        System.out.println("PETICION DE PRECIOS ACTUALES");
        System.out.println("Método: " + exchange.getRequestMethod());
        System.out.println("URI: " + exchange.getRequestURI());
        
        try {
            // Consulta SQL para obtener precios actuales
            String sql = """
                SELECT c.id, c.symbol, c.name, p.price, p.price_time 
                FROM crypto c
                INNER JOIN (
                    SELECT crypto_id, MAX(price_time) as max_time
                    FROM prices
                    GROUP BY crypto_id
                ) latest ON c.id = latest.crypto_id
                INNER JOIN prices p ON p.crypto_id = latest.crypto_id 
                    AND p.price_time = latest.max_time
                ORDER BY c.id
            """;
            
            List<Map<String, Object>> prices = new ArrayList<>();
            
            try (Connection conn = dbManager.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {
                
                while (rs.next()) {
                    Map<String, Object> crypto = new HashMap<>();
                    crypto.put("id", rs.getInt("id"));
                    crypto.put("symbol", rs.getString("symbol"));
                    crypto.put("name", rs.getString("name"));
                    crypto.put("price", rs.getDouble("price"));
                    crypto.put("timestamp", rs.getTimestamp("price_time").toString());
                    prices.add(crypto);
                    
                    // Print para debugging
                    System.out.println("Crypto: " + rs.getString("symbol") + 
                                     " - Price: $" + rs.getDouble("price") + 
                                     " - Time: " + rs.getTimestamp("price_time"));
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", prices);
            response.put("count", prices.size());
            
            String jsonResponse = objectMapper.writeValueAsString(response);
            
            System.out.println("Total cryptos returned: " + prices.size());
            System.out.println("JSON Response: " + jsonResponse);
            
            // Configurar CORS
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            
            sendResponse(jsonResponse.getBytes(), exchange);
            
        } catch (Exception e) {
            System.err.println("ERROR en current prices: " + e.getMessage());
            e.printStackTrace();
            
            String errorJson = "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, errorJson.getBytes().length);
            sendResponse(errorJson.getBytes(), exchange);
        }
    }
    
    private void handleHistoricalPricesRequest(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("get")) {
            exchange.close();
            return;
        }
        
        System.out.println("PETICION DE PRECIOS HISTÓRICOS");
        System.out.println("Método: " + exchange.getRequestMethod());
        System.out.println("URI: " + exchange.getRequestURI());
        
        try {
            // Parsear parámetros
            Map<String, String> params = parseQueryParams(exchange.getRequestURI().getQuery());
            String cryptoId = params.get("crypto_id");
            String hours = params.get("hours");
            
            System.out.println("Parámetros recibidos - crypto_id: " + cryptoId + ", hours: " + hours);
            
            if (cryptoId == null) {
                throw new IllegalArgumentException("Parámetro 'crypto_id' es requerido");
            }
            
            int hoursParam = hours != null ? Integer.parseInt(hours) : 24;
            if (hoursParam < 1 || hoursParam > 24) {
                hoursParam = 24;
            }
            
            // Consulta SQL
            String sql = """
                SELECT p.price, p.price_time, c.symbol, c.name
                FROM prices p
                INNER JOIN crypto c ON p.crypto_id = c.id
                WHERE p.crypto_id = ?
                AND p.price_time >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY p.price_time ASC
            """;
            
            List<Map<String, Object>> priceHistory = new ArrayList<>();
            String symbol = "";
            String name = "";
            
            try (Connection conn = dbManager.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                
                stmt.setInt(1, Integer.parseInt(cryptoId));
                stmt.setInt(2, hoursParam);
                
                System.out.println("Ejecutando query para crypto_id=" + cryptoId + " últimas " + hoursParam + " horas");
                
                try (ResultSet rs = stmt.executeQuery()) {
                    int count = 0;
                    while (rs.next()) {
                        if (symbol.isEmpty()) {
                            symbol = rs.getString("symbol");
                            name = rs.getString("name");
                        }
                        
                        Map<String, Object> point = new HashMap<>();
                        point.put("price", rs.getDouble("price"));
                        point.put("timestamp", rs.getTimestamp("price_time").toString());
                        priceHistory.add(point);
                        count++;
                        
                        // Print cada 10 registros para no saturar
                        if (count % 10 == 0) {
                            System.out.println("Registro " + count + " - Price: $" + rs.getDouble("price"));
                        }
                    }
                    System.out.println("Total registros encontrados: " + count);
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("crypto_id", Integer.parseInt(cryptoId));
            response.put("symbol", symbol);
            response.put("name", name);
            response.put("hours", hoursParam);
            response.put("data", priceHistory);
            response.put("count", priceHistory.size());
            
            String jsonResponse = objectMapper.writeValueAsString(response);
            
            System.out.println("Response size: " + priceHistory.size() + " registros");
            System.out.println("Symbol: " + symbol + ", Name: " + name);
            
            // Configurar CORS
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            
            sendResponse(jsonResponse.getBytes(), exchange);
            
        } catch (Exception e) {
            System.err.println("ERROR en historical prices: " + e.getMessage());
            e.printStackTrace();
            
            String errorJson = "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, errorJson.getBytes().length);
            sendResponse(errorJson.getBytes(), exchange);
        }
    }
    
    private void handleCryptosListRequest(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("get")) {
            exchange.close();
            return;
        }
        
        System.out.println("PETICION DE LISTA DE CRIPTOMONEDAS");
        
        try {
            String sql = "SELECT id, symbol, name FROM crypto ORDER BY id";
            
            List<Map<String, Object>> cryptos = new ArrayList<>();
            
            try (Connection conn = dbManager.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {
                
                while (rs.next()) {
                    Map<String, Object> crypto = new HashMap<>();
                    crypto.put("id", rs.getInt("id"));
                    crypto.put("symbol", rs.getString("symbol"));
                    crypto.put("name", rs.getString("name"));
                    cryptos.add(crypto);
                    
                    System.out.println("Crypto: " + rs.getInt("id") + " - " + 
                                     rs.getString("symbol") + " - " + 
                                     rs.getString("name"));
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", cryptos);
            
            String jsonResponse = objectMapper.writeValueAsString(response);
            
            System.out.println("Total cryptos: " + cryptos.size());
            
            // Configurar CORS
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            
            sendResponse(jsonResponse.getBytes(), exchange);
            
        } catch (Exception e) {
            System.err.println("ERROR en cryptos list: " + e.getMessage());
            e.printStackTrace();
            
            String errorJson = "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, errorJson.getBytes().length);
            sendResponse(errorJson.getBytes(), exchange);
        }
    }
    
    private Map<String, String> parseQueryParams(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null) return params;
        
        for (String pair : query.split("&")) {
            String[] keyValue = pair.split("=");
            if (keyValue.length == 2) {
                params.put(keyValue[0], keyValue[1]);
            }
        }
        return params;
    }
    
    private void sendResponse(byte[] responseBytes, HttpExchange exchange) throws IOException {
        exchange.sendResponseHeaders(200, responseBytes.length);
        OutputStream outputStream = exchange.getResponseBody();
        System.out.println("Enviando " + responseBytes.length + " bytes");
        outputStream.write(responseBytes);
        outputStream.flush();
        outputStream.close();
    }
}