package com.eventvista.event_vista.data;

import com.eventvista.event_vista.model.Event;
import com.eventvista.event_vista.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {

    List<Event> findAllByUser(User user);

    Optional<Event> findByIdAndUser(Integer id, User user);

    Optional<Event> findByNameAndUser(String name, User user);

    //To find past, upcoming, and dates within a specific range
    List<Event> findByDateBetweenAndUser(LocalDate startDate, LocalDate endDate, User user);

    List<Event> findByVenueIdAndUser(Integer venueId, User user);

    List<Event> findByClientIdAndUser(Integer clientId, User user);

    List<Event> findByVendorsIdAndUser(Integer vendorId, User user);

    // Checks if the event belongs to the specified user
    // Checks if the event is upcoming:
    // if event is on a future date or
    // if event is today but at a future time
    @Query("SELECT e FROM Event e WHERE e.user = :user AND (e.date > :currentDate OR (e.date = :currentDate AND e.time > :currentTime))")
    List<Event> findUpcomingEvents(@Param("user") User user,
                                   @Param("currentDate") LocalDate currentDate,
                                   @Param("currentTime") LocalTime currentTime);

//    List<Event> findByUserAndDateGreaterThanEqualOrderByDateAsc(User user, LocalDate date);
//
//    default List<Event> findUpcomingEventsByUser(User user) {
//        return findByUserAndDateGreaterThanEqualOrderByDateAsc(user, LocalDate.now());
//    }
//
//    @Query("SELECT e FROM Event e WHERE e.date >= :currentDate ORDER BY e.date ASC")
//    List<Event> findUpcomingEvents(@Param("currentDate") LocalDate currentDate);
//
//    default List<Event> findUpcomingEvents() {
//        return findUpcomingEvents(LocalDate.now());
//    }

}

