import React, { useState, useEffect } from 'react';
import { CryptoPrice } from '../cryptoTypes';

const CurrentPrices: React.FC = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Aquí iría la llamada a tu API de Java
        // const response = await fetch('tu-api/prices');
        // const data = await response.json();
        
        // Datos de ejemplo (simulando respuesta de API)
        const mockData: CryptoPrice[] = [
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 50000, image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
          { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3000, image: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
          { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 1.5, image: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
          { id: 'solana', name: 'Solana', symbol: 'SOL', price: 150, image: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
          { id: 'ripple', name: 'Ripple', symbol: 'XRP', price: 0.8, image: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' },
          { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 25, image: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png' },
          { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.2, image: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
          { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', price: 80, image: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' },
          { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', price: 150, image: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
          { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 20, image: 'https://cryptologos.cc/logos/chainlink-link-logo.png' },
        ];
        
        setPrices(mockData);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los precios');
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  if (loading) return <div className="center">Cargando...</div>;
  if (error) return <div className="center red-text">{error}</div>;

  return (
    <div className="container">
      <h4 className="center black-text">Precios Actuales de Criptomonedas</h4>
      <p className="center black-text">Última actualización: {new Date().toLocaleTimeString()}</p>
      
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
              <td><img src={crypto.image} alt={crypto.name} style={{ width: '24px', height: '24px' }} /></td>
              <td>{crypto.name}</td>
              <td>{crypto.symbol}</td>
              <td>${crypto.price.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrentPrices;