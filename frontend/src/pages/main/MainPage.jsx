import React, { useCallback } from 'react';
import "./MainPage.css";
import MapComponent from '../../components/map/MapComponent';
import { useDispatch, useSelector } from 'react-redux';
import { setStartSimulation } from '../../redux/actions/actions';

const MainPage = () => {
    const dispatch = useDispatch();
    const startSimulation = useSelector(state => state.startSimulation);

    const handleStart = useCallback(() => {
        fetch("http://127.0.0.1:5000/start-simulation")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Réponse reçue:", data);
                dispatch(setStartSimulation(true));
            })
            .catch(error => console.error('Erreur lors de la requête:', error));
    }, [dispatch]);

    return (
        <div className='container'>
            <h1 className='main-title'>Gestion de la congestion du trafic routier</h1>
            <div className='container-content '>
                <div className='left mapComponent'>
                    <MapComponent />
                </div>
                <div className='right'>
                    <div className="controls">
                        <button disabled={startSimulation} onClick={handleStart}>
                            Start
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MainPage;
