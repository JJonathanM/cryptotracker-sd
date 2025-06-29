import React, { useState, useEffect } from 'react';

interface Crypto {
  id: number;
  symbol: string;
  name: string;
}

interface PriceData {
  timestamp_unix: number;
  price: number;
  timestamp: string;
}

interface RegressionData {
  data_points: number;
  intercept: number;
  equation: string;
  slope: number;
  r_squared: number;
}

interface ApiResponse {
  symbol: string;
  data: PriceData[];
  regression: RegressionData;
  start_hour: number;
  name: string;
  count: number;
  end_hour: number;
  crypto_id: number;
  status: string;
}

const RegressionAnalysis: React.FC = () => {
  const [crypto, setCrypto] = useState<string>('1');
  const [hours, setHours] = useState<number>(6);
  const [analysis, setAnalysis] = useState<ApiResponse | null>(null);
  const [filteredData, setFilteredData] = useState<PriceData[]>([]);
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar la lista de criptomonedas
    const fetchCryptos = async () => {
      try {
        const response = await fetch('http://34.95.126.189/cryptos');
        const data = await response.json();
        if (data.status === 'success') {
          setCryptos(data.data);
        } else {
          setError('Error al cargar las criptomonedas');
        }
      } catch (err) {
        setError('Error de conexión al servidor');
      }
    };

    fetchCryptos();
  }, []);

  // Filtrar datos cuando cambia el análisis o las horas
  useEffect(() => {
    if (analysis) {
      const now = Date.now();
      const milliseconds = hours * 60 * 60 * 1000;
      const filtered = analysis.data.filter(point => 
        now - point.timestamp_unix * 1000 <= milliseconds
      );
      setFilteredData(filtered);
    }
  }, [analysis, hours]);

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://34.95.126.189/prices/regression/?crypto_id=${crypto}&hours=${hours}`
      );
      const data: ApiResponse = await response.json();
      
      if (data.status === 'success') {
        setAnalysis(data);
      } else {
        setError('Error al generar el análisis');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  // Función para renderizar el gráfico SVG
  const renderChart = (data: PriceData[]) => {
    if (!data || data.length === 0) return null;

    // Preparamos los datos para el gráfico
    const prices = data.map(d => d.price);
    const timestamps = data.map(d => new Date(d.timestamp).toLocaleTimeString());
    
    // Calculamos dimensiones y escalas
    const width = 800;
    const height = 400;
    const padding = 40;
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    const xScale = (index: number) => 
      padding + (index * (width - 2 * padding)) / (data.length - 1);
    const yScale = (price: number) => 
      height - padding - ((price - minPrice) * (height - 2 * padding)) / priceRange;

    // Puntos para la línea de regresión (simplificado)
    const regressionPoints = analysis ? [
      { x: 0, y: analysis.regression.intercept },
      { 
        x: data.length - 1, 
        y: analysis.regression.intercept + analysis.regression.slope * (data.length - 1)
      }
    ] : [];

    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Eje X */}
        <line 
          x1={padding} y1={height - padding} 
          x2={width - padding} y2={height - padding} 
          stroke="black" 
        />
        
        {/* Eje Y */}
        <line 
          x1={padding} y1={padding} 
          x2={padding} y2={height - padding} 
          stroke="black" 
        />
        
        {/* Etiquetas eje X */}
        {timestamps
          .filter((_, i) => i % Math.ceil(data.length / 5) === 0)
          .map((time, i) => (
            <text 
              key={i}
              x={xScale(i * Math.ceil(data.length / 5))} 
              y={height - padding / 2} 
              textAnchor="middle"
              fontSize="10"
            >
              {time}
            </text>
          ))}
        
        {/* Etiquetas eje Y */}
        {[minPrice, minPrice + priceRange * 0.25, minPrice + priceRange * 0.5, minPrice + priceRange * 0.75, maxPrice].map((price, i) => (
          <text 
            key={i}
            x={padding / 2} 
            y={yScale(price)} 
            textAnchor="middle"
            fontSize="10"
          >
            {price.toFixed(2)}
          </text>
        ))}
        
        {/* Línea de precios */}
        <polyline
          fill="none"
          stroke="#4285F4"
          strokeWidth="2"
          points={prices.map((price, i) => `${xScale(i)},${yScale(price)}`).join(' ')}
        />
        
        {/* Línea de regresión */}
        {analysis && (
          <line
            x1={xScale(0)}
            y1={yScale(regressionPoints[0].y)}
            x2={xScale(data.length - 1)}
            y2={yScale(regressionPoints[1].y)}
            stroke="#EA4335"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
        
        {/* Leyenda */}
        <rect x={width - 150} y={padding} width={140} height={40} fill="white" stroke="black" />
        <text x={width - 140} y={padding + 15} fontSize="12">
          <tspan fill="#4285F4">●</tspan> Precios
        </text>
        {analysis && (
          <text x={width - 140} y={padding + 30} fontSize="12">
            <tspan fill="#EA4335">●</tspan> Regresión
          </text>
        )}
      </svg>
    );
  };

  return (
    <div className="container black-text">
      <h4 className="center">Análisis de Regresión Lineal</h4>
      
      <div className="row">
        <div className="input-field col s12 m6 black-text">
          <select 
            value={crypto} 
            onChange={(e) => setCrypto(e.target.value)}
            className="browser-default black-text"
            disabled={loading}
          >
            {cryptos.map((c) => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div className="input-field col s12 m6 black-text">
          <form action="#">
            <p className="range-field">
              <label>Horas: {hours}</label>
              <input 
                type="range" 
                min="1" 
                max="24" 
                value={hours} 
                onChange={(e) => setHours(parseInt(e.target.value))}
                disabled={loading}
              />
            </p>
          </form>
        </div>
      </div>
      
      <div className="center">
        <button 
          onClick={generateAnalysis}
          className="btn waves-effect waves-light blue"
          disabled={loading}
        >
          {loading ? 'Generando...' : 'Generar Análisis'}
        </button>
      </div>
      
      {error && (
        <div className="row">
          <div className="col s12">
            <div className="card-panel red lighten-2 white-text">
              {error}
            </div>
          </div>
        </div>
      )}
      
      {analysis && (
        <div className="row">
          <div className="col s12">
            <h5>Ecuación de regresión lineal:</h5>
            <div className="card-panel blue-custom white-text">
              <code style={{ fontSize: '1.2em' }}>{analysis.regression.equation}</code>
              <p>R² = {analysis.regression.r_squared.toFixed(4)}</p>
              <p>Datos mostrados: últimas {hours} horas ({filteredData.length} puntos)</p>
            </div>
            
            <h5>Gráfico de regresión:</h5>
            <div className="card-panel">
              {renderChart(filteredData)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegressionAnalysis;