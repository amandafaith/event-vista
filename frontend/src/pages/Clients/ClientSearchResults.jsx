import React from "react";
import "../../styles/components.css";
import PhoneNumberInput from "../../components/common/PhoneNumberInput/PhoneNumberInput";

const ClientSearchResults = ({ clients = [], onEdit, onDelete }) => {
  const clientsArray = Array.isArray(clients) ? clients : [];

  if (clientsArray.length === 0) {
    return (
      <div className="empty-state">
        <p>No clients found. Try adjusting your search or add a new client!</p>
      </div>
    );
  }

  return (
    <div className="grid-container">
      {clientsArray.map((client) => (
        <div key={`client-${client.id}`} className="client-card">
          <div className="client-header">
            <h3 className="client-title">{client.name}</h3>
            <div className="flex" style={{ gap: "0.5rem" }}>
              <button
                key={`edit-${client.id}`}
                className="button button-outline"
                onClick={() => onEdit(client)}
              >
                Edit
              </button>
              <button
                key={`delete-${client.id}`}
                className="button button-secondary"
                onClick={() => onDelete(client.id)}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="client-details">
            <p key={`email-${client.id}`}>📧 {client.emailAddress}</p>
            <p key={`phone-${client.id}`}>
              📞{" "}
              <PhoneNumberInput
                name={`phone-${client.id}`}
                value={
                  typeof client.phoneNumber === "object"
                    ? client.phoneNumber.phoneNumber
                    : client.phoneNumber
                }
                onChange={() => {}}
                displayMode={true}
              />
            </p>
            {client.notes && (
              <p key={`notes-${client.id}`}>📝 {client.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientSearchResults;
