/**
 * Feature 4 — Faculty Management
 * Spec: features/feature-4-faculty-management.md
 */
import { flushPromises } from "@vue/test-utils";
import { vi } from "vitest";
import FacultyList from "../src/views/FacultyList.vue";
import facultyServices from "../src/services/facultyServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/facultyServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const ada = {
  id: 1,
  firstName: "Ada",
  lastName: "Lovelace",
  dept: "Computer Science",
};

async function mountList(role = "admin") {
  Utils.setStore("user", {
    userId: 1,
    fName: "Site",
    role,
    token: "test-token",
  });

  const { wrapper } = await mountWithPlugins(FacultyList, {
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

describe("Feature 4 — Faculty Management", () => {
  beforeEach(() => {
    facultyServices.getAll.mockResolvedValue({ data: [] });
    facultyServices.create.mockResolvedValue({ data: {} });
    facultyServices.update.mockResolvedValue({ data: {} });
    facultyServices.remove.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-4.1 — Add a faculty member", () => {
    it("Admin creates a faculty member with a missing required field", async () => {
      const wrapper = await mountList("admin");
      await buttonByText("+ New Faculty").click();
      await flushPromises();

      await setField(wrapper, "Last Name", "Lovelace");
      await setField(wrapper, "Department", "Computer Science");
      await buttonByText("Create").click();
      await flushPromises();

      expect(document.body.textContent).toContain("First name is required.");
      expect(facultyServices.create).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });

  describe("US-4.2 — Browse the faculty list", () => {
    it("User views existing faculty", async () => {
      facultyServices.getAll.mockResolvedValue({ data: [ada] });
      const wrapper = await mountList("student");

      expect(wrapper.text()).toContain("Ada");
      expect(wrapper.text()).toContain("Lovelace");
      expect(wrapper.text()).toContain("Computer Science");
      wrapper.unmount();
    });

    it("User has no existing faculty", async () => {
      const wrapper = await mountList("student");

      expect(wrapper.text()).toContain(
        "No faculty yet. Create your first faculty member.",
      );
      wrapper.unmount();
    });
  });

  describe("US-4.3 — Correct a faculty member's details", () => {
    it("Admin edits a faculty member with a missing required field", async () => {
      facultyServices.getAll.mockResolvedValue({ data: [ada] });
      const wrapper = await mountList("admin");

      document.body.querySelector('[aria-label="Edit faculty"]').click();
      await flushPromises();

      await setField(wrapper, "First Name", " ");
      await buttonByText("Save Faculty").click();
      await flushPromises();

      expect(document.body.textContent).toContain("First name is required.");
      expect(facultyServices.update).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });

  describe("US-4.4 — Remove a faculty member", () => {
    it("Admin cancels deleting a faculty member", async () => {
      facultyServices.getAll.mockResolvedValue({ data: [ada] });
      const wrapper = await mountList("admin");

      document.body.querySelector('[aria-label="Delete faculty"]').click();
      await flushPromises();
      await buttonByText("Cancel").click();
      await flushPromises();

      expect(facultyServices.remove).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Ada");
      wrapper.unmount();
    });
  });
});
