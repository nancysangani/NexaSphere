import { mentorshipRepository } from '../repositories/mentorshipRepository.js';

export const mentorshipService = {
  async listMentors(params) {
    return mentorshipRepository.listMentors(params);
  },

  async getMentor(id) {
    return mentorshipRepository.getMentorById(id);
  },

  async registerMentor(input) {
    return mentorshipRepository.registerMentor(input);
  },

  async updateMentor(id, input) {
    return mentorshipRepository.updateMentor(id, input);
  },

  async requestMentorship(input) {
    return mentorshipRepository.requestMentorship(input);
  },

  async listMentorships(params) {
    return mentorshipRepository.listMentorships(params);
  },

  async getMentorship(id) {
    return mentorshipRepository.getMentorshipById(id);
  },

  async updateMentorshipStatus(id, status) {
    return mentorshipRepository.updateMentorshipStatus(id, status);
  },

  async logSession(mentorshipId, input) {
    return mentorshipRepository.logSession(mentorshipId, input);
  },

  async listSessions(mentorshipId, params) {
    return mentorshipRepository.listSessions(mentorshipId, params);
  },

  async createBuddyPair(input) {
    return mentorshipRepository.createBuddyPair(input);
  },

  async listBuddyPairs(params) {
    return mentorshipRepository.listBuddyPairs(params);
  },

  async adminListAll(params) {
    return mentorshipRepository.adminListAll(params);
  },

  async adminListMentors(params) {
    return mentorshipRepository.adminListMentors(params);
  },
};
