import React from 'react';
import AllCryptosChart from './AllCryptoChart';

const ChartsDashboard: React.FC = () => {
  return (
    <div className="row">
      <h4 className="center black-text">Dashboard Analítico de Criptomonedas</h4>
      
      {/* Gráfico Combinado - Ocupa 12 columnas (ancho completo) */}
      <div className="row">
        <div className="col s12">
          <div className="card z-depth-2" style={{ borderRadius: '8px' }}>
            <div className="card-content">
              <span className="card-title black-text">Visión General del Mercado</span>
              <div className="divider"></div>
              <div style={{ padding: '15px 0' }}>
                <AllCryptosChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsDashboard;