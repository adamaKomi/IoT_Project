import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StreetSelector from './StreetSelector';
import PredictionChart from './Chart';
import PredictionTable from './AccidentTable';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const AccidentPrediction = () => {
  const [streets, setStreets] = useState([]);
  const [selectedStreet, setSelectedStreet] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStreets = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/streets');
        setStreets(response.data);
        setSelectedStreet(response.data[0] || '');
      } catch (err) {
        setError('Erreur lors du chargement des rues: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStreets();
  }, []);

  useEffect(() => {
    if (!selectedStreet) return;

    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const url = `http://localhost:5000/api/predictions/${encodeURIComponent(selectedStreet)}`;
        const response = await axios.get(url);
        // Vérifier que la réponse contient les données attendues
        if (!response.data?.train || !response.data?.test || !response.data?.future) {
          throw new Error('Données de prédiction incomplètes ou mal formées');
        }
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur réseau: ' + err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, [selectedStreet]);

  // Agréger les données pour réduire le bruit (moyenne sur 7 jours)
  const aggregateData = (dates, values, label) => {
    const aggregated = [];
    const interval = 7; // Moyenne sur 7 jours
    if (!Array.isArray(dates) || !Array.isArray(values)) {
      return aggregated; // Retourner un tableau vide si les données sont invalides
    }
    for (let i = 0; i < dates.length; i += interval) {
      const sliceDates = dates.slice(i, i + interval);
      const sliceValues = values.slice(i, i + interval);
      const avgValue = sliceValues.reduce((sum, val) => sum + (val || 0), 0) / sliceValues.length;
      aggregated.push({
        date: sliceDates[0],
        [label]: avgValue,
      });
    }
    return aggregated;
  };

  // Préparer les données pour le graphique avec des vérifications
  const chartData = data?.train && data?.test && data?.future
    ? [
        ...(data.train.dates && data.train.real
          ? aggregateData(data.train.dates, data.train.real, 'Train').map((d, i) => ({
              ...d,
              'Pred Train': aggregateData(data.train.dates, data.train.predictions, 'Pred Train')[i]?.['Pred Train'] || 0,
            }))
          : []),
        ...(data.test.dates && data.test.real
          ? aggregateData(data.test.dates, data.test.real, 'Test').map((d, i) => ({
              ...d,
              'Pred Test': aggregateData(data.test.dates, data.test.predictions, 'Pred Test')[i]?.['Pred Test'] || 0,
            }))
          : []),
        ...(data.future
          ? data.future.map((item) => ({
              date: item.date,
              'Pred Future': item.predicted_accidents || 0,
            }))
          : []),
      ]
    : [];

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          color: '#333',
          marginBottom: '30px',
          fontSize: '2.5rem',
        }}
      >
        Prédictions des accidents
      </h1>

      {loading && streets.length === 0 ? (
        <LoadingSpinner message="Chargement des rues..." />
      ) : error && streets.length === 0 ? (
        <ErrorMessage message={error} />
      ) : (
        <StreetSelector
          streets={streets}
          selectedStreet={selectedStreet}
          onStreetChange={setSelectedStreet}
        />
      )}

      {loading && streets.length > 0 && (
        <LoadingSpinner message="Chargement des prédictions..." />
      )}
      {error && streets.length > 0 && <ErrorMessage message={error} />}
      {data && !loading && chartData.length > 0 ? (
        <div>
          <PredictionChart chartData={chartData} />
          <PredictionTable futureData={data.future || []} selectedStreet={selectedStreet} />
        </div>
      ) : (
        !loading && streets.length > 0 && <ErrorMessage message="Aucune donnée disponible pour cette rue." />
      )}
    </div>
  );
};

export default AccidentPrediction;