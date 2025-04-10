import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const PredictionChart = ({ chartData }) => {
  return (
    <div
      style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        marginBottom: '30px',
      }}
    >
      <LineChart
        width={1100}
        height={400}
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
          interval={Math.floor(chartData.length / 10)}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis />
        <Tooltip
          formatter={(value) => value.toFixed(2)}
          labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR')}
        />
        <Legend verticalAlign="top" height={36} />
        <Line type="monotone" dataKey="Train" stroke="#1e90ff" name="Données entraînement" dot={false} />
        <Line
          type="monotone"
          dataKey="Pred Train"
          stroke="#00ced1"
          strokeDasharray="5 5"
          name="Prédictions entraînement"
          dot={false}
        />
        <Line type="monotone" dataKey="Test" stroke="#32cd32" name="Données test" dot={false} />
        <Line
          type="monotone"
          dataKey="Pred Test"
          stroke="#ffa500"
          strokeDasharray="5 5"
          name="Prédictions test"
          dot={false}
        />
        <Line type="monotone" dataKey="Pred Future" stroke="#ff4500" name="Prédictions futures" dot={false} />
      </LineChart>
    </div>
  );
};

export default PredictionChart;