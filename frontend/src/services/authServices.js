import axios from "axios";
import Utils from "../config/utils.js";
import router from "../router.js";

const authClient = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:3201/courses/" : "/courses/",
  withCredentials: true,
});

authClient.interceptors.request.use((config) => {
  const user = Utils.getStore("user");

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  return config;
});

authClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "";

    if (error.response?.status === 401 || /Unauthorized/i.test(message)) {
      Utils.removeItem("user");

      if (router.hasRoute("login")) {
        router.push({ name: "login" });
      }
    }

    return Promise.reject(error);
  },
);

export default {
  registerUser(user) {
    return authClient.post("register", user);
  },

  loginUser(credentials) {
    return authClient.post("login", credentials);
  },

  logoutUser() {
    return authClient.post("logout");
  },
};
