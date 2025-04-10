from datetime import datetime, timedelta
from ..models.traffic import TrafficData
from typing import Dict, List, Optional

class TrafficDataService:
    @staticmethod
    def get_recent_traffic_data(hours: int = 1) -> List[Dict]:
        """Get traffic data from the last N hours"""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        return list(TrafficData.get_collection().find({
            "timestamp": {"$gte": cutoff.timestamp()}
        }).sort("timestamp", -1))
    
    @staticmethod
    def get_congestion_stats() -> Dict:
        """Calculate congestion statistics"""
        pipeline = [
            {"$group": {
                "_id": None,
                "avg_halting": {"$avg": "$halting_number"},
                "max_halting": {"$max": "$halting_number"},
                "total_lanes": {"$addToSet": "$lane_id"}
            }},
            {"$project": {
                "average_halting_vehicles": "$avg_halting",
                "max_halting_vehicles": "$max_halting",
                "total_monitored_lanes": {"$size": "$total_lanes"}
            }}
        ]
        
        result = list(TrafficData.get_collection().aggregate(pipeline))
        return result[0] if result else {}
    
    @staticmethod
    def get_lane_history(lane_id: str, limit: int = 100) -> List[Dict]:
        """Get historical data for a specific lane"""
        return list(TrafficData.get_collection().find({"lane_id": lane_id})
                   .sort("timestamp", -1)
                   .limit(limit))