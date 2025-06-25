# 1. Agregar CoinGeckoScraper.java en backend/src/main/java/com/cryptotracker/

# 2. Compilar
cd backend/cryptotracker/
mvn clean compile

# 3. Ejecutar el scraper
mvn exec:java -Dexec.mainClass="com.cryptotracker.CoinGeckoScraper"