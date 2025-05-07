package com.eventvista.event_vista.model.dto;

import com.eventvista.event_vista.model.Event;
import com.eventvista.event_vista.model.Vendor;
import com.eventvista.event_vista.model.Client;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpcomingEventDTO {
    private Integer id;
    private String name;
    private LocalDate date;
    private LocalTime time;
    private String location;
    private String venueName;
    private String formattedDate;
    private String formattedTime;
    private WeatherData weatherData;
    private String weatherDisplay;
    private List<Vendor> vendors;
    private String formattedVendorNames;
    private Client client;

    public UpcomingEventDTO() {
    }

    public UpcomingEventDTO(Event event, WeatherData weatherData) {
        this.id = event.getId();
        this.name = event.getName();
        this.date = event.getDate();
        this.time = event.getTime();
        this.location = event.getVenue() != null ? event.getVenue().getLocation() : "No venue set";
        this.venueName = event.getVenue() != null ? event.getVenue().getName() : null;
        this.weatherData = weatherData;
        this.vendors = event.getVendors();
        this.client = event.getClient();

        // Format date and time
        this.formattedDate = formatDate(event.getDate());
        this.formattedTime = formatTime(event.getTime());

        // Format weather display
        if (weatherData != null) {
            this.weatherDisplay = formatWeatherDisplay(weatherData, event.getDate());
        }

        // Format vendor names
        this.formattedVendorNames = formatVendorNames(event.getVendors());
    }

    private String formatVendorNames(List<Vendor> vendors) {
        if (vendors == null || vendors.isEmpty()) {
            return null;
        }
        return vendors.stream()
                .map(Vendor::getName)
                .collect(Collectors.joining(", "));
    }

    private String formatDate(LocalDate date) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEEE MMMM d yyyy");
        return date.format(formatter);
    }

    private String formatTime(LocalTime time) {
        if (time == null) return "";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("h:mm a");
        return time.format(formatter);
    }

    private String formatWeatherDisplay(WeatherData weatherData, LocalDate eventDate) {
        StringBuilder sb = new StringBuilder();
        sb.append(weatherData.getDescription());
        sb.append("\n");
        sb.append(weatherData.getTemperature());
        return sb.toString();
    }

    // Getters and setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getVenueName() {
        return venueName != null ? venueName : "No venue set";
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }

    public String getFormattedDate() {
        return formattedDate;
    }

    public void setFormattedDate(String formattedDate) {
        this.formattedDate = formattedDate;
    }

    public String getFormattedTime() {
        return formattedTime;
    }

    public void setFormattedTime(String formattedTime) {
        this.formattedTime = formattedTime;
    }

    public WeatherData getWeatherData() {
        return weatherData;
    }

    public void setWeatherData(WeatherData weatherData) {
        this.weatherData = weatherData;
    }

    public String getWeatherDisplay() {
        return weatherDisplay;
    }

    public void setWeatherDisplay(String weatherDisplay) {
        this.weatherDisplay = weatherDisplay;
    }

    public List<Vendor> getVendors() {
        return vendors;
    }

    public void setVendors(List<Vendor> vendors) {
        this.vendors = vendors;
    }

    public String getFormattedVendorNames() {
        return formattedVendorNames;
    }

    public void setFormattedVendorNames(String formattedVendorNames) {
        this.formattedVendorNames = formattedVendorNames;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }
}