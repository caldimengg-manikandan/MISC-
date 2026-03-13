// src/components/dashboard/StatCard.jsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon, change = '' }) => {
  const changeColor = change.startsWith('+') ? 'text-green-600' : 'text-red-600';
  const ChangeIcon = change.startsWith('+') ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 rounded-md bg-gray-100 text-gray-700">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${changeColor}`}>
            <ChangeIcon className="w-4 h-4" />
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-600">
        {title}
      </div>
    </div>
  );
};

export default StatCard;