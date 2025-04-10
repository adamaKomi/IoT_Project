import React from 'react';

const StreetSelector = ({ streets, selectedStreet, onStreetChange }) => {
  return (
    <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '400px' }}>
        <label
          htmlFor="street-select"
          style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: 'bold',
            color: '#555',
          }}
        >
          Sélectionner une rue :
        </label>
        <select
          id="street-select"
          value={selectedStreet}
          onChange={(e) => onStreetChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#fff',
          }}
        >
          <option value="">-- Choisir une rue --</option>
          {streets.map((street) => (
            <option key={street} value={street}>
              {street}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default StreetSelector;