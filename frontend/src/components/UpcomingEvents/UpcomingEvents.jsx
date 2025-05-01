import React, { useState, useEffect } from "react";
import { eventApi } from "../../services/api";
import styles from "./UpcomingEvents.module.css";

const getWeatherEmoji = (icon) => {
  const emojiMap = {
    "01d": "☀️",
    "01n": "🌙",
    "02d": "⛅",
    "02n": "☁️",
    "03d": "☁️",
    "03n": "☁️",
    "04d": "☁️",
    "04n": "☁️",
    "09d": "🌧️",
    "09n": "🌧️",
    "10d": "🌦️",
    "10n": "🌧️",
    "11d": "⛈️",
    "11n": "⛈️",
    "13d": "❄️",
    "13n": "❄️",
    "50d": "🌫️",
    "50n": "🌫️",
  };
  return emojiMap[icon] || "☀️";
};

const formatDate = (dateString) => {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const UpcomingEvents = ({ refreshTrigger }) => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        const response = await eventApi.getUpcomingEvents();
        setUpcomingEvents(response.data);
      } catch (err) {
        console.error("Error fetching upcoming events:", err);
        setError(err.message || "Failed to fetch upcoming events");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, [refreshTrigger]);

  if (loading)
    return (
      <div className={`${styles.upcomingEvents} ${styles.loading}`}>
        Loading upcoming events...
      </div>
    );
  if (error)
    return (
      <div className={`${styles.upcomingEvents} ${styles.error}`}>{error}</div>
    );
  if (upcomingEvents.length === 0)
    return (
      <div className={`${styles.upcomingEvents} ${styles.empty}`}>
        No upcoming events in the next 5 days
      </div>
    );

  return (
    <div className={styles.upcomingEvents}>
      <h2>Upcoming Events</h2>
      <div className={styles.eventsList}>
        {upcomingEvents.map((event) => (
          <div key={event.id} className={styles.eventCard}>
            <div className={styles.eventDate}>📅 {formatDate(event.date)}</div>
            <div className={styles.eventName}>{event.name}</div>
            <div className={styles.eventLocation}>
              {event.venueName || "No venue set"}
            </div>
            {event.vendors && event.vendors.length > 0 && (
              <div className={styles.eventVendors}>
                 {event.vendors.map((vendor) => vendor.name).join(", ")}
              </div>
            )}
            {event.weatherData && event.weatherData.icon ? (
              <div className={styles.eventWeather}>
                {getWeatherEmoji(event.weatherData.icon)}{" "}
                {event.weatherData.description}, {event.weatherData.temperature}
                {event.date === new Date().toISOString().split("T")[0]
                  ? " (Current)"
                  : " (Forecast)"}
              </div>
            ) : (
              <div className={styles.eventWeather}>
                Weather data not available
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
