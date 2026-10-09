import apiClient from "./services.js";

const CourseServices = {
  getAll() {
    return apiClient.get("courses");
  },

  create(data) {
    return apiClient.post("courses", data);
  },

  update(id, data) {
    return apiClient.put(`courses/${id}`, data);
  },

  remove(id) {
    return apiClient.delete(`courses/${id}`);
  },
};

export default CourseServices;
