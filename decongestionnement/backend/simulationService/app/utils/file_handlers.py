import os
import json
import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional

def read_json_file(file_path: str) -> Dict[str, Any]:
    """Read JSON file and return its content"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File {file_path} not found")
    
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def write_json_file(file_path: str, data: Dict[str, Any]) -> None:
    """Write data to JSON file"""
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4)

def read_xml_file(file_path: str) -> ET.ElementTree:
    """Read XML file and return ElementTree"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File {file_path} not found")
    
    try:
        return ET.parse(file_path)
    except ET.ParseError as e:
        raise ValueError(f"Error parsing XML file: {str(e)}")

def get_float_value(element: ET.Element, attribute: str, default: Optional[float] = None) -> Optional[float]:
    """Get float value from XML element attribute"""
    value = element.get(attribute)
    return float(value) if value is not None else default

def ensure_directory_exists(dir_path: str) -> None:
    """Ensure directory exists, create if it doesn't"""
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)