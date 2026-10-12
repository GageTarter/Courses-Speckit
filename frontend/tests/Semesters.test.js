/**
 * Feature 3 — Semester Management
 * Spec: features/feature-3-semester-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import SemesterList from "../src/views/SemesterList.vue";
import SemesterForm from "../src/components/SemesterForm.vue";
import semesterServices from "../src/services/semesterServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/semesterServices.js", () => ({
  default: {
    getSemesters: vi.fn(),
    createSemester: vi.fn(),
    updateSemester: vi.fn(),
    deleteSemester: vi.fn(),
  },
}));

const fall2026 = {
  id: 1,
  name: "Fall 2026",
  startDate: "2026-08-20",
  endDate: "2026-12-31",
};

const validSemesterForm = (overrides = {}) => ({
  name: "Fall 2026",
  startDate: "2026-08-20",
  endDate: "2026-12-31",
  ...overrides,
});

const VDialogStub = {
  name: "VDialog",
  props: { modelValue: Boolean },
  template: `<div v-if="modelValue" class="v-dialog-stub"><slot /></div>`,
};

const clickButton = async (wrapper, label) => {
  const button = wrapper.findAll("button").find((item) => item.text().includes(label));
  expect(button).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
};

const fillSemesterForm = async (wrapper, overrides = {}) => {
  const form = wrapper.findComponent(SemesterForm);
  await form.setValue(validSemesterForm(overrides));
};

const mountSemesters = async () => {
  const mounted = await mountWithPlugins(SemesterList, {
    attachTo: document.body,
    global: {
      stubs: { VDialog: VDialogStub },
    },
  });
  await flushPromises();
  return mounted;
};

describe("Feature 3 — Semester Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    semesterServices.getSemesters.mockResolvedValue({ data: [] });
    semesterServices.createSemester.mockResolvedValue({ data: fall2026 });
    semesterServices.updateSemester.mockResolvedValue({
      data: { message: "semester updated successfully." },
    });
    semesterServices.deleteSemester.mockResolvedValue({
      data: { message: "semester deleted successfully." },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-3.1 — Select to work with Semesters", () => {
    it("Menu Selection", async () => {
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Semesters");
      expect(wrapper.text()).toContain("+ New semester");
    });
  });

  describe("US-3.4 — Add a catalogue semester", () => {
    it("User creates a new semester", async () => {
      semesterServices.getSemesters
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [fall2026] });

      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New semester");
      await fillSemesterForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(semesterServices.createSemester).toHaveBeenCalledWith({
        name: "Fall 2026",
        startDate: "2026-08-20",
        endDate: "2026-12-31",
      });
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Fall 2026");
    });

    it("User creates a semester with a missing required field", async () => {
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New semester");
      await fillSemesterForm(wrapper, { name: "" });
      await clickButton(wrapper, "Create");

      expect(semesterServices.createSemester).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Required");
    });

    it("User creates a semester with a name that is too long", async () => {
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New semester");
      await fillSemesterForm(wrapper, {
        name: "Fall Semester",
        startDate: "2026-08-20",
        endDate: "2026-12-31",
      });
      await clickButton(wrapper, "Create");

      expect(semesterServices.createSemester).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain(
        "Semester name must be 11 characters or fewer."
      );
    });

    it("User creates a semester with an invalid start date", async () => {
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New semester");
      await fillSemesterForm(wrapper, { startDate: "2026-08-99" });
      await clickButton(wrapper, "Create");

      expect(semesterServices.createSemester).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain(
        "Start date must be a valid date."
      );
    });

    it("User creates a semester with a duplicate name", async () => {
      semesterServices.createSemester.mockRejectedValue({
        response: { data: { message: "Semester name is already taken." } },
      });

      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New semester");
      await fillSemesterForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(semesterServices.createSemester).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Semester name is already taken.");
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(true);
    });
  });

  describe("US-3.1 — Browse the semester list", () => {
    it("Semesters view loads with existing semesters", async () => {
      semesterServices.getSemesters.mockResolvedValue({
        data: [
          { id: 2, name: "Spring 2027", startDate: "2027-01-01", endDate: "2027-05-31" },
          fall2026,
        ],
      });

      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Fall 2026");
      expect(wrapper.text()).toContain("Spring 2027");
    });

    it("User has no semesters", async () => {
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No semesters yet. Create your first semester.");
    });
  });

  describe("US-3.2 — Correct a semester's start date or end date", () => {
    it("semester rows show edit and delete actions", async () => {
      semesterServices.getSemesters.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      expect(wrapper.get('[aria-label="Edit semester"]').exists()).toBe(true);
      expect(wrapper.get('[aria-label="Delete semester"]').exists()).toBe(true);
    });
  });

  describe("US-3.5 — Edit a semester", () => {
    it("User selects to edit a semester", async () => {
      semesterServices.getSemesters.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit semester"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Semester");
    });

    it("User edits a semester with valid values and saves", async () => {
      semesterServices.getSemesters
        .mockResolvedValueOnce({ data: [fall2026] })
        .mockResolvedValue({
          data: [{ ...fall2026, name: "Spring 2027", startDate: "2027-01-01", endDate: "2027-05-31" }],
        });

      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit semester"]').trigger("click");
      await flushPromises();
      await fillSemesterForm(wrapper, {
        name: "Spring 2027",
        startDate: "2027-01-01",
        endDate: "2027-05-31",
      });
      await clickButton(wrapper, "Save Semester");

      expect(semesterServices.updateSemester).toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Spring 2027");
    });

    it("User edits a semester with invalid values and saves", async () => {
      semesterServices.getSemesters.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit semester"]').trigger("click");
      await flushPromises();
      await fillSemesterForm(wrapper, {
        name: "Spring Semester",
        startDate: "2027-01-01",
        endDate: "2027-05-31",
      });
      await clickButton(wrapper, "Save Semester");

      expect(semesterServices.updateSemester).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Edit Semester");
      expect(wrapper.text()).toContain(
        "Semester name must be 11 characters or fewer."
      );
    });

    it("User edits a semester and cancels", async () => {
      semesterServices.getSemesters.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit semester"]').trigger("click");
      await flushPromises();
      await fillSemesterForm(wrapper, {
        name: "Spring 2027",
        startDate: "2027-01-01",
        endDate: "2027-05-31",
      });
      await clickButton(wrapper, "Cancel");

      expect(semesterServices.updateSemester).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Fall 2026");
    });
  });

  describe("US-3.3 — Remove a semester", () => {
    it("User selects to delete a semester", async () => {
      semesterServices.getSemesters.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete semester"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Delete this semester?");
    });

    it("User deletes a semester", async () => {
        semesterServices.getSemesters
        .mockResolvedValueOnce({ data: [fall2026] })
        .mockResolvedValue({ data: [] });

      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete semester"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Delete Semester");

      expect(semesterServices.deleteSemester).toHaveBeenCalledWith(1);
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).not.toContain("Fall 2026");
    });

    it("User cancels deleting a semester", async () => {
      semesterServices.getSemesters.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSemesters();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete semester"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Cancel");

      expect(semesterServices.deleteSemester).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Fall 2026");
    });
  });
});
