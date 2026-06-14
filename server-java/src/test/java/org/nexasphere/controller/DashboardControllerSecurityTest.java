package org.nexasphere.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.nexasphere.model.entity.QuestEntity;
import org.nexasphere.model.entity.UserProfileEntity;
import org.nexasphere.repository.QuestRepository;
import org.nexasphere.repository.UserProfileRepository;
import org.nexasphere.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DashboardControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private QuestRepository questRepository;

    @BeforeEach
    void cleanDatabase() {
        questRepository.deleteAll();
        userProfileRepository.deleteAll();
    }

    @Test
    void profileAndQuestEndpointsRejectUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/dashboard/profile/victim-user"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/dashboard/profile/victim-user/interests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of("security"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/dashboard/quests/victim-user"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/dashboard/quests/quest-1/complete"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void profileAndQuestEndpointsRejectCrossUserRequests() throws Exception {
        mockMvc.perform(get("/api/dashboard/profile/victim-user")
                        .header(HttpHeaders.AUTHORIZATION, bearerFor("owner-user")))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/dashboard/profile/victim-user/interests")
                        .header(HttpHeaders.AUTHORIZATION, bearerFor("owner-user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of("tampered"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/dashboard/quests/victim-user")
                        .header(HttpHeaders.AUTHORIZATION, bearerFor("owner-user")))
                .andExpect(status().isForbidden());

        assertThat(userProfileRepository.findByUserId("victim-user")).isEmpty();
        assertThat(questRepository.findByUserId("victim-user")).isEmpty();
    }

    @Test
    void ownerProfileReadDoesNotCreateMissingProfiles() throws Exception {
        mockMvc.perform(get("/api/dashboard/profile/owner-user")
                        .header(HttpHeaders.AUTHORIZATION, bearerFor("owner-user")))
                .andExpect(status().isNotFound());

        assertThat(userProfileRepository.findByUserId("owner-user")).isEmpty();
    }

    @Test
    void ownerCanReadAndUpdateOnlyTheirDashboardData() throws Exception {
        UserProfileEntity ownerProfile = new UserProfileEntity();
        ownerProfile.setUserId("owner-user");
        ownerProfile.setUsername("Owner");
        userProfileRepository.save(ownerProfile);

        mockMvc.perform(get("/api/dashboard/profile/owner-user")
                        .header(HttpHeaders.AUTHORIZATION, bearerFor("owner-user")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("owner-user"));

        mockMvc.perform(post("/api/dashboard/profile/owner-user/interests")
                        .header(HttpHeaders.AUTHORIZATION, bearerFor("owner-user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of("java", "security"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interests[0]").value("java"))
                .andExpect(jsonPath("$.interests[1]").value("security"));

        String questsResponse = mockMvc.perform(get("/api/dashboard/quests/owner-user")
                        .header(HttpHeaders.AUTHORIZATION, bearerFor("owner-user")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value("owner-user"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode quests = objectMapper.readTree(questsResponse);
        String questId = quests.get(0).get("id").asText();

        mockMvc.perform(post("/api/dashboard/quests/{questId}/complete", questId)
                        .header(HttpHeaders.AUTHORIZATION, bearerFor("owner-user")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.quest.completed").value(true));

        UserProfileEntity profile = userProfileRepository.findByUserId("owner-user").orElseThrow();
        assertThat(profile.getXp()).isGreaterThan(0);
    }

    @Test
    void questCompletionRejectsTokensForOtherUsersWithoutMutatingProgress() throws Exception {
        UserProfileEntity victimProfile = new UserProfileEntity();
        victimProfile.setUserId("victim-user");
        victimProfile.setUsername("Victim");
        userProfileRepository.save(victimProfile);

        QuestEntity victimQuest = new QuestEntity();
        victimQuest.setUserId("victim-user");
        victimQuest.setTitle("Protected quest");
        victimQuest.setDescription("Must only be completed by the owner");
        victimQuest.setXpReward(75);
        victimQuest = questRepository.save(victimQuest);

        mockMvc.perform(post("/api/dashboard/quests/{questId}/complete", victimQuest.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearerFor("attacker-user")))
                .andExpect(status().isForbidden());

        QuestEntity reloadedQuest = questRepository.findById(victimQuest.getId()).orElseThrow();
        UserProfileEntity reloadedProfile = userProfileRepository.findByUserId("victim-user").orElseThrow();
        assertThat(reloadedQuest.isCompleted()).isFalse();
        assertThat(reloadedProfile.getXp()).isZero();
    }

    @Test
    void leaderboardRemainsPublicReadOnlyDashboardData() throws Exception {
        mockMvc.perform(get("/api/dashboard/leaderboard"))
                .andExpect(status().isOk());
    }

    private String bearerFor(String subject) {
        return "Bearer " + tokenService.createSession(subject).token();
    }
}
