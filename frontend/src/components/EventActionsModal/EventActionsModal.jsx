import React, { useState, useEffect } from "react";
import { eventApi, venueApi, vendorApi } from "../../services/api";
import Modal from "../common/Modal/Modal";
import styles from "./EventActionsModal.module.css";

const EventActionsModal = ({ event, onClose, onEventUpdated }) => {
  const [action, setAction] = useState("view"); // 'view', 'edit', 'rebook'
  const [formData, setFormData] = useState({
    name: event.name || "",
    date: event.date || "",
    time: event.time || "",
    venue: event.venue || null,
    vendors: event.vendors || [],
    notes: event.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [venues, setVenues] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venuesResponse, vendorsResponse] = await Promise.all([
          venueApi.getAllVenues(),
          vendorApi.getAllVendors(),
        ]);
        setVenues(venuesResponse.data || []);
        setVendors(vendorsResponse.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    if (action !== "view") {
      fetchData();
    }
  }, [action]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleVenueChange = (e) => {
    const venueId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      venue: venueId ? { id: parseInt(venueId) } : null,
    }));
  };

  const handleVendorChange = (e) => {
    const vendorId = parseInt(e.target.value);
    if (vendorId && !formData.vendors.some((v) => v.id === vendorId)) {
      const selectedVendor = vendors.find((v) => v.id === vendorId);
      setFormData((prev) => ({
        ...prev,
        vendors: [...prev.vendors, { id: vendorId, name: selectedVendor.name }],
      }));
    }
  };

  const removeVendor = (vendorId) => {
    setFormData((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((v) => v.id !== vendorId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Event name is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.time) {
      newErrors.time = "Time is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (action === "edit") {
        await eventApi.updateEvent(event.id, formData);
      } else if (action === "rebook") {
        await eventApi.rebookEvent(event.id, formData);
      }
      onEventUpdated();
      setAction("view");
    } catch (err) {
      console.error("Error saving event:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      setLoading(true);
      try {
        await eventApi.deleteEvent(event.id);
        onEventUpdated();
        onClose();
      } catch (err) {
        console.error("Error deleting event:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Add function to format time in 12-hour format
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderViewMode = () => (
    <div className={styles.viewMode}>
      <div className={styles.eventDetails}>
        <h2>{event.name}</h2>
        <p>
          <strong>Date:</strong> {event.date}
        </p>
        <p>
          <strong>Time:</strong> {formatTime(event.time)}
        </p>
        {event.venue && (
          <p>
            <strong>Venue:</strong> 📍 {event.venue.name}
          </p>
        )}
        {event.vendors && event.vendors.length > 0 && (
          <p>
            <strong>Vendors:</strong> 👥{" "}
            {event.vendors.map((v) => v.name).join(", ")}
          </p>
        )}
        {event.notes && (
          <p>
            <strong>Notes:</strong> {event.notes}
          </p>
        )}
      </div>
      <div className={styles.buttonGroup}>
        <button
          type="button"
          className={styles.submitButton}
          onClick={() => setAction("edit")}
        >
          Edit
        </button>
        <button
          type="button"
          className={styles.submitButton}
          onClick={() => setAction("rebook")}
        >
          Rebook
        </button>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={handleDelete}
        >
          Delete
        </button>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Event Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`${styles.input} ${errors.name ? styles.error : ""}`}
        />
        {errors.name && <div className={styles.errorText}>{errors.name}</div>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className={`${styles.input} ${errors.date ? styles.error : ""}`}
        />
        {errors.date && <div className={styles.errorText}>{errors.date}</div>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Time</label>
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          className={`${styles.input} ${errors.time ? styles.error : ""}`}
        />
        {errors.time && <div className={styles.errorText}>{errors.time}</div>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Venue</label>
        <select
          name="venue"
          value={formData.venue?.id || ""}
          onChange={handleVenueChange}
          className={styles.input}
        >
          <option value="">Select a venue</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Vendors</label>
        <select
          name="vendors"
          value=""
          onChange={handleVendorChange}
          className={styles.input}
        >
          <option value="">Select vendors</option>
          {vendors
            .filter(
              (vendor) => !formData.vendors.some((v) => v.id === vendor.id)
            )
            .map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
        </select>
        {formData.vendors.length > 0 && (
          <div className={styles.selectedVendors}>
            {formData.vendors.map((vendor) => (
              <div key={vendor.id} className={styles.selectedVendor}>
                <span>{vendor.name}</span>
                <button
                  type="button"
                  onClick={() => removeVendor(vendor.id)}
                  className={styles.removeVendor}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className={styles.textarea}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : action === "edit"
            ? "Save Changes"
            : "Rebook Event"}
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => setAction("view")}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <Modal onClose={onClose}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {action === "edit"
              ? "Edit Event"
              : action === "rebook"
              ? "Rebook Event"
              : ""}
          </h2>
          <p className={styles.modalSubtitle}>
            {action === "edit"
              ? "Update the event details below"
              : action === "rebook"
              ? "Enter new details for the rebooked event"
              : ""}
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {successMessage && (
          <div className={styles.success}>{successMessage}</div>
        )}

        {action === "view" ? renderViewMode() : renderForm()}
      </div>
    </Modal>
  );
};

export default EventActionsModal;
