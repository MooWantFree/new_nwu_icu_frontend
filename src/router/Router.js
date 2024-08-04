import {createRouter, createWebHistory} from "vue-router";
import About from "@/views/About.vue";
import Login from "@/views/Login.vue";
import {checkLoginStatus} from "@/lib/logins";
import Logout from "@/views/Logout.vue";
// import Reset from "@/views/Reset.vue";

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
    component: Login,
    pageTitle: "登录/注册",
  },
  {
    path: '/logout',
    name: 'logout',
    component: Logout,
    pageTitle: "退出登录"
  },
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
  // Change title
  document.title = routes.filter(it => it.path === to.path)[0]?.pageTitle ?? 'NWU.ICU'
  // Check for login required
  const loginStatus = checkLoginStatus()
  routes.forEach(route => {
    if (route.path === to.path) {
      if (route.needLogin && !loginStatus) {
        next({name: 'login'})
      }
    }
  })
  // Finally
  next();
});

export default Router;
