package org.nexasphere.controller;

import org.nexasphere.model.entity.QuestEntity;
import org.nexasphere.model.entity.UserProfileEntity;
import org.nexasphere.repository.QuestRepository;
import org.nexasphere.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private static final String DEDICATED_LEARNER_BADGE = "Dedicated Learner";

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private QuestRepository questRepository;

    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId, Authentication authentication) {
        if (!isDashboardOwner(authentication, userId)) {
            return forbidden();
        }

        return userProfileRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/profile/{userId}/interests")
    public ResponseEntity<?> updateInterests(
            @PathVariable String userId,
            @RequestBody List<String> interests,
            Authentication authentication
    ) {
        if (!isDashboardOwner(authentication, userId)) {
            return forbidden();
        }

        Optional<UserProfileEntity> profileOpt = userProfileRepository.findByUserId(userId);
        if (profileOpt.isPresent()) {
            UserProfileEntity profile = profileOpt.get();
            profile.setInterests(interests);
            return ResponseEntity.ok(userProfileRepository.save(profile));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<UserProfileEntity>> getLeaderboard() {
        return ResponseEntity.ok(userProfileRepository.findTop10ByOrderByXpDesc());
    }

    @GetMapping("/quests/{userId}")
    public ResponseEntity<?> getQuests(@PathVariable String userId, Authentication authentication) {
        if (!isDashboardOwner(authentication, userId)) {
            return forbidden();
        }

        List<QuestEntity> quests = questRepository.findByUserId(userId);
        if (quests.isEmpty()) {
            quests = seedInitialQuests(userId);
        }
        return ResponseEntity.ok(quests);
    }

    @PostMapping("/quests/{questId}/complete")
    public ResponseEntity<?> completeQuest(@PathVariable String questId, Authentication authentication) {
        String safeQuestId = Objects.requireNonNull(questId, "questId must not be null");
        Optional<QuestEntity> questOpt = questRepository.findById(safeQuestId);
        if (questOpt.isPresent()) {
            QuestEntity quest = questOpt.get();
            if (!isDashboardOwner(authentication, quest.getUserId())) {
                return forbidden();
            }

            if (!quest.isCompleted()) {
                quest.setCompleted(true);
                questRepository.save(quest);
                awardQuestCompletion(quest);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("quest", quest);
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.notFound().build();
    }

    private List<QuestEntity> seedInitialQuests(String userId) {
        QuestEntity viewRoadmap = defaultQuest(
                userId,
                "View Roadmap",
                "Check out our learning roadmaps.",
                50
        );
        QuestEntity joinHackathon = defaultQuest(
                userId,
                "Join Hackathon",
                "Participate in an upcoming hackathon event.",
                200
        );

        return questRepository.saveAll(List.of(viewRoadmap, joinHackathon));
    }

    private QuestEntity defaultQuest(String userId, String title, String description, int xpReward) {
        QuestEntity quest = new QuestEntity();
        quest.setUserId(userId);
        quest.setTitle(title);
        quest.setDescription(description);
        quest.setXpReward(xpReward);
        return quest;
    }

    private void awardQuestCompletion(QuestEntity quest) {
        userProfileRepository.findByUserId(quest.getUserId()).ifPresent(profile -> {
            profile.setXp(profile.getXp() + quest.getXpReward());

            if (profile.getXp() >= profile.getLevel() * 1000) {
                profile.setLevel(profile.getLevel() + 1);
                if (profile.getLevel() == 5 && !profile.getBadges().contains(DEDICATED_LEARNER_BADGE)) {
                    profile.getBadges().add(DEDICATED_LEARNER_BADGE);
                }
            }
            userProfileRepository.save(profile);
        });
    }

    private boolean isDashboardOwner(Authentication authentication, String userId) {
        return authentication != null
                && authentication.isAuthenticated()
                && userId != null
                && userId.equals(authentication.getName());
    }

    private ResponseEntity<Void> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
}
