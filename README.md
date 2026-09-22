## TODO
- [x] 封装一下请求，做好错误处理
- [x] 封装一个 useUser 以获取当前用户状态
- [x] 随后研究一下如何处理用户状态，包括 `@/lib/logins.ts` 中的 `loginStatus` 和 `userInfo`，以及 `NavBar.vue` 中的 `fetchUserInfo` 方法，`Login.vue` 中的 `handleLoginSuccess` 方法等，以实现退出登录后页面刷新。
- [ ] 用 Tailwind 重写 NavBar.vue 和 LoginForm.vue
- [ ] 收起按钮应该是浮动在页面上的

## 构建版本

页脚会显示前后端提交号。本地开发会自动读取同级的 `new_nwu_icu_frontend` 与 `NWU.ICU`
仓库；生产 Docker 构建应显式传入本次部署的固定提交：

```bash
docker build \
  --build-arg FRONTEND_COMMIT="$(git rev-parse HEAD)" \
  --build-arg BACKEND_COMMIT="$(git -C ../NWU.ICU rev-parse HEAD)" \
  -t nwuicu-gateway:local .
```

使用 Docker Compose 时，命令写为
`docker compose build --build-arg FRONTEND_COMMIT=... --build-arg BACKEND_COMMIT=... gateway`。
提交号只写入构建产物，无需维护本地版本文件。
