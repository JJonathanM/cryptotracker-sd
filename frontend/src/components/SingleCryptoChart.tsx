import React, { useState } from 'react';

const SingleCryptoChart: React.FC = () => {
  const [crypto, setCrypto] = useState<string>('bitcoin');
  const [hours, setHours] = useState<number>(6);
  const [chartUrl, setChartUrl] = useState<string>('');

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

  const generateChart = () => { 
    // Simulando la URL de la imagen del gráfico generado
    const mockChartUrl = `https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.jaspersoft.com%2Fes%2Farticles%2Fwhat-is-a-line-chart&psig=AOvVaw1FpRzHhri84dHaWGjCpbn4&ust=1751251267139000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCOjZ-r7NlY4DFQAAAAAdAAAAABAE`;
    setChartUrl(mockChartUrl);
  };

  return (
    <div className='container black-text'>
      <h5 className="center black-text  ">Gráfico Individual de Criptomoneda</h5>
      
      <div className="row ">
        <div className="input-field col s12 m6 ">
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
          onClick={generateChart}
          className="btn waves-effect waves-light blue"
        >
          Generar Gráfico
        </button>
      </div>
      
      {chartUrl && (
        <div className="row">
          <div className="col s12">
            <img 
              src={chartUrl} 
              alt={`Gráfico de ${crypto}`} 
              style={{ width: '100%', marginTop: '20px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleCryptoChart;