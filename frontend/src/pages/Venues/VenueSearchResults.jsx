import React from "react";
import "../../styles/components.css";
import PhoneNumberInput from "../../components/common/PhoneNumberInput/PhoneNumberInput";

const VenueSearchResults = ({ venues = [], onEdit, onDelete }) => {
  const venuesArray = Array.isArray(venues) ? venues : [];

  if (venuesArray.length === 0) {
    return (
      <div className="empty-state">
        <p>No venues found. Try adjusting your search or add a new venue!</p>
      </div>
    );
  }

  return (
    <div className="grid-container">
      {venuesArray.map((venue) => (
        <div key={`venue-${venue.id}`} className="venue-card">
          <div className="venue-header">
            <h3 className="venue-title">{venue.name}</h3>
            <div className="flex" style={{ gap: "0.5rem" }}>
              <button
                key={`edit-${venue.id}`}
                className="button button-outline"
                onClick={() => onEdit(venue)}
              >
                Edit
              </button>
              <button
                key={`delete-${venue.id}`}
                className="button button-secondary"
                onClick={() => onDelete(venue.id)}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="venue-details">
            <p key={`location-${venue.id}`}>📍 {venue.location}</p>
            <p key={`email-${venue.id}`}>📧 {venue.emailAddress}</p>
            <p key={`phone-${venue.id}`}>
              📞{" "}
              <PhoneNumberInput
                name={`phone-${venue.id}`}
                value={
                  typeof venue.phoneNumber === "object"
                    ? venue.phoneNumber.phoneNumber
                    : venue.phoneNumber
                }
                onChange={() => {}}
                displayMode={true}
              />
            </p>
            {venue.notes && <p key={`notes-${venue.id}`}>📝 {venue.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VenueSearchResults;
