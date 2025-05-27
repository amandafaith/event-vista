import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Calendar from "./Calendar";
import EventForm from "./EventForm";
import UpcomingEvents from "../../components/UpcomingEvents/UpcomingEvents";
import { eventApi } from "../../services/api";
import "../../styles/components.css";
import { useNavigate } from "react-router-dom";
import Navigation from "../../components/common/Navigation/Navigation";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [eventUpdateCount, setEventUpdateCount] = useState(0);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventApi.getAllEvents();
      setEvents(response.data);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        const notification = document.querySelector(".notification");
        if (notification) {
          notification.classList.add("hiding");
          // Wait for the exit animation to complete before removing the message
          setTimeout(() => {
            setSuccessMessage(null);
          }, 300);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const redirectToUserProfile = () => {
    navigate("/profile");
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const handleAddEvent = () => {
    setShowEventForm(true);
  };

  const handleSaveEvent = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      await fetchEvents();
      setSuccessMessage("Event created successfully!");
      setShowEventForm(false);
      setEventUpdateCount((prev) => prev + 1);
    } catch (err) {
      console.error("Error saving event:", err);
      setError("Failed to create event. Please try again.");
    }
  };

  const handleCancelEvent = () => {
    setShowEventForm(false);
  };

  const handleEventUpdated = () => {
    fetchEvents();
    setEventUpdateCount((prev) => prev + 1);
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Navigation />
        <div className="dashboard-container">
          <div className="dashboard-content">
            <div className="loading-container">
              <div className="loading-spinner">Loading events...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-layout">
        <Navigation />
        <div className="dashboard-container">
          <div className="dashboard-content">
            <div className="error-container">
              <div className="error-message">
                <h3>Error Loading Events</h3>
                <p>{error}</p>
                <button onClick={fetchEvents} className="button button-primary">
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Navigation />
      <div className="dashboard-container">
        <div className="dashboard-content">
          {successMessage && (
            <div className="notification success-notification">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="error-message" style={{ margin: "1rem 0" }}>
              {error}
            </div>
          )}
          <div className="dashboard-grid">
            <div className="calendar-section">
              <Calendar
                events={events}
                onEventUpdated={handleEventUpdated}
                onAddEvent={handleAddEvent}
              />
            </div>
            <div className="upcoming-events-section">
              <UpcomingEvents refreshTrigger={eventUpdateCount} />
            </div>
          </div>
        </div>

        {showEventForm && (
          <div className="modal-overlay">
            <div className="modal-container">
              <EventForm
                onSubmit={handleSaveEvent}
                onCancel={handleCancelEvent}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
