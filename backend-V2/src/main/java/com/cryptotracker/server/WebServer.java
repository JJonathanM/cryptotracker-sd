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
    // Endpoint para las graficas
    private static final String API_PRICES_ALL_CRYPTOS = "/prices/all-cryptos";
    private static final String API_PRICES_COMPARE = "/prices/compare";
    private static final String API_PRICES_REGRESSION = "/prices/regression";
    //

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
        
        // contextos para los endpoint de las graficas
        HttpContext allCryptosContext = server.createContext(API_PRICES_ALL_CRYPTOS);
        HttpContext compareContext = server.createContext(API_PRICES_COMPARE);
        HttpContext regressionContext = server.createContext(API_PRICES_REGRESSION);
        //

        // Asignar handlers
        statusContext.setHandler(this::handleStatusCheckRequest);
        currentPricesContext.setHandler(this::handleCurrentPricesRequest);
        historicalPricesContext.setHandler(this::handleHistoricalPricesRequest);
        cryptosContext.setHandler(this::handleCryptosListRequest);
        
        // nuevos headers
        allCryptosContext.setHandler(this::handleAllCryptosRequest);
        compareContext.setHandler(this::handleCompareRequest);
        regressionContext.setHandler(this::handleRegressionRequest);
        // 

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
//nuevos metodos
    private void handleAllCryptosRequest(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("get")) {
            exchange.close();
            return;
        }
        
        System.out.println("PETICION DE TODAS LAS CRIPTOMONEDAS");
        System.out.println("URI: " + exchange.getRequestURI());
        
        try {
            Map<String, String> params = parseQueryParams(exchange.getRequestURI().getQuery());
            String hours = params.get("hours");
            
            int hoursParam = hours != null ? Integer.parseInt(hours) : 24;
            if (hoursParam < 1 || hoursParam > 24) {
                hoursParam = 24;
            }
            
            System.out.println("Obteniendo datos de todas las cryptos para últimas " + hoursParam + " horas");
            
            // Consulta para obtener datos de las cryptos
            String sql = """
                SELECT c.id, c.symbol, c.name, p.price, p.price_time
                FROM prices p
                INNER JOIN crypto c ON p.crypto_id = c.id
                WHERE p.price_time >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY c.id, p.price_time ASC
            """;
            
            Map<String, List<Map<String, Object>>> cryptoData = new LinkedHashMap<>();
            
            try (Connection conn = dbManager.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                
                stmt.setInt(1, hoursParam);
                
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        String symbol = rs.getString("symbol");
                        
                        if (!cryptoData.containsKey(symbol)) {
                            cryptoData.put(symbol, new ArrayList<>());
                        }
                        
                        Map<String, Object> point = new HashMap<>();
                        point.put("crypto_id", rs.getInt("id"));
                        point.put("symbol", symbol);
                        point.put("name", rs.getString("name"));
                        point.put("price", rs.getDouble("price"));
                        point.put("timestamp", rs.getTimestamp("price_time").toString());
                        
                        cryptoData.get(symbol).add(point);
                    }
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("hours", hoursParam);
            response.put("data", cryptoData);
            response.put("crypto_count", cryptoData.size());
            
            String jsonResponse = objectMapper.writeValueAsString(response);
            
            System.out.println("Cryptos encontradas: " + cryptoData.size());
            
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            
            sendResponse(jsonResponse.getBytes(), exchange);
            
        } catch (Exception e) {
            System.err.println("ERROR en all cryptos: " + e.getMessage());
            e.printStackTrace();
            
            String errorJson = "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, errorJson.getBytes().length);
            sendResponse(errorJson.getBytes(), exchange);
        }
    }

    ///////////////////////////////////////////////////////

    private void handleCompareRequest(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("get")) {
            exchange.close();
            return;
        }
        
        System.out.println("PETICION DE COMPARACION DE CRIPTOMONEDAS");
        System.out.println("URI: " + exchange.getRequestURI());
        
        try {
            Map<String, String> params = parseQueryParams(exchange.getRequestURI().getQuery());
            String cryptoIdsParam = params.get("crypto_ids");
            String startHourParam = params.get("start_hour");
            String endHourParam = params.get("end_hour");
            
            if (cryptoIdsParam == null) {
                throw new IllegalArgumentException("Parámetro 'crypto_ids' es requerido (ej: 1,2,3)");
            }
            
            // muestra las IDs de cryptos
            String[] cryptoIdsArray = cryptoIdsParam.split(",");
            List<Integer> cryptoIds = new ArrayList<>();
            for (String id : cryptoIdsArray) {
                cryptoIds.add(Integer.parseInt(id.trim()));
            }
            
            // muestra las horas 
            int startHour = startHourParam != null ? Integer.parseInt(startHourParam) : 0;
            int endHour = endHourParam != null ? Integer.parseInt(endHourParam) : 24;
            
            System.out.println("Comparando cryptos: " + cryptoIds + " desde hora " + startHour + " hasta " + endHour);
            
            // Crear placeholders para la consulta IN
            String placeholders = String.join(",", Collections.nCopies(cryptoIds.size(), "?"));
            
            String sql = """
                SELECT c.id, c.symbol, c.name, p.price, p.price_time,
                       HOUR(p.price_time) as price_hour
                FROM prices p
                INNER JOIN crypto c ON p.crypto_id = c.id
                WHERE p.crypto_id IN (%s)
                AND p.price_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                AND HOUR(p.price_time) >= ? AND HOUR(p.price_time) <= ?
                ORDER BY c.id, p.price_time ASC
            """.formatted(placeholders);
            
            Map<String, List<Map<String, Object>>> compareData = new LinkedHashMap<>();
            
            try (Connection conn = dbManager.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                
                // Establecer parámetros crypto_ids
                for (int i = 0; i < cryptoIds.size(); i++) {
                    stmt.setInt(i + 1, cryptoIds.get(i));
                }
                // Establecer parámetros de horas
                stmt.setInt(cryptoIds.size() + 1, startHour);
                stmt.setInt(cryptoIds.size() + 2, endHour);
                
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        String symbol = rs.getString("symbol");
                        
                        if (!compareData.containsKey(symbol)) {
                            compareData.put(symbol, new ArrayList<>());
                        }
                        
                        Map<String, Object> point = new HashMap<>();
                        point.put("crypto_id", rs.getInt("id"));
                        point.put("symbol", symbol);
                        point.put("name", rs.getString("name"));
                        point.put("price", rs.getDouble("price"));
                        point.put("timestamp", rs.getTimestamp("price_time").toString());
                        point.put("hour", rs.getInt("price_hour"));
                        
                        compareData.get(symbol).add(point);
                    }
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("crypto_ids", cryptoIds);
            response.put("start_hour", startHour);
            response.put("end_hour", endHour);
            response.put("data", compareData);
            response.put("crypto_count", compareData.size());
            
            String jsonResponse = objectMapper.writeValueAsString(response);
            
            System.out.println("Cryptos comparadas: " + compareData.size());
            
            // Configurar CORS
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            
            sendResponse(jsonResponse.getBytes(), exchange);
            
        } catch (Exception e) {
            System.err.println("ERROR en compare: " + e.getMessage());
            e.printStackTrace();
            
            String errorJson = "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, errorJson.getBytes().length);
            sendResponse(errorJson.getBytes(), exchange);
        }
    }

        /////////////////////////////////////////////////////////
    
        private void handleRegressionRequest(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("get")) {
            exchange.close();
            return;
        }
        
        System.out.println("PETICION DE REGRESION LINEAL");
        System.out.println("URI: " + exchange.getRequestURI());
        
        try {
            Map<String, String> params = parseQueryParams(exchange.getRequestURI().getQuery());
            String cryptoId = params.get("crypto_id");
            String startHourParam = params.get("start_hour");
            String endHourParam = params.get("end_hour");
            
            if (cryptoId == null) {
                throw new IllegalArgumentException("Parámetro 'crypto_id' es requerido");
            }
            
            int startHour = startHourParam != null ? Integer.parseInt(startHourParam) : 0;
            int endHour = endHourParam != null ? Integer.parseInt(endHourParam) : 24;
            
            System.out.println("Calculando regresión para crypto_id=" + cryptoId + 
                             " desde hora " + startHour + " hasta " + endHour);
            
            // Consulta SQL para obtener datos del intervalo específico
            String sql = """
                SELECT c.symbol, c.name, p.price, p.price_time,
                       UNIX_TIMESTAMP(p.price_time) as timestamp_unix
                FROM prices p
                INNER JOIN crypto c ON p.crypto_id = c.id
                WHERE p.crypto_id = ?
                AND p.price_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                AND HOUR(p.price_time) >= ? AND HOUR(p.price_time) <= ?
                ORDER BY p.price_time ASC
            """;
            
            List<Map<String, Object>> priceData = new ArrayList<>();
            String symbol = "";
            String name = "";
            
            try (Connection conn = dbManager.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                
                stmt.setInt(1, Integer.parseInt(cryptoId));
                stmt.setInt(2, startHour);
                stmt.setInt(3, endHour);
                
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        if (symbol.isEmpty()) {
                            symbol = rs.getString("symbol");
                            name = rs.getString("name");
                        }
                        
                        Map<String, Object> point = new HashMap<>();
                        point.put("price", rs.getDouble("price"));
                        point.put("timestamp", rs.getTimestamp("price_time").toString());
                        point.put("timestamp_unix", rs.getLong("timestamp_unix"));
                        
                        priceData.add(point);
                    }
                }
            }
            
            // Calcular regresión lineal
            Map<String, Object> regression = calculateLinearRegression(priceData);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("crypto_id", Integer.parseInt(cryptoId));
            response.put("symbol", symbol);
            response.put("name", name);
            response.put("start_hour", startHour);
            response.put("end_hour", endHour);
            response.put("data", priceData);
            response.put("regression", regression);
            response.put("count", priceData.size());
            
            String jsonResponse = objectMapper.writeValueAsString(response);
            
            System.out.println("Regresión calculada para " + symbol + " con " + priceData.size() + " puntos");
            System.out.println("Ecuación: y = " + regression.get("slope") + "x + " + regression.get("intercept"));
            
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            
            sendResponse(jsonResponse.getBytes(), exchange);
            
        } catch (Exception e) {
            System.err.println("ERROR en regression: " + e.getMessage());
            e.printStackTrace();
            
            String errorJson = "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, errorJson.getBytes().length);
            sendResponse(errorJson.getBytes(), exchange);
        }
    }

    /////////////////////////////////////////////////////////////////
    // Método auxiliar para calcular regresión lineal
     
    private Map<String, Object> calculateLinearRegression(List<Map<String, Object>> data) {
        if (data.size() < 2) {
            Map<String, Object> result = new HashMap<>();
            result.put("slope", 0.0);
            result.put("intercept", 0.0);
            result.put("r_squared", 0.0);
            result.put("equation", "No hay suficientes datos");
            return result;
        }
        
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        int n = data.size();
        
        // Usar índices como X, precios como Y
        for (int i = 0; i < n; i++) {
            double x = i; // índice del punto
            double y = (Double) data.get(i).get("price");
            
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }
        
        // Calcular pendiente (slope) e intercepto
        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        double intercept = (sumY - slope * sumX) / n;
        
        // Calcular R²
        double meanY = sumY / n;
        double ssRes = 0, ssTot = 0;
        
        for (int i = 0; i < n; i++) {
            double x = i;
            double y = (Double) data.get(i).get("price");
            double yPred = slope * x + intercept;
            
            ssRes += Math.pow(y - yPred, 2);
            ssTot += Math.pow(y - meanY, 2);
        }
        
        double rSquared = ssTot != 0 ? 1 - (ssRes / ssTot) : 0;
        
        Map<String, Object> result = new HashMap<>();
        result.put("slope", Math.round(slope * 10000.0) / 10000.0); // 4 decimales
        result.put("intercept", Math.round(intercept * 100.0) / 100.0); // 2 decimales
        result.put("r_squared", Math.round(rSquared * 10000.0) / 10000.0);
        result.put("equation", String.format("y = %.4fx + %.2f", slope, intercept));
        result.put("data_points", n);
        
        return result;
    }

    ////////////////////////////////////////////////////////////////

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