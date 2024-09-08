import {createRouter, createWebHistory, RouteRecordRaw} from "vue-router";
import {checkLoginStatus} from "@/lib/logins";
import {nextTick} from "vue";

const courseReviewRoutes = [
  {
    path: '/review/timeline',
    component: () => import("@/views/courseReview/ReviewTimeline.vue"),
    meta: {
      pageTitle: '课程评价|首页 - 时间线',
    }
  },
  {
    path: '/review/course/:id',
    component: () => import("@/views/courseReview/Course.vue"),
    meta: {
      pateTitle: '课程评价',
    }
  }
] as RouteRecordRaw[]

const userRoutes = [
  {
    path: "/login",
    name: 'login',
    component: () => import("@/views/Login.vue"),
    meta: {
      pageTitle: "登录/注册",
    }
  },
  {
    path: "/user/profile",
    name: "用户资料",
    component: () => import("@/views/user/Profile.vue"),
    meta:
      {
        requiresAuth: true,
        pageTitle: '用户资料',
      }
  }
] as RouteRecordRaw[]

const routes = [
  ...courseReviewRoutes,
  ...userRoutes,
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
    meta: {
      pageTitle: '主页'
    }
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: {
      pageTitle: '主页'
    }
  },
  {
    path: "/about",
    name: 'about',
    component: () => import("@/views/About.vue"),
    meta: {
      pageTitle: '关于'
    }
  },
  {
    path: "/user/activate",
    name: "userActivate",
    component: () => import("@/views/user/UserActivate.vue"),
    meta: {
      pageTitle: "用户激活"
    }
  }
] as RouteRecordRaw[]

const Router = createRouter({
  history: createWebHistory(),
  routes,
});

Router.beforeEach((to, from, next) => {
  // Change title
  nextTick(() => document.title = to.meta?.pageTitle as string ?? 'NWU.ICU')
  // Check for login required
  const loginStatus = checkLoginStatus()
  routes.forEach(route => {
    if (route.path === to.path) {
      if (route.meta?.requiresAuth && !loginStatus) {
        next({name: 'login'})
      }
    }
  })
  // Finally
  next();
});

export default Router;
