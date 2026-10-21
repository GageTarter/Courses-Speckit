/**
 * Feature 7 — Student Course Listing
 * Spec: features/feature-7-student-course-listing.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MyCourses from "../src/views/MyCourses.vue";
import myCourseServices from "../src/services/myCourseServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/myCourseServices.js", () => ({
  default: {
    listMyCourses: vi.fn(),
  },
}));

const programming = {
  id: 1,
  name: "Programming I",
  courseID: "CMSC-1113-01",
  description: "Introduction to programming",
  semesterOffered: "Fall",
};

const software = {
  id: 2,
  name: "Software Engineering IV",
  courseID: "CMSC 4123",
  description: "Team software project",
  semesterOffered: "Fall",
};

async function mountPage() {
  const { wrapper } = await mountWithPlugins(MyCourses);
  await flushPromises();
  return wrapper;
}

describe("Feature 7 — Student Course Listing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("US-7.1 — Browse my enrolled courses", () => {
    it("Student sees enrolled courses in alphabetical order", async () => {
      myCourseServices.listMyCourses.mockResolvedValue({
        data: [programming, software],
      });

      const wrapper = await mountPage();

      expect(wrapper.text()).toContain("Programming I");
      expect(wrapper.text()).toContain("CMSC-1113-01");
      expect(wrapper.text()).toContain("Introduction to programming");
      expect(wrapper.text()).toContain("Software Engineering IV");
      expect(wrapper.text()).toContain("CMSC 4123");
      expect(wrapper.text().indexOf("Programming I")).toBeLessThan(
        wrapper.text().indexOf("Software Engineering IV"),
      );
    });

    it("A course the student is not enrolled in is hidden", async () => {
      myCourseServices.listMyCourses.mockResolvedValue({ data: [programming] });

      const wrapper = await mountPage();

      expect(wrapper.text()).toContain("Programming I");
      expect(wrapper.text()).not.toContain("Data Structures");
    });

    it("Student has no enrollments", async () => {
      myCourseServices.listMyCourses.mockResolvedValue({ data: [] });

      const wrapper = await mountPage();

      expect(wrapper.text()).toContain("You are not enrolled in any courses.");
    });
  });
});
