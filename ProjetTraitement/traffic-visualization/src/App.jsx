import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TrafficMap from './components/Traffic';
import AccidentPrediction from './components/AccidentPrediction';
import Path from './components/Path';
import './App.css';

function App() {
  console.log('App rendu, URL actuelle :', window.location.pathname);
  return (
    <Routes>
      <Route path="/" element={<TrafficMap />} />
      <Route path="/predictions" element={<AccidentPrediction />} />
      <Route path="/path" element={<Path />} />
      <Route path="*" element={<div>404 - Page non trouvée</div>} />
    </Routes>
  );
}

export default App;