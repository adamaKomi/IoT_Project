export const parseCoordinates = (coordStr) => {
  const parts = coordStr.split(',').map((part) => parseFloat(part.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    return null;
  }
  return { lat: parts[0], lng: parts[1] };
};