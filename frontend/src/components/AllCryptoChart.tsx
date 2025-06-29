import React, { useState } from 'react';

const AllCryptoChart: React.FC = () => {
  const [hours, setHours] = useState<number>(6);
  const [chartUrl, setChartUrl] = useState<string>('');

  const generateChart = () => {
    // Aquí iría la llamada a tu API de Java para generar el gráfico
    // const response = await fetch(`tu-api/chart/all?hours=${hours}`);
    // const data = await response.json();
    
    // Simulando la URL de la imagen del gráfico generado
    const mockChartUrl = `https://via.placeholder.com/800x400.png?text=Gráfico+de+todas+las+criptos+últimas+${hours}+horas`;
    setChartUrl(mockChartUrl);
  };

  return (
    <div className="container">
      <h4 className="center black-text">Gráfico de Todas las Criptomonedas</h4>
      
      <div className="row">
        <div className="input-field col s12 m6 offset-m3">
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
              alt="Gráfico de todas las criptomonedas" 
              style={{ width: '100%', marginTop: '20px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCryptoChart;