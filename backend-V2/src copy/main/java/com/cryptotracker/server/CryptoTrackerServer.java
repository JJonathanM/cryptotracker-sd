package com.cryptotracker.server;

import com.cryptotracker.database.DatabaseManager;
import com.cryptotracker.database.DataCleanupTask;
import com.cryptotracker.scraper.ScraperService;
import com.cryptotracker.zookeeper.LeaderElection;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.sql.SQLException;
import java.util.Properties;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class CryptoTrackerServer {
    private static Properties config;
    private static WebServer webServer;
    private static DatabaseManager dbManager;
    private static LeaderElection leaderElection;
    private static ScraperService scraperService;
    private static ScheduledExecutorService cleanupExecutor;

    static int port = 8080; // Puerto por defecto
    
    public static void main(String[] args) {
        try {            
            // Permitir puerto personalizado desde argumentos
            if (args.length > 0) {
                port = Integer.parseInt(args[0]);
            }
            
            // Cargar configuración
            loadConfiguration();
            
            // Inicializar base de datos
            initializeDatabase();
            
            // Inicializar servicio de scraping
            initializeScraperService();
            
            // Iniciar servidor web
            startWebServer();
            
            // Iniciar elección de líder
            startLeaderElection();
            
            // Programar limpieza de datos antiguos
            scheduleDataCleanup();
            
            System.out.println("\nServidor iniciado correctamente");
            System.out.println("Puerto: " + config.getProperty("server.port"));
            System.out.println("ZooKeeper: " + config.getProperty("zookeeper.hosts"));
            System.out.println("\nPresiona Ctrl+C para detener...\n");
            
            // Mantener el servidor en ejecución
            Thread.currentThread().join();
            
        } catch (Exception e) {
            System.err.println("Error fatal al iniciar servidor: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
    
    private static void loadConfiguration() throws IOException {
        config = new Properties();
        
        // Cargar configuración base
        try (InputStream is = CryptoTrackerServer.class.getResourceAsStream("/application.properties")) {
            if (is == null) {
                throw new IOException("No se encontró application.properties");
            }
            config.load(is);
        }
        
        // Cargar configuración de base de datos si existe
        try (InputStream is = CryptoTrackerServer.class.getResourceAsStream("/database.properties")) {
            if (is != null) {
                Properties dbProps = new Properties();
                dbProps.load(is);
                config.putAll(dbProps);
            }
        }
    }
    
    private static void initializeDatabase() throws Exception {
        dbManager = new DatabaseManager(config);
        dbManager.initialize();
        System.out.println("Base de datos inicializada");
    }
    
    private static void initializeScraperService() {
        scraperService = new ScraperService(dbManager, config);
        System.out.println("Servicio de scraping inicializado");
    }
    
    private static void startWebServer() throws Exception {
        webServer = new WebServer(port);
        
        // Configurar el DatabaseManager
        webServer.setDatabaseManager(dbManager);
        
        // Iniciar servidor
        webServer.startServer();
        
        System.out.println("Servidor iniciado en puerto " + port);
    }
    
    private static void startLeaderElection() throws Exception {
        String zkHosts = config.getProperty("zookeeper.hosts");
        String nodeId = InetAddress.getLocalHost().getHostName() + 
                       ":" + config.getProperty("server.port");
        
        leaderElection = new LeaderElection(zkHosts, nodeId, new LeaderElection.LeadershipListener() {
            @Override
            public void onBecomeLeader() {
                System.out.println("\nEste nodo es ahora el líder - Iniciando scraper");
                webServer.setLeaderStatus(true);
                scraperService.start();
            }
            
            @Override
            public void onLoseLeadership() {
                System.out.println("\nEste nodo no es lider - Deteniendo scraper");
                webServer.setLeaderStatus(false);
                scraperService.stop();
            }
        });
        
        leaderElection.start();
        System.out.println("Leader Election iniciado - Nodo ID: " + nodeId);
    }
    
    private static void scheduleDataCleanup() {
        cleanupExecutor = Executors.newSingleThreadScheduledExecutor();
        
        int retentionHours = Integer.parseInt(config.getProperty("data.retention.hours", "36"));
        int cleanupInterval = Integer.parseInt(config.getProperty("data.cleanup.interval.hours", "1"));
        
        cleanupExecutor.scheduleAtFixedRate(
            new DataCleanupTask(dbManager, retentionHours),
            0, // Ejecutar inmediatamente la primera vez
            cleanupInterval,
            TimeUnit.HOURS
        );
        
        System.out.println("✓ Limpieza automática configurada (retención: " + retentionHours + " horas)");
    }
    
    // Shutdown hook para limpieza
    static {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\nDeteniendo servidor...");
            
            if (scraperService != null) {
                scraperService.stop();
            }
            
            if (cleanupExecutor != null) {
                cleanupExecutor.shutdownNow();
            }
            
            if (leaderElection != null) {
                leaderElection.close();
            }
            
            if (dbManager != null) {
                try {
                    dbManager.close();
                } catch (SQLException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }
            }
            
            System.out.println("Servidor detenido correctamente.");
        }));
    }
}