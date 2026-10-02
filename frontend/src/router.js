import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import SectionList from "./views/SectionList.vue";

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
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

export default router;