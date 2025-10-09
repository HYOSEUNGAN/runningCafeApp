import React from 'react';

const StatsCard = ({
  title,
  value,
  icon,
  trend,
  trendText,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && trendText && (
            <div className="flex items-center mt-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}
              >
                {trend}
              </span>
              <span className="ml-2 text-sm text-gray-500">{trendText}</span>
            </div>
          )}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
};

export default StatsCard;
