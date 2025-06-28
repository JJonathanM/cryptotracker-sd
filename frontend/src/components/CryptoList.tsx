import { FC, useEffect, useState } from 'react';
import { CryptoData } from './types';
import mockData from '../mockData.json';

const CryptoList: FC = () => {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);

  useEffect(() => {
    // Simular llamada a la API
    setCryptos(mockData.currentPrices);
  }, []);

  return (
    <div className="box">
      <h2 className="title is-2">Precios Actuales de Criptomonedas</h2>
      <p className="subtitle">Última actualización: {new Date().toLocaleString()}</p>
      
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Icono</th>
              <th>Símbolo</th>
              <th>Nombre</th>
              <th>Precio (USD)</th>
              <th>Última Actualización</th>
            </tr>
          </thead>
          <tbody>
            {cryptos.map((crypto) => (
              <tr key={crypto.id}>
                <td>
                  <figure className="image is-32x32">
                    <img src={crypto.image_url} alt={crypto.name} />
                  </figure>
                </td>
                <td>{crypto.symbol}</td>
                <td>{crypto.name}</td>
                <td>${crypto.price.toFixed(2)}</td>
                <td>{new Date(crypto.last_update).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CryptoList;