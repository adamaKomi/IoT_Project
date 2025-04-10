import React from "react";

const ViewButtons = ({ view, setView }) => {
  const views = [
    { id: "heatmap", label: "Carte de chaleur" },
    { id: "dangerous-zones", label: "Zones dangereuses" },
    { id: "TrafficAccidents", label: "TrafficAccidents" },
  ];

  return (
    <>
      {views.map((type) => (
        <React.Fragment key={type.id}>
          <button
            onClick={() => setView(type.id)}
            style={{
              margin: "0 5px",
              padding: "10px",
              backgroundColor: view === type.id ? "#ddd" : "#fff",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            {type.label}
          </button>
        </React.Fragment>
      ))}
    </>
  );
};

export default ViewButtons;