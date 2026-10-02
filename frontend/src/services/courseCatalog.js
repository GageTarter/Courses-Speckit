import axios from "axios";

const courseClient = axios.create({
  baseURL: "http://localhost:3200/courseapi/",
  withCredentials: true,
});

export const getCourses = () => courseClient.get("courses");
