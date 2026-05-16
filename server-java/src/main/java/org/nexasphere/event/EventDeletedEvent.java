package org.nexasphere.event;

import org.nexasphere.model.entity.EventEntity;
import java.time.LocalDateTime;
import java.util.Map;

public class EventDeletedEvent extends AdminEvent {
    public EventDeletedEvent(String adminEmail, EventEntity event) {
        setAdminEmail(adminEmail);
        setAction("EVENT_DELETED");
        setTimestamp(LocalDateTime.now());
        setEventId(event.getId());
        setMetadata(Map.of("eventId", event.getId(), "eventDetails", event));
    }
}
