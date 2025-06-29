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

  // Función para restar 6 horas al timestamp de la API
  const adjustTimeToMexico = (apiTimestamp: string): string => {
    const date = new Date(apiTimestamp);
    // Restamos 6 horas (en milisegundos)
    date.setHours(date.getHours() - 6);
    
    // Formateamos de vuelta al mismo formato que viene de la API pero con la hora ajustada
    const pad = (num: number) => num.toString().padStart(2, '0');
    const ms = apiTimestamp.split('.')[1] || '000'; // Mantenemos los milisegundos si existen
    
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}`;
  };

  // Estrategia de múltiples fuentes para imágenes con fallbacks
  const getCryptoImage = (symbol: string, name: string): string => {
    const symbolLower = symbol.toLowerCase();
    
    const coingeckoImages: Record<string, string> = {
      'BTC': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      'ETH': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      'XRP': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
      'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
      'TRX': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
      'DOGE': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
      'ADA': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
      'HYPE': 'https://assets.coingecko.com/coins/images/39593/large/Hyperliquid.png',
      'BCH': 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
      'LINK': 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png'
    };

    const cryptoIconsUrl = `https://cryptoicons.org/api/icon/${symbolLower}/200`;
    const placeholderUrl = `https://ui-avatars.com/api/?name=${symbol}&background=random&color=fff&rounded=true&size=32`;
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
        const response = await fetch('http://34.95.126.189/prices/current');
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        
        const data = await response.json();
        if (data.status !== 'success') throw new Error('API response failed');

        setPrices(data.data);
        
        if (data.data.length > 0) {
          // Aplicamos el ajuste de hora aquí
          const adjustedTime = adjustTimeToMexico(data.data[0].timestamp);
          setLastUpdated(adjustedTime);
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