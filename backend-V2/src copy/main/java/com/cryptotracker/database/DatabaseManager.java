package com.cryptotracker.database;

import java.sql.*;
import java.util.*;
import javax.sql.DataSource;
import com.mysql.cj.jdbc.MysqlDataSource;

public class DatabaseManager {
    private final Properties config;
    private DataSource dataSource;
    
    // Cache de IDs de criptomonedas
    private final Map<String, Integer> cryptoIdCache = new HashMap<>();
    
    public DatabaseManager(Properties config) {
        this.config = config;
    }
    
    public void initialize() throws SQLException {
        // Configurar DataSource
        MysqlDataSource ds = new MysqlDataSource();
        
        String jdbcUrl = String.format(
                "jdbc:mysql://google/%s?cloudSqlInstance=%s&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false",
                config.getProperty("db.databaseName"),
                config.getProperty("db.instanceConnectionName")
            );
        ds.setURL(jdbcUrl);        
        ds.setUser(config.getProperty("db.user"));
        ds.setPassword(config.getProperty("db.password"));
        
        this.dataSource = ds;
        
        // Cargar cache de IDs
        loadCryptoIds();
        
        // Verificar conexión
        try (Connection conn = getConnection()) {
            if (!conn.isValid(5)) {
                throw new SQLException("No se pudo establecer conexión válida con la base de datos");
            }
        }
    }
    
    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
    
    private void loadCryptoIds() throws SQLException {
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id, symbol FROM crypto")) {
            
            while (rs.next()) {
                cryptoIdCache.put(rs.getString("symbol"), rs.getInt("id"));
            }
            
            System.out.println("Cargados " + cryptoIdCache.size() + " IDs de criptomonedas");
        }
    }
    
    public Map<String, Integer> getCryptoIds() {
        return new HashMap<>(cryptoIdCache);
    }
    
    public Integer getCryptoId(String symbol) {
        return cryptoIdCache.get(symbol);
    }

    public boolean testConnection() {
        try (Connection conn = getConnection()) {
            return conn != null && !conn.isClosed();
        } catch (SQLException e) {
            return false;
        }
    }

    public void reconnect() throws SQLException {
        // Cerrar pool actual si existe
        if (dataSource != null) {
            if (dataSource instanceof MysqlDataSource) {
                ((DatabaseManager) dataSource).close();
            }
        }
        
        // Reinicializar
        initialize();
        
        System.out.println("Reconexión a base de datos completada");
    }
    
    public void close() throws SQLException {
        // Limpiar recursos si es necesario
        if (dataSource instanceof MysqlDataSource) {
            ((DatabaseManager) dataSource).close();
        }
    }
}