/**
 * Feature 1 — User Authentication & Role-Based Access
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const USERNAME = 0;
const PASSWORD = 1;

const submitLogin = async (wrapper) => {
  await wrapper.find("form").trigger("submit.prevent");
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Feature 1 — Login view", () => {
  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      authServices.loginUser.mockRejectedValue({
        response: { data: { message: "Invalid username or password." } },
      });

      const { wrapper } = await mountWithPlugins(Login);
      const inputs = wrapper.findAll("input");
      await inputs[USERNAME].setValue("jdoe");
      await inputs[PASSWORD].setValue("wrongpassword");

      await submitLogin(wrapper);

      expect(authServices.loginUser).toHaveBeenCalledTimes(1);
      expect(wrapper.find(".v-alert").text()).toContain(
        "Invalid username or password."
      );
      expect(localStorage.getItem("user")).toBeNull();
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      const inputs = wrapper.findAll("input");
      await inputs[PASSWORD].setValue("secret123");

      await submitLogin(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(authServices.loginUser).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      const inputs = wrapper.findAll("input");
      await inputs[USERNAME].setValue("jdoe");

      await submitLogin(wrapper);

      expect(wrapper.text()).toContain("Password is required.");
      expect(authServices.loginUser).not.toHaveBeenCalled();
    });
  });
});
