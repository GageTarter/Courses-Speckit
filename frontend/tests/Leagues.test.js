/**
 * Feature 3 — League Management
 * Spec: features/feature-3-league-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import LeagueList from "../src/views/LeagueList.vue";
import LeagueForm from "../src/components/LeagueForm.vue";
import leagueServices from "../src/services/leagueServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/leagueServices.js", () => ({
  default: {
    getLeagues: vi.fn(),
    createLeague: vi.fn(),
    updateLeague: vi.fn(),
    deleteLeague: vi.fn(),
  },
}));

const okcYouthSoccer = {
  id: 1,
  name: "OKC Youth Soccer",
  sport: "soccer",
};

const validLeagueForm = (overrides = {}) => ({
  name: "OKC Youth Soccer",
  sport: "soccer",
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

const fillLeagueForm = async (wrapper, overrides = {}) => {
  const form = wrapper.findComponent(LeagueForm);
  await form.setValue(validLeagueForm(overrides));
};

const mountLeagues = async () => {
  const mounted = await mountWithPlugins(LeagueList, {
    attachTo: document.body,
    global: {
      stubs: { VDialog: VDialogStub },
    },
  });
  await flushPromises();
  return mounted;
};

describe("Feature 3 — League Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    leagueServices.getLeagues.mockResolvedValue({ data: [] });
    leagueServices.createLeague.mockResolvedValue({ data: okcYouthSoccer });
    leagueServices.updateLeague.mockResolvedValue({
      data: { message: "league updated successfully." },
    });
    leagueServices.deleteLeague.mockResolvedValue({
      data: { message: "league deleted successfully." },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-3.1 — Select to work with Leagues", () => {
    it("Menu Selection", async () => {
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Leagues");
      expect(wrapper.text()).toContain("+ New league");
    });
  });

  describe("US-3.2 — Create league", () => {
    it("User creates a new league", async () => {
      leagueServices.getLeagues
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [okcYouthSoccer] });

      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New league");
      await fillLeagueForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(leagueServices.createLeague).toHaveBeenCalledWith({
        name: "OKC Youth Soccer",
        sport: "soccer",
      });
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("OKC Youth Soccer");
    });

    it("User creates a league with a missing required field", async () => {
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New league");
      await fillLeagueForm(wrapper, { sport: "" });
      await clickButton(wrapper, "Create");

      expect(leagueServices.createLeague).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Required");
    });

    it("User creates a league with a name that is too long", async () => {
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New league");
      await fillLeagueForm(wrapper, {
        name: "Oklahoma City Youth Recreational Soccer League Extra",
      });
      await clickButton(wrapper, "Create");

      expect(leagueServices.createLeague).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain(
        "League name must be 50 characters or fewer."
      );
    });

    it("User creates a league with an invalid sport", async () => {
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New league");
      await fillLeagueForm(wrapper, { sport: "basketball" });
      await clickButton(wrapper, "Create");

      expect(leagueServices.createLeague).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain(
        "Sport must be soccer, baseball, volleyball, or football."
      );
    });

    it("User creates a league with a duplicate name", async () => {
      leagueServices.createLeague.mockRejectedValue({
        response: { data: { message: "League name is already taken." } },
      });

      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New league");
      await fillLeagueForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(leagueServices.createLeague).toHaveBeenCalled();
      expect(wrapper.text()).toContain("League name is already taken.");
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(true);
    });
  });

  describe("US-3.3 — View leagues", () => {
    it("Leagues view loads with existing leagues", async () => {
      leagueServices.getLeagues.mockResolvedValue({
        data: [
          { id: 2, name: "Metro Baseball", sport: "baseball" },
          okcYouthSoccer,
        ],
      });

      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("OKC Youth Soccer");
      expect(wrapper.text()).toContain("Metro Baseball");
    });

    it("User has no leagues", async () => {
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No leagues yet. Create your first league.");
    });
  });

  describe("US-3.4 — Manage league rows", () => {
    it("league rows show edit and delete actions", async () => {
      leagueServices.getLeagues.mockResolvedValue({ data: [okcYouthSoccer] });
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      expect(wrapper.get('[aria-label="Edit league"]').exists()).toBe(true);
      expect(wrapper.get('[aria-label="Delete league"]').exists()).toBe(true);
    });
  });

  describe("US-3.5 — Edit a league", () => {
    it("User selects to edit a league", async () => {
      leagueServices.getLeagues.mockResolvedValue({ data: [okcYouthSoccer] });
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit league"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit League");
    });

    it("User edits a league with valid values and saves", async () => {
      leagueServices.getLeagues
        .mockResolvedValueOnce({ data: [okcYouthSoccer] })
        .mockResolvedValue({
          data: [{ ...okcYouthSoccer, name: "Metro Baseball", sport: "baseball" }],
        });

      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit league"]').trigger("click");
      await flushPromises();
      await fillLeagueForm(wrapper, {
        name: "Metro Baseball",
        sport: "baseball",
      });
      await clickButton(wrapper, "Save League");

      expect(leagueServices.updateLeague).toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Metro Baseball");
    });

    it("User edits a league with invalid values and saves", async () => {
      leagueServices.getLeagues.mockResolvedValue({ data: [okcYouthSoccer] });
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit league"]').trigger("click");
      await flushPromises();
      await fillLeagueForm(wrapper, {
        name: "Oklahoma City Youth Recreational Soccer League Extra",
      });
      await clickButton(wrapper, "Save League");

      expect(leagueServices.updateLeague).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Edit League");
      expect(wrapper.text()).toContain(
        "League name must be 50 characters or fewer."
      );
    });

    it("User edits a league and cancels", async () => {
      leagueServices.getLeagues.mockResolvedValue({ data: [okcYouthSoccer] });
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit league"]').trigger("click");
      await flushPromises();
      await fillLeagueForm(wrapper, {
        name: "Metro Baseball",
        sport: "baseball",
      });
      await clickButton(wrapper, "Cancel");

      expect(leagueServices.updateLeague).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("OKC Youth Soccer");
    });
  });

  describe("US-3.6 — Delete a league", () => {
    it("User selects to delete a league", async () => {
      leagueServices.getLeagues.mockResolvedValue({ data: [okcYouthSoccer] });
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete league"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Delete this league?");
    });

    it("User deletes a league", async () => {
      leagueServices.getLeagues
        .mockResolvedValueOnce({ data: [okcYouthSoccer] })
        .mockResolvedValue({ data: [] });

      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete league"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Delete League");

      expect(leagueServices.deleteLeague).toHaveBeenCalledWith(1);
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).not.toContain("OKC Youth Soccer");
    });

    it("User cancels deleting a league", async () => {
      leagueServices.getLeagues.mockResolvedValue({ data: [okcYouthSoccer] });
      const mounted = await mountLeagues();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete league"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Cancel");

      expect(leagueServices.deleteLeague).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("OKC Youth Soccer");
    });
  });
});
