import { nextTick } from 'vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { checkLoginStatus } from '@/lib/logins'

const courseReviewRoutes = [
  {
    path: '/review/timeline',
    component: () => import('@/views/courseReview/ReviewTimeline.vue'),
    meta: {
      pageTitle: '课程评价|首页 - 时间线',
    },
  },
  {
    name: 'courseReviewItem',
    path: '/review/course/:id(\\d+)',
    component: () => import('@/views/courseReview/Course.vue'),
    meta: {
      pageTitle: '课程评价',
    },
  },
  {
    name: 'teacherReviewItem',
    path: '/review/teacher/:id(\\d+)',
    component: () => import('@/views/courseReview/Teacher.vue'),
    meta: {
      pageTitle: '教师评价',
    },
  },
  {
    path: '/review/course',
    component: () => import('@/views/courseReview/CourseList.vue'),
    meta: {
      pageTitle: '课程评价|课程列表',
    },
  },
  {
    path: '/review/teacher',
    component: () => import('@/views/courseReview/TeacherList.vue'),
    meta: {
      pageTitle: '课程评价|教师列表',
    },
  },

] satisfies RouteRecordRaw[]

const userRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/user/Login.vue'),
    meta: {
      pageTitle: '登录/注册',
    },
  },
  {
    path: '/user/:id',
    name: 'userProfile',
    component: () => import('@/views/user/Profile.vue'),
    props: true,
    meta: {
      pageTitle: '用户资料',
      requiresAuth: false,
    },
  },
  {
    path: '/user/settings',
    name: 'settings',
    meta: {
      pageTitle: '设置',
      requiresAuth: true,
    },
    component: () => import('@/views/user/Settings.vue'),
    children: [
      {
        name: 'profileSettings',
        path: 'profile',
        component: () => import('@/components/settings/ProfileSettings.vue'),
      },
      {
        name: 'emailSettings',
        path: 'email',
        component: () => import('@/components/settings/EmailSettings.vue'),
      },
      {
        name: 'passwordSettings',
        path: 'password',
        component: () => import('@/components/settings/PasswordSettings.vue'),
      },
      {
        name: 'privateSettings',
        path: 'private',
        component: () => import('@/components/settings/PrivateSettings.vue'),
      },
    ],
  },
  {
    path: '/user/forget-password',
    name: 'forgetPassword',
    component: () => import('@/views/user/ForgetPassword.vue'),
    meta: {
      pageTitle: '忘记密码',
    },
  },
  {
    path: '/user/activate',
    name: 'userActivate',
    component: () => import('@/views/user/UserActivate.vue'),
    meta: {
      pageTitle: '用户激活',
    },
  },
  {
    path: '/user/bind-college-mail',
    name: 'bindCollegeMail',
    component: () => import('@/views/user/UserActivate.vue'),
    meta: {
      pageTitle: '绑定学院邮箱',
    },
  },
] satisfies RouteRecordRaw[]

const messageRoutes = [
  {
    path: '/message',
    name: 'message',
    component: () => import('@/views/message/PMLayout.vue'),
    meta: {
      pageTitle: '消息',
    },
    children: [
      {
        path: 'inbox',
        name: 'inbox',
        component: () => import('@/components/message/InBox.vue'),
        meta: {
          pageTitle: '我的消息',
        },
      },
      {
        path: 'replies',
        name: 'replies',
        component: () => import('@/components/message/Replies.vue'),
        meta: {
          pageTitle: '回复我的',
        },
      },
      {
        path: 'likes',
        name: 'likes',
        component: () => import('@/components/message/Likes.vue'),
        meta: {
          pageTitle: '收到的赞',
        },
      },
      {
        path: 'system',
        name: 'system',
        component: () => import('@/components/message/SystemNotifications.vue'),
        meta: {
          pageTitle: '系统通知',
        },
      },
    ],
  },
] satisfies RouteRecordRaw[]

const systemInfoRoutes = [
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('@/components/infoNErrors/404.vue'),
    meta: {
      pageTitle: '404 - 页面未找到',
    },
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/components/infoNErrors/403.vue'),
    meta: {
      pageTitle: '403 - 访问被拒绝',
    },
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@/components/infoNErrors/500.vue'),
    meta: {
      pageTitle: '500 - 服务器错误',
    },
  },
] satisfies RouteRecordRaw[]

const routes = [
  ...courseReviewRoutes,
  ...userRoutes,
  ...systemInfoRoutes,
  ...messageRoutes,
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
    meta: {
      pageTitle: '主页',
    },
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: {
      pageTitle: '主页',
    },
  },
  {
    path: '/blog',
    name: 'blogs',
    component: () => import('@/views/blog/catalog.vue'),
    meta: {
      pageTitle: '文章目录',
    },
  },
  {
    path: '/blog/:id',
    name: 'blog',
    component: () => import('@/views/blog/article.vue'),
    meta: {
      pageTitle: '文章',
    },
  },
] as RouteRecordRaw[]

const Router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (from, to, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },

})

Router.beforeEach(async (to, from) => {
  // Change title
  nextTick(() => (document.title = (to.meta?.pageTitle as string) ?? 'NWU.ICU'))
  // Check for login required
  if (to.meta?.requiresAuth && !checkLoginStatus()) {
    return { name: '403', params: { message: '你尚未登录' } }
  }
  return
})

export default Router
