import apiClient from './apiClient';

const collaborationService = {
  getEventHub: async (eventId) => {
    const response = await apiClient.get(`/api/admin/collaboration/${eventId}/dashboard`);
    return response.data;
  },
  createTask: async (eventId, taskData) => {
    const response = await apiClient.post(`/api/admin/collaboration/${eventId}/tasks`, taskData);
    return response.data;
  },
  addBudget: async (eventId, budgetData) => {
    const response = await apiClient.post(`/api/admin/collaboration/${eventId}/budget`, budgetData);
    return response.data;
  },
  postComment: async (eventId, commentData) => {
    const response = await apiClient.post(
      `/api/admin/collaboration/${eventId}/discussions`,
      commentData
    );
    return response.data;
  },
};

export default collaborationService;
