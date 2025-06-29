import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="blue darken-3">
      <div className="nav-wrapper container">
        <Link to="/" className="brand-logo">CryptoTracker</Link>
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