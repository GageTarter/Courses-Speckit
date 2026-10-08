import apiClient from "./services.js";

const facultyServices = {
  getAll() {
    return apiClient.get("facultyapi/faculties");
  },

  create(faculty) {
    return apiClient.post("facultyapi/faculties", faculty);
  },

  update(id, faculty) {
    return apiClient.put(`facultyapi/faculties/${id}`, faculty);
  },

  remove(id) {
    return apiClient.delete(`facultyapi/faculties/${id}`);
  },
};

export default facultyServices;
