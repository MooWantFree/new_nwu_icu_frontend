import {createRouter, createWebHistory} from "vue-router";
import About from "@/views/About.vue";
import Login from "@/views/Login.vue";
import Reset from "@/views/Reset.vue";
import Register from "@/views/Register.vue";
import ReviewTimeline from "@/views/ReviewTimeline.vue";

const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue')
  },
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
  {
    path: "/login",
    name: 'login',
    component: Login
  },
  {
    path: "/reset",
    name: 'reset',
    component: Reset
  },
  {
    path: "/register",
    name: 'register',
    component: Register
  },
  {
    path: "/review",
    name: 'review',
    component: ReviewTimeline
  },
];

const Router = createRouter({
  history: createWebHistory(),
  routes,
});

Router.beforeEach((to, from, next) => {
  document.title = 'NWU.ICU';
  next();
});

export default Router;
