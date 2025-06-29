import React from 'react';
import { Link } from 'react-router-dom';
import cardimage1 from "../images/1.png";
import cardimage2 from "../images/2.png";
import cardimage3 from "../images/3.png";
import cardimage4 from "../images/4.png";
import cardimage5 from "../images/5.png";

const Dashboard: React.FC = () => {
  return (
    <div className="row">
      <h4 className="center black-text">Bienvenido a CryptoTracker</h4>
      <p className="center">Selecciona una opción del menú o de las tarjetas a continuación</p>
      
      <div className="row">
        <div className="col s12 m6 l4">
          <div className="card blue-custom">
            <div className='card-image'>
              <img src={cardimage1} alt="Criptomonedas" style={{ 
                height: '200px', 
                objectFit: 'cover',
              }}/>
            </div>
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
          <div className="card blue-custom">
            <div className='card-image'>
              <img src={cardimage2} alt="Criptomonedas" style={{ 
                height: '200px', 
                objectFit: 'cover',
              }}/>
            </div>
            <div className="card-content white-text">
              <span className="card-title">Gráfico Individual</span>
              <p>Visualiza la variación de precio de una criptomoneda en un intervalo de tiempo.</p>
            </div>
            <div className="card-action ">
              <Link to="/single-crypto-chart">Ver Gráfico</Link>
            </div>
          </div>
        </div>

        <div className="col s12 m6 l4">
          <div className="card blue-custom">
            <div className='card-image'>
              <img src={cardimage3} alt="Criptomonedas" style={{ 
                height: '200px', 
                objectFit: 'cover',
              }}/>
            </div>
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
          <div className="card blue-custom">
            <div className='card-image'>
              <img src={cardimage4} alt="Criptomonedas" style={{ 
                height: '200px', 
                objectFit: 'cover',
              }}/>
            </div>
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
          <div className="card blue-custom">
            <div className='card-image'>
              <img src={cardimage5} alt="Criptomonedas" style={{ 
                height: '200px', 
                objectFit: 'cover',
              }}/>
            </div>
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