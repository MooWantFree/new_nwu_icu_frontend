import {createRouter, createWebHistory} from "vue-router";
import About from "@/views/About.vue";
import Login from "@/views/Login.vue";
// import Reset from "@/views/Reset.vue";
// import Register from "@/views/Register.vue";

const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
    pageTitle: '主页'
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    pageTitle: '主页'
  },
  {
    path: "/about",
    name: 'about',
    component: About,
    pageTitle: '关于'
  },
  {
    path: "/login",
    name: 'login',
    component: Login
  },
  // {
  //   path: "/reset",
  //   name: 'reset',
  //   component: Reset
  // },
  // {
  //   path: "/register",
  //   name: 'register',
  //   component: Register
  // },
  {
    path: "/review",
    name: 'review',
    component: ()=> import('@/views/courseReview/Review.vue')
  },
];

const Router = createRouter({
  history: createWebHistory(),
  routes,
});

Router.beforeEach((to, from, next) => {
  document.title = routes.filter(it => it.path === to.path)[0]?.pageTitle ?? 'NWU.ICU'
  next();
});

export default Router;
