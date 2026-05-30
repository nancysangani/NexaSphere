package org.nexasphere.controller;

import jakarta.validation.Valid;
import org.nexasphere.model.entity.EventEntity;
import org.nexasphere.repository.EventRepository;
import org.nexasphere.util.Sanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/admin/events")
@Tag(name = "Events Management", description = "Endpoints for managing NexaSphere events")
public class EventsController {

    private final EventRepository repo;
    private final Sanitizer sanitizer;

    public EventsController(EventRepository repo, Sanitizer sanitizer) {
        this.repo = repo;
        this.sanitizer = sanitizer;
    }

    @GetMapping
    public Map<String, Object> getAll() {
        List<EventEntity> events = repo.findAll();
        return Map.of("events", events);
    }

    @PostMapping
    public ResponseEntity<EventEntity> create(@Valid @RequestBody EventEntity event) {
        event.setId(null);
        event.setName(sanitizer.clean(event.getName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(event));
    }

    @PutMapping("/{id}")
    @SuppressWarnings("null") // repo.save() return is unannotated in Spring Data JPA
    public ResponseEntity<EventEntity> update(
            @PathVariable @NonNull String id,
            @Valid @RequestBody EventEntity event) {

        return repo.findById(id).map(existing -> {

            // merge only non-null fields that exist on EventEntity
            if (event.getName() != null) {
                existing.setName(sanitizer.clean(event.getName()));
            }

            if (event.getDescription() != null) {
                existing.setDescription(event.getDescription());
            }

            if (event.getDateText() != null) {
                existing.setDateText(event.getDateText());
            }

            if (event.getStatus() != null) {
                existing.setStatus(event.getStatus());
            }

            if (event.getIcon() != null) {
                existing.setIcon(event.getIcon());
            }

            if (event.getTags() != null && !event.getTags().isEmpty()) {
                existing.setTags(event.getTags());
            }

            // save merged entity
            EventEntity saved = Objects.requireNonNull(
                    repo.save(existing), "saved event must not be null");
            return ResponseEntity.ok(saved);

        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull String id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
