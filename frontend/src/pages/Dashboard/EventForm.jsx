import React, { useState, useEffect } from "react";
import { eventApi, venueApi, vendorApi, clientApi } from "../../services/api";
import "../../styles/components.css";
import styles from "./EventForm.module.css";
import Modal from "../../components/common/Modal/Modal";

const EventForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    venue: null,
    client: null,
    vendors: [],
    notes: "",
  });

  const [venues, setVenues] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await venueApi.getAllVenues();
        if (response.data) {
          setVenues(response.data);
        }
      } catch (error) {
        console.error("Error fetching venues:", error);
        setErrors((prev) => ({
          ...prev,
          fetch: "Failed to load venues. Please try again.",
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await vendorApi.getAllVendors();
        if (response.data) {
          setVendors(response.data);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
        setErrors((prev) => ({
          ...prev,
          fetch: "Failed to load vendors. Please try again.",
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await clientApi.getAllClients();
        if (response.data) {
          setClients(response.data);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        setErrors((prev) => ({
          ...prev,
          fetch: "Failed to load clients. Please try again.",
        }));
      }
    };

    fetchClients();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) {
      newErrors.name = "Event name must be at least 3 characters long";
    }
    if (!formData.date) {
      newErrors.date = "Please select a date";
    }
    if (!formData.time) {
      newErrors.time = "Please select a time";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

// Handle changes to basic form fields (name, date, time, notes)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

// Handle Venue Selection from dropdown
  const handleVenueChange = (e) => {
    const selectedVenue = venues.find((v) => v.id === parseInt(e.target.value));
    setFormData((prev) => ({ ...prev, venue: selectedVenue }));
    if (errors.venue) {
      setErrors((prev) => ({ ...prev, venue: undefined }));
    }
  };

// Handle Vendor Selection from dropdown (allows multiple)
  const handleVendorChange = (e) => {
    const selectedVendor = vendors.find(
      (v) => v.id === parseInt(e.target.value)
    );
// Only add vendor if not already selected
    if (
      selectedVendor &&
      !formData.vendors.some((v) => v.id === selectedVendor.id)
    ) {
      setFormData((prev) => ({
        ...prev,
        vendors: [...prev.vendors, selectedVendor],
      }));
    }

    if (errors.vendor) {
      setErrors((prev) => ({ ...prev, vendor: undefined }));
    }
  };

// Remove a vendor from the selected vendors list
  const removeVendor = (vendorId) => {
    setFormData((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((v) => v.id !== vendorId),
    }));
  };

// Handle client selection from dropdown
  const handleClientChange = (e) => {
    const selectedClient = clients.find(
      (c) => c.id === parseInt(e.target.value)
    );
    setFormData((prev) => ({ ...prev, client: selectedClient }));
    if (errors.client) {
      setErrors((prev) => ({ ...prev, client: undefined }));
    }
  };
// Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
          // Format data for API submission
        const eventData = {
          name: formData.name,
          date: formData.date,
          time: formData.time,
          notes: formData.notes,
          venue: formData.venue ? { id: formData.venue.id } : null,
          client: formData.client ? { id: formData.client.id } : null,
          vendors: formData.vendors.map((vendor) => ({ id: vendor.id })),
        };
        await eventApi.createEvent(eventData);
        onSubmit(); // Notify parent of successful submission
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          submit: "Failed to create event. Please try again.",
        }));
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Modal onClose={onCancel}>
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>Add New Event</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Event Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`${styles.input} ${errors.name ? styles.error : ""}`}
              required
            />
            {errors.name && (
              <div className={styles.errorText}>{errors.name}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`${styles.input} ${errors.date ? styles.error : ""}`}
              required
            />
            {errors.date && (
              <div className={styles.errorText}>{errors.date}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={`${styles.input} ${errors.time ? styles.error : ""}`}
              required
            />
            {errors.time && (
              <div className={styles.errorText}>{errors.time}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Venue</label>
            <select
              name="venue"
              value={formData.venue?.id || ""}
              onChange={handleVenueChange}
              className={`${styles.input} ${errors.venue ? styles.error : ""}`}
            >
              <option value="">Select a venue (optional)</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
            {errors.venue && (
              <div className={styles.errorText}>{errors.venue}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Vendors</label>
            <select
              name="vendors"
              value=""
              onChange={handleVendorChange}
              className={`${styles.input} ${errors.vendor ? styles.error : ""}`}
            >
              <option value="">Select a vendor (optional)</option>
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
            {errors.vendor && (
              <div className={styles.errorText}>{errors.vendor}</div>
            )}

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
            <label className={styles.label}>Client</label>
            <select
              name="client"
              value={formData.client?.id || ""}
              onChange={handleClientChange}
              className={`${styles.input} ${errors.client ? styles.error : ""}`}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.client && (
              <div className={styles.errorText}>{errors.client}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className={styles.input}
              rows="4"
            />
          </div>

          {errors.submit && (
            <div className={styles.errorMessage}>{errors.submit}</div>
          )}
{/* Display submission errors if any */}
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitButton}>
              Create Event
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EventForm;
