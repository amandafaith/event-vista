import React from "react";
import "../../styles/components.css";
import PhoneNumberInput from "../../components/common/PhoneNumberInput/PhoneNumberInput";

const VendorSearchResults = ({ vendors = [], onEdit, onDelete }) => {
  const vendorsArray = Array.isArray(vendors) ? vendors : [];

  if (vendorsArray.length === 0) {
    return (
      <div className="empty-state">
        <p>No vendors found. Try adjusting your search or add a new vendor!</p>
      </div>
    );
  }

  return (
    <div className="grid-container">
      {vendorsArray.map((vendor) => (
        <div key={`vendor-${vendor.id}`} className="vendor-card">
          <div className="vendor-header">
            <h3 className="vendor-title">{vendor.name}</h3>
            <div className="flex" style={{ gap: "0.5rem" }}>
              <button
                key={`edit-${vendor.id}`}
                className="button button-outline"
                onClick={() => onEdit(vendor)}
              >
                Edit
              </button>
              <button
                key={`delete-${vendor.id}`}
                className="button button-secondary"
                onClick={() => onDelete(vendor.id)}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="vendor-details">
            <p key={`email-${vendor.id}`}>📧 {vendor.emailAddress}</p>
            <p key={`phone-${vendor.id}`}>
              📞{" "}
              <PhoneNumberInput
                name={`phone-${vendor.id}`}
                value={
                  typeof vendor.phoneNumber === "object"
                    ? vendor.phoneNumber.phoneNumber
                    : vendor.phoneNumber
                }
                onChange={() => {}}
                displayMode={true}
              />
            </p>
            <p key={`skills-${vendor.id}`}>
              🛠️{" "}
              {Array.isArray(vendor.skills) && vendor.skills.length > 0 ? (
                <span className="skill-badges">
                  {vendor.skills.map((skill) => skill.name).join(", ")}
                </span>
              ) : (
                "None"
              )}
            </p>
            {vendor.notes && (
              <p key={`notes-${vendor.id}`}>📝 {vendor.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VendorSearchResults;
