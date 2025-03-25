import { useMapEvents } from "react-leaflet";
import { useDispatch } from "react-redux";
import { setZoomLevel } from "../../redux/actions/trafficActions";

const ZoomHandler = () => {
  const dispatch = useDispatch();

  useMapEvents({
    zoomend: (e) => {
      const newZoom = e.target.getZoom();
      dispatch(setZoomLevel(newZoom));
    },
  });

  return null;
};

export default ZoomHandler;