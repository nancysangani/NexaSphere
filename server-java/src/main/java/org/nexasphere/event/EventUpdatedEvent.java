package org.nexasphere.event;

import org.nexasphere.model.entity.EventEntity;
import java.time.LocalDateTime;
import java.util.Map;

public class EventUpdatedEvent extends AdminEvent {
    public EventUpdatedEvent(String adminEmail, EventEntity before, EventEntity after) {
        setAdminEmail(adminEmail);
        setAction("EVENT_UPDATED");
        setTimestamp(LocalDateTime.now());
        setEventId(after.getId());
        setMetadata(Map.of("before", before, "after", after));
    }
}
