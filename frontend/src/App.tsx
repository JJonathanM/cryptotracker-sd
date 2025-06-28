import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import 'bulma/css/bulma.min.css'
import './styles/main.css'

function App() {
  const [activeFeature, setActiveFeature] = useState<string>('currentPrices');

  return (
    <Router>
      <div className="app">
        <div className="columns is-gapless">
          <div className="column is-2">
            <Sidebar setActiveFeature={setActiveFeature} />
          </div>
          <div className="column is-10">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    activeFeature={activeFeature} 
                    setActiveFeature={setActiveFeature} 
                  />
                } 
              />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;