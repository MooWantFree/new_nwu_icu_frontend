import {createRouter, createWebHistory} from "vue-router";
import Home from "@/views/Home.vue";
import About from "@/views/About.vue";
import Download from "@/views/Download.vue";
import Review from "@/views/Review.vue";
import Login from "@/views/Login.vue";
import Reset from "@/views/Reset.vue";
import Register from "@/views/Register.vue";
import ReviewTimeline from "@/views/ReviewTimeline.vue";

const routes = [
  {path: "/", component: Home},
  {path: "/about", component: About},
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
