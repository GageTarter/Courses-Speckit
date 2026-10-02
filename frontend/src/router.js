import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import SectionList from "./views/SectionList.vue";
import CourseList from "./views/CourseList.vue";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import Utils from "./config/utils.js";

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
      path: "/sections",
      name: "sections",
      component: SectionList,
    },
    {
      path: "/courses",
      name: "courses",
      component: CourseList,
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

  return true;
});

export default router;
