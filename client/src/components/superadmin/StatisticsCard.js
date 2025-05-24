import React from 'react';

const StatisticsCard = ({ title, value, icon, iconBgColor, iconColor, percentChange, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center`}>
          <i className={`fas ${icon} text-lg ${iconColor}`}></i>
        </div>
        
        <div className={`text-sm font-medium ${
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
        } flex items-center`}>
          <i className={`fas fa-arrow-${trend} mr-1`}></i>
          {percentChange}%
        </div>
      </div>
      
      <div className="text-2xl font-bold text-npc-navy mb-1">{value}</div>
      <div className="text-gray-500 text-sm">{title}</div>
    </div>
  );
};

export default StatisticsCard;