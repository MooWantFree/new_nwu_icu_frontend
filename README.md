## TODO
- [ ] 封装一下请求，做好错误处理
- [ ] 封装一个 useUser 以获取当前用户状态
- [ ] 随后研究一下如何处理用户状态，包括 `@/lib/logins.ts` 中的 `loginStatus` 和 `userInfo`，以及 `NavBar.vue` 中的 `fetchUserInfo` 方法，`Login.vue` 中的 `handleLoginSuccess` 方法等，以实现退出登录后页面刷新。