/**
 * Feature 1 — User Authentication & Role-Based Access
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const FIRST_NAME = 0;
const LAST_NAME = 1;
const EMAIL = 2;
const USERNAME = 3;
const PASSWORD = 4;
const CONFIRM_PASSWORD = 5;

/** Fill every field with valid data, then apply per-test overrides. */
const fillForm = async (wrapper, overrides = {}) => {
  const values = {
    [FIRST_NAME]: "Jane",
    [LAST_NAME]: "Doe",
    [EMAIL]: "jane@example.com",
    [USERNAME]: "jdoe",
    [PASSWORD]: "secret123",
    [CONFIRM_PASSWORD]: "secret123",
    ...overrides,
  };

  const inputs = wrapper.findAll("input");

  for (const [index, value] of Object.entries(values)) {
    await inputs[index].setValue(value);
  }
};

const submitForm = async (wrapper) => {
  await wrapper.find("form").trigger("submit.prevent");
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Feature 1 — Register view", () => {
  describe("US-1.1 — Register as a student", () => {
    it("User submits registration with missing email", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillForm(wrapper, { [EMAIL]: "" });

      await submitForm(wrapper);

      expect(wrapper.text()).toContain("Email is required.");
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillForm(wrapper, { [EMAIL]: "notanemail" });

      await submitForm(wrapper);

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillForm(wrapper, {
        [PASSWORD]: "short1",
        [CONFIRM_PASSWORD]: "short1",
      });

      await submitForm(wrapper);

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillForm(wrapper, { [CONFIRM_PASSWORD]: "different123" });

      await submitForm(wrapper);

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });
  });
});
