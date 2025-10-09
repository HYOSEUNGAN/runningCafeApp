import React from 'react';

const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={className}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterDropdown;
