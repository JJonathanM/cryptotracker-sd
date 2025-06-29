import React, { useState, useEffect } from 'react';

interface CryptoPrice {
  id: number;
  name: string;
  symbol: string;
  price: number;
  timestamp: string;
}

const CurrentPrices: React.FC = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Estrategia de múltiples fuentes para imágenes con fallbacks
  const getCryptoImage = (symbol: string, name: string): string => {
    const symbolLower = symbol.toLowerCase();
    const nameLower = name.toLowerCase().replace(/\s+/g, '-');
    
    // 1. Intento con CoinGecko CDN
    const coingeckoImages: Record<string, string> = {
      'BTC': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      'ETH': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      'XRP': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
      'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
      'TRX': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
      'DOGE': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
      'ADA': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
      'BCH': 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
      'LINK': 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png'
    };

    // 2. Intento con CryptoIcons (alternativa a CoinGecko)
    const cryptoIconsUrl = `https://cryptoicons.org/api/icon/${symbolLower}/200`;
    
    // 3. Intento con placeholder generado dinámicamente
    const placeholderUrl = `https://ui-avatars.com/api/?name=${symbol}&background=random&color=fff&rounded=true&size=32`;
    
    // 4. Imagen genérica local como último recurso
    const localFallback = '/images/crypto/generic.png';

    return coingeckoImages[symbol] || cryptoIconsUrl || placeholderUrl || localFallback;
  };

  // Componente de imagen seguro con múltiples fallbacks
  const SafeCryptoImage = ({ symbol, name }: { symbol: string; name: string }) => {
    const [imgSrc, setImgSrc] = useState(getCryptoImage(symbol, name));
    const [attempts, setAttempts] = useState(0);
    
    const fallbacks = [
      `https://cryptoicons.org/api/icon/${symbol.toLowerCase()}/200`,
      `https://ui-avatars.com/api/?name=${symbol}&background=random&color=fff&rounded=true&size=32`,
      '/images/crypto/generic.png'
    ];

    const handleError = () => {
      if (attempts < fallbacks.length) {
        setImgSrc(fallbacks[attempts]);
        setAttempts(attempts + 1);
      }
    };

    return (
      <img 
        src={imgSrc} 
        alt={name} 
        style={{ width: '24px', height: '24px' }}
        onError={handleError}
        loading="lazy"
        crossOrigin="anonymous"
      />
    );
  };

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('http://34.56.65.161/prices/current');
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        
        const data = await response.json();
        if (data.status !== 'success') throw new Error('API response failed');

        setPrices(data.data);
        
        if (data.data.length > 0) {
          setLastUpdated(new Date(data.data[0].timestamp).toLocaleString());
        }
        
        setLoading(false);
      } catch (err) {
        setError(`Error loading data: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    fetchPrices();
    const intervalId = setInterval(fetchPrices, 60000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) return <div className="center">Cargando...</div>;
  if (error) return <div className="center red-text">{error}</div>;

  return (
    <div className="container">
      <h4 className="center black-text">Precios Actuales de Criptomonedas</h4>
      <p className="center black-text">Última actualización: {lastUpdated || 'No disponible'}</p>
      
      <table className="striped black-text">
        <thead>
          <tr>
            <th>Icono</th>
            <th>Nombre</th>
            <th>Símbolo</th>
            <th>Precio (USD)</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((crypto) => (
            <tr key={crypto.id}>
              <td>
                <SafeCryptoImage symbol={crypto.symbol} name={crypto.name} />
              </td>
              <td>{crypto.name}</td>
              <td>{crypto.symbol}</td>
              <td>${crypto.price.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: crypto.price < 1 ? 6 : 2 
              })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrentPrices;