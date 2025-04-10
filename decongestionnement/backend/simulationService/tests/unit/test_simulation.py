import pytest
from unittest.mock import patch, MagicMock
from app.services.simulation import SimulationService

def test_init_simulation_service():
    """Test initialization of simulation service"""
    mock_config = MagicMock()
    mock_config.SUMO_CONFIG_PATH = "/mock/path"
    mock_config.API_URL = "http://mock-api.com"
    
    service = SimulationService(mock_config)
    assert service.sumo_config_path == "/mock/path"
    assert service.api_url == "http://mock-api.com"

@patch('app.services.simulation.traci')
@patch('app.services.simulation.configure_simulation')
def test_run_simulation(mock_configure, mock_traci):
    """Test running simulation"""
    # Setup mocks
    mock_config = MagicMock()
    mock_config.SUMO_CONFIG_PATH = "/mock/path"
    mock_config.API_URL = "http://mock-api.com"
    
    mock_configure.return_value = ["mock", "cmd"]
    mock_traci.lanearea.getIDList.return_value = ["lane_1", "lane_2"]
    
    # Run simulation with shorter duration for testing
    service = SimulationService(mock_config)
    service._process_lane_data = MagicMock()  # Mock processing to avoid actual data handling
    service._notify_api = MagicMock()  # Mock API notification
    
    service.run_simulation(simulation_duration=5)
    
    # Verify simulation setup
    mock_configure.assert_called_once_with("/mock/path")
    mock_traci.start.assert_called_once_with(["mock", "cmd"])
    
    # Verify simulation steps
    assert mock_traci.simulationStep.call_count == 5
    assert service._process_lane_data.call_count == 5
    assert service._notify_api.call_count == 5
    
    # Verify simulation cleanup
    mock_traci.close.assert_called_once()