import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import FacultyList from "./views/FacultyList.vue";
import Enroll from "./views/Enroll.vue";
import Utils from "./config/utils.js";
import { ROLES } from "./config/roles.js";

const PUBLIC_ROUTES = ["login", "register"];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/faculty",
      name: "faculty",
      component: FacultyList,
    },
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/register",
      name: "register",
      component: Register,
    },
    {
      path: "/enroll",
      name: "enroll",
      component: Enroll,
      meta: { roles: [ROLES.STUDENT] },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

router.beforeEach((to) => {
  const signedIn = !!Utils.getStore("user")?.token;
  const isPublic = PUBLIC_ROUTES.includes(to.name);

  if (!signedIn && !isPublic) {
    return { name: "login" };
  }

  if (signedIn && isPublic) {
    return { name: "home" };
  }

  if (to.name === "faculty" && Utils.getStore("user")?.role !== "admin") {
    return { name: "home" };
  }

  // Feature 1 role: login payload.role. Admin-only pages set meta.roles: ["admin"].
  const allowedRoles = to.meta.roles;
  if (allowedRoles?.length) {
    const role = Utils.getStore("user")?.role;
    if (!allowedRoles.includes(role)) {
      return { name: "home" };
    }
  }

  return true;
});

export default router;