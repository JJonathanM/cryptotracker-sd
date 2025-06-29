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
import Footer from "./components/Footer.tsx";
import ChartsDashboard from './components/ChartsDashboard.tsx';

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
          alignItems: 'center',
          padding: '20px 0',
          backgroundColor: 'white'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1200px',
            padding: '0 15px'
          }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/current-prices" element={<CurrentPrices />} />
              <Route path="/single-crypto-chart" element={<SingleCryptoChart />} />
              <Route path="/all-cryptos-chart" element={<AllCryptosChart />} />
              <Route path="/combined-chart" element={<CombinedChart />} />
              <Route path="/regression-analysis" element={<RegressionAnalysis />} />
              <Route path='/ChartDashboard' element={<ChartsDashboard/>}/>
            </Routes>
          </div>
        </main>
        
        <footer className="footer-custom" style={{
          width: '100%',
          flexShrink: 0,
          marginTop: 'auto'
        }}>
          <Footer/>
        </footer>
      </div>
    </Router>
  );
};

export default App;