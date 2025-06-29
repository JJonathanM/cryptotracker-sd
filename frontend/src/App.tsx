import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CurrentPrices from './components/CurrentPrices';
import SingleCryptoChart from './components/SingleCryptoChart';
import AllCryptosChart from './components/AllCryptoChart';
import CombinedChart from './components/CombinedChart';
import RegressionAnalysis from './components/RegressionAnalysis.tsx';
import Navbar from './components/Navbar';
import 'materialize-css/dist/css/materialize.min.css';
import "./styles/main.css"

const App: React.FC = () => {
  return (
    <Router>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100vw', // Asegura el ancho completo
        overflowX: 'hidden' // Previene scroll horizontal
      }}>
        <Navbar />
        
        <main style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', // Centrado horizontal
          padding: '20px 0' // Espaciado vertical
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1200px', // Ancho máximo fijo
            padding: '0 15px'
          }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/current-prices" element={<CurrentPrices />} />
              <Route path="/single-crypto-chart" element={<SingleCryptoChart />} />
              <Route path="/all-cryptos-chart" element={<AllCryptosChart />} />
              <Route path="/combined-chart" element={<CombinedChart />} />
              <Route path="/regression-analysis" element={<RegressionAnalysis />} />
            </Routes>
          </div>
        </main>
        
        <footer style={{
          width: '100%',
          flexShrink: 0,
          marginTop: 'auto' // Empuja el footer hacia abajo
        }} className="page-footer grey lighten-3">
          <div className="container grey-text text-darken-1">
            © {new Date().getFullYear()} CryptoTracker
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;