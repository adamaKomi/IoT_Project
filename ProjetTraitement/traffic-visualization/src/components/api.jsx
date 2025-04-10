import axios from 'axios';

export const fetchStreets = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/streets');
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors du chargement des rues: ' + error.message);
  }
};

export const fetchPredictions = async (street) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/predictions/${encodeURIComponent(street)}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Erreur réseau: ' + error.message);
  }
};
