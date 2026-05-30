package org.nexasphere.service.crud;

import org.nexasphere.model.entity.CollaborationTeamEntity;
import org.nexasphere.model.entity.JoinRequestEntity;
import org.nexasphere.repository.CollaborationTeamRepository;
import org.nexasphere.repository.JoinRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class CollaborationService {

    @Autowired
    private CollaborationTeamRepository teamRepository;

    @Autowired
    private JoinRequestRepository requestRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${INTERNAL_SERVICE_URL:http://localhost:8000}")
    private String internalServiceUrl;

    @Value("${INTERNAL_SERVICE_SECRET:}")
    private String internalServiceSecret;

    public List<CollaborationTeamEntity> getAllTeams() {
        return teamRepository.findAll();
    }

    public @NonNull CollaborationTeamEntity createTeam(@NonNull CollaborationTeamEntity team) {
        // Objects.requireNonNull wraps save() whose return is unannotated in Spring Data JPA
        return Objects.requireNonNull(teamRepository.save(team), "saved team must not be null");
    }

    public @NonNull JoinRequestEntity submitJoinRequest(@NonNull JoinRequestEntity request) {
        // requireNonNull satisfies the null-checker: save() return is unannotated in Spring Data JPA
        JoinRequestEntity saved = Objects.requireNonNull(
                requestRepository.save(request), "saved join request must not be null");

        // Notify via Python microservice
        try {
            String url = internalServiceUrl + "/notify/join-request";
            HttpHeaders headers = new HttpHeaders();
            if (internalServiceSecret != null && !internalServiceSecret.isEmpty()) {
                headers.set("X-Service-Auth", internalServiceSecret);
            }
            HttpEntity<JoinRequestEntity> httpEntity = new HttpEntity<>(saved, headers);
            restTemplate.postForObject(url, httpEntity, String.class);
        } catch (Exception e) {
            // Log error, continue execution
            System.err.println("Failed to notify python microservice: " + e.getMessage());
        }

        return saved;
    }

    /**
     * Updates the status of a join request. Returns an empty Optional if not found.
     * The returned Optional always contains a non-null value when present.
     */
    public Optional<JoinRequestEntity> updateRequestStatus(
            @NonNull Long requestId, String status) {
        // requireNonNull is redundant here since @NonNull on the param documents the contract,
        // but we keep the cast to long to avoid the autoboxing null-safety warning.
        long safeId = requestId; // @NonNull guarantees non-null; direct unbox is safe
        Optional<JoinRequestEntity> optionalReq = requestRepository.findById(safeId);
        if (optionalReq.isPresent()) {
            JoinRequestEntity req = optionalReq.get();
            req.setStatus(status);
            JoinRequestEntity updated = Objects.requireNonNull(
                    requestRepository.save(req), "saved request must not be null");
            return Optional.of(updated);
        }
        return Optional.empty();
    }
}
