import type { FC } from 'react';
import CryptoList from './CryptoList';
import SingleCryptoChart from './SingleCryptoChart';
import MultiCryptoChart from './MultiCryptoChart';
import AllCryptoChart from './AllCryptoChart';
import RegressionChart from './RegressionChart';

interface DashboardProps {
  activeFeature: string;
  setActiveFeature: (value: string) => void;
}

const Dashboard: FC<DashboardProps> = ({ activeFeature }) => {
  const renderActiveFeature = () => {
    switch (activeFeature) {
      case 'currentPrices':
        return <CryptoList />;
      case 'singleChart':
        return <SingleCryptoChart />;
      case 'allChart':
        return <AllCryptoChart />;
      case 'multiChart':
        return <MultiCryptoChart />;
      case 'regression':
        return <RegressionChart />;
      default:
        return <CryptoList />;
    }
  };

  return (
    <section className="section">
      <div className="container">
        {renderActiveFeature()}
      </div>
    </section>
  );
};

export default Dashboard;