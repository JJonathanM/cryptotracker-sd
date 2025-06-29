import React from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';

const Dashboard: React.FC = () => {
  return (
    <div className="row">
      <h4 className="center">Bienvenido a CryptoTracker</h4>
      <p className="center">Selecciona una opción del menú o de las tarjetas a continuación</p>
      
      <div className="row">
        <div className="col s12 m6 l4">
          <div className="card blue-grey darken-1">
            <div className="card-content white-text">
              <span className="card-title">Precios Actuales</span>
              <p>Visualiza los precios actuales de las 10 principales criptomonedas.</p>
            </div>
            <div className="card-action">
              <Link to="/current-prices">Ver Precios</Link>
            </div>
          </div>
        </div>

        <div className="col s12 m6 l4">
          <div className="card blue-grey darken-1">
            <div className="card-content white-text">
              <span className="card-title">Gráfico Individual</span>
              <p>Visualiza la variación de precio de una criptomoneda en un intervalo de tiempo.</p>
            </div>
            <div className="card-action">
              <Link to="/single-crypto-chart">Ver Gráfico</Link>
            </div>
          </div>
        </div>

        <div className="col s12 m6 l4">
          <div className="card blue-grey darken-1">
            <div className="card-content white-text">
              <span className="card-title">Gráfico de Todas</span>
              <p>Compara las variaciones de precio de todas las criptomonedas.</p>
            </div>
            <div className="card-action">
              <Link to="/all-cryptos-chart">Ver Gráfico</Link>
            </div>
          </div>
        </div>

        <div className="col s12 m6 l4">
          <div className="card blue-grey darken-1">
            <div className="card-content white-text">
              <span className="card-title">Gráfico Combinado</span>
              <p>Superposición de gráficos de múltiples criptomonedas.</p>
            </div>
            <div className="card-action">
              <Link to="/combined-chart">Ver Gráfico</Link>
            </div>
          </div>
        </div>

        <div className="col s12 m6 l4">
          <div className="card blue-grey darken-1">
            <div className="card-content white-text">
              <span className="card-title">Análisis de Regresión</span>
              <p>Ecuación de regresión lineal para una criptomoneda en un intervalo de tiempo.</p>
            </div>
            <div className="card-action">
              <Link to="/regression-analysis">Ver Análisis</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;