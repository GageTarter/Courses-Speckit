import apiClient from "./services.js";

export default {
  listEnrollments(semesterId) {
    return apiClient.get("enrollments", {
      params: semesterId ? { semesterId } : {},
    });
  },

  enroll(sectionId) {
    return apiClient.post("enrollments", { sectionId });
  },

  drop(id) {
    return apiClient.delete(`enrollments/${id}`);
  },
};
