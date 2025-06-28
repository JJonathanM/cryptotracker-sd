import type { FC } from 'react';
import type { CryptoData } from './types';
import { useState, useEffect } from 'react';
import mockData from '../mockData.json';

const MultiCryptoChart: FC = () => {
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>(['BTC', 'ETH']);
  const [hours, setHours] = useState<number>(24);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // Simular llamada a la API con filtros
    const selectedData = mockData.currentPrices
      .filter(crypto => selectedCryptos.includes(crypto.symbol))
      .map(crypto => ({
        crypto,
        data: (mockData.historicalData[crypto.symbol as keyof typeof mockData.historicalData] || [])
          .filter((item: any) => {
            const now = new Date();
            const itemDate = new Date(item.price_time);
            return (now.getTime() - itemDate.getTime()) <= hours * 60 * 60 * 1000;
          })
      }));

    setChartData(selectedData);
  }, [selectedCryptos, hours]);

  const toggleCryptoSelection = (symbol: string) => {
    setSelectedCryptos(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol) 
        : [...prev, symbol]
    );
  };

  return (
    <div className="box">
      <h2 className="title is-2">Superposición de Gráficos</h2>
      
      <div className="field is-horizontal">
        <div className="field-label is-normal">
          <label className="label">Criptomonedas</label>
        </div>
        <div className="field-body">
          <div className="field">
            <div className="control">
              <div className="buttons are-small">
                {mockData.currentPrices.map(crypto => (
                  <button
                    key={crypto.id}
                    className={`button ${selectedCryptos.includes(crypto.symbol) ? 'is-primary' : ''}`}
                    onClick={() => toggleCryptoSelection(crypto.symbol)}
                  >
                    {crypto.symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="field is-horizontal">
        <div className="field-label is-normal">
          <label className="label">Horas</label>
        </div>
        <div className="field-body">
          <div className="field">
            <div className="control">
              <input 
                className="input" 
                type="number" 
                min="1" 
                max="24" 
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="chart-container">
        {chartData ? (
          <div className="has-text-centered">
            <figure className="image is-16by9">
              {/* Aquí iría el gráfico generado por un microservicio */}
              <img 
                src={`https://dummyimage.com/800x450/363636/ffffff&text=Superposición+de+${selectedCryptos.join(',')}+últimas+${hours}+horas`} 
                alt="Superposición de gráficos"
              />
            </figure>
            <div className="content mt-4">
              <p>Mostrando datos de {selectedCryptos.join(', ')} para las últimas {hours} horas.</p>
            </div>
          </div>
        ) : (
          <p>Cargando datos...</p>
        )}
      </div>
    </div>
  );
};

export default MultiCryptoChart;