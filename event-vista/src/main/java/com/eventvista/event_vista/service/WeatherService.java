package com.eventvista.event_vista.service;

import com.eventvista.event_vista.exception.WeatherServiceException;
import com.eventvista.event_vista.model.dto.WeatherData;
import com.eventvista.event_vista.model.dto.UpcomingEventDTO;
import com.eventvista.event_vista.model.Event;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.StringUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
public class WeatherService {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${weather.api.key}")
    private String apiKey;

    @Value("${weather.api.url}")
    private String weatherApiUrl;

    public WeatherService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    // Main method to get weather data for a specific location and date
    // Handles both current weather and forecasts up to 5 days in advance
    public WeatherData getWeatherData(String location, LocalDate eventDate) {
        validateInputs(location, eventDate);
        validateApiKey();
        validateDateRange(eventDate);
        return fetchWeatherData(location, eventDate);
    }

    // Validates that location and date parameters are not null or empty
    private void validateInputs(String location, LocalDate eventDate) {
        if (!StringUtils.hasText(location)) {
            throw new WeatherServiceException("Location cannot be empty");
        }
        if (eventDate == null) {
            throw new WeatherServiceException("Date cannot be null");
        }
    }

    // Ensures the weather API key is properly configured
    private void validateApiKey() {
        if (!StringUtils.hasText(apiKey)) {
            throw new WeatherServiceException("Weather API key is not configured");
        }
    }

    // Validates that the requested date is within the allowed range (today to 5 days ahead)
    private void validateDateRange(LocalDate eventDate) {
        LocalDate today = LocalDate.now();
        long daysBetween = ChronoUnit.DAYS.between(today, eventDate);

        if (daysBetween < 0) {
            throw new WeatherServiceException("Cannot get weather for past dates");
        }
        if (daysBetween > 5) {
            throw new WeatherServiceException("Weather forecast is only available for up to 5 days in advance");
        }
    }

    // Fetches weather data from the API, handling both current weather and forecasts
    // Uses different endpoints based on whether the date is today or in the future
    private WeatherData fetchWeatherData(String location, LocalDate targetDate) {
        String endpoint = targetDate.equals(LocalDate.now()) ? "weather" : "forecast";
        String url = String.format("%s/data/2.5/%s?q=%s&appid=%s&units=imperial",
                weatherApiUrl, endpoint, location, apiKey);

        String response = restTemplate.getForObject(url, String.class);
        try {
            JsonNode root = objectMapper.readTree(response);

            if (endpoint.equals("forecast")) {
                JsonNode list = root.path("list");
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

                for (JsonNode forecast : list) {
                    LocalDateTime forecastDateTime = LocalDateTime.parse(
                            forecast.path("dt_txt").asText(),
                            formatter
                    );
                    if (forecastDateTime.toLocalDate().equals(targetDate)) {
                        return extractWeatherData(forecast);
                    }
                }
                throw new WeatherServiceException("No forecast available for the specified date");
            }

            return extractWeatherData(root);
        } catch (JsonProcessingException e) {
            throw new WeatherServiceException("Error processing weather data response: " + e.getMessage());
        }
    }

    // Extracts relevant weather information from the API response
    // Creates a WeatherData object with icon, temperature, and description
    private WeatherData extractWeatherData(JsonNode weatherNode) {
        try {
            JsonNode weather = weatherNode.path("weather").get(0);
            return new WeatherData(
                    weather.path("icon").asText(),
                    String.format("%.1f°F", weatherNode.path("main").path("temp").asDouble()),
                    weather.path("description").asText()
            );
        } catch (Exception e) {
            throw new WeatherServiceException("Error extracting weather data from API response: " + e.getMessage(), e);
        }
    }

    // Enriches a list of events with weather data
    // Handles missing venues and weather data errors gracefully
    public List<UpcomingEventDTO> enrichEventsWithWeather(List<Event> events) {
        return events.stream()
                .map(event -> {
                    // Try to get weather data for the event's venue location
                    WeatherData weatherData = Optional.ofNullable(event.getVenue())
                            .map(venue -> {
                                try {
                                    // Call OpenWeatherMap API for the venue's location
                                    return getWeatherData(venue.getLocation(), event.getDate());
                                } catch (Exception e) {
                                    return null;
                                }
                            })
                            .orElse(null);
                    // Create DTO with event and weather data
                    return new UpcomingEventDTO(event, weatherData);
                })
                .collect(Collectors.toList());
    }
}