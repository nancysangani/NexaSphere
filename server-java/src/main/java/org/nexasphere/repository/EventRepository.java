package org.nexasphere.repository;

import org.nexasphere.model.entity.EventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventRepository extends JpaRepository<EventEntity, String> {
    List<EventEntity> findAllByOrderByCreatedAtDesc();
}
