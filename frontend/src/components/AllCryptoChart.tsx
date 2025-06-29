import React, { useState, useEffect, useRef } from 'react';

interface Crypto {
  id: number;
  name: string;
  symbol: string;
  color: string;
}

interface PriceData {
  price: number;
  timestamp: string;
}

interface ApiResponse {
  data: PriceData[];
  name: string;
  symbol: string;
  status: string;
  hours: number;
  count: number;
}

const AllCryptoChart: React.FC = () => {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>(['1']);
  const [hours, setHours] = useState<number>(24);
  const [priceData, setPriceData] = useState<Record<string, PriceData[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Colores para las diferentes criptomonedas
  const cryptoColors = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853', '#673AB7',
    '#FF5722', '#009688', '#E91E63', '#795548', '#607D8B'
  ];

  useEffect(() => {
    const fetchCryptos = async () => {
      try {
        const response = await fetch('http://34.95.126.189/cryptos');
        const data = await response.json();
        
        if (data.status === 'success') {
          const cryptosWithColors = data.data.map((c: Crypto, index: number) => ({
            ...c,
            color: cryptoColors[index % cryptoColors.length]
          }));
          setCryptos(cryptosWithColors);
        } else {
          setError('Error al cargar las criptomonedas');
        }
      } catch (err) {
        setError('Error de conexión al servidor');
      }
    };
    
    fetchCryptos();
  }, []);

  // Obtener datos de precios cuando cambian las criptomonedas seleccionadas o las horas
  useEffect(() => {
    if (selectedCryptos.length > 0 && hours > 0) {
      fetchAllPriceData();
    }
  }, [selectedCryptos, hours]);

  // Dibujar el gráfico cuando cambian los datos
  useEffect(() => {
    if (Object.keys(priceData).length > 0 && canvasRef.current) {
      drawChart();
    }
  }, [priceData]);

  const fetchAllPriceData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const promises = selectedCryptos.map(async (cryptoId) => {
        const response = await fetch(
          `http://34.95.126.189/prices/history/?crypto_id=${cryptoId}&hours=${hours}`
        );
        return response.json();
      });

      const results = await Promise.all(promises);
      
      const newPriceData: Record<string, PriceData[]> = {};
      results.forEach((result: ApiResponse, index) => {
        if (result.status === 'success') {
          newPriceData[selectedCryptos[index]] = result.data;
        }
      });

      setPriceData(newPriceData);
      
      if (Object.keys(newPriceData).length === 0) {
        setError('Error al cargar los datos del gráfico');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoSelection = (cryptoId: string) => {
    if (selectedCryptos.includes(cryptoId)) {
      // Si ya está seleccionada, la quitamos
      setSelectedCryptos(selectedCryptos.filter(id => id !== cryptoId));
    } else {
      // Si no está seleccionada, la agregamos
      setSelectedCryptos([...selectedCryptos, cryptoId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCryptos.length === cryptos.length) {
      // Si todas están seleccionadas, deseleccionar todas
      setSelectedCryptos([]);
    } else {
      // Si no, seleccionar todas
      setSelectedCryptos(cryptos.map(crypto => crypto.id.toString()));
    }
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || Object.keys(priceData).length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configuración del gráfico
    const padding = 50;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    // Encontrar valores mínimos y máximos para escalar el gráfico (entre todas las criptos)
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let minTime = Infinity;
    let maxTime = -Infinity;

    Object.values(priceData).forEach(data => {
      const prices = data.map(d => d.price);
      const currentMin = Math.min(...prices);
      const currentMax = Math.max(...prices);
      
      const timestamps = data.map(d => new Date(d.timestamp).getTime());
      const currentMinTime = Math.min(...timestamps);
      const currentMaxTime = Math.max(...timestamps);

      if (currentMin < minPrice) minPrice = currentMin;
      if (currentMax > maxPrice) maxPrice = currentMax;
      if (currentMinTime < minTime) minTime = currentMinTime;
      if (currentMaxTime > maxTime) maxTime = currentMaxTime;
    });

    const priceRange = maxPrice - minPrice;
    const timeRange = maxTime - minTime;
    
    // Dibujar ejes
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    
    // Eje Y
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height + padding);
    
    // Eje X
    ctx.lineTo(width + padding, height + padding);
    ctx.stroke();
    
    // Dibujar líneas de guía y etiquetas
    ctx.textAlign = 'right';
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    
    // Marcadores del eje Y
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding + height - (i / ySteps) * height;
      const value = minPrice + (i / ySteps) * priceRange;
      
      ctx.beginPath();
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(padding, y);
      ctx.stroke();
      
      ctx.fillText(value.toFixed(2), padding - 10, y + 4);
    }
    
    // Marcadores del eje X (solo algunos para no saturar)
    // Tomamos la primera cripto como referencia para los tiempos
    const firstCryptoData = Object.values(priceData)[0];
    const xSteps = Math.min(5, firstCryptoData.length);
    for (let i = 0; i <= xSteps; i++) {
      const index = Math.floor((i / xSteps) * (firstCryptoData.length - 1));
      const x = padding + (i / xSteps) * width;
      const date = new Date(firstCryptoData[index].timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      ctx.beginPath();
      ctx.moveTo(x, height + padding);
      ctx.lineTo(x, height + padding + 5);
      ctx.stroke();
      
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, x, height + padding + 20);
    }
    
    // Dibujar las líneas de cada criptomoneda
    Object.entries(priceData).forEach(([cryptoId, data]) => {
      if (data.length === 0) return;
      
      const cryptoInfo = cryptos.find(c => c.id.toString() === cryptoId);
      const color = cryptoInfo?.color || '#000';
      
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      
      data.forEach((point, index) => {
        const date = new Date(point.timestamp);
        const x = padding + ((date.getTime() - minTime) / timeRange) * width;
        const y = padding + height - ((point.price - minPrice) / priceRange) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    });
    
    // Título del gráfico
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Comparación de criptomonedas - Últimas ${hours} horas`, canvas.width / 2, 20);
    
    // Leyenda
    const legendX = canvas.width - 150;
    let legendY = 30;
    
    Object.entries(priceData).forEach(([cryptoId]) => {
      const cryptoInfo = cryptos.find(c => c.id.toString() === cryptoId);
      if (!cryptoInfo) return;
      
      ctx.fillStyle = cryptoInfo.color;
      ctx.fillRect(legendX, legendY, 15, 15);
      
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.fillText(`${cryptoInfo.name} (${cryptoInfo.symbol})`, legendX + 20, legendY + 12);
      
      legendY += 20;
    });
  };

  return (
    <div className='container black-text'>    
      <div className="row">
        <div className="input-field col s12 m6">
          <div className="crypto-selection">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Selecciona criptomonedas:</label>
              <button 
                onClick={toggleSelectAll}
                className="btn waves-effect waves-light blue"
                style={{ padding: '0 10px', lineHeight: '30px', height: '30px', fontSize: '12px' }}
              >
                {selectedCryptos.length === cryptos.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </button>
            </div>
            <div className="crypto-checkboxes" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {cryptos.map((crypto) => (
                <label key={crypto.id} className="checkbox-label" style={{ display: 'block', margin: '5px 0' }}>
                  <input
                    type="checkbox"
                    checked={selectedCryptos.includes(crypto.id.toString())}
                    onChange={() => handleCryptoSelection(crypto.id.toString())}
                    disabled={loading}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{ color: crypto.color }}>
                    {crypto.name} ({crypto.symbol})
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="input-field col s12 m6">
          <div className="range-field">
            <p className="range-field black-text">
              <label>Rango de horas: {hours}h</label>
              <input 
                type="range" 
                min="1" 
                max="24" 
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value))}
                disabled={loading}
              />
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="row">
          <div className="col s12 red-text">
            {error}
          </div>
        </div>
      )}
      
      <div className="row">
        <div className="col s12">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={500}
            style={{ width: '100%', maxWidth: '800px', border: '1px solid #ddd' }}
          />
        </div>
      </div>
      
      {loading && (
        <div className="progress">
          <div className="indeterminate"></div>
        </div>
      )}
    </div>
  );
};

export default AllCryptoChart;