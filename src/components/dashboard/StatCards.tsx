
import React from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { EditableField } from '../ui/editable-field';

interface StatCardsProps {
  monthlyRevenue: number;
  revenueGrowth: number;
  cultivatedArea: number;
  parcelsCount: number;
  averageYield: number;
  yieldGrowth: number;
  alertsCount: number;
  handleRevenueChange: (value: string | number) => void;
  handleRevenueGrowthChange: (value: string | number) => void;
  handleAreaChange: (value: string | number) => void;
  handleParcelsCountChange: (value: string | number) => void;
  handleYieldChange: (value: string | number) => void;
  handleYieldGrowthChange: (value: string | number) => void;
}

const StatCards: React.FC<StatCardsProps> = ({
  monthlyRevenue,
  revenueGrowth,
  cultivatedArea,
  parcelsCount,
  averageYield,
  yieldGrowth,
  alertsCount,
  handleRevenueChange,
  handleRevenueGrowthChange,
  handleAreaChange,
  handleParcelsCountChange,
  handleYieldChange,
  handleYieldGrowthChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
      <div className="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex flex-row items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium text-sm mb-1">Revenu mensuel</p>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-800">
                <EditableField
                  value={monthlyRevenue}
                  type="number"
                  onSave={handleRevenueChange}
                  className="inline-block"
                /> €
              </p>
              <span className="text-green-600 text-sm font-medium flex items-center ml-3">
                <TrendingUp className="h-4 w-4 mr-1" /> +
                <EditableField
                  value={revenueGrowth}
                  type="number"
                  onSave={handleRevenueGrowthChange}
                  className="inline-block"
                />%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex flex-row items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium text-sm mb-1">Superficie cultivée</p>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-800">
                <EditableField
                  value={cultivatedArea}
                  type="number"
                  onSave={handleAreaChange}
                  className="inline-block"
                /> ha
              </p>
              <span className="text-rwiz-primary text-sm font-medium ml-3">
                <EditableField
                  value={parcelsCount}
                  type="number"
                  onSave={handleParcelsCountChange}
                  className="inline-block"
                /> parcelles
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="stat-card bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex flex-row items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium text-sm mb-1">Rendement moyen</p>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-800">
                <EditableField
                  value={averageYield}
                  type="number"
                  onSave={handleYieldChange}
                  className="inline-block"
                /> t/ha
              </p>
              <span className="text-green-600 text-sm font-medium flex items-center ml-3">
                <TrendingUp className="h-4 w-4 mr-1" /> +
                <EditableField
                  value={yieldGrowth}
                  type="number"
                  onSave={handleYieldGrowthChange}
                  className="inline-block"
                />%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCards;
