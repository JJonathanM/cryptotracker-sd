import React from 'react';
import { Link } from 'react-router-dom';
import logo from "../icon/CryptoTrackerIcon.png"

const Navbar: React.FC = () => {
  return (
    <nav className="navbar-custom" style={{ 
              height: '10vh',
              marginRight: '10px',
            }} >
      <div className="nav-wrapper container">
        <Link to="/" className="brand-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={logo} 
            alt="CryptoTracker Logo" 
            style={{ 
              height: '10vh',
              marginRight: '10px',
            }} 
          />
        </Link>
        <ul id="nav-mobile" className="right hide-on-med-and-down">
          <li><Link to="/current-prices">Precios Actuales</Link></li>
          <li><Link to="/single-crypto-chart">Gráfico Individual</Link></li>
          <li><Link to="/all-cryptos-chart">Gráfico de Todas</Link></li>
          <li><Link to="/combined-chart">Gráfico Combinado</Link></li>
          <li><Link to="/regression-analysis">Análisis de Regresión</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;