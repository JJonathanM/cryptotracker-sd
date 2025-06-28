import { FC, useState, useEffect } from 'react';
import { CryptoData } from './types';
import mockData from '../mockData.json';

const RegressionChart: FC = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');
  const [hours, setHours] = useState<number>(24);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // Simular llamada a la API con filtros
    const crypto = mockData.currentPrices.find(c => c.symbol === selectedCrypto);
    const historical = mockData.historicalData[selectedCrypto as keyof typeof mockData.historicalData] || [];
    
    // Filtrar por horas seleccionadas
    const now = new Date();
    const filteredData = historical.filter(item => {
      const itemDate = new Date(item.price_time);
      return (now.getTime() - itemDate.getTime()) <= hours * 60 * 60 * 1000;
    });

    // Simular cálculo de regresión lineal (en un microservicio real esto se haría en el backend)
    const n = filteredData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    filteredData.forEach((item, index) => {
      const x = index;
      const y = item.price;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    setChartData({
      crypto: crypto,
      data: filteredData,
      regression: {
        slope,
        intercept,
        equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`
      }
    });
  }, [selectedCrypto, hours]);

  return (
    <div className="box">
      <h2 className="title is-2">Regresión Lineal</h2>
      
      <div className="field is-horizontal">
        <div className="field-label is-normal">
          <label className="label">Criptomoneda</label>
        </div>
        <div className="field-body">
          <div className="field">
            <div className="control">
              <div className="select is-fullwidth">
                <select 
                  value={selectedCrypto} 
                  onChange={(e) => setSelectedCrypto(e.target.value)}
                >
                  {mockData.currentPrices.map(crypto => (
                    <option key={crypto.id} value={crypto.symbol}>
                      {crypto.name} ({crypto.symbol})
                    </option>
                  ))}
                </select>
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
                src={`https://dummyimage.com/800x450/363636/ffffff&text=Regresión+Lineal+${chartData.crypto.name}+(${chartData.crypto.symbol})+últimas+${hours}+horas`} 
                alt={`Regresión lineal de ${chartData.crypto.name}`}
              />
            </figure>
            <div className="content mt-4">
              <p className="title is-4">Ecuación de regresión lineal:</p>
              <p className="subtitle is-5">{chartData.regression.equation}</p>
              <p>Mostrando datos de {chartData.crypto.name} para las últimas {hours} horas.</p>
            </div>
          </div>
        ) : (
          <p>Cargando datos...</p>
        )}
      </div>
    </div>
  );
};

export default RegressionChart;