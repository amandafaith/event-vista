import React, { useState, useEffect } from "react";
import styles from "./Calendar.module.css";
import EventActionsModal from "../../components/EventActionsModal/EventActionsModal";
import { eventApi } from "../../services/api";

const Calendar = ({ onEventUpdated, onAddEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventsByDate, setEventsByDate] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEventsForMonth = async () => {
      // Only show loading if we don't have any events for the current month
      const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
      const hasEventsForMonth = Object.keys(eventsByDate).some((date) =>
        date.startsWith(currentMonthKey)
      );

      if (!hasEventsForMonth) {
        setLoading(true);
      }

      try {
        const firstDay = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const lastDay = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );

        console.log("Fetching events for date range:", {
          startDate: firstDay.toISOString().split("T")[0],
          endDate: lastDay.toISOString().split("T")[0],
        });

        const response = await eventApi.getEventsByDateRange(
          firstDay.toISOString().split("T")[0],
          lastDay.toISOString().split("T")[0]
        );

        console.log("API Response:", response);

        // Create a new eventsByDate object without the current month's events
        const newEventsByDate = Object.keys(eventsByDate).reduce(
          (acc, date) => {
            if (!date.startsWith(currentMonthKey)) {
              acc[date] = eventsByDate[date];
            }
            return acc;
          },
          {}
        );

        // Add the new events
        if (response && response.data) {
          console.log("Response data:", response.data);
          if (Array.isArray(response.data)) {
            response.data.forEach((event) => {
              const dateStr = event.date;
              if (!newEventsByDate[dateStr]) {
                newEventsByDate[dateStr] = [];
              }
              // Check if the event is already in the array
              const isDuplicate = newEventsByDate[dateStr].some(
                (e) => e.id === event.id
              );
              if (!isDuplicate) {
                newEventsByDate[dateStr].push(event);
              }
            });
          } else {
            console.warn("Response data is not an array:", response.data);
          }
        } else {
          console.warn("No response data received from API");
        }

        console.log("Updated eventsByDate:", newEventsByDate);
        setEventsByDate(newEventsByDate);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsForMonth();
  }, [currentDate]);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";

    const timeWithoutSeconds = timeStr.split(":").slice(0, 2).join(":");

    const [hours, minutes] = timeWithoutSeconds.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const events = eventsByDate[dateStr] || [];
    // Sort events by time
    return [...events].sort((a, b) => {
      const timeA = a.time.split(":").map(Number);
      const timeB = b.time.split(":").map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "month":
        newDate.setMonth(currentDate.getMonth() - 1);
        break;
      case "week":
        newDate.setDate(currentDate.getDate() - 7);
        break;
      case "day":
        newDate.setDate(currentDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "month":
        newDate.setMonth(currentDate.getMonth() + 1);
        break;
      case "week":
        newDate.setDate(currentDate.getDate() + 7);
        break;
      case "day":
        newDate.setDate(currentDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getTimeSlots = () => {
    const slots = [];
    // First add times from 8 AM to 11 PM
    for (let hour = 8; hour < 24; hour++) {
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      slots.push(`${hour12}:00 ${ampm}`);
    }
    // Then add times from 12 AM to 7 AM
    for (let hour = 0; hour < 8; hour++) {
      const ampm = "AM";
      const hour12 = hour % 12 || 12;
      slots.push(`${hour12}:00 ${ampm}`);
    }
    return slots;
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEventUpdated = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    if (onEventUpdated) {
      onEventUpdated();
    }
  };

  const handleScrollToEvent = (eventIndex, eventDate) => {
    console.log("Scrolling to event index:", eventIndex);
    console.log("For date:", eventDate);

    // Find the current day container
    const dayContainer = document.querySelector(
      `.${styles.calendarDay}[data-date="${eventDate.toISOString()}"]`
    );
    console.log("Day container found:", !!dayContainer);

    if (!dayContainer) return;

    // Find the events container
    const eventsContainer = dayContainer.querySelector(
      `.${styles.calendarDayEvents}`
    );
    console.log("Events container found:", !!eventsContainer);

    if (!eventsContainer) return;

    // Find all events
    const events = eventsContainer.querySelectorAll(`.${styles.calendarEvent}`);
    console.log("Number of events found:", events.length);

    if (!events || !events[eventIndex]) return;

    // Get the target event
    const targetEvent = events[eventIndex];
    console.log("Target event found:", !!targetEvent);

    // Scroll to the event
    targetEvent.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add weekday headers
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekdayHeaders = (
      <div className={styles.calendarWeekdays}>
        {weekdays.map((day, index) => (
          <div key={index} className={styles.calendarWeekday}>
            {day}
          </div>
        ))}
      </div>
    );

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className={`${styles.calendarDay} ${styles.calendarDayEmpty}`}
        />
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dayEvents = getEventsForDate(date);

      days.push(
        <div
          key={day}
          className={styles.calendarDay}
          data-date={date.toISOString()}
        >
          <div className={styles.calendarDayNumber}>
            {day}
            {dayEvents.length > 1 && (
              <div className={styles.eventIndicators}>
                {dayEvents.map((_, index) => (
                  <div
                    key={index}
                    className={styles.eventIndicator}
                    title={`Event ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className={styles.calendarDayEvents}>
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={styles.calendarEvent}
                onClick={() => handleEventClick(event)}
                title={`${formatTime(event.time)} - ${event.name}${
                  event.client ? "\nClient: " + event.client.name : ""
                }${event.venue ? " at " + event.venue.name : ""}${
                  event.vendors && event.vendors.length > 0
                    ? "\nVendors: " +
                      event.vendors.map((v) => v.name).join(", ")
                    : ""
                }${event.notes ? "\nNotes: " + event.notes : ""}`}
              >
                <div className={styles.eventTime}>{formatTime(event.time)}</div>
                <div className={styles.eventName}>{event.name}</div>
                {event.venue && (
                  <div className={styles.eventVenue}>📍 {event.venue.name}</div>
                )}
                {event.vendors && event.vendors.length > 0 && (
                  <div className={styles.eventVendors}>
                    👥 {event.vendors.map((v) => v.name).join(", ")}
                  </div>
                )}
                {event.client && (
                  <div className={styles.eventClient}>
                    🤝 {event.client.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Add empty cells for remaining days to complete the grid
    const totalDays = firstDay + daysInMonth;
    const remainingDays = Math.ceil(totalDays / 7) * 7 - totalDays;
    for (let i = 0; i < remainingDays; i++) {
      days.push(
        <div
          key={`empty-end-${i}`}
          className={`${styles.calendarDay} ${styles.calendarDayEmpty}`}
        />
      );
    }

    return (
      <>
        {weekdayHeaders}
        <div className={styles.calendarGrid}>{days}</div>
      </>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates();

    return (
      <div className={styles.calendarWeekView}>
        <div className={styles.calendarWeekHeader}>
          {weekDates.map((date, index) => (
            <div key={index} className={styles.calendarWeekDay}>
              <div className={styles.calendarWeekDayName}>
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className={styles.calendarWeekDayNumber}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.calendarWeekGrid}>
          {weekDates.map((date, dateIndex) => {
            const dayEvents = getEventsForDate(date);
            return (
              <div key={dateIndex} className={styles.calendarWeekDayColumn}>
                {dayEvents.map((event) => (
                  <div key={event.id} className={styles.calendarEventWeek}>
                    <div className={styles.weekEventTime}>
                      {formatTime(event.time)}
                    </div>
                    <div className={styles.weekEventName}>{event.name}</div>
                    {event.venue && (
                      <div className={styles.weekEventVenue}>
                        📍 {event.venue.name}
                      </div>
                    )}
                    {event.vendors && event.vendors.length > 0 && (
                      <div className={styles.weekEventVendors}>
                        👥 {event.vendors.map((v) => v.name).join(", ")}
                      </div>
                    )}
                    {event.client && (
                      <div className={styles.weekEventClient}>
                        🤝 {event.client.name}
                      </div>
                    )}
                    {event.notes && (
                      <div className={styles.weekEventNotes}>
                        📝 {event.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className={styles.calendarDayView}>
        <div className={styles.calendarDayHeader}>
          <div className={styles.calendarDayTitle}>
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <div className={styles.calendarDayTimeline}>
          {timeSlots.map((time, index) => (
            <React.Fragment key={index}>
              <div className={styles.calendarTime}>{time}</div>
              <div className={styles.calendarSlotContent}>
                {dayEvents
                  .filter((event) => {
                    const eventHour = parseInt(event.time.split(":")[0]);
                    const slotHour = parseInt(time.split(":")[0]);
                    const slotIsPM = time.includes("PM");
                    const eventIsPM = eventHour >= 12;

                    // Convert both to 24-hour format for comparison
                    const slot24Hour = slotIsPM
                      ? slotHour === 12
                        ? 12
                        : slotHour + 12
                      : slotHour === 12
                      ? 0
                      : slotHour;
                    return eventHour === slot24Hour;
                  })
                  .map((event) => (
                    <div key={event.id} className={styles.calendarEventWeek}>
                      <div className={styles.weekEventTime}>
                        {formatTime(event.time)}
                      </div>
                      <div className={styles.weekEventName}>{event.name}</div>
                      {event.venue && (
                        <div className={styles.weekEventVenue}>
                          📍 {event.venue.name}
                        </div>
                      )}
                      {event.vendors && event.vendors.length > 0 && (
                        <div className={styles.weekEventVendors}>
                          👥 {event.vendors.map((v) => v.name).join(", ")}
                        </div>
                      )}
                      {event.client && (
                        <div className={styles.weekEventClient}>
                          🤝 {event.client.name}
                        </div>
                      )}
                      {event.notes && (
                        <div className={styles.weekEventNotes}>
                          📝 {event.notes}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case "month":
        return currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      case "week":
        const weekDates = getWeekDates();
        const startDate = weekDates[0];
        const endDate = weekDates[6];
        return `${startDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${endDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
      case "day":
        return currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      default:
        return "";
    }
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <div className={styles.navigation}>
          <button onClick={handlePrevious}>&lt;</button>
          <h2>{getViewTitle()}</h2>
          <button onClick={handleNext}>&gt;</button>
        </div>
        <div className={styles.headerControls}>
          <div className={styles.viewControls}>
            <button
              className={viewMode === "month" ? styles.active : ""}
              onClick={() => setViewMode("month")}
            >
              Month
            </button>
            <button
              className={viewMode === "week" ? styles.active : ""}
              onClick={() => setViewMode("week")}
            >
              Week
            </button>
            <button
              className={viewMode === "day" ? styles.active : ""}
              onClick={() => setViewMode("day")}
            >
              Day
            </button>
          </div>
          <button onClick={onAddEvent} className={styles.addEventButton}>
            Add Event
          </button>
        </div>
      </div>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}
      {viewMode === "month" && renderMonthView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "day" && renderDayView()}
      {showEventModal && selectedEvent && (
        <EventActionsModal
          event={selectedEvent}
          onClose={() => setShowEventModal(false)}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
};

export default Calendar;
