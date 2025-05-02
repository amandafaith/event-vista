import React, { useState, useEffect } from "react";
import { eventApi } from "../../services/api";
import styles from "./UpcomingEvents.module.css";

const getWeatherIcon = (icon) => {
  const iconMap = {
    "01d": "/animated/day.svg",
    "01n": "/animated/night.svg",
    "02d": "/animated/cloudy-day-1.svg",
    "02n": "/animated/cloudy-night-1.svg",
    "03d": "/animated/cloudy-day-2.svg",
    "03n": "/animated/cloudy-night-2.svg",
    "04d": "/animated/cloudy-day-3.svg",
    "04n": "/animated/cloudy-night-3.svg",
    "09d": "/animated/rainy-1.svg",
    "09n": "/animated/rainy-1.svg",
    "10d": "/animated/rainy-2.svg",
    "10n": "/animated/rainy-2.svg",
    "11d": "/animated/thunder.svg",
    "11n": "/animated/thunder.svg",
    "13d": "/animated/snowy-1.svg",
    "13n": "/animated/snowy-1.svg",
    "50d": "/animated/cloudy.svg",
    "50n": "/animated/cloudy.svg",
  };
  return iconMap[icon] || "/animated/day.svg";
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
            <div className={styles.eventContent}>
              <div className={styles.eventName}>{event.name}</div>
              <div className={styles.eventDate}>📅 {event.formattedDate}</div>
              <div className={styles.eventTime}>🕒 {event.formattedTime}</div>
              <div className={styles.eventLocation}>{event.venueName}</div>
              {event.formattedVendorNames && (
                <div className={styles.eventVendors}>
                  {event.formattedVendorNames}
                </div>
              )}
              {event.client && (
                <div className={styles.eventClient}>{event.client.name}</div>
              )}
            </div>
            {event.weatherData && event.weatherData.icon ? (
              <div className={styles.weatherSection}>
                <img
                  src={getWeatherIcon(event.weatherData.icon)}
                  alt={event.weatherData.description}
                  className={styles.weatherIcon}
                />
                <div className={styles.weatherInfo}>{event.weatherDisplay}</div>
              </div>
            ) : (
              <div className={styles.weatherSection}>
                <div className={styles.weatherInfo}>
                  Weather data not available
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
