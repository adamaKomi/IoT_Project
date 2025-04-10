import os
import xml.etree.ElementTree as ET
from ..utils.file_handlers import read_xml_file, write_json_file
from ..utils.sumo_helpers import generate_route_file, generate_sensors_file

class SumoUtilsService:
    def __init__(self, config_path):
        self.config_path = config_path
        
    def prepare_simulation_files(self):
        """Prepare all necessary SUMO files for simulation"""
        net_file = os.path.join(self.config_path, "map.net.xml")
        rou_file = os.path.join(self.config_path, "map.rou.xml")
        sensors_file = os.path.join(self.config_path, "sensors.add.xml")
        
        # Generate route file if it doesn't exist
        if not os.path.exists(rou_file):
            generate_route_file(net_file, rou_file)
            
        # Generate sensors file if it doesn't exist
        if not os.path.exists(sensors_file):
            generate_sensors_file(net_file, sensors_file)
            
        return {
            "net_file": net_file,
            "rou_file": rou_file,
            "sensors_file": sensors_file
        }
    
    def extract_network_metadata(self):
        """Extract network metadata from SUMO network file"""
        net_file = os.path.join(self.config_path, "map.net.xml")
        tree = read_xml_file(net_file)
        root = tree.getroot()
        
        # Extract network boundaries
        location = root.find("location")
        boundaries = {
            "net_offset": location.get("netOffset", "0,0"),
            "conv_boundary": location.get("convBoundary", "0,0,0,0"),
            "orig_boundary": location.get("origBoundary", "0,0,0,0"),
            "proj_projection": location.get("projParameter", "")
        }
        
        # Count edges, junctions, etc.
        junctions = root.findall("junction")
        edges = root.findall("edge")
        connections = root.findall("connection")
        
        metadata = {
            "boundaries": boundaries,
            "junctions_count": len(junctions),
            "edges_count": len(edges),
            "connections_count": len(connections)
        }
        
        # Save metadata to file
        metadata_file = os.path.join(self.config_path, "network_metadata.json")
        write_json_file(metadata_file, metadata)
        
        return metadata