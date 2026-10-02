/**
 * Feature 5 — Section Management
 * Spec: features/feature-5-section-management.md
 */
import { flushPromises } from "@vue/test-utils";
import { vi } from "vitest";
import SectionList from "../src/views/SectionList.vue";
import sectionServices from "../src/services/sectionServices.js";
import { getCourses } from "../src/services/courseCatalog.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/sectionServices.js", () => ({
  default: {
    getSections: vi.fn(),
    createSection: vi.fn(),
    updateSection: vi.fn(),
    deleteSection: vi.fn(),
  },
}));

vi.mock("../src/services/courseCatalog.js", () => ({
  getCourses: vi.fn(),
}));

const course = {
  id: 2,
  name: "Data Structures",
  courseID: "CS 240",
};

const section = {
  id: 7,
  sectionNumber: 1,
  semesterId: 1,
  courseId: 2,
  facultyId: 4,
  daysOfWeek: "Monday,Wednesday",
  startTime: "11:40",
  endTime: "12:50",
  userId: 1,
};

async function mountList() {
  const { wrapper } = await mountWithPlugins(SectionList, {
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

function buttonByText(text) {
  return [...document.body.querySelectorAll("button")].find((button) =>
    button.textContent.includes(text),
  );
}

async function setField(wrapper, label, value) {
  const field = wrapper
    .findAllComponents({ name: "VTextField" })
    .find((component) => component.props("label") === label);
  await field.setValue(value);
  await flushPromises();
}

async function setSelect(wrapper, label, value) {
  const field = wrapper
    .findAllComponents({ name: "VSelect" })
    .find((component) => component.props("label") === label);
  await field.setValue(value);
  await flushPromises();
}

async function openAdd(wrapper) {
  await buttonByText("+ New Section").click();
  await flushPromises();
}

async function fillSection(wrapper, { semesterId = 1, courseId = 2 } = {}) {
  await setField(wrapper, "Section Number", "1");
  await setSelect(wrapper, "Semester", semesterId);
  await setSelect(wrapper, "Course", courseId);
  await setField(wrapper, "Faculty ID", "4");
  await setSelect(wrapper, "Days of the Week", ["Monday", "Wednesday"]);
  await setField(wrapper, "Start Time", "11:40");
  await setField(wrapper, "End Time", "12:50");
}

describe("Feature 5 — Section Management", () => {
  beforeEach(() => {
    sectionServices.getSections.mockResolvedValue({ data: [] });
    sectionServices.createSection.mockResolvedValue({ data: {} });
    sectionServices.updateSection.mockResolvedValue({ data: {} });
    getCourses.mockResolvedValue({ data: [course] });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("US-5.1 — Create a Section", () => {
    it("The sections table shows 01, Fall, and the course code", async () => {
      sectionServices.getSections.mockResolvedValue({ data: [section] });

      const wrapper = await mountList();

      expect(wrapper.text()).toContain("01");
      expect(wrapper.text()).toContain("Fall");
      expect(wrapper.text()).toContain("CS 240");
    });

    it("Choosing Winter in the form sends semesterId 4", async () => {
      const wrapper = await mountList();
      await openAdd(wrapper);
      await fillSection(wrapper, { semesterId: 4 });
      await buttonByText("Create").click();
      await flushPromises();

      expect(sectionServices.createSection).toHaveBeenCalledWith(
        expect.objectContaining({ semesterId: 4, courseId: 2 }),
      );
    });

    it("The Course menu lists a course code and name and saves course.id", async () => {
      const wrapper = await mountList();
      await openAdd(wrapper);

      const courseSelect = wrapper
        .findAllComponents({ name: "VSelect" })
        .find((component) => component.props("label") === "Course");

      expect(courseSelect.props("items")).toEqual([
        { id: 2, label: "CS 240 — Data Structures" },
      ]);

      await fillSection(wrapper, { courseId: 2 });
      await buttonByText("Create").click();
      await flushPromises();

      expect(sectionServices.createSection).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: 2 }),
      );
    });
  });

  describe("US-5.3 — Update a section's details", () => {
    it("Cancel on the edit dialog sends no request", async () => {
      sectionServices.getSections.mockResolvedValue({ data: [section] });
      const wrapper = await mountList();

      document.body.querySelector('[aria-label="Edit section"]').click();
      await flushPromises();
      await buttonByText("Cancel").click();
      await flushPromises();

      expect(sectionServices.updateSection).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });

  describe("US-5.4 — Delete a Section", () => {
    it("Cancel on the add dialog sends no request", async () => {
      const wrapper = await mountList();
      await openAdd(wrapper);
      await buttonByText("Cancel").click();
      await flushPromises();

      expect(sectionServices.createSection).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });
});
