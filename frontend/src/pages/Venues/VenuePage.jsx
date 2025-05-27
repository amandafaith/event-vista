import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { venueApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import VenueForm from "./VenueForm";
import VenueSearch from "./VenueSearch";
import VenueSearchResults from "./VenueSearchResults";
import Modal from "../../components/common/Modal/Modal";
import Navigation from "../../components/common/Navigation/Navigation";
import styles from "./VenuePage.module.css";

const VenuePage = () => {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchVenues();
  }, [user, navigate]);

  const handleAuthError = async () => {
    await logout();
    navigate("/login");
  };

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await venueApi.getAllVenues();
      setVenues(response.data || []);
      setSearchResults(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching venues:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await handleAuthError();
      } else {
        setError("Unable to load venues. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults(venues);
      return;
    }

    try {
      setLoading(true);
      let result;
      console.log("Searching for:", searchTerm, "by type:", searchType);

      switch (searchType) {
        case "name":
          result = await venueApi.getVenueByName(searchTerm);
          console.log("Name search result:", result);
          break;
        case "location":
          result = await venueApi.getVenueByLocation(searchTerm);
          console.log("Location search result:", result);
          break;
        case "phone":
          result = await venueApi.getVenueByPhoneNumber(searchTerm);
          console.log("Phone search result:", result);
          break;
        case "email":
          result = await venueApi.getVenueByEmail(searchTerm);
          console.log("Email search result:", result);
          break;
        default:
          result = [];
      }

      // Extract data from response if it exists
      if (result && result.data) {
        result = result.data;
      }

      // Ensure result is an array
      const searchResults = Array.isArray(result) ? result : [result];
      console.log("Final search results:", searchResults);

      setSearchResults(searchResults.filter((item) => item !== null));
      setError(null);
    } catch (err) {
      console.error("Error searching venues:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await handleAuthError();
      } else {
        setError("Error searching venues. Please try again.");
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddVenue = () => {
    if (!user) {
      handleAuthError();
      return;
    }
    setSelectedVenue(null);
    setShowVenueForm(true);
  };

  const handleEditVenue = (venue) => {
    if (!user) {
      handleAuthError();
      return;
    }
    setSelectedVenue(venue);
    setShowVenueForm(true);
  };

  const handleDeleteVenue = async (venueId) => {
    if (!user) {
      handleAuthError();
      return;
    }

    if (window.confirm("Are you sure you want to delete this venue?")) {
      try {
        setIsSubmitting(true);
        await venueApi.deleteVenue(venueId);
        setVenues(venues.filter((venue) => venue.id !== venueId));
        setSearchResults(searchResults.filter((venue) => venue.id !== venueId));
        setError(null);
      } catch (err) {
        console.error("Error deleting venue:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          await handleAuthError();
        } else {
          setError("Failed to delete venue. Please try again later.");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleVenueSubmit = async (venueData) => {
    if (!user) {
      handleAuthError();
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedVenue) {
        // Update existing venue
        const response = await venueApi.updateVenue(
          selectedVenue.id,
          venueData
        );
        setVenues(
          venues.map((venue) =>
            venue.id === selectedVenue.id ? response.data : venue
          )
        );
        setSearchResults(
          searchResults.map((venue) =>
            venue.id === selectedVenue.id ? response.data : venue
          )
        );
      } else {
        // Create new venue
        const response = await venueApi.createVenue(venueData);
        setVenues([...venues, response.data]);
        setSearchResults([...searchResults, response.data]);
      }
      setShowVenueForm(false);
      setSelectedVenue(null);
      setError(null);
    } catch (err) {
      console.error("Error saving venue:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        await handleAuthError();
      } else {
        // Rethrow the error so VenueForm can handle and display it
        throw err;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAll = () => {
    setSearchTerm("");
    setSearchType("name");
    setSearchResults(venues);
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading venues...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navigation />
      <div className={styles.contentContainer}>
        <div className={styles.header}>
          <h1>Venues</h1>
        </div>

        <div className={styles.actionsContainer}>
          <VenueSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchType={searchType}
            setSearchType={setSearchType}
            onSearch={handleSearch}
            disabled={isSubmitting}
          />

          <div className={styles.actionButtons}>
            <button
              className={styles.viewAllButton}
              onClick={handleViewAll}
              disabled={isSubmitting}
            >
              View All
            </button>
            <button
              className={styles.addButton}
              onClick={handleAddVenue}
              disabled={isSubmitting}
            >
              Add New Venue
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        <VenueSearchResults
          venues={searchResults}
          onEdit={handleEditVenue}
          onDelete={handleDeleteVenue}
          disabled={isSubmitting}
        />

        {showVenueForm && (
          <Modal
            onClose={() => {
              setShowVenueForm(false);
              setSelectedVenue(null);
            }}
          >
            <VenueForm
              initialData={selectedVenue}
              onSubmit={handleVenueSubmit}
              onCancel={() => {
                setShowVenueForm(false);
                setSelectedVenue(null);
              }}
            />
          </Modal>
        )}
      </div>
    </div>
  );
};

export default VenuePage;
