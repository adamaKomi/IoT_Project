import React from 'react';

const ErrorMessage = ({ message }) => {
  return (
    <p style={{ textAlign: 'center', color: 'red' }}>{message}</p>
  );
};

export default ErrorMessage;