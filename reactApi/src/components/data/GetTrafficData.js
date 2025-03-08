const GetTrafficData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:4000/api/congestion-data");
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      // console.log("Données reçues:", data); 
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      return [];
    }
  };
  
  export default GetTrafficData;
  