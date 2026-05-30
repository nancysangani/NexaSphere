package org.nexasphere.controller;

import jakarta.validation.Valid;
import org.nexasphere.model.entity.ActivityEventEntity;
import org.nexasphere.repository.ActivityEventRepository;
import org.nexasphere.util.Sanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/admin/activity-events")
@SuppressWarnings("null") // Spring Data JPA's save()/findById() return types carry no @NonNull annotations
public class ActivityEventsController {

    private final ActivityEventRepository repo;
    private final Sanitizer sanitizer;

    public ActivityEventsController(ActivityEventRepository repo, Sanitizer sanitizer) {
        this.repo = repo;
        this.sanitizer = sanitizer;
    }

    @GetMapping("/{activityKey}")
    public List<ActivityEventEntity> getByActivity(@PathVariable @NonNull String activityKey) {
        return repo.findByActivityKey(activityKey);
    }

    @PostMapping("/{activityKey}")
    public ResponseEntity<ActivityEventEntity> create(
            @PathVariable @NonNull String activityKey,
            @Valid @RequestBody ActivityEventEntity event) {
        event.setId(null);
        event.setActivityKey(activityKey);
        event.setName(sanitizer.clean(event.getName()));
        ActivityEventEntity saved = Objects.requireNonNull(
                repo.save(event), "saved entity must not be null");
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{activityKey}/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable @NonNull String activityKey,
            @PathVariable @NonNull Long id) {
        boolean deleted = repo.findById(id)
                .filter(e -> activityKey.equals(e.getActivityKey()))
                .map(e -> {
                    repo.delete(e);
                    return true;
                })
                .orElse(false);
        return deleted
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
