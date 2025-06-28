import { FC, useState, useEffect } from 'react';
import mockData from '../mockData.json';

const AllCryptoChart: FC = () => {
  const [hours, setHours] = useState<number>(24);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // Simular llamada a la API con filtros
    const allData = mockData.currentPrices.map(crypto => ({
      crypto,
      data: (mockData.historicalData[crypto.symbol as keyof typeof mockData.historicalData] || [])
        .filter((item: any) => {
          const now = new Date();
          const itemDate = new Date(item.price_time);
          return (now.getTime() - itemDate.getTime()) <= hours * 60 * 60 * 1000;
        })
    }));

    setChartData(allData);
  }, [hours]);

  return (
    <div className="box">
      <h2 className="title is-2">Gráfico de Todas las Criptomonedas</h2>
      
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
                src={`https://dummyimage.com/800x450/363636/ffffff&text=Gráfico+de+todas+las+criptos+últimas+${hours}+horas`} 
                alt="Gráfico de todas las criptomonedas"
              />
            </figure>
            <div className="content mt-4">
              <p>Mostrando datos de todas las criptomonedas para las últimas {hours} horas.</p>
            </div>
          </div>
        ) : (
          <p>Cargando datos...</p>
        )}
      </div>
    </div>
  );
};

export default AllCryptoChart;