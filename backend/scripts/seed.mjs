/**
 * Optional first-run data: admin user, one league, three teams, one season.
 * Safe to run more than once — skips rows that already exist.
 *
 *   npm run seed --prefix backend
 */
import bcrypt from "bcryptjs";
import db from "../app/models/index.js";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password123";

const seed = async () => {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const [admin] = await db.user.findOrCreate({
    where: { username: ADMIN_USERNAME },
    defaults: {
      fName: "Demo",
      lName: "Admin",
      email: "admin@example.com",
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: "admin",
    },
  });

  const [league] = await db.league.findOrCreate({
    where: { name: "OKC Youth Soccer" },
    defaults: {
      name: "OKC Youth Soccer",
      sport: "soccer",
    },
  });

  const teams = [
    { name: "OKC Strikers", homeField: "Memorial Field" },
    { name: "Tulsa FC", homeField: "Tulsa Stadium" },
    { name: "Norman United", homeField: "Reaves Park" },
  ];

  for (const team of teams) {
    await db.team.findOrCreate({
      where: { leagueId: league.id, name: team.name },
      defaults: {
        ...team,
        leagueId: league.id,
      },
    });
  }

  await db.season.findOrCreate({
    where: { leagueId: league.id, name: "2026 Fall" },
    defaults: {
      name: "2026 Fall",
      startDate: "2026-08-15",
      endDate: "2026-12-15",
      leagueId: league.id,
      gameDays: ["saturday"],
      gameTime: "18:00",
      minDaysBetweenGames: 7,
    },
  });

  console.log(
    `Seed complete. Sign in as ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}` +
      (admin.role === "admin" ? "." : " (existing user was left unchanged).")
  );
};

try {
  await seed();
} finally {
  await db.sequelize.close();
}
