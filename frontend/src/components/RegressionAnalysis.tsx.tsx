import React, { useState } from 'react';

const RegressionAnalysis: React.FC = () => {
  const [crypto, setCrypto] = useState<string>('bitcoin');
  const [hours, setHours] = useState<number>(6);
  const [analysis, setAnalysis] = useState<{equation: string, chartUrl: string} | null>(null);

  const cryptos = [
    { id: 'bitcoin', name: 'Bitcoin' },
    { id: 'ethereum', name: 'Ethereum' },
    { id: 'cardano', name: 'Cardano' },
    { id: 'solana', name: 'Solana' },
    { id: 'ripple', name: 'Ripple' },
    { id: 'polkadot', name: 'Polkadot' },
    { id: 'dogecoin', name: 'Dogecoin' },
    { id: 'avalanche', name: 'Avalanche' },
    { id: 'litecoin', name: 'Litecoin' },
    { id: 'chainlink', name: 'Chainlink' },
  ];

  const generateAnalysis = () => {
    // Simulando la respuesta de la API
    const mockAnalysis = {
      equation: `y = ${(Math.random() * 2 - 1).toFixed(2)}x + ${(Math.random() * 10000).toFixed(2)}`,
      chartUrl: `https://via.placeholder.com/800x400.png?text=Regresión+de+${crypto}+últimas+${hours}+horas`
    };
    
    setAnalysis(mockAnalysis);
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
          >
            {cryptos.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div className="input-field col s12 m6 black-text">
          <input 
            type="number" 
            min="1" 
            max="24" 
            value={hours} 
            onChange={(e) => setHours(parseInt(e.target.value))}
            className="validate"
          />
          <label htmlFor="hours">Horas (1-24)</label>
        </div>
      </div>
      
      <div className="center">
        <button 
          onClick={generateAnalysis}
          className="btn waves-effect waves-light blue"
        >
          Generar Análisis
        </button>
      </div>
      
      {analysis && (
        <div className="row">
          <div className="col s12 ">
            <h5>Ecuación de regresión lineal:</h5>
            <div className="card-panel blue-custom white-text">
              <code style={{ fontSize: '1.2em' }}>{analysis.equation}</code>
            </div>
            
            <h5>Gráfico de regresión:</h5>
            <img 
              src={analysis.chartUrl} 
              alt={`Gráfico de regresión de ${crypto}`} 
              style={{ width: '100%', marginTop: '10px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegressionAnalysis;