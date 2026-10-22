import axios from "axios";

const courseClient = axios.create({
  baseURL: "http://localhost:3201/courses/",
  withCredentials: true,
});

export const getCourses = () => courseClient.get("courses");
