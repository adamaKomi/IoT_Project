import json
import pytest
from unittest.mock import patch

@patch('app.routes.api.SimulationService')
def test_start_simulation_endpoint(mock_sim_service, client):
    """Test the start simulation endpoint"""
    # Setup mock
    mock_instance = mock_sim_service.return_value
    mock_instance.run_simulation.return_value = {"steps": 1500}
    
    # Make request
    response = client.post('/api/v1/start-simulation', 
                          data=json.dumps({"duration": 100}),
                          content_type='application/json')
    
    # Check response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "success"
    assert "Simulation completed" in data["message"]
    
    # Verify mock was called correctly
    mock_instance.run_simulation.assert_called_once_with(simulation_duration=100)

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get('/api/v1/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "healthy"