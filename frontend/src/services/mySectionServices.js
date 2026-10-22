import apiClient from "./services.js";

export default {
  listMySections() {
    return apiClient.get("my-sections");
  },
};
