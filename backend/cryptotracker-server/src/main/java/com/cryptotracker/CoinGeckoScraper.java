package com.cryptotracker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

import java.io.IOException;
import java.io.InputStream;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class CoinGeckoScraper {
    
    // Configuración
    private static final String COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
    private static final int INTERVALO_SEGUNDOS = 60; // Cada minuto
    
    // Mapeo de IDs de CoinGecko a símbolos de nuestra BD
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
    
    // Base de datos
    private static String DB_URL;
    private static String DB_USER;
    private static String DB_PASSWORD;
    
    // Utilidades
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");
    
    // Cache de IDs de criptomonedas
    private static Map<String, Integer> cryptoIds = new HashMap<>();
    
    static {
        loadDatabaseConfig();
    }
    
    public static void main(String[] args) {
        System.out.println("=== CryptoTracker Scraper (CoinGecko) ===");
        System.out.println("Intervalo: " + INTERVALO_SEGUNDOS + " segundos");
        System.out.println("Criptomonedas: " + COINGECKO_MAP.size());
        System.out.println("Iniciando...\n");
        
        // Cargar IDs de las criptomonedas una sola vez
        try {
            cargarCryptoIds();
        } catch (SQLException e) {
            System.err.println("Error al cargar IDs de criptomonedas: " + e.getMessage());
            System.exit(1);
        }
        
        // Ejecutar inmediatamente la primera vez
        ejecutarScraping();
        
        // Programar ejecución periódica
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(
            CoinGeckoScraper::ejecutarScraping,
            INTERVALO_SEGUNDOS,
            INTERVALO_SEGUNDOS,
            TimeUnit.SECONDS
        );
        
        // Agregar shutdown hook para cerrar limpiamente
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\nDeteniendo scraper...");
            scheduler.shutdownNow();
            System.out.println("Scraper detenido.");
        }));
        
        System.out.println("Scraper ejecutándose. Presiona Ctrl+C para detener.\n");
    }
    
    private static void ejecutarScraping() {
        String horaActual = LocalDateTime.now().format(formatter);
        System.out.println("[" + horaActual + "] Obteniendo precios...");
        
        try {
            // Obtener todos los precios de CoinGecko
            Map<String, Double> precios = obtenerPreciosCoinGecko();
            
            // Guardar en base de datos
            int guardados = guardarPreciosEnBD(precios);
            
            System.out.println("[" + horaActual + "] ✓ " + guardados + " precios actualizados");
            
            // Opcional: Limpiar datos antiguos (más de 24 horas)
            limpiarDatosAntiguos();
            
        } catch (Exception e) {
            System.err.println("[" + horaActual + "] ✗ Error: " + e.getMessage());
        }
    }
    
    private static Map<String, Double> obtenerPreciosCoinGecko() throws Exception {
        Map<String, Double> precios = new HashMap<>();
        
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            // Construir URL con todos los IDs
            String ids = String.join(",", COINGECKO_MAP.keySet());
            String url = COINGECKO_API_URL + "?ids=" + ids + "&vs_currencies=usd";
            
            HttpGet request = new HttpGet(url);
            
            try (CloseableHttpResponse response = client.execute(request)) {
                if (response.getStatusLine().getStatusCode() == 200) {
                    String jsonResponse = EntityUtils.toString(response.getEntity());
                    JsonNode root = objectMapper.readTree(jsonResponse);
                    
                    // Procesar cada cripto
                    for (Map.Entry<String, String> entry : COINGECKO_MAP.entrySet()) {
                        String geckoId = entry.getKey();
                        String symbol = entry.getValue();
                        
                        JsonNode cryptoNode = root.get(geckoId);
                        if (cryptoNode != null && cryptoNode.has("usd")) {
                            double price = cryptoNode.get("usd").asDouble();
                            precios.put(symbol, price);
                        }
                    }
                } else {
                    throw new Exception("Error HTTP: " + response.getStatusLine().getStatusCode());
                }
            }
        }
        
        return precios;
    }
    
    private static int guardarPreciosEnBD(Map<String, Double> precios) throws SQLException {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            String sql = "INSERT INTO prices (crypto_id, price, price_time) VALUES (?, ?, ?)";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                Timestamp now = Timestamp.valueOf(LocalDateTime.now());
                int count = 0;
                
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
                    }
                }
                
                stmt.executeBatch();
                return count;
            }
        }
    }
    
    private static void cargarCryptoIds() throws SQLException {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            String sql = "SELECT id, symbol FROM crypto";
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {
                
                while (rs.next()) {
                    cryptoIds.put(rs.getString("symbol"), rs.getInt("id"));
                }
                
                System.out.println("Cargados " + cryptoIds.size() + " IDs de criptomonedas");
            }
        }
    }
    
    private static void limpiarDatosAntiguos() {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            String sql = "DELETE FROM prices WHERE price_time < DATE_SUB(NOW(), INTERVAL 24 HOUR)";
            try (Statement stmt = conn.createStatement()) {
                int eliminados = stmt.executeUpdate(sql);
                if (eliminados > 0) {
                    System.out.println("  (Limpieza: " + eliminados + " registros antiguos eliminados)");
                }
            }
        } catch (SQLException e) {
            // No es crítico si falla la limpieza
        }
    }
    
    private static void loadDatabaseConfig() {
        Properties props = new Properties();
        try (InputStream is = CoinGeckoScraper.class.getResourceAsStream("/database.properties")) {
            if (is == null) {
                System.err.println("✗ No se encontró database.properties");
                System.exit(1);
            }
            props.load(is);
            DB_URL = String.format(
            "jdbc:mysql://google/%s?cloudSqlInstance=%s&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false",
            props.getProperty("db.databaseName"), props.getProperty("db.instanceConnectionName"));
            DB_USER = props.getProperty("db.user");
            DB_PASSWORD = props.getProperty("db.password");
        } catch (IOException e) {
            System.err.println("✗ Error al leer database.properties: " + e.getMessage());
            System.exit(1);
        }
    }
}