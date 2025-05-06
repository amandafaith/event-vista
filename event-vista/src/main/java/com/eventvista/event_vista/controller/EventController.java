package com.eventvista.event_vista.controller;

import com.eventvista.event_vista.exception.EventNotFoundException;
import com.eventvista.event_vista.exception.InvalidEventDataException;
import com.eventvista.event_vista.model.Event;
import com.eventvista.event_vista.model.User;
import com.eventvista.event_vista.model.dto.UpcomingEventDTO;
import com.eventvista.event_vista.service.EventService;
import com.eventvista.event_vista.utilities.AuthUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;


@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class EventController {

    private final EventService eventService;
    private final AuthUtil authUtil;

    public EventController(EventService eventService, AuthUtil authUtil) {
        this.eventService = eventService;
        this.authUtil = authUtil;
    }

    // Get all events for the current authenticated user
    // Returns ResponseEntity containing:
    // List of events if found - 200 Ok - may be empty if no events exits
    // Specific error 500 message if something goes wrong
    @GetMapping("/all")
    public ResponseEntity<?> getAllEvents() {
        try {
            User user = authUtil.getUserFromAuthentication();
            List<Event> events = eventService.findAllEvents(user);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error retrieving events: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Get a specific event by its ID for the current authenticated user
    // Returns ResponseEntity containing:
    // The event if found - 200 OK
    // 404 Not Found if event does not exist (no response body)
    // Specific error 500 message if something goes wrong
    @GetMapping("/find/{id}")
    public ResponseEntity<?> getEventById(@PathVariable("id") Integer id) {
        try {
            User user = authUtil.getUserFromAuthentication();
            Event event = eventService.findEventById(id, user);
            return ResponseEntity.ok(event);
        } catch (EventNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error retrieving event: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Get a specific event by its name for the current authenticated user
    // Returns ResponseEntity containing:
    // The event if found - 200 OK
    // 404 Not Found if event does not exist (no response body)
    // Specific error 500 message if something goes wrong
    @GetMapping("/find/name/{name}")
    public ResponseEntity<?> getEventByName(@PathVariable("name") String name) {
        try {
            User user = authUtil.getUserFromAuthentication();
            Event event = eventService.findEventByName(name, user);
            return ResponseEntity.ok(event);
        } catch (EventNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error retrieving event: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Get all events associated with a specific venue for the current authenticated user
    // Returns ResponseEntity containing:
    // List of events if found - 200 OK - may be empty if no events exist for the venue
    // 404 Not Found if the venue doesn't exist (no response body)
    // Specific error 500 message if something goes wrong
    @GetMapping("/find/venue/{venueId}")
    public ResponseEntity<?> getEventsByVenue(@PathVariable("venueId") Integer venueId) {
        try {
            User user = authUtil.getUserFromAuthentication();
            List<Event> events = eventService.findEventsByVenue(venueId, user);
            if (events == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error retrieving events by venue: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Get all events associated with a specific client for the current authenticated user
    // Returns ResponseEntity containing:
    // List of events if found - 200 OK - may be empty if no events exist for the client
    // 404 Not Found if the client doesn't exist (no response body)
    // Specific error 500 message if something goes wrong
    @GetMapping("/find/client/{clientId}")
    public ResponseEntity<?> getEventsByClient(@PathVariable("clientId") Integer clientId) {
        try {
            User user = authUtil.getUserFromAuthentication();
            List<Event> events = eventService.findEventsByClient(clientId, user);
            if (events == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error retrieving events by client: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Get all events associated with a specific vendor for the current authenticated user
    // Returns ResponseEntity containing:
    // List of events if found - 200 OK - may be empty if no events exist for the vendor
    // 404 Not Found if the vendor doesn't exist (no response body)
    // Specific error 500 message if something goes wrong
    @GetMapping("/find/vendor/{vendorId}")
    public ResponseEntity<?> getEventsByVendor(@PathVariable("vendorId") Integer vendorId) {
        try {
            User user = authUtil.getUserFromAuthentication();
            List<Event> events = eventService.findEventsByVendor(vendorId, user);
            if (events == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error retrieving events by vendor: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Create a new event for the current authenticated user
    // Returns ResponseEntity containing:
    // The created event if successful - 200 OK
    // Error message 400 Bad Request if event data is invalid
    // Specific error 500 message if something goes wrong
    @PostMapping("/add")
    public ResponseEntity<?> addEvent(@RequestBody Event event) {
        try {
            User user = authUtil.getUserFromAuthentication();
            Event savedEvent = eventService.addEvent(event, user);
            return ResponseEntity.ok(savedEvent);
        } catch (IllegalArgumentException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Invalid event data: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error creating event: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Update an existing event for the current authenticated user
    // Returns ResponseEntity containing:
    // The updated event if successful - 200 OK
    // Error message 404 Not Found if the event doesn't exist (no response body)
    // Specific error 500 message if something goes wrong
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable("id") Integer id, @RequestBody Event event) {
        try {
            User user = authUtil.getUserFromAuthentication();
            return ResponseEntity.ok(eventService.updateEvent(id, event, user));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error updating event: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Deletes an event for the current authenticated user
    // Returns ResponseEntity containing:
    // 200 OK if successful (no response body)
    // 404 Not Found if the event does not exist
    // Specific error 500 message if something else goes wrong
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable("id") Integer id) {
        try {
            User user = authUtil.getUserFromAuthentication();
            eventService.deleteEvent(id, user);
            return ResponseEntity.ok().build();
        } catch (EventNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error deleting event: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Retrieves upcoming events with weather info for the current authenticated user
    // Returns ResponseEntity containing:
    // List of upcoming events with weather data if successful - 200 OK - may be empty if no upcoming events exits
    // Specific error 500 message if something else goes wrong
    @GetMapping("/upcoming-events")
    public ResponseEntity<?> getUpcomingEvents() {
        try {
            User user = authUtil.getUserFromAuthentication();
            List<UpcomingEventDTO> events = eventService.findUpcomingEventsWithWeather(user);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error retrieving upcoming events: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Rebook an existing event with new details for the current authenticated user
    // This method is designed to be flexible by allowing users to:
    // Keep all original event details
    // Update any combination of fields
    // Rebook for the same date/time
    // Rebook for any date/time in the present or future

    // Verifies user authentication
    // Checks if request body exists
    // Delegates all business validation to service layer

    // Any field not included in the request will keep its original value
    // Fields included with empty values are cleared
    // Name is required (must not be blank)

    // Returns ResponseEntity containing:
    // 200 OK with the rebooked event if successful
    // 404 Not Found if the original event doesn't exist
    // 400 Bad request if:
    // - New event details are null
    // - Service layer validation fails (name, date, time, etc.)
    // 500 Internal Server Error if something else goes wrong

    @PostMapping("/rebook/{id}")
    public ResponseEntity<?> rebookEvent(@PathVariable("id") Integer id, @RequestBody Event newEventDetails) {
        try {
            // Get authenticated user first
            User user = authUtil.getUserFromAuthentication();

            // Basic request validation - only check if the request body exists
            if (newEventDetails == null) {
                throw new InvalidEventDataException("New event details cannot be null");
            }

            // Let the service layer handle all business validations
            Event rebookedEvent = eventService.rebookEvent(id, newEventDetails, user);
            return ResponseEntity.ok(rebookedEvent);
        } catch (EventNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (InvalidEventDataException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Invalid event data: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "An unexpected error occurred while rebooking the event: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }


    // Retrieves all events within a date range for the authenticated user
    // Used by the calendar component to display events in month/week/day views
    // Returns ResponseEntity containing:
    // List of events if found - 200 OK - may be empty if no events exist in range
    // 400 Bad Request if date format is invalid
    // Specific error 500 message if something else goes wrong
    @GetMapping("/by-date-range")
    public ResponseEntity<?> getEventsByDateRange(
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        try {
            User user = authUtil.getUserFromAuthentication();
            LocalDate startLocalDate = LocalDate.parse(startDate);
            LocalDate endLocalDate = LocalDate.parse(endDate);

            List<Event> events = eventService.findEventsByDateRange(startLocalDate, endLocalDate, user);
            return ResponseEntity.ok(events);

        } catch (DateTimeParseException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Invalid date format. Please use YYYY-MM-DD format");
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error retrieving events by date range: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}


