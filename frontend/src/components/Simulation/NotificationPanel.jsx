import React from "react";

const NotificationPanel = () => {
  return (
    <div className="flex-grow-1 overflow-auto p-2 bg-light rounded">
      <h5>Notifications</h5>
      {/* Ajoutez ici la logique pour afficher les notifications */}
      <p>Aucune notification pour le moment.</p>
    </div>
  );
};

export default NotificationPanel;