CREATE DATABASE IF NOT EXISTS cryptotracker;
USE cryptotracker;

-- Tabla de criptomonedas
CREATE TABLE IF NOT EXISTS crypto (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de precios históricos
CREATE TABLE IF NOT EXISTS prices (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    crypto_id INT UNSIGNED NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    price_time DATETIME(3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crypto_id) REFERENCES crypto(id) ON DELETE CASCADE,
    INDEX idx_crypto_time (crypto_id, price_time DESC),
    INDEX idx_time (price_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar criptomonedas principales
INSERT INTO crypto (symbol, name, image_url) VALUES
    ('BTC', 'Bitcoin', 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'),
    ('ETH', 'Ethereum', 'https://cryptologos.cc/logos/ethereum-eth-logo.png'),
    ('XRP', 'XRP', 'https://cryptologos.cc/logos/xrp-xrp-logo.png'),
    ('SOL', 'Solana', 'https://cryptologos.cc/logos/solana-sol-logo.png'),
    ('TRX', 'TRON', 'https://cryptologos.cc/logos/tron-trx-logo.png'),
    ('DOGE', 'Dogecoin', 'https://cryptologos.cc/logos/dogecoin-doge-logo.png'),
    ('ADA', 'Cardano', 'https://cryptologos.cc/logos/cardano-ada-logo.png'),
    ('HYPE', 'Hyperliquid', 'https://drive.google.com/uc?export=view&id=1_DXtPO3UxoPyMHADRsIa140ePwewXzSb'),
    ('BCH', 'Bitcoin Cash', 'https://cryptologos.cc/logos/bitcoin-cash-bch-logo.png'),
    ('LINK', 'Chainlink', 'https://cryptologos.cc/logos/chainlink-link-logo.png')
ON DUPLICATE KEY UPDATE name=VALUES(name), image_url=VALUES(image_url);

-- Vista: precio más reciente por cripto
CREATE OR REPLACE VIEW latest_prices AS
SELECT 
    c.id,
    c.symbol,
    c.name,
    c.image_url,
    p.price,
    p.price_time AS last_update
FROM crypto c
LEFT JOIN prices p ON c.id = p.crypto_id
    AND p.price_time = (
        SELECT MAX(price_time) 
        FROM prices 
        WHERE crypto_id = c.id
    )
ORDER BY c.id;
