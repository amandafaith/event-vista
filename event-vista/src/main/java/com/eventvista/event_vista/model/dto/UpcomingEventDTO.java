package com.eventvista.event_vista.model.dto;

import com.eventvista.event_vista.model.Event;
import com.eventvista.event_vista.model.Vendor;
import com.eventvista.event_vista.model.Client;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpcomingEventDTO {
    private Integer id;
    private String name;
    private LocalDate date;
    private LocalTime time;
    private String location;
    private String venueName;
    private WeatherData weatherData;
    private List<Vendor> vendors;
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
        return venueName;
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }

    public WeatherData getWeatherData() {
        return weatherData;
    }

    public void setWeatherData(WeatherData weatherData) {
        this.weatherData = weatherData;
    }

    public List<Vendor> getVendors() {
        return vendors;
    }

    public void setVendors(List<Vendor> vendors) {
        this.vendors = vendors;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }
}