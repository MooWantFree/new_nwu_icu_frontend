import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  DEFAULT_LOGIN_REASON,
  DEFAULT_LOGIN_SUCCESS_MESSAGE,
  getSafeLoginRedirect,
  resolveLoginContext,
} from './loginRedirect'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: { render: () => null },
      meta: { pageTitle: '首页' },
    },
    {
      path: '/upload',
      component: { render: () => null },
      meta: {
        pageTitle: '资料投稿',
        loginReason: '请先登录或注册，再继续投稿资料',
        loginSuccessMessage: '登录成功，正在继续投稿',
      },
    },
    {
      path: '/message/inbox',
      component: { render: () => null },
      meta: {
        pageTitle: '我的消息',
        loginReason: '请先登录或注册，再查看消息',
        loginSuccessMessage: '登录成功，正在打开消息',
      },
    },
    {
      path: '/guestbook',
      component: { render: () => null },
      meta: { pageTitle: '留言板' },
    },
  ],
})

describe('login redirect context', () => {
  it('rejects external and malformed redirects', () => {
    expect(getSafeLoginRedirect('//example.com')).toBe('/')
    expect(getSafeLoginRedirect('https://example.com')).toBe('/')
    expect(getSafeLoginRedirect(['/upload'])).toBe('/')
  })

  it('uses copy configured by the target route', () => {
    expect(resolveLoginContext(router, '/upload', undefined)).toEqual({
      redirect: '/upload',
      reason: '请先登录或注册，再继续投稿资料',
      successMessage: '登录成功，正在继续投稿',
    })
    expect(resolveLoginContext(router, '/message/inbox', undefined).reason)
      .toBe('请先登录或注册，再查看消息')
  })

  it('uses allowlisted intent copy for actions on public routes', () => {
    expect(resolveLoginContext(router, '/guestbook?compose=1', 'guestbook')).toEqual({
      redirect: '/guestbook?compose=1',
      reason: '请先登录，再参与留言板讨论',
      successMessage: '登录成功，正在返回留言板',
    })
  })

  it('ignores unknown intents and falls back to generic copy', () => {
    expect(resolveLoginContext(router, '/', '任意提示')).toEqual({
      redirect: '/',
      reason: DEFAULT_LOGIN_REASON,
      successMessage: DEFAULT_LOGIN_SUCCESS_MESSAGE,
    })
  })

  it('prefers target-route copy over an unrelated intent', () => {
    expect(resolveLoginContext(router, '/upload', 'guestbook').reason)
      .toBe('请先登录或注册，再继续投稿资料')
  })
})
