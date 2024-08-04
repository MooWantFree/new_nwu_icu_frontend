import {createRouter, createWebHistory} from "vue-router";
import About from "@/views/About.vue";
import Login from "@/views/Login.vue";
import {checkLoginStatus} from "@/lib/logins";
import Logout from "@/views/Logout.vue";
import Review from "@/views/courseReview/Review.vue";
import Profile from "@/views/user/Profile.vue";

const courseReviewRoutes = [
  {
    path: '/review',
    component: Review,
    pathTitle: '课程评价|首页 - 时间线',
  }
]

const userRoutes = [
  {
    path: "/login",
    name: 'login',
    component: Login,
    pageTitle: "登录/注册",
  },
  {
    path: "/user/profile",
    name: "用户资料",
    component: Profile,
    pageTitle: '用户资料',
  }
]

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
  ...courseReviewRoutes,
  ...userRoutes
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
