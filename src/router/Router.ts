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
    path: '/review/course/:id(\\d+)',
    component: () => import("@/views/courseReview/Course.vue"),
    meta: {
      pageTitle: '课程评价',
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
  },
  {
    path: "/user/forget-password",
    name: 'forgetPassword',
    component: () => import("@/views/user/ForgetPassword.vue"),
    meta: {
      pageTitle: "忘记密码",
    }
  }
] as RouteRecordRaw[]

const systemInfoRoutes = [
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('@/components/infoNErrors/404.vue'),
    meta: {
      pageTitle: '404 - 页面未找到'
    }
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/components/infoNErrors/403.vue'),
    meta: {
      pageTitle: '403 - 访问被拒绝'
    }
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@/components/infoNErrors/500.vue'),
    meta: {
      pageTitle: '500 - 服务器错误'
    }
  },
] as RouteRecordRaw[]

const routes = [
  ...courseReviewRoutes,
  ...userRoutes,
  ...systemInfoRoutes,
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
    path: "/editor",
    name: 'editor',
    component: () => import("@/views/courseReview/Editor.vue"),
    meta: {
      pageTitle: '编辑器'
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
