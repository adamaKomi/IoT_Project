import React from 'react';

const LoadingSpinner = ({ message }) => {
  return (
    <p style={{ textAlign: 'center', color: '#666' }}>{message}</p>
  );
};

export default LoadingSpinner;