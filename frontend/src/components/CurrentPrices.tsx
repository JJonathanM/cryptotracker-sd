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

  // Mapeo de símbolos a nombres de archivo en el bucket
  const getCryptoImageUrl = (symbol: string): string => {
    const symbolMappings: Record<string, string> = {
      'BTC': 'bitcoin.png',
      'ETH': 'ethereum.png',
      'XRP': 'xrp.png',
      'SOL': 'solana.png',
      'TRX': 'tron.png',
      'DOGE': 'dogecoin.png',
      'ADA': 'cardano.png',
      'HYPE': 'hyperliquid.png',
      'BCH': 'bitcoincash.png',
      'LINK': 'chainlink.png'
    };

    const filename = symbolMappings[symbol] || 'generic.png';
    return `https://storage.googleapis.com/cryptotracker-logos/${filename}`;
  };

  // Componente de imagen simple con fallback
  const CryptoImage = ({ symbol, name }: { symbol: string; name: string }) => {
    const [imgSrc, setImgSrc] = useState(getCryptoImageUrl(symbol));
    
    const handleError = () => {
      // Fallback genérico si la imagen no existe
      setImgSrc('https://storage.googleapis.com/cryptotracker-logos/generic.png');
    };

    return (
      <img 
        src={imgSrc} 
        alt={name} 
        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
        onError={handleError}
        loading="lazy"
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
                <CryptoImage symbol={crypto.symbol} name={crypto.name} />
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