package com.cryptotracker.scraper;

import com.cryptotracker.database.DatabaseManager;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ScraperService {
    private final DatabaseManager dbManager;
    private final Properties config;
    private final CoinGeckoScraper scraper;
    private ScheduledExecutorService scheduler;
    private boolean isRunning = false;
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    // Contadores para monitoreo
    private int successCount = 0;
    private int errorCount = 0;
    private LocalDateTime lastSuccessTime = null;
    
    public ScraperService(DatabaseManager dbManager, Properties config) {
        this.dbManager = dbManager;
        this.config = config;
        this.scraper = new CoinGeckoScraper(dbManager);
    }
    
    public synchronized void start() {
        if (isRunning) {
            System.out.println("Scraper ya está en ejecución");
            return;
        }
        
        isRunning = true;
        
        // Usar ScheduledThreadPoolExecutor para mejor control
        scheduler = new ScheduledThreadPoolExecutor(1, r -> {
            Thread t = new Thread(r);
            t.setName("scraper-thread");
            t.setDaemon(true);
            // Importante: manejar excepciones no capturadas
            t.setUncaughtExceptionHandler((thread, ex) -> {
                System.err.println("[ERROR FATAL] Excepción no capturada en scraper: " + ex.getMessage());
                ex.printStackTrace();
            });
            return t;
        });
        
        // Configurar para continuar ejecutando aunque haya excepciones
        ((ScheduledThreadPoolExecutor) scheduler).setContinueExistingPeriodicTasksAfterShutdownPolicy(false);
        ((ScheduledThreadPoolExecutor) scheduler).setExecuteExistingDelayedTasksAfterShutdownPolicy(false);
        
        int intervalSeconds = Integer.parseInt(
            config.getProperty("scraper.interval.seconds", "60")
        );
        
        System.out.println("SCRAPER SERVICE INICIADO");
        System.out.println("Intervalo configurado: " + intervalSeconds + " segundos");
        System.out.println("Hora de inicio: " + LocalDateTime.now().format(formatter));
        
        // Ejecutar inmediatamente
        executeScraping();
        
        // Programar ejecuciones periódicas
        // IMPORTANTE: scheduleWithFixedDelay en lugar de scheduleAtFixedRate
        // para evitar acumulación si una ejecución tarda más del intervalo
        scheduler.scheduleWithFixedDelay(
            this::executeScraping,
            intervalSeconds,
            intervalSeconds,
            TimeUnit.SECONDS
        );
        
        // Thread monitor para detectar si el scraper se detiene
        startMonitorThread();
    }
    
    private void startMonitorThread() {
        Thread monitor = new Thread(() -> {
            while (isRunning) {
                try {
                    Thread.sleep(300000); // Verificar cada 5 minutos
                    
                    if (lastSuccessTime != null) {
                        long minutesSinceLastSuccess = 
                            java.time.Duration.between(lastSuccessTime, LocalDateTime.now()).toMinutes();
                        
                        if (minutesSinceLastSuccess > 5) {
                            System.err.println("[ALERTA] No hay scraping exitoso desde hace " + 
                                            minutesSinceLastSuccess + " minutos!");
                            System.err.println("Último éxito: " + lastSuccessTime.format(formatter));
                            System.err.println("Errores consecutivos: " + errorCount);
                        }
                    }
                    
                    // Log de estadísticas
                    System.out.println("[MONITOR] Estadísticas - Éxitos: " + successCount + 
                                     ", Errores: " + errorCount + 
                                     ", Último éxito: " + 
                                     (lastSuccessTime != null ? lastSuccessTime.format(formatter) : "Nunca"));
                    
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
        monitor.setName("scraper-monitor");
        monitor.setDaemon(true);
        monitor.start();
    }
    
    private void executeScraping() {
        LocalDateTime startTime = LocalDateTime.now();
        String horaActual = startTime.format(formatter);
        
        try {
            System.out.println("\n[" + horaActual + "] Iniciando scraping #" + (successCount + errorCount + 1));
            
            // Verificar conexión a BD antes de hacer scraping
            if (!dbManager.testConnection()) {
                throw new Exception("No hay conexión a la base de datos");
            }
            
            // Ejecutar scraping
            scraper.fetchAndSavePrices();
            
            // Actualizar contadores
            successCount++;
            lastSuccessTime = LocalDateTime.now();
            
            long duration = java.time.Duration.between(startTime, LocalDateTime.now()).toMillis();
            System.out.println("[" + horaActual + "] Scraping completado en " + duration + "ms");
            
        } catch (Exception e) {
            errorCount++;
            System.err.println("[" + horaActual + "] ERROR en scraping: " + e.getMessage());
            e.printStackTrace();
            
            // Si hay muchos errores consecutivos, intentar reconectar BD
            if (errorCount > 5 && errorCount % 5 == 0) {
                System.err.println("[" + horaActual + "] Intentando reconectar a la BD después de " + errorCount + " errores");
                try {
                    dbManager.reconnect();
                } catch (Exception reconnectError) {
                    System.err.println("Error al reconectar: " + reconnectError.getMessage());
                }
            }
        }
    }
    
    public synchronized void stop() {
        if (!isRunning) {
            return;
        }
        
        isRunning = false;
        
        System.out.println("DETENIENDO SCRAPER SERVICE");
        System.out.println("Total ejecuciones exitosas: " + successCount);
        System.out.println("Total errores: " + errorCount);
        
        if (scheduler != null) {
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                scheduler.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
        
        System.out.println("Scraper detenido");
    }
    
    // Métodos para monitoreo externo
    public boolean isHealthy() {
        if (!isRunning) return false;
        if (lastSuccessTime == null) return false;
        
        long minutesSinceLastSuccess = 
            java.time.Duration.between(lastSuccessTime, LocalDateTime.now()).toMinutes();
        
        return minutesSinceLastSuccess < 5; // Considerado saludable si tuvo éxito en los últimos 5 minutos
    }
    
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("running", isRunning);
        stats.put("successCount", successCount);
        stats.put("errorCount", errorCount);
        stats.put("lastSuccess", lastSuccessTime != null ? lastSuccessTime.format(formatter) : null);
        stats.put("healthy", isHealthy());
        return stats;
    }
}