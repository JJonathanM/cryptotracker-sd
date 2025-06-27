package com.cryptotracker.scraper;

import com.cryptotracker.database.DatabaseManager;
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
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");
    
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
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r);
            t.setName("scraper-thread");
            t.setDaemon(true);
            return t;
        });
        
        int intervalSeconds = Integer.parseInt(
            config.getProperty("scraper.interval.seconds", "60")
        );
        
        // Ejecutar inmediatamente
        executeScraping();
        
        // Programar ejecuciones periódicas
        scheduler.scheduleAtFixedRate(
            this::executeScraping,
            intervalSeconds,
            intervalSeconds,
            TimeUnit.SECONDS
        );
        
        System.out.println("Scraper iniciado - Intervalo: " + intervalSeconds + " segundos");
    }
    
    public synchronized void stop() {
        if (!isRunning) {
            return;
        }
        
        isRunning = false;
        
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
    
    private void executeScraping() {
        String horaActual = LocalDateTime.now().format(formatter);
        
        try {
            scraper.fetchAndSavePrices();
        } catch (Exception e) {
            System.err.println("[" + horaActual + "] Error en scraping: " + e.getMessage());
        }
    }
}