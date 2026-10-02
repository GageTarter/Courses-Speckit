import axios from "axios";

const courseClient = axios.create({
  baseURL: "http://localhost:3201/api/",
  withCredentials: true,
});

export const getCourses = () => courseClient.get("courses");
