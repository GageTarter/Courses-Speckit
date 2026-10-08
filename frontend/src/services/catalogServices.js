import apiClient from "./services.js";

export default {
  listSemesters() {
    return apiClient.get("semesters");
  },

  listSections(semesterId) {
    return apiClient.get("sections", { params: { semesterId } });
  },
};
