import apiClient from "./services.js";

export default {
  listMyCourses() {
    return apiClient.get("my-courses");
  },
};
