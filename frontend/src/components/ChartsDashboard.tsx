import React from 'react';
import SingleCryptoChart from './SingleCryptoChart';
import CombinedChart from './CombinedChart';
import AllCryptosChart from './AllCryptoChart';

const ChartsDashboard: React.FC = () => {
  return (
    <div className="row">
      <h4 className="center black-text">Dashboard Analítico de Criptomonedas</h4>
      <p className="center black-text">Visualización completa del mercado en tiempo real</p>
      
      <div className="row">
        {/* Gráfico Individual - Ocupa 6 columnas */}
        <div className="col s12 m12 l6">
          <div className="card z-depth-2" style={{ borderRadius: '8px' }}>
            <div className="card-content">
              <span className="card-title">Análisis Individual</span>
              <div className="divider"></div>
              <div style={{ padding: '15px 0' }}>
                <SingleCryptoChart />
              </div>
            </div>
          </div>
        </div>
        
        {/* Gráfico de Todas las Criptos - Ocupa 6 columnas */}
        <div className="col s12 m12 l6">
          <div className="card z-depth-2" style={{ borderRadius: '8px' }}>
            <div className="card-content">
              <span className="card-title">Visión General del Mercado</span>
              <div className="divider"></div>
              <div style={{ padding: '15px 0' }}>
                <AllCryptosChart />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico Combinado - Ocupa 12 columnas (ancho completo) */}
      <div className="row">
        <div className="col s12">
          <div className="card z-depth-2" style={{ borderRadius: '8px' }}>
            <div className="card-content">
              <span className="card-title">Comparativa Combinada</span>
              <div className="divider"></div>
              <div style={{ padding: '15px 0' }}>
                <CombinedChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsDashboard;