# app/routes/api.py
from flask import Blueprint, jsonify, request, current_app
from ..services.simulation import SimulationService
from ..services.traffic_data import TrafficDataService
from ..services.sumo_utils import SumoUtilsService
from ..utils.decorators import handle_errors

api_bp = Blueprint('api', __name__)

# Dans app/routes/api.py
@api_bp.route('/start-simulation', methods=['POST'])
@handle_errors
def start_simulation():
    """Start the traffic simulation"""
    data = request.get_json() or {}
    duration = data.get('duration', 1500)
    
    # Utiliser l'instance stockée dans l'application
    result = current_app.simulation_service.run_simulation(simulation_duration=duration)
    return jsonify(result), 200 if result["status"] != "error" else 400

@api_bp.route('/stop-simulation', methods=['POST'])
@handle_errors
def stop_simulation():
    """Stop the running traffic simulation"""
    result = current_app.simulation_service.stop_simulation()
    return jsonify(result), 200 if result["status"] != "error" else 400

# @api_bp.route('/simulation-status', methods=['GET'])
# @handle_errors
# def simulation_status():
#     """Get the current simulation status"""
#     status = {
#         "running": current_app.simulation_service.simulation_running,
#     }
#     return jsonify(status), 200


@api_bp.route('/pause-simulation', methods=['POST'])
@handle_errors
def pause_simulation():
    """Pause the running simulation"""
    result = current_app.simulation_service.pause_simulation()
    return jsonify(result), 200 if result["status"] != "error" else 400

@api_bp.route('/resume-simulation', methods=['POST'])
@handle_errors
def resume_simulation():
    """Resume a paused simulation"""
    result = current_app.simulation_service.resume_simulation()
    return jsonify(result), 200 if result["status"] != "error" else 400

@api_bp.route('/simulation-status', methods=['GET'])
@handle_errors
def simulation_status():
    """Get the current simulation status"""
    status = current_app.simulation_service.get_simulation_status()
    return jsonify({
        "status": "success",
        "data": {
            "running": status["running"],
            "paused": status.get("paused", False),
            "traci_connected": status["traci_connected"],
            "current_step": status.get("current_step", 0)
        }
    }), 200
    
    

# @api_bp.route('/prepare-simulation', methods=['POST'])
# @handle_errors
# def prepare_simulation():
#     """Prepare SUMO files for simulation"""
#     sumo_utils = SumoUtilsService(current_app.config.SUMO_CONFIG_PATH)
#     files = sumo_utils.prepare_simulation_files()
#     return jsonify({"status": "success", "files": files}), 200

# @api_bp.route('/traffic-data', methods=['GET'])
# @handle_errors
# def get_traffic_data():
#     """Get recent traffic data"""
#     hours = request.args.get('hours', 1, type=int)
#     traffic_service = TrafficDataService()
#     data = traffic_service.get_recent_traffic_data(hours=hours)
#     return jsonify({"status": "success", "count": len(data), "data": data}), 200

# @api_bp.route('/congestion-stats', methods=['GET'])
# @handle_errors
# def get_congestion_stats():
#     """Get congestion statistics"""
#     traffic_service = TrafficDataService()
#     stats = traffic_service.get_congestion_stats()
#     return jsonify({"status": "success", "data": stats}), 200

# @api_bp.route('/lane-data/<lane_id>', methods=['GET'])
# @handle_errors
# def get_lane_data(lane_id):
#     """Get historical data for a specific lane"""
#     limit = request.args.get('limit', 100, type=int)
#     traffic_service = TrafficDataService()
#     data = traffic_service.get_lane_history(lane_id, limit=limit)
#     return jsonify({"status": "success", "count": len(data), "data": data}), 200

# @api_bp.route('/network-metadata', methods=['GET'])
# @handle_errors
# def get_network_metadata():
#     """Get network metadata"""
#     sumo_utils = SumoUtilsService(current_app.config.SUMO_CONFIG_PATH)
#     metadata = sumo_utils.extract_network_metadata()
#     return jsonify({"status": "success", "data": metadata}), 200

# @api_bp.route('/health', methods=['GET'])
# def health_check():
#     """Health check endpoint"""
#     return jsonify({"status": "healthy"}), 200