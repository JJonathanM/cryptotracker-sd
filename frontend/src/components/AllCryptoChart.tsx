import React, { useState, useEffect } from 'react';

interface CryptoData {
  symbol: string;
  price: number;
  name: string;
  crypto_id: number;
  timestamp: string;
}

interface ApiResponse {
  crypto_count: number;
  hours: number;
  data: {
    [key: string]: CryptoData[];
  };
}

const AllCryptoChart: React.FC = () => {
  const [hours, setHours] = useState<number>(6);
  const [chartData, setChartData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://34.56.65.161/prices/all-cryptos?hours=${hours}`);
      if (!response.ok) {
        throw new Error('Error al obtener los datos');
      }
      const data: ApiResponse = await response.json();
      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 24) {
      setHours(value);
    }
  };

  // Opcional: cargar datos automáticamente al cambiar las horas
  useEffect(() => {
    fetchData();
  }, [hours]);

  const renderChart = () => {
    if (!chartData || !chartData.data) return null;

    const cryptos = Object.keys(chartData.data);
    if (cryptos.length === 0) return <p>No hay datos disponibles</p>;

    // Configuración del gráfico
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Procesamiento de datos
    const allDataPoints = cryptos.flatMap(crypto => 
      chartData.data[crypto].map(d => ({
        ...d,
        date: new Date(d.timestamp),
        cryptoName: d.name
      }))
    );

    if (allDataPoints.length === 0) return <p>No hay puntos de datos</p>;

    // Encontrar mínimos y máximos para la escala
    const minTime = new Date(Math.min(...allDataPoints.map(d => d.date.getTime())));
    const maxTime = new Date(Math.max(...allDataPoints.map(d => d.date.getTime())));
    const minPrice = Math.min(...allDataPoints.map(d => d.price));
    const maxPrice = Math.max(...allDataPoints.map(d => d.price));

    // Funciones de escala
    const xScale = (date: Date) => 
      margin.left + innerWidth * ((date.getTime() - minTime.getTime()) / (maxTime.getTime() - minTime.getTime()));
    
    const yScale = (price: number) => 
      margin.top + innerHeight - innerHeight * ((price - minPrice) / (maxPrice - minPrice));

    // Colores para cada cripto
    const colors = [
      '#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', 
      '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395'
    ];

    // Crear líneas para cada criptomoneda
    const lines = cryptos.map((crypto, i) => {
      const cryptoData = chartData.data[crypto]
        .map(d => ({ ...d, date: new Date(d.timestamp) }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const points = cryptoData.map(d => `${xScale(d.date)},${yScale(d.price)}`).join(' ');

      return (
        <polyline
          key={crypto}
          points={points}
          fill="none"
          stroke={colors[i % colors.length]}
          strokeWidth="2"
        />
      );
    });

    // Crear ejes
    const timeTicks = [];
    const priceTicks = [];
    const numTicks = 5;

    for (let i = 0; i < numTicks; i++) {
      const time = new Date(minTime.getTime() + i * (maxTime.getTime() - minTime.getTime()) / (numTicks - 1));
      timeTicks.push(
        <g key={`time-${i}`}>
          <line
            x1={xScale(time)}
            y1={margin.top + innerHeight}
            x2={xScale(time)}
            y2={margin.top + innerHeight + 5}
            stroke="black"
          />
          <text
            x={xScale(time)}
            y={margin.top + innerHeight + 20}
            textAnchor="middle"
            fontSize="12"
          >
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </text>
        </g>
      );

      const price = minPrice + i * (maxPrice - minPrice) / (numTicks - 1);
      priceTicks.push(
        <g key={`price-${i}`}>
          <line
            x1={margin.left - 5}
            y1={yScale(price)}
            x2={margin.left}
            y2={yScale(price)}
            stroke="black"
          />
          <text
            x={margin.left - 10}
            y={yScale(price)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="12"
          >
            {price.toFixed(2)}
          </text>
        </g>
      );
    }

    // Leyenda
    const legend = cryptos.map((crypto, i) => {
      const firstData = chartData.data[crypto][0];
      return (
        <g key={`legend-${crypto}`} transform={`translate(${width - 150}, ${20 + i * 20})`}>
          <rect width="15" height="2" fill={colors[i % colors.length]} y="9" />
          <text x="20" y="10" fontSize="12" dominantBaseline="middle">
            {firstData.name} ({firstData.symbol})
          </text>
        </g>
      );
    });

    return (
      <div style={{ overflowX: 'auto' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Eje X (tiempo) */}
          <line
            x1={margin.left}
            y1={margin.top + innerHeight}
            x2={margin.left + innerWidth}
            y2={margin.top + innerHeight}
            stroke="black"
          />
          {timeTicks}

          {/* Eje Y (precio) */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + innerHeight}
            stroke="black"
          />
          {priceTicks}

          {/* Líneas del gráfico */}
          {lines}

          {/* Leyenda */}
          {legend}

          {/* Títulos */}
          <text
            x={margin.left + innerWidth / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="14"
          >
            Tiempo
          </text>
          <text
            x={10}
            y={height / 2}
            textAnchor="middle"
            fontSize="14"
            transform={`rotate(-90, 10, ${height / 2})`}
          >
            Precio
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="row">
        <div className="input-field col s12 m6 offset-m3">
          <input 
            type="number" 
            min="1" 
            max="24" 
            value={hours} 
            onChange={handleHoursChange}
            className="validate"
          />
          <label htmlFor="hours">Horas (1-24)</label>
        </div>
      </div>
      
      <div className="center">
        <button 
          onClick={fetchData}
          className="btn waves-effect waves-light blue"
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Generar Gráfico'}
        </button>
      </div>
      
      {error && (
        <div className="row">
          <div className="col s12 center red-text">
            {error}
          </div>
        </div>
      )}
      
      <div className="row">
        <div className="col s12">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default AllCryptoChart;