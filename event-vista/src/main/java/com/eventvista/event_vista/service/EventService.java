package com.eventvista.event_vista.service;

import com.eventvista.event_vista.data.EventRepository;
import com.eventvista.event_vista.model.Event;
import com.eventvista.event_vista.model.User;
import com.eventvista.event_vista.model.dto.UpcomingEventDTO;
import com.eventvista.event_vista.exception.EventNotFoundException;
import com.eventvista.event_vista.exception.InvalidEventDataException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;


@Service
public class EventService {
    private final EventRepository eventRepository;
    private final VenueService venueService;
    private final CalendarService calendarService;
    private final WeatherService weatherService;

    public EventService(EventRepository eventRepository, VenueService venueService,
                        CalendarService calendarService, WeatherService weatherService) {
        this.eventRepository = eventRepository;
        this.venueService = venueService;
        this.calendarService = calendarService;
        this.weatherService = weatherService;
    }

    // Retrieves all events associated with a specific user.
// Returns List of events belonging to the user, may be empty if no events exist
    public List<Event> findAllEvents(User user) {
        return eventRepository.findAllByUser(user);
    }


    // Retrieves a specific event by its ID for a given user.
// Returns The event if found
// throws EventNotFoundException if the event doesn't exist or doesn't belong to the user
    public Event findEventById(Integer id, User user) {
        return eventRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + id));
    }


    // Retrieves a specific event by its name for a given user.
// Returns The event if found
// Throws EventNotFoundException if the event doesn't exist or doesn't belong to the user
    public Event findEventByName(String name, User user) {
        return eventRepository.findByNameAndUser(name, user)
                .orElseThrow(() -> new EventNotFoundException("Event not found with name: " + name));
    }


    // Retrieves all events associated with a specific venue
// Returns List of events for the venue, may be empty if no events exist
    public List<Event> findEventsByVenue(Integer venueId, User user) {
        return eventRepository.findByVenueIdAndUser(venueId, user);
    }


    // Retrieves all events associated with a specific client
// Returns List of events for the client, may be empty if no events exist
    public List<Event> findEventsByClient(Integer clientId, User user) {
        return eventRepository.findByClientIdAndUser(clientId, user);
    }


    // Retrieves all events associated with a specific vendor
// Returns List of events for the vendor, may be empty if no events exist
    public List<Event> findEventsByVendor(Integer vendorId, User user) {
        return eventRepository.findByVendorsIdAndUser(vendorId, user);
    }


    // Creates a new event for a given user.
// Validates the event data and sets up necessary relationships.
// Throws InvalidEventDataException if the event data is invalid
    @Transactional
    public Event addEvent(Event event, User user) {
        // Not a rebooking operation,
        // Will not validate that the event date/time is in the future
        validateEventData(event, false);

        // Set the user
        event.setUser(user);

        // Handle venue relationship
        if (event.getVenue() != null && event.getVenue().getId() != null) {
            venueService.findVenueById(event.getVenue().getId(), user)
                    .ifPresent(event::setVenue);
        } else {
            event.setVenue(null);
        }

        // Set the user's calendar automatically
        calendarService.findCalendarByUser(user)
                .ifPresent(event::setCalendar);

        return eventRepository.save(event);
    }


    // Updates an existing event for a given user.
// Validates the event data and updates all relevant fields.
// Returns The updated event
// Throws EventNotFoundException if the event doesn't exist or doesn't belong to the user
// Throws InvalidEventDataException if the event data is invalid
    @Transactional
    public Event updateEvent(Integer id, Event updatedEvent, User user) {
        validateEventData(updatedEvent, false);

        return eventRepository.findByIdAndUser(id, user)
                .map(existingEvent -> {
                    // Update basic fields
                    existingEvent.setName(updatedEvent.getName());
                    existingEvent.setDate(updatedEvent.getDate());
                    existingEvent.setTime(updatedEvent.getTime());
                    existingEvent.setNotes(updatedEvent.getNotes());

                    // Handle venue relationship
                    if (updatedEvent.getVenue() != null && updatedEvent.getVenue().getId() != null) {
                        venueService.findVenueById(updatedEvent.getVenue().getId(), user)
                                .ifPresent(existingEvent::setVenue);
                    }

                    // Handle vendors relationship
                    if (updatedEvent.getVendors() != null) {
                        existingEvent.setVendors(new ArrayList<>(updatedEvent.getVendors()));
                    }

                    // Calendar relationship remains unchanged as it's tied to the user
                    return eventRepository.save(existingEvent);
                })
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + id));
    }


    // Deletes an event
// Throws EventNotFoundException if the event doesn't exist or doesn't belong to the user
    @Transactional
    public void deleteEvent(Integer id, User user) {
        Event event = eventRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + id));
        eventRepository.delete(event);
    }


    // Retrieves all upcoming events for a given user.
// Events are considered upcoming if their date and time are in the future.
// Return List of upcoming events, may be empty if no upcoming events exist
    public List<Event> findUpcomingEventsByUser(User user) {
        LocalDate currentDate = LocalDate.now();
        LocalTime currentTime = LocalTime.now();
        return eventRepository.findUpcomingEvents(user, currentDate, currentTime);
    }


    // Rebooks an existing event with new details
// Creates a new event based on the original event's data and updates it with new details.
// Returns The rebooked event
// Throws EventNotFoundException if the original event doesn't exist
// Throws InvalidEventDataException if the new event data is invalid
    @Transactional
    public Event rebookEvent(Integer id, Event newEventDetails, User user) {
        validateEventData(newEventDetails, true);

        Event originalEvent = eventRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + id));

        //Create new event with all original data
        Event newEvent = new Event();

        //Copy all basic fields from original event
        newEvent.setName(originalEvent.getName());
        newEvent.setDate(originalEvent.getDate());
        newEvent.setTime(originalEvent.getTime());
        newEvent.setNotes(originalEvent.getNotes());

        //Copy all relationships from original event
        newEvent.setVenue(originalEvent.getVenue());
        newEvent.setVendors(originalEvent.getVendors() != null ?
                new ArrayList<>(originalEvent.getVendors()) : new ArrayList<>());
        newEvent.setClient(originalEvent.getClient());
        newEvent.setCalendar(originalEvent.getCalendar());
        newEvent.setUser(user);

        //Update with new values if provided
        if (newEventDetails.getName() != null) {
            newEvent.setName(newEventDetails.getName());
        }

        //Date and time must be provided for rebooking
        if (newEventDetails.getDate() == null || newEventDetails.getTime() == null) {
            throw new InvalidEventDataException("Date and time must be provided for rebooking");
        }
        newEvent.setDate(newEventDetails.getDate());
        newEvent.setTime(newEventDetails.getTime());

        if (newEventDetails.getNotes() != null) {
            newEvent.setNotes(newEventDetails.getNotes());
        }

        //Update relationships if new values are provided
        if (newEventDetails.getVenue() != null) {
            venueService.findVenueById(newEventDetails.getVenue().getId(), user)
                    .ifPresent(newEvent::setVenue);
        }

        if (newEventDetails.getVendors() != null) {
            newEvent.setVendors(new ArrayList<>(newEventDetails.getVendors()));
        }

        if (newEventDetails.getClient() != null) {
            newEvent.setClient(newEventDetails.getClient());
        }

        return eventRepository.save(newEvent);
    }

    private int compareEventsByDateTime(Event e1, Event e2) {
        // First compare dates
        int dateComparison = e1.getDate().compareTo(e2.getDate());
        if (dateComparison != 0) {
            return dateComparison;
        }
        // If dates are equal, compare times
        return e1.getTime().compareTo(e2.getTime());
    }


    // Gets events between today and 5 days from now for a given user
    // Sorts them chronologically by date and time
    // Enriches each event with weather data from OWM API
    // Returns List of upcoming events with weather data, may be empty if no upcoming events exist
    // Events without venues will have null weather data.
    public List<UpcomingEventDTO> findUpcomingEventsWithWeather(User user) {
        LocalDate currentDate = LocalDate.now();
        LocalDate fiveDaysFromNow = currentDate.plusDays(5);
        LocalTime currentTime = LocalTime.now();

        // Get events between today and 5 days from now
        List<Event> events = eventRepository.findByDateBetweenAndUser(currentDate, fiveDaysFromNow, user);

        // Sort events by date and time
        events.sort(this::compareEventsByDateTime);

        // Pass events to WeatherService for enrichment
        return weatherService.enrichEventsWithWeather(events);
    }


    // Retrieves all events for a specific date range
    // Returns list of events within the date range, may be empty if no events exist
    public List<Event> findEventsByDateRange(LocalDate startDate, LocalDate endDate, User user) {
        // Validate date parameters
        if (startDate == null || endDate == null) {
            throw new InvalidEventDataException("Start date and end date cannot be null");
        }

        // Calendar-specific validation
        if (startDate.isAfter(endDate)) {
            throw new InvalidEventDataException("Start date cannot be after end date");
        }

        // Get events from repository - repository methods already include user validation
        return eventRepository.findByDateBetweenAndUser(startDate, endDate, user);
    }


    // Validates the event data before saving or updating.
    // Throws InvalidEventDataException if any required field is missing or invalid
    private void validateEventData(Event event, boolean isRebooking) {
        if (event == null) {
            throw new InvalidEventDataException("Event cannot be null");
        }
        if (event.getName() == null || event.getName().trim().isEmpty()) {
            throw new InvalidEventDataException("Event name cannot be empty");
        }
        if (event.getDate() == null) {
            throw new InvalidEventDataException("Event date cannot be null");
        }
        if (event.getTime() == null) {
            throw new InvalidEventDataException("Event time cannot be null");
        }

        // Only validate future dates when rebooking
        if (isRebooking) {
            LocalDate currentDate = LocalDate.now();
            LocalTime currentTime = LocalTime.now();

            if (event.getDate().isBefore(currentDate)) {
                throw new InvalidEventDataException("Event date must be in the future");
            }

            // If the event is today, validate that the time is in the future
            if (event.getDate().equals(currentDate) && event.getTime().isBefore(currentTime)) {
                throw new InvalidEventDataException("Event time must be in the future");
            }
        }
    }
}
