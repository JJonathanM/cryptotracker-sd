package com.cryptotracker.database;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DataCleanupTask implements Runnable {
    private final DatabaseManager dbManager;
    private final int retentionHours;
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");
    
    public DataCleanupTask(DatabaseManager dbManager, int retentionHours) {
        this.dbManager = dbManager;
        this.retentionHours = retentionHours;
    }
    
    @Override
    public void run() {
        String horaActual = LocalDateTime.now().format(formatter);
        
        try (Connection conn = dbManager.getConnection()) {
            // Usar DATE_SUB para MySQL
            String sql = "DELETE FROM prices WHERE price_time < DATE_SUB(NOW(), INTERVAL ? HOUR)";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, retentionHours);
                
                int deletedRows = stmt.executeUpdate();
                
                if (deletedRows > 0) {
                    System.out.println("[" + horaActual + "] Limpieza: " + deletedRows + 
                                     " registros antiguos eliminados (>" + retentionHours + " horas)");
                }
            }
            
        } catch (SQLException e) {
            System.err.println("[" + horaActual + "] Error en limpieza de datos: " + e.getMessage());
        }
    }
}