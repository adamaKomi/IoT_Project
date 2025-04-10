import React from "react";
import { useNavigate } from "react-router-dom";

const NavigationButton = ({ to, label }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      style={{
        margin: "0 5px",
        padding: "10px",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
};

export default NavigationButton;