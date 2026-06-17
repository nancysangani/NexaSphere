import { resourcesRepository } from '../repositories/resourcesRepository.js';
import { createResourceSchema, updateResourceSchema } from '../schemas/resourceSchema.js';

export const resourcesService = {
  async listResources({ page = 1, limit = 20, category, difficulty, status, q } = {}) {
    return resourcesRepository.list({ page, limit, category, difficulty, status, q });
  },

  async getResource(id) {
    return resourcesRepository.getById(id);
  },

  async createResource(input) {
    const resource = createResourceSchema.parse(input);
    return resourcesRepository.create(resource);
  },

  async updateResource(id, input) {
    const patch = updateResourceSchema.parse(input);
    return resourcesRepository.update(id, patch);
  },

  async deleteResource(id) {
    return resourcesRepository.delete(id);
  },

  async toggleVote(id, voterId) {
    const resource = await resourcesRepository.getById(id);
    if (!resource) return null;

    const votes = resource.votes || [];
    const idx = votes.indexOf(voterId);

    let newVotes;
    if (idx === -1) {
      newVotes = [...votes, voterId];
    } else {
      newVotes = [...votes.slice(0, idx), ...votes.slice(idx + 1)];
    }

    return resourcesRepository.update(id, {
      votes: newVotes,
      rating: newVotes.length,
    });
  },

  async incrementDownloads(id) {
    return resourcesRepository.incrementDownloads(id);
  },

  async moderateResource(id, status) {
    return resourcesRepository.update(id, { status });
  },
};
