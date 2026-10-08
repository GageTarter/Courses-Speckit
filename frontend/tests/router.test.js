/**
 * Feature 1 — User Authentication & Role-Based Access
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import Utils from "../src/config/utils.js";

/** The router is a module singleton, so each test needs its own copy. */
const freshRouter = async () => (await import("../src/router.js")).default;

const navigate = async (router, path) => {
  try {
    await router.push(path);
  } catch {
    // Redirecting guards reject the navigation promise; the resulting
    // route is what the assertions read.
  }

  await router.isReady();
};

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  vi.resetModules();
});

describe("Feature 1 — Router guards", () => {
  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const router = await freshRouter();

      await navigate(router, "/");

      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      Utils.setStore("user", {
        userId: 1,
        fName: "Jane",
        role: "student",
        token: "a-valid-token",
      });

      const router = await freshRouter();

      await navigate(router, "/login");

      expect(router.currentRoute.value.name).toBe("home");
    });
  });
});

describe("Feature 6 — Router role guard", () => {
  describe("US-6.3 — Enroll in a section", () => {
    it("Admin cannot enroll", async () => {
      Utils.setStore("user", {
        userId: 2,
        fName: "Site",
        role: "admin",
        token: "an-admin-token",
      });

      const router = await freshRouter();

      await navigate(router, "/enroll");

      expect(router.currentRoute.value.name).toBe("home");
    });
  });
});
