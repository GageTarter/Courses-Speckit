import apiClient from "./services.js";

export default {
  registerUser(user) {
    return apiClient.post("register", user);
  },

  loginUser(credentials) {
    return apiClient.post("login", credentials);
  },

  logoutUser() {
    return apiClient.post("logout");
  },
};
