from datetime import datetime
from ..extensions import mongo
from bson import ObjectId

class TrafficData:
    @staticmethod
    def get_collection():
        return mongo.db.traffic_data
    
    @staticmethod
    def create_indexes():
        """Ensure proper indexes exist"""
        TrafficData.get_collection().create_index("lane_id", unique=True)
        TrafficData.get_collection().create_index("timestamp")
    
    @staticmethod
    def upsert_lane_data(lane_id, data):
        """Insert or update lane data"""
        data['updated_at'] = datetime.utcnow()
        return TrafficData.get_collection().update_one(
            {"lane_id": lane_id},
            {"$set": data},
            upsert=True
        )
    
    @staticmethod
    def get_lane_data(lane_id):
        """Get data for a specific lane"""
        return TrafficData.get_collection().find_one({"lane_id": lane_id})
    
    @staticmethod
    def get_latest_data(limit=100):
        """Get latest traffic data"""
        return list(TrafficData.get_collection().find()
                   .sort("timestamp", -1)
                   .limit(limit))