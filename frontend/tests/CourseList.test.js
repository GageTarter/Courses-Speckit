/**
 * Feature 2 — Course Management
 * Spec: features/feature-2-course-management.md
 */
import { flushPromises } from "@vue/test-utils";
import { vi } from "vitest";
import CourseList from "../src/views/CourseList.vue";
import CourseServices from "../src/services/courseServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/courseServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const programming = {
  id: 1,
  name: "Programming I",
  courseID: "CMSC-1113-01",
  description: "Introduction to programming",
  semesterOffered: "Fall",
};

const nameTooLong = "Course name must be 100 characters or fewer.";
const descriptionTooLong = "Course description must be 300 characters or fewer.";
const invalidSemester = "Semester offered must be Fall, Spring, Summer, or Winter.";
const nameInUse = "Course name is in use. Enter a different course name.";

async function mountList() {
  const { wrapper } = await mountWithPlugins(CourseList, {
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

function cardByTitle(title) {
  return [...document.body.querySelectorAll(".v-card")].find(
    (card) => card.querySelector(".v-card-title")?.textContent?.trim() === title,
  );
}

function listTitles() {
  return [...document.body.querySelectorAll(".v-list-item-title")].map((node) =>
    node.textContent.trim(),
  );
}

function activeDialogTitles() {
  return [...document.body.querySelectorAll(".v-overlay--active .v-card-title")].map((node) =>
    node.textContent.trim(),
  );
}

async function setText(wrapper, dialogTitle, label, value) {
  const card = cardByTitle(dialogTitle);
  const field = wrapper
    .findAllComponents({ name: "VTextField" })
    .find((component) => component.props("label") === label && card.contains(component.element));
  await field.setValue(value);
  await flushPromises();
}

async function setSemester(wrapper, dialogTitle, value) {
  const card = cardByTitle(dialogTitle);
  const field = wrapper
    .findAllComponents({ name: "VSelect" })
    .find(
      (component) =>
        component.props("label") === "Semester Offered" && card.contains(component.element),
    );
  await field.setValue(value);
  await flushPromises();
}

async function openAdd(wrapper) {
  await wrapper.get("button.oc-cta").trigger("click");
  await flushPromises();
}

function clickEdit() {
  document.body.querySelector('[aria-label="Edit Course"]').click();
}

describe("Feature 2 — Course Management", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("US-2.1 — Add a catalogue course", () => {
    it("User creates a new course", async () => {
      CourseServices.getAll
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [programming] });
      CourseServices.create.mockResolvedValue({ data: programming });
      const wrapper = await mountList();

      await openAdd(wrapper);
      await setText(wrapper, "New Course", "Name", "Programming I");
      await setText(wrapper, "New Course", "CourseID", "CMSC-1113-01");
      await setText(wrapper, "New Course", "Description", "Introduction to programming");
      await setSemester(wrapper, "New Course", "Fall");
      buttonByText("Create").click();
      await flushPromises();

      expect(CourseServices.create).toHaveBeenCalledWith({
        name: "Programming I",
        courseID: "CMSC-1113-01",
        description: "Introduction to programming",
        semesterOffered: "Fall",
      });
      expect(listTitles()).toEqual(["Programming I"]);
      expect(activeDialogTitles()).not.toContain("New Course");
    });

    it("User creates a course without a description or semester offered", async () => {
      const created = { ...programming, description: null, semesterOffered: null };
      CourseServices.getAll
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [created] });
      CourseServices.create.mockResolvedValue({ data: created });
      const wrapper = await mountList();

      await openAdd(wrapper);
      await setText(wrapper, "New Course", "Name", "Programming I");
      await setText(wrapper, "New Course", "CourseID", "CMSC-1113-01");
      buttonByText("Create").click();
      await flushPromises();

      expect(CourseServices.create).toHaveBeenCalledWith({
        name: "Programming I",
        courseID: "CMSC-1113-01",
        description: "",
        semesterOffered: "",
      });
      expect(listTitles()).toEqual(["Programming I"]);
    });

    it("User creates a course with an empty name", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [] });
      const wrapper = await mountList();
      await openAdd(wrapper);
      await setText(wrapper, "New Course", "CourseID", "CMSC-1113-01");
      buttonByText("Create").click();
      await flushPromises();

      expect(document.body.textContent).toContain("Course name is required.");
      expect(CourseServices.create).not.toHaveBeenCalled();
    });

    it("User creates a course with an empty course ID", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [] });
      const wrapper = await mountList();
      await openAdd(wrapper);
      await setText(wrapper, "New Course", "Name", "Programming I");
      buttonByText("Create").click();
      await flushPromises();

      expect(document.body.textContent).toContain("Course ID is required.");
      expect(CourseServices.create).not.toHaveBeenCalled();
    });

    it("User creates a course with an existing name", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [programming] });
      const wrapper = await mountList();
      await openAdd(wrapper);
      await setText(wrapper, "New Course", "Name", "Programming I");
      await setText(wrapper, "New Course", "CourseID", "CMSC-1113-02");
      buttonByText("Create").click();
      await flushPromises();

      expect(document.body.textContent).toContain(nameInUse);
      expect(CourseServices.create).not.toHaveBeenCalled();
    });

    it("User creates a course with a name that is too long", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [] });
      CourseServices.create.mockRejectedValue({
        response: { data: { message: nameTooLong } },
      });
      const wrapper = await mountList();
      await openAdd(wrapper);
      await setText(wrapper, "New Course", "Name", "A".repeat(101));
      await setText(wrapper, "New Course", "CourseID", "CMSC-1113-01");
      buttonByText("Create").click();
      await flushPromises();

      expect(document.body.querySelector(".v-alert").textContent).toContain(nameTooLong);
    });

    it("User creates a course with a description that is too long", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [] });
      CourseServices.create.mockRejectedValue({
        response: { data: { message: descriptionTooLong } },
      });
      const wrapper = await mountList();
      await openAdd(wrapper);
      await setText(wrapper, "New Course", "Name", "Programming I");
      await setText(wrapper, "New Course", "CourseID", "CMSC-1113-01");
      await setText(wrapper, "New Course", "Description", "D".repeat(301));
      buttonByText("Create").click();
      await flushPromises();

      expect(document.body.querySelector(".v-alert").textContent).toContain(descriptionTooLong);
    });

    it("User creates a course with an invalid semester offered", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [] });
      CourseServices.create.mockRejectedValue({
        response: { data: { message: invalidSemester } },
      });
      const wrapper = await mountList();
      await openAdd(wrapper);
      await setText(wrapper, "New Course", "Name", "Programming I");
      await setText(wrapper, "New Course", "CourseID", "CMSC-1113-01");
      await setSemester(wrapper, "New Course", "Monday");
      buttonByText("Create").click();
      await flushPromises();

      expect(CourseServices.create).toHaveBeenCalledWith(
        expect.objectContaining({ semesterOffered: "Monday" }),
      );
      expect(document.body.querySelector(".v-alert").textContent).toContain(invalidSemester);
      expect(listTitles()).toEqual([]);
    });
  });

  describe("US-2.2 — Browse the Course List", () => {
    it("User views existing courses", async () => {
      CourseServices.getAll.mockResolvedValue({
        data: [
          { ...programming, id: 2, name: "Zebra", courseID: "CMSC-2000-01" },
          programming,
        ],
      });
      await mountList();

      expect(listTitles()).toEqual(["Programming I", "Zebra"]);
    });

    it("There are no existing courses", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [] });
      await mountList();
      expect(document.body.querySelectorAll(".v-list-item").length).toBe(0);
    });
  });

  describe("US-2.3 — Correct a course's name, ID, description or semester Offered", () => {
    it("User edits a course's information", async () => {
      const updated = { ...programming, name: "Programming II", courseID: "CMSC-1113-02" };
      CourseServices.getAll
        .mockResolvedValueOnce({ data: [programming] })
        .mockResolvedValueOnce({ data: [updated] });
      CourseServices.update.mockResolvedValue({
        data: { message: "Course was updated successfully." },
      });
      const wrapper = await mountList();

      clickEdit();
      await flushPromises();
      await setText(wrapper, "Edit Course", "Name", "Programming II");
      await setText(wrapper, "Edit Course", "CourseID", "CMSC-1113-02");
      buttonByText("Save").click();
      await flushPromises();

      expect(CourseServices.update).toHaveBeenCalledWith(1, {
        name: "Programming II",
        courseID: "CMSC-1113-02",
        description: "Introduction to programming",
        semesterOffered: "Fall",
      });
      expect(listTitles()).toEqual(["Programming II"]);
      expect(activeDialogTitles()).not.toContain("Edit Course");
    });

    it("User clears a course's description and semester offered", async () => {
      const cleared = { ...programming, description: null, semesterOffered: null };
      CourseServices.getAll
        .mockResolvedValueOnce({ data: [programming] })
        .mockResolvedValueOnce({ data: [cleared] });
      CourseServices.update.mockResolvedValue({
        data: { message: "Course was updated successfully." },
      });
      const wrapper = await mountList();

      clickEdit();
      await flushPromises();
      await setText(wrapper, "Edit Course", "Description", "");
      await setSemester(wrapper, "Edit Course", null);
      buttonByText("Save").click();
      await flushPromises();

      expect(CourseServices.update).toHaveBeenCalledWith(1, {
        name: "Programming I",
        courseID: "CMSC-1113-01",
        description: "",
        semesterOffered: "",
      });
      expect(listTitles()).toEqual(["Programming I"]);
      const subtitle = document.body.querySelector(".v-list-item-subtitle").textContent;
      expect(subtitle).not.toContain("Introduction to programming");
      expect(subtitle).not.toContain("Fall");
    });

    it("User edits a course with an empty name", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [programming] });
      const wrapper = await mountList();
      clickEdit();
      await flushPromises();
      await setText(wrapper, "Edit Course", "Name", "   ");
      buttonByText("Save").click();
      await flushPromises();

      expect(document.body.textContent).toContain("Course name is required.");
      expect(CourseServices.update).not.toHaveBeenCalled();
    });

    it("User edits a course with an empty course ID", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [programming] });
      const wrapper = await mountList();
      clickEdit();
      await flushPromises();
      await setText(wrapper, "Edit Course", "CourseID", " ");
      buttonByText("Save").click();
      await flushPromises();

      expect(document.body.textContent).toContain("Course ID is required.");
      expect(CourseServices.update).not.toHaveBeenCalled();
    });

    it("User edits a course with an existing name", async () => {
      const other = { ...programming, id: 2, name: "Databases", courseID: "CMSC-3000-01" };
      CourseServices.getAll.mockResolvedValue({ data: [programming, other] });
      const wrapper = await mountList();
      const programmingRow = [...document.body.querySelectorAll(".v-list-item")].find((item) =>
        item.textContent.includes("Programming I"),
      );
      programmingRow.querySelector('[aria-label="Edit Course"]').click();
      await flushPromises();
      await setText(wrapper, "Edit Course", "Name", "Databases");
      buttonByText("Save").click();
      await flushPromises();

      expect(document.body.textContent).toContain(nameInUse);
      expect(CourseServices.update).not.toHaveBeenCalled();
    });

    it("User edits a course with a name that is too long", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [programming] });
      CourseServices.update.mockRejectedValue({
        response: { data: { message: nameTooLong } },
      });
      const wrapper = await mountList();
      clickEdit();
      await flushPromises();
      await setText(wrapper, "Edit Course", "Name", "A".repeat(101));
      buttonByText("Save").click();
      await flushPromises();

      expect(document.body.querySelector(".v-alert").textContent).toContain(nameTooLong);
    });

    it("User edits a course with a description that is too long", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [programming] });
      CourseServices.update.mockRejectedValue({
        response: { data: { message: descriptionTooLong } },
      });
      const wrapper = await mountList();
      clickEdit();
      await flushPromises();
      await setText(wrapper, "Edit Course", "Description", "D".repeat(301));
      buttonByText("Save").click();
      await flushPromises();

      expect(document.body.querySelector(".v-alert").textContent).toContain(descriptionTooLong);
    });

    it("User edits a course with an invalid semester offered", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [programming] });
      CourseServices.update.mockRejectedValue({
        response: { data: { message: invalidSemester } },
      });
      const wrapper = await mountList();
      clickEdit();
      await flushPromises();
      await setSemester(wrapper, "Edit Course", "Monday");
      buttonByText("Save").click();
      await flushPromises();

      expect(CourseServices.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ semesterOffered: "Monday" }),
      );
      expect(document.body.querySelector(".v-alert").textContent).toContain(invalidSemester);
      expect(document.body.textContent).toContain("Fall");
    });
  });

  describe("US-2.4 Remove a course", () => {
    it("User removes a course", async () => {
      CourseServices.getAll.mockResolvedValue({ data: [programming] });
      CourseServices.remove.mockResolvedValue({ status: 200 });
      const wrapper = await mountList();
      document.body.querySelector('[aria-label="Delete Course"]').click();
      await flushPromises();
      buttonByText("Delete").click();
      await flushPromises();

      expect(CourseServices.remove).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Programming I");
    });
  });
});
