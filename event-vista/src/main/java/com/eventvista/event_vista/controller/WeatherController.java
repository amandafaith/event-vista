package com.eventvista.event_vista.controller;

import com.eventvista.event_vista.exception.WeatherServiceException;
import com.eventvista.event_vista.model.dto.WeatherData;
import com.eventvista.event_vista.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class WeatherController {

    private final WeatherService weatherService;

    @Autowired
    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    // Creates a response map with the given message
    private Map<String, String> createResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("message", message);
        return response;
    }

    // Retrieves weather data for a specific location and date
    // Returns ResponseEntity containing:
    // WeatherData object if successful - 200 OK
    // Error message 400 Bad Request if input is invalid:
    // Empty or null location, empty or null date, location name too long, invalid date, past dates, dates more than 5 days in advance
    // Specific error 500 message if something else goes wrong:
    @GetMapping
    public ResponseEntity<?> getWeather(@RequestParam String location, @RequestParam String date) {
        try {
            validateParams(location, date);
            LocalDate eventDate = LocalDate.parse(date);
            WeatherData weather = weatherService.getWeatherData(location, eventDate);
            return ResponseEntity.ok(weather);
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest()
                    .body(createResponse("Invalid date format. Please use YYYY-MM-DD format"));
        } catch (HttpClientErrorException e) {
            String message;
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                message = "Location not found. Please enter a valid city name.";
            } else if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                message = "Too many requests to the weather service. Please try again later.";
            } else {
                message = "Error retrieving weather data: " + e.getMessage();
            }
            return ResponseEntity.status(e.getStatusCode()).body(createResponse(message));
        } catch (WeatherServiceException e) {
            if (e.getMessage().contains("cannot be empty") ||
                    e.getMessage().contains("cannot be null") ||
                    e.getMessage().contains("past dates") ||
                    e.getMessage().contains("only available for up to 5 days")) {
                return ResponseEntity.badRequest().body(createResponse(e.getMessage()));
            } else if (e.getMessage().contains("not configured")) {
                return ResponseEntity.internalServerError().body(createResponse(e.getMessage()));
            } else {
                return ResponseEntity.badRequest().body(createResponse(e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createResponse("Error retrieving weather data: " + e.getMessage()));
        }
    }

    // Validates the input parameters for the weather request
    // Location length must be less than 100 characters to match Venue entity constraints
    private void validateParams(String location, String date) {
        if (!StringUtils.hasText(location)) {
            throw new WeatherServiceException("Location cannot be empty");
        }
        if (!StringUtils.hasText(date)) {
            throw new WeatherServiceException("Date cannot be empty");
        }
        if (location.length() > 100) {
            throw new WeatherServiceException("Location name is too long (maximum 100 characters)");
        }
    }
}