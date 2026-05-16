package org.nexasphere.event;

import org.nexasphere.model.entity.EventEntity;
import java.time.LocalDateTime;
import java.util.Map;

public class EventCreatedEvent extends AdminEvent {
    public EventCreatedEvent(String adminEmail, EventEntity event) {
        setAdminEmail(adminEmail);
        setAction("EVENT_CREATED");
        setTimestamp(LocalDateTime.now());
        setEventId(event.getId());
        setMetadata(Map.of("eventDetails", event));
    }
}
