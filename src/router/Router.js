import {createRouter, createWebHistory} from "vue-router";
import About from "@/views/About.vue";
import Download from "@/views/Download.vue";
import Login from "@/views/Login.vue";
import Reset from "@/views/Reset.vue";
import Register from "@/views/Register.vue";
import ReviewTimeline from "@/views/ReviewTimeline.vue";

const routes = [
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/Home.vue')
  },

  {
    path: "/about",
    name: 'about',
    component: About
  },
  {path: "/download", component: Download},
  // {path: "/review", component: Review},
  {path: "/login", component: Login},
  {path: "/reset", component: Reset},
  {path: "/register", component: Register},
  {path: "/review", component: ReviewTimeline},
];

const Router = createRouter({
  history: createWebHistory(),
  routes,
});

export default Router;
