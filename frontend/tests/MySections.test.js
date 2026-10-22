/**
 * Feature 8 — Student Section Listing
 * Spec: features/feature-8-student-section-listing.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MySections from "../src/views/MySections.vue";
import mySectionServices from "../src/services/mySectionServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/mySectionServices.js", () => ({
  default: {
    listMySections: vi.fn(),
  },
}));

const software = {
  id: 1,
  sectionNumber: 2,
  semester: "Fall 2026",
  courseID: "CMSC 4123",
  facultyId: 1,
  daysOfWeek: "Monday,Wednesday",
  startTime: "11:40",
  endTime: "12:50",
};

const programming = {
  id: 2,
  sectionNumber: 1,
  semester: "Fall 2026",
  courseID: "CMSC-1113-01",
  facultyId: 3,
  daysOfWeek: "Monday,Wednesday",
  startTime: "11:40",
  endTime: "12:50",
};

async function mountPage() {
  const { wrapper } = await mountWithPlugins(MySections);
  await flushPromises();
  return wrapper;
}

describe("Feature 8 — Student Section Listing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("US-8.1 — Browse my enrolled sections", () => {
    it("Student sees enrolled sections in id order", async () => {
      mySectionServices.listMySections.mockResolvedValue({
        data: [software, programming],
      });

      const wrapper = await mountPage();
      const text = wrapper.text();

      expect(text).toContain("02");
      expect(text).toContain("CMSC 4123");
      expect(text).toContain("01");
      expect(text).toContain("Fall 2026");
      expect(text).toContain("CMSC-1113-01");
      expect(text).toContain("3");
      expect(text).toContain("Monday,Wednesday");
      expect(text).toContain("11:40");
      expect(text).toContain("12:50");
      expect(text.indexOf("CMSC 4123")).toBeLessThan(text.indexOf("CMSC-1113-01"));
    });

    it("A section the student is not enrolled in is hidden", async () => {
      mySectionServices.listMySections.mockResolvedValue({ data: [programming] });

      const wrapper = await mountPage();

      expect(wrapper.text()).toContain("CMSC-1113-01");
      expect(wrapper.text()).not.toContain("Data Structures");
    });

    it("Student has no enrollments", async () => {
      mySectionServices.listMySections.mockResolvedValue({ data: [] });

      const wrapper = await mountPage();

      expect(wrapper.text()).toContain("You are not enrolled in any sections.");
    });
  });
});
