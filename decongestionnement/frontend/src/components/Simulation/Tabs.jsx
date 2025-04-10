import React from 'react';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <ul className="nav nav-tabs mb-3">
      {tabs.map((tab) => (
        <li key={tab.id} className="nav-item">
          <button
            className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default Tabs;