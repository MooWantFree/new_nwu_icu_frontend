## TODO
- [x] 封装一下请求，做好错误处理
- [x] 封装一个 useUser 以获取当前用户状态
- [x] 随后研究一下如何处理用户状态，包括 `@/lib/logins.ts` 中的 `loginStatus` 和 `userInfo`，以及 `NavBar.vue` 中的 `fetchUserInfo` 方法，`Login.vue` 中的 `handleLoginSuccess` 方法等，以实现退出登录后页面刷新。
- [ ] 用 Tailwind 重写 NavBar.vue 和 LoginForm.vue
- [ ] 收起按钮应该是浮动在页面上的

## 构建版本

页脚会显示前后端提交号。本地开发会自动读取同级的 `new_nwu_icu_frontend` 与 `NWU.ICU`
仓库。将 `VITE_FRONTEND_GITHUB_URL` 和 `VITE_BACKEND_GITHUB_URL` 写入本地 `.env.local`
后，提交号会链接到相应的 GitHub 提交页。生产环境在 Compose 使用的 env 文件中设置
`FRONTEND_GITHUB_URL` 和 `BACKEND_GITHUB_URL`，构建时会传入前端镜像。

单独使用 Docker 构建时，先从 env 文件加载 `FRONTEND_GITHUB_URL` 和
`BACKEND_GITHUB_URL`，再显式传入本次部署的固定提交和仓库地址：

```bash
docker build \
  --build-arg FRONTEND_COMMIT="$(git rev-parse HEAD)" \
  --build-arg BACKEND_COMMIT="$(git -C ../NWU.ICU rev-parse HEAD)" \
  --build-arg FRONTEND_GITHUB_URL="$FRONTEND_GITHUB_URL" \
  --build-arg BACKEND_GITHUB_URL="$BACKEND_GITHUB_URL" \
  -t nwuicu-gateway:local .
```

使用 Docker Compose 时，命令写为
`docker compose build --build-arg FRONTEND_COMMIT=... --build-arg BACKEND_COMMIT=... gateway`；
仓库地址由 Compose 从 env 文件读取。
提交号只写入构建产物，无需维护本地版本文件。
