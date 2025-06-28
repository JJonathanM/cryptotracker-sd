import type { FC } from 'react';
import type { SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  setActiveFeature: (value: SetStateAction<string>) => void;
}

const Sidebar: FC<SidebarProps> = ({ setActiveFeature }) => {
  const navigate = useNavigate();

  const handleFeatureSelect = (feature: string) => {
    setActiveFeature(feature);
    navigate('/');
  };

  return (
    <aside className="menu p-4">
      <p className="menu-label">CryptoTracker</p>
      <ul className="menu-list">
        <li>
          <a 
            className="is-active" 
            onClick={() => handleFeatureSelect('currentPrices')}
          >
            Precios Actuales
          </a>
        </li>
        <li>
          <a onClick={() => handleFeatureSelect('singleChart')}>
            Gráfico Individual
          </a>
        </li>
        <li>
          <a onClick={() => handleFeatureSelect('allChart')}>
            Gráfico de Todas
          </a>
        </li>
        <li>
          <a onClick={() => handleFeatureSelect('multiChart')}>
            Superposición
          </a>
        </li>
        <li>
          <a onClick={() => handleFeatureSelect('regression')}>
            Regresión Lineal
          </a>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;