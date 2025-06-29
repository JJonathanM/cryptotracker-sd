import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="page-footer blue-custom">
      <div className="container">
        <div className="row">
          <div className="col l6 s12">
            <h5 className="white-text">CryptoTracker</h5>
            <p className="grey-text text-lighten-4">
              Plataforma de seguimiento de criptomonedas en tiempo real con análisis avanzados.
            </p>
          </div>
          <div className="col l4 offset-l2 s12">
            <h5 className="white-text">Enlaces</h5>
            <ul>
              <li><Link to="/" className="grey-text text-lighten-3">Inicio</Link></li>
              <li><Link to="/current-prices" className="grey-text text-lighten-3">Precios</Link></li>
              <li><Link to="/regression-analysis" className="grey-text text-lighten-3">Análisis</Link></li>
              <li><Link to="/about" className="grey-text text-lighten-3">Acerca de</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-copyright">
        <div className="container">
          © {new Date().getFullYear()} CryptoTracker
          <a className="grey-text text-lighten-4 right" href="#!">Términos y Condiciones</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;