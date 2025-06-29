package com.cryptotracker.scraper;

import com.cryptotracker.database.DatabaseManager;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class CoinGeckoScraper {
    
    private static final String COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
    
    // Configuración de timeouts
    private static final int CONNECT_TIMEOUT = 5000; // 5 segundos
    private static final int SOCKET_TIMEOUT = 10000; // 10 segundos
    
    // Mapeo de IDs de CoinGecko a símbolos
    private static final Map<String, String> COINGECKO_MAP = new LinkedHashMap<String, String>() {{
        put("bitcoin", "BTC");
        put("ethereum", "ETH");
        put("ripple", "XRP");
        put("solana", "SOL");
        put("tron", "TRX");
        put("dogecoin", "DOGE");
        put("cardano", "ADA");
        put("hyperliquid", "HYPE");
        put("bitcoin-cash", "BCH");
        put("chainlink", "LINK");
    }};
    
    private final DatabaseManager dbManager;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");
    
    // Cliente HTTP reutilizable con timeouts
    private final CloseableHttpClient httpClient;
    
    public CoinGeckoScraper(DatabaseManager dbManager) {
        this.dbManager = dbManager;
        
        // Configurar cliente HTTP con timeouts
        RequestConfig config = RequestConfig.custom()
            .setConnectTimeout(CONNECT_TIMEOUT)
            .setSocketTimeout(SOCKET_TIMEOUT)
            .setConnectionRequestTimeout(CONNECT_TIMEOUT)
            .build();
            
        this.httpClient = HttpClients.custom()
            .setDefaultRequestConfig(config)
            .build();
    }
    
    public void fetchAndSavePrices() throws Exception {
        String horaActual = LocalDateTime.now().format(formatter);
        System.out.println("\n[" + horaActual + "] INICIANDO SCRAPING");
        
        Map<String, Double> precios = null;
        int intentos = 0;
        int maxIntentos = 3;
        
        // Reintentar hasta 3 veces en caso de falla
        while (intentos < maxIntentos && precios == null) {
            intentos++;
            try {
                precios = obtenerPreciosCoinGecko();
            } catch (Exception e) {
                System.err.println("[" + horaActual + "] Intento " + intentos + " falló: " + e.getMessage());
                if (intentos < maxIntentos) {
                    Thread.sleep(2000); // Esperar 2 segundos antes de reintentar
                } else {
                    throw e; // Re-lanzar la excepción en el último intento
                }
            }
        }
        
        if (precios != null && !precios.isEmpty()) {
            int guardados = guardarPreciosEnBD(precios);
            System.out.println("[" + horaActual + "] Scraping completado: " + guardados + " precios actualizados");
        } else {
            throw new Exception("No se pudieron obtener precios después de " + maxIntentos + " intentos");
        }
        
        System.out.println("[" + horaActual + "] FIN SCRAPING\n");
    }
    
    private Map<String, Double> obtenerPreciosCoinGecko() throws Exception {
        Map<String, Double> precios = new HashMap<>();
        
        // Construir URL con todos los IDs
        String ids = String.join(",", COINGECKO_MAP.keySet());
        String url = COINGECKO_API_URL + "?ids=" + ids + "&vs_currencies=usd";
        
        System.out.println("Consultando API CoinGecko...");
        
        HttpGet request = new HttpGet(url);
        request.setHeader("Accept", "application/json");
        
        try (CloseableHttpResponse response = httpClient.execute(request)) {
            int statusCode = response.getStatusLine().getStatusCode();
            System.out.println("Response status: " + statusCode);
            
            if (statusCode == 200) {
                String jsonResponse = EntityUtils.toString(response.getEntity());
                JsonNode root = objectMapper.readTree(jsonResponse);
                
                System.out.println("\nPrecios obtenidos:");
                
                // Procesar cada cripto
                for (Map.Entry<String, String> entry : COINGECKO_MAP.entrySet()) {
                    String geckoId = entry.getKey();
                    String symbol = entry.getValue();
                    
                    JsonNode cryptoNode = root.get(geckoId);
                    if (cryptoNode != null && cryptoNode.has("usd")) {
                        double price = cryptoNode.get("usd").asDouble();
                        precios.put(symbol, price);
                        System.out.println("  " + symbol + ": $" + String.format("%.2f", price));
                    } else {
                        System.out.println("  " + symbol + ": No disponible");
                    }
                }
            } else if (statusCode == 429) {
                throw new Exception("Rate limit alcanzado. Esperando antes de reintentar...");
            } else {
                throw new Exception("Error HTTP: " + statusCode);
            }
        }
        
        System.out.println("Total precios obtenidos: " + precios.size());
        return precios;
    }
    
    private int guardarPreciosEnBD(Map<String, Double> precios) throws SQLException {
        String sql = "INSERT INTO prices (crypto_id, price, price_time) VALUES (?, ?, ?)";
        
        Connection conn = null;
        PreparedStatement stmt = null;
        
        try {
            conn = dbManager.getConnection();
            conn.setAutoCommit(false); // Usar transacción
            
            stmt = conn.prepareStatement(sql);
            
            Timestamp now = Timestamp.valueOf(LocalDateTime.now());
            int count = 0;
            
            Map<String, Integer> cryptoIds = dbManager.getCryptoIds();
            
            System.out.println("\nGuardando en base de datos:");
            
            for (Map.Entry<String, Double> entry : precios.entrySet()) {
                String symbol = entry.getKey();
                Double price = entry.getValue();
                
                Integer cryptoId = cryptoIds.get(symbol);
                if (cryptoId != null) {
                    stmt.setInt(1, cryptoId);
                    stmt.setDouble(2, price);
                    stmt.setTimestamp(3, now);
                    stmt.addBatch();
                    count++;
                    System.out.println("  " + symbol + " (ID: " + cryptoId + ") - Precio: $" + price);
                } else {
                    System.out.println("  " + symbol + " - ID no encontrado en BD");
                }
            }
            
            if (count > 0) {
                stmt.executeBatch();
                conn.commit(); // Confirmar transacción
                System.out.println("Transacción completada exitosamente");
            }
            
            return count;
            
        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback(); // Revertir en caso de error
                    System.err.println("Transacción revertida debido a error");
                } catch (SQLException ex) {
                    System.err.println("Error al revertir transacción: " + ex.getMessage());
                }
            }
            throw e;
        } finally {
            if (stmt != null) stmt.close();
            if (conn != null) {
                conn.setAutoCommit(true);
                conn.close();
            }
        }
    }
}