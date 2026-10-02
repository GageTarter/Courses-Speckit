/**
 * Feature 2 — Season Management
 * Spec: features/feature-2-season-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  registerAdmin,
  authHeader,
  validSeason,
  createSeason,
  createSeasonGames,
  createGame,
  createTeam,
} from "./helpers.js";

describe("Feature 2 — Season Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-2.2 — Create season", () => {
    it("User creates a new season", async () => {
      const { token } = await registerAdmin(app);
      const response = await createSeason(app, token);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "2026 Fall",
      });
      expect(response.body.id).toEqual(expect.any(Number));
      expect(response.body.leagueId).toEqual(expect.any(Number));
      expect(response.body.startDate).toBeDefined();
      expect(response.body.endDate).toBeDefined();
      expect(response.body.gameDays).toEqual(["saturday"]);
      expect(response.body.minDaysBetweenGames).toBe(7);

      const stored = await db.season.findOne({ where: { name: "2026 Fall" } });
      expect(stored).not.toBeNull();
    });

    it("User creates a season with a duplicate name", async () => {
      const { token } = await registerAdmin(app);
      await createSeason(app, token);

      const response = await createSeason(app, token);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Season name is already taken in this league.",
      });

      const count = await db.season.count({ where: { name: "2026 Fall" } });
      expect(count).toBe(1);
    });

    it("User creates a season with an unknown league", async () => {
      const { token } = await registerAdmin(app);
      const response = await createSeason(app, token, { leagueId: 9999 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "League not found." });
      expect(await db.season.count()).toBe(0);
    });
  });

  describe("US-2.3 — View seasons", () => {
    it("Seasons view loads with existing seasons", async () => {
      const { token } = await registerAdmin(app);
      await createSeason(app, token, { name: "2026 Fall" });
      await createSeason(app, token, {
        name: "2026 Spring",
        startDate: "2026-01-15",
        endDate: "2026-05-15",
      });

      const response = await request(app)
        .get("/league/seasons")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((row) => row.name)).toEqual([
        "2026 Spring",
        "2026 Fall",
      ]);
    });
  });

  describe("US-2.5 — Edit a season", () => {
    it("User edits a season with valid values and saves", async () => {
      const { token } = await registerAdmin(app);
      const created = await createSeason(app, token);

      const response = await request(app)
        .put(`/league/seasons/${created.body.id}`)
        .set(authHeader(token))
        .send({
          seasonId: created.body.id,
          name: "2027 Spring",
          startDate: "2027-01-10",
          endDate: "2027-04-30",
          leagueId: created.body.leagueId,
          gameDays: ["saturday"],
          gameTime: "18:00",
          minDaysBetweenGames: 7,
        });

      expect(response.status).toBe(200);

      const stored = await db.season.findByPk(created.body.id);
      expect(stored.name).toBe("2027 Spring");
    });
  });

  describe("US-2.6 — Delete a season", () => {
    it("User deletes a season", async () => {
      const { token } = await registerAdmin(app);
      const created = await createSeason(app, token);

      const response = await request(app)
        .delete(`/league/seasons/${created.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);

      const stored = await db.season.findByPk(created.body.id);
      expect(stored).toBeNull();
    });
  });

  describe("US-2.7 — Restrict season management to admins", () => {
    it("Student can list seasons via the API", async () => {
      const { token: adminToken } = await registerAdmin(app);
      await createSeason(app, adminToken);

      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .get("/league/seasons")
        .set(authHeader(student.body.token));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it("Student cannot create a season via the API", async () => {
      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .post("/league/seasons")
        .set(authHeader(student.body.token))
        .send(validSeason());

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin role required." });
      expect(await db.season.count()).toBe(0);
    });

    it("Unauthenticated API request to seasons", async () => {
      const response = await request(app).get("/league/seasons");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });

    it("User cannot delete a season that has a game", async () => {
      const { token } = await registerAdmin(app);
      const created = await createGame(app, token);

      const response = await request(app)
        .delete(`/league/seasons/${created.body.seasonId}`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot delete season: games still exist.",
      });
      expect(await db.season.findByPk(created.body.seasonId)).not.toBeNull();
      expect(await db.game.findByPk(created.body.id)).not.toBeNull();
    });

    it("User cannot delete a league that has a season", async () => {
      const { token } = await registerAdmin(app);
      const created = await createSeason(app, token);

      const response = await request(app)
        .delete(`/league/leagues/${created.body.leagueId}`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot delete league: seasons still exist.",
      });
      expect(await db.league.findByPk(created.body.leagueId)).not.toBeNull();
      expect(await db.season.findByPk(created.body.id)).not.toBeNull();
    });
  });
});

const seedLeagueTeams = async (app, token, leagueId, names) => {
  const teams = [];
  for (const name of names) {
    const team = await createTeam(app, token, { name, leagueId });
    teams.push(team.body);
  }
  return teams;
};

const teamGames = (games, teamId) =>
  games
    .filter((game) => game.homeTeamId === teamId || game.visitingTeamId === teamId)
    .sort((left, right) => {
      const dateOrder = String(left.gameDate).localeCompare(String(right.gameDate));
      if (dateOrder !== 0) {
        return dateOrder;
      }
      return String(left.startTime).localeCompare(String(right.startTime));
    });

const opponentId = (game, teamId) =>
  game.homeTeamId === teamId ? game.visitingTeamId : game.homeTeamId;

describe("Feature 8 — Create Season Games", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-8.1 — Store schedule settings on a season", () => {
    it("User creates a season with schedule settings", async () => {
      const { token } = await registerAdmin(app);
      const response = await createSeason(app, token);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "2026 Fall",
        gameDays: ["saturday"],
        minDaysBetweenGames: 7,
      });
      expect(String(response.body.gameTime)).toMatch(/18:00/);
    });
  });

  describe("US-8.2 — Create games from the season view", () => {
    it("User creates games for a season", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token);
      await seedLeagueTeams(app, token, season.body.leagueId, [
        "OKC Strikers",
        "Tulsa FC",
        "Norman United",
      ]);

      const response = await createSeasonGames(app, token, season.body.id);

      expect(response.status).toBe(201);
      expect(response.body).toHaveLength(6);
      expect(
        response.body.every(
          (game) =>
            String(game.startTime).includes("18:00") &&
            game.location === "Memorial Field"
        )
      ).toBe(true);
    });
  });

  describe("US-8.3 — Double round-robin home and away", () => {
    it("User creates a home and away game for every pair of teams", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token);
      const teams = await seedLeagueTeams(app, token, season.body.leagueId, [
        "OKC Strikers",
        "Tulsa FC",
        "Norman United",
      ]);

      const response = await createSeasonGames(app, token, season.body.id);

      expect(response.status).toBe(201);
      const pairs = response.body.map(
        (game) => `${game.homeTeamId}-${game.visitingTeamId}`
      );
      expect(new Set(pairs).size).toBe(6);
      for (const home of teams) {
        for (const visiting of teams) {
          if (home.id === visiting.id) {
            expect(pairs).not.toContain(`${home.id}-${visiting.id}`);
            continue;
          }
          expect(pairs).toContain(`${home.id}-${visiting.id}`);
        }
      }
    });
  });

  describe("US-8.4 — Honor days, gaps, and no back-to-back rematch", () => {
    it("Created games use only the season game days and time", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token);
      await seedLeagueTeams(app, token, season.body.leagueId, [
        "OKC Strikers",
        "Tulsa FC",
        "Norman United",
      ]);

      const response = await createSeasonGames(app, token, season.body.id);

      expect(response.status).toBe(201);
      for (const game of response.body) {
        const date = String(game.gameDate).slice(0, 10);
        expect(new Date(`${date}T00:00:00.000Z`).getUTCDay()).toBe(6);
        expect(date >= "2026-08-15").toBe(true);
        expect(date <= "2026-12-15").toBe(true);
        expect(String(game.startTime)).toMatch(/18:00/);
      }
    });

    it("A team's games are not closer than the minimum days", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token);
      const teams = await seedLeagueTeams(app, token, season.body.leagueId, [
        "OKC Strikers",
        "Tulsa FC",
        "Norman United",
      ]);

      const response = await createSeasonGames(app, token, season.body.id);

      expect(response.status).toBe(201);
      for (const team of teams) {
        const games = teamGames(response.body, team.id);
        for (let index = 1; index < games.length; index += 1) {
          const first = String(games[index - 1].gameDate).slice(0, 10);
          const second = String(games[index].gameDate).slice(0, 10);
          const days =
            (Date.parse(`${second}T00:00:00.000Z`) -
              Date.parse(`${first}T00:00:00.000Z`)) /
            86400000;
          expect(days).toBeGreaterThanOrEqual(7);
        }
      }
    });

    it("A team does not play the same team twice in a row", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token);
      const teams = await seedLeagueTeams(app, token, season.body.leagueId, [
        "OKC Strikers",
        "Tulsa FC",
        "Norman United",
      ]);

      const response = await createSeasonGames(app, token, season.body.id);

      expect(response.status).toBe(201);
      for (const team of teams) {
        const games = teamGames(response.body, team.id);
        for (let index = 1; index < games.length; index += 1) {
          expect(opponentId(games[index], team.id)).not.toBe(
            opponentId(games[index - 1], team.id)
          );
        }
      }
    });
  });

  describe("US-8.5 — Refuse a schedule that does not fit", () => {
    it("User cannot create games when the season is too short", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token, {
        startDate: "2026-08-15",
        endDate: "2026-08-16",
      });
      await seedLeagueTeams(app, token, season.body.leagueId, [
        "OKC Strikers",
        "Tulsa FC",
        "Norman United",
      ]);

      const response = await createSeasonGames(app, token, season.body.id);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Season is not long enough to schedule all games.",
      });
      expect(await db.game.count({ where: { seasonId: season.body.id } })).toBe(0);
    });

    it("User cannot create games when games already exist", async () => {
      const { token } = await registerAdmin(app);
      const created = await createGame(app, token);

      const response = await createSeasonGames(app, token, created.body.seasonId);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot create games: games already exist.",
      });
      expect(await db.game.count({ where: { seasonId: created.body.seasonId } })).toBe(
        1
      );
    });

    it("User cannot create games with fewer than three teams", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token);
      await seedLeagueTeams(app, token, season.body.leagueId, [
        "OKC Strikers",
        "Tulsa FC",
      ]);

      const response = await createSeasonGames(app, token, season.body.id);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "At least 3 teams are required to create a schedule.",
      });
      expect(await db.game.count()).toBe(0);
    });
  });

  describe("US-8.6 — Restrict create-games to admins", () => {
    it("Student cannot create season games via the API", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token);
      await seedLeagueTeams(app, token, season.body.leagueId, [
        "OKC Strikers",
        "Tulsa FC",
        "Norman United",
      ]);

      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .post(`/league/seasons/${season.body.id}/games`)
        .set(authHeader(student.body.token));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin role required." });
      expect(await db.game.count()).toBe(0);
    });

    it("Unauthenticated API request to create season games", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token);

      const response = await request(app).post(
        `/league/seasons/${season.body.id}/games`
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });
});
