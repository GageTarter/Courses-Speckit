/**
 * Feature 6 — Section Enrollment
 * Spec: features/feature-6-enrollment-management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Enroll from "../src/views/Enroll.vue";
import catalogServices from "../src/services/catalogServices.js";
import enrollmentServices from "../src/services/enrollmentServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/catalogServices.js", () => ({
  default: {
    listSemesters: vi.fn(),
    listSections: vi.fn(),
  },
}));

vi.mock("../src/services/enrollmentServices.js", () => ({
  default: {
    listEnrollments: vi.fn(),
    enroll: vi.fn(),
    drop: vi.fn(),
  },
}));

const FALL = { id: 3, name: "Fall 2026" };
const SPRING = { id: 4, name: "Spring 2027" };

const fallSection = (overrides = {}) => ({
  id: 12,
  sectionNumber: "001",
  capacity: 30,
  remainingSeats: 2,
  semesterId: FALL.id,
  courseId: 5,
  course: { id: 5, code: "CMSC 4123", title: "Software Engineering IV" },
  ...overrides,
});

const scheduleRow = {
  id: 44,
  sectionId: 12,
  section: {
    id: 12,
    sectionNumber: "001",
    semesterId: FALL.id,
    course: { id: 5, code: "CMSC 4123", title: "Software Engineering IV" },
  },
};

const mountEnroll = () => mountWithPlugins(Enroll);

const clickButtonByText = async (text) => {
  const button = [...document.querySelectorAll("button")].find(
    (el) => el.textContent.trim() === text
  );
  expect(button).toBeTruthy();
  button.click();
  await flushPromises();
};

const selectSemester = async (wrapper, id) => {
  const select = wrapper.findComponent({ name: "VSelect" });
  await select.setValue(id);
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  catalogServices.listSemesters.mockResolvedValue({ data: [FALL, SPRING] });
  catalogServices.listSections.mockResolvedValue({ data: [] });
  enrollmentServices.listEnrollments.mockResolvedValue({ data: [] });
  enrollmentServices.enroll.mockResolvedValue({ data: { id: 44 } });
  enrollmentServices.drop.mockResolvedValue({ data: { message: "Enrollment dropped." } });
});

describe("Feature 6 — Enroll view", () => {
  describe("US-6.1 — Choose a semester", () => {
    it("Student selects a semester", async () => {
      catalogServices.listSections.mockImplementation(async (semesterId) => ({
        data:
          semesterId === FALL.id
            ? [fallSection()]
            : [fallSection({ id: 99, semesterId: SPRING.id, sectionNumber: "010" })],
      }));

      const { wrapper } = await mountEnroll();
      await flushPromises();
      await selectSemester(wrapper, FALL.id);

      expect(catalogServices.listSections).toHaveBeenCalledWith(FALL.id);
      expect(wrapper.text()).toContain("001");
      expect(wrapper.text()).not.toContain("010");
    });

    it("Student has not selected a semester yet", async () => {
      const { wrapper } = await mountEnroll();
      await flushPromises();

      expect(wrapper.text()).toContain("Select a semester to see available sections.");
      expect(catalogServices.listSections).not.toHaveBeenCalled();
    });

    it("No semesters exist", async () => {
      catalogServices.listSemesters.mockResolvedValue({ data: [] });

      const { wrapper } = await mountEnroll();
      await flushPromises();

      expect(wrapper.text()).toContain("No semesters are open for registration yet.");
    });
  });

  describe("US-6.2 — Browse sections offered in the selected semester", () => {
    it("Student sees remaining seats for each section", async () => {
      catalogServices.listSections.mockResolvedValue({ data: [fallSection()] });

      const { wrapper } = await mountEnroll();
      await flushPromises();
      await selectSemester(wrapper, FALL.id);

      expect(wrapper.text()).toContain("2 / 30");
    });

    it("Semester has no sections", async () => {
      const { wrapper } = await mountEnroll();
      await flushPromises();
      await selectSemester(wrapper, SPRING.id);

      expect(wrapper.text()).toContain("No sections are offered in this semester.");
    });

    it("A full section cannot be enrolled in from the list", async () => {
      catalogServices.listSections.mockResolvedValue({
        data: [fallSection({ remainingSeats: 0, capacity: 1 })],
      });

      const { wrapper } = await mountEnroll();
      await flushPromises();
      await selectSemester(wrapper, FALL.id);

      expect(wrapper.text()).toContain("Full");
      const enrollBtn = wrapper.findAll("button").find((b) => b.text() === "Enroll");
      expect(enrollBtn.attributes("disabled")).toBeDefined();
    });
  });

  describe("US-6.3 — Enroll in a section", () => {
    it("Student enrolls in an open section", async () => {
      let mine = [];
      catalogServices.listSections.mockResolvedValue({ data: [fallSection()] });
      enrollmentServices.listEnrollments.mockImplementation(async () => ({ data: mine }));
      enrollmentServices.enroll.mockImplementation(async () => {
        mine = [scheduleRow];
        return { data: { id: 44, userId: 7, sectionId: 12 } };
      });

      const { wrapper } = await mountEnroll();
      await flushPromises();
      await selectSemester(wrapper, FALL.id);

      const enrollBtn = wrapper.findAll("button").find((b) => b.text() === "Enroll");
      await enrollBtn.trigger("click");
      await flushPromises();

      expect(enrollmentServices.enroll).toHaveBeenCalledWith(12);
      expect(wrapper.text()).toContain("My Schedule");
      expect(wrapper.text()).toContain("CMSC 4123");
      expect(wrapper.findAll("button").find((b) => b.text() === "Enroll")).toBeUndefined();
    });
  });

  describe("US-6.4 — Review my enrollments for the semester", () => {
    it("Student has no enrollments in the selected semester", async () => {
      const { wrapper } = await mountEnroll();
      await flushPromises();
      await selectSemester(wrapper, SPRING.id);

      expect(wrapper.text()).toContain(
        "You are not enrolled in any sections for this semester."
      );
    });

    it("Enrollment survives a page reload", async () => {
      catalogServices.listSections.mockResolvedValue({ data: [fallSection()] });
      enrollmentServices.listEnrollments.mockResolvedValue({ data: [scheduleRow] });

      const { wrapper } = await mountEnroll();
      await flushPromises();
      await selectSemester(wrapper, FALL.id);

      expect(wrapper.text()).toContain("CMSC 4123");
      expect(wrapper.text()).toContain("Section 001");
    });
  });

  describe("US-6.5 — Drop a section", () => {
    it("Student drops a section", async () => {
      let mine = [scheduleRow];
      catalogServices.listSections.mockResolvedValue({ data: [fallSection()] });
      enrollmentServices.listEnrollments.mockImplementation(async () => ({ data: mine }));
      enrollmentServices.drop.mockImplementation(async () => {
        mine = [];
        return { data: { message: "Enrollment dropped." } };
      });

      const { wrapper } = await mountWithPlugins(Enroll, { attachTo: document.body });
      await flushPromises();
      await selectSemester(wrapper, FALL.id);

      await wrapper.get('[aria-label="Drop section"]').trigger("click");
      await flushPromises();

      await clickButtonByText("Drop");

      expect(enrollmentServices.drop).toHaveBeenCalledWith(44);
      expect(wrapper.text()).toContain("You are not enrolled in any sections for this semester.");
      expect(wrapper.findAll("button").find((b) => b.text() === "Enroll")).toBeTruthy();
      wrapper.unmount();
    });

    it("Student cancels the drop confirmation", async () => {
      catalogServices.listSections.mockResolvedValue({ data: [fallSection()] });
      enrollmentServices.listEnrollments.mockResolvedValue({ data: [scheduleRow] });

      const { wrapper } = await mountWithPlugins(Enroll, { attachTo: document.body });
      await flushPromises();
      await selectSemester(wrapper, FALL.id);

      await wrapper.get('[aria-label="Drop section"]').trigger("click");
      await flushPromises();

      await clickButtonByText("Cancel");

      expect(enrollmentServices.drop).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("CMSC 4123");
      wrapper.unmount();
    });
  });
});
