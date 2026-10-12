import apiClient from "./services.js";

/** Feature 5 adapter — loads course options for section forms. */
export const getCourses = () => apiClient.get("courses");
