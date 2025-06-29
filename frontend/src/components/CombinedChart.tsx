import React, { useState } from 'react';

const CombinedChart: React.FC = () => {
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>(['bitcoin', 'ethereum']);
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

  const toggleCrypto = (cryptoId: string) => {
    if (selectedCryptos.includes(cryptoId)) {
      setSelectedCryptos(selectedCryptos.filter(id => id !== cryptoId));
    } else {
      setSelectedCryptos([...selectedCryptos, cryptoId]);
    }
  };

  const generateChart = () => {
    if (selectedCryptos.length === 0) {
      alert('Selecciona al menos una criptomoneda');
      return;
    }

    // Simulando la URL de la imagen del gráfico generado
    const mockChartUrl = `https://via.placeholder.com/800x400.png?text=Gráfico+combinado+de+${selectedCryptos.length}+criptos+últimas+${hours}+horas`;
    setChartUrl(mockChartUrl);
  };

  return (
    <div className="container black-text">      
      <div className="row">
        <div className="col s12">
          <h5>Selecciona las criptomonedas:</h5>
          {cryptos.map((crypto) => (
            <label key={crypto.id} style={{ marginRight: '15px', display: 'inline-block' }}>
              <input
                type="checkbox"
                checked={selectedCryptos.includes(crypto.id)}
                onChange={() => toggleCrypto(crypto.id)}
                className="filled-in"
              />
              <span>{crypto.name}</span>
            </label>
          ))}
        </div>
        
        <div className="input-field col s12 m6 black-text">
          <input 
            type="number" 
            min="1" 
            max="24" 
            value={hours} 
            onChange={(e) => setHours(parseInt(e.target.value))}
            className="validate black-text"
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
              alt="Gráfico combinado de criptomonedas" 
              style={{ width: '100%', marginTop: '20px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CombinedChart;