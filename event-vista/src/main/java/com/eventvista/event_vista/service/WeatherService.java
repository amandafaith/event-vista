package com.eventvista.event_vista.service;

import com.eventvista.event_vista.exception.WeatherServiceException;
import com.eventvista.event_vista.model.dto.WeatherData;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.StringUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

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

    public WeatherData getWeatherData(String location, LocalDate eventDate) {
        try {
            validateInputs(location, eventDate);
            validateApiKey();

            LocalDate today = LocalDate.now();
            long daysBetween = ChronoUnit.DAYS.between(today, eventDate);

            if (daysBetween < 0) {
                throw new WeatherServiceException("Cannot get weather for past dates");
            }
            if (daysBetween > 5) {
                throw new WeatherServiceException("Weather forecast is only available for up to 5 days in advance");
            }

            return daysBetween == 0 ?
                    getCurrentWeather(location) :
                    getForecastWeather(location, eventDate);
        } catch (WeatherServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new WeatherServiceException("Error fetching weather data: " + e.getMessage(), e);
        }
    }

    private void validateInputs(String location, LocalDate eventDate) {
        if (!StringUtils.hasText(location)) {
            throw new WeatherServiceException("Location cannot be empty");
        }
        if (eventDate == null) {
            throw new WeatherServiceException("Date cannot be null");
        }
    }

    private void validateApiKey() {
        if (!StringUtils.hasText(apiKey)) {
            throw new WeatherServiceException("Weather API key is not configured");
        }
    }

    private WeatherData getCurrentWeather(String location) {
        try {
            String url = String.format("%s/data/2.5/weather?q=%s&appid=%s&units=imperial",
                    weatherApiUrl, location, apiKey);
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            return extractWeatherData(root);
        } catch (RestClientException e) {
            throw new WeatherServiceException("Failed to fetch current weather: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new WeatherServiceException("Error processing current weather data: " + e.getMessage(), e);
        }
    }

    private WeatherData getForecastWeather(String location, LocalDate targetDate) {
        try {
            String url = String.format("%s/data/2.5/forecast?q=%s&appid=%s&units=imperial",
                    weatherApiUrl, location, apiKey);
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode list = root.path("list");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String targetDateStr = targetDate.toString();

            for (JsonNode forecast : list) {
                String dtTxt = forecast.path("dt_txt").asText();
                LocalDateTime forecastDateTime = LocalDateTime.parse(dtTxt, formatter);

                if (forecastDateTime.toLocalDate().equals(targetDate)) {
                    return extractWeatherData(forecast);
                }
            }

            throw new WeatherServiceException("No forecast available for the specified date");
        } catch (RestClientException e) {
            throw new WeatherServiceException("Failed to fetch forecast: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new WeatherServiceException("Error processing forecast data: " + e.getMessage(), e);
        }
    }

    private WeatherData extractWeatherData(JsonNode weatherNode) {
        try {
            String icon = weatherNode.path("weather").get(0).path("icon").asText();
            double temp = weatherNode.path("main").path("temp").asDouble();
            String description = weatherNode.path("weather").get(0).path("description").asText();

            return new WeatherData(icon, String.format("%.1f°F", temp), description);
        } catch (Exception e) {
            throw new WeatherServiceException("Error extracting weather data from API response: " + e.getMessage(), e);
        }
    }
}