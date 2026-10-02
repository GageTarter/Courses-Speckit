import axios from "axios";

const courseClient = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:3201/api/" : "/api/",
  withCredentials: true,
});

const CourseServices = {
  getAll() {
    return courseClient.get("courses");
  },

  create(data) {
    return courseClient.post("courses", data);
  },

  update(id, data) {
    return courseClient.put(`courses/${id}`, data);
  },

  remove(id) {
    return courseClient.delete(`courses/${id}`);
  },
};

export default CourseServices;
