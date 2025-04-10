import React from 'react';

const PredictionTable = ({ futureData, selectedStreet }) => {
  return (
    <div>
      <h2
        style={{
          textAlign: 'center',
          color: '#333',
          marginBottom: '20px',
          fontSize: '1.8rem',
        }}
      >
        Prédictions futures pour {selectedStreet}
      </h2>
      <div
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'center',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#e9ecef', color: '#333' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Date</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>
                Prédictions d'accidents
              </th>
              <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Rue</th>
            </tr>
          </thead>
          <tbody>
            {futureData.map((item, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#fff',
                  transition: 'background-color 0.3s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e9ecef')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#fff')
                }
              >
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  {new Date(item.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                  {item.predicted_accidents.toFixed(6)}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{item.street}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PredictionTable;