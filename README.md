# NWU.ICU 前端

NWU.ICU 面向西北大学师生，提供课程评价、资料下载与投稿、留言板和站内消息。

[访问网站](https://nwu.icu/) · [后端仓库](https://github.com/NWUCA/NWU.ICU)

## 使用

- 在“课程评价”中搜索课程或教师，查看评价并参与讨论。
- 在“资料下载”中浏览目录、搜索文件，打开文件详情后预览或下载。需要多个文件时，点击“批量下载”，选择文件后打包下载。
- 登录后进入“分享资料”，选择目标目录并提交文件，等待管理员审核；投稿页面可查看进度。
- 在留言板交流或反馈问题，在公告栏查看通知，在“消息”中查看私信和互动提醒。

资料默认允许游客浏览和下载，部分目录有访问限制。需要账号的操作会提示登录。管理员通过 `/manage` 进入管理页面，并完成 Passkey 验证。

## 服务器部署

前端需要与后端一起部署。首次安装请从[服务器部署指南](https://github.com/NWUCA/NWU.ICU/blob/master/README.md#服务器部署)开始，按顺序完成服务器准备、配置、镜像构建、HTTPS 接入和管理员初始化。

### 前后端目录

在服务器上将两个仓库放在 `DEPLOY_ROOT` 指定的目录中，生产 Compose 会按同级目录构建前端：

```text
<DEPLOY_ROOT>/
├── NWU.ICU/
├── new_nwu_icu_frontend/
└── docker-compose.server.yaml（使用服务器覆盖配置时）
```

前端通过 Docker 镜像构建和运行，服务器无需另行安装 Node.js 或 pnpm。

### 配置与构建

在后端 `.env.production` 中配置站点域名、HTTPS 和前后端仓库地址：

```dotenv
FRONTEND_GITHUB_URL=https://github.com/MooWantFree/new_nwu_icu_frontend
BACKEND_GITHUB_URL=https://github.com/NWUCA/NWU.ICU
```

站点名称、域名、学校名称、校邮规则、导航和统计设置也在后端 `.env.production` 中配置，完整字段见[配置说明](https://github.com/NWUCA/NWU.ICU/blob/master/README.md#3-填写配置)。公开配置随页面返回，修改后重新创建后端服务并刷新页面即可，无需重建前端。浏览器使用最新版 Chrome、Firefox 或 Safari。

使用自己的仓库时，替换这两个地址。前端通过同源 `/api/` 访问后端，无需另设前端 API 域名。使用 GitHub Actions 发布时，同时修改本仓库 `.env.production.example` 中的 `BACKEND_IMAGE_REPOSITORY` 和 `BACKEND_GITHUB_URL`，让 CI 使用自己的后端镜像。

完成服务器部署指南中的配置和目录准备后，在后端目录构建前端镜像：

```bash
export ENV_FILE="$(pwd)/.env.production"
source deploy/load-config.sh
cd "$DEPLOY_ROOT/NWU.ICU"

docker compose --env-file "$ENV_FILE" \
  -f docker-compose.production.yaml \
  build \
  --build-arg FRONTEND_COMMIT="$(git -C ../new_nwu_icu_frontend rev-parse HEAD)" \
  --build-arg BACKEND_COMMIT="$(git rev-parse HEAD)" \
  gateway
```

已有服务器覆盖文件时，在命令中追加对应的 `-f` 参数。构建后继续按服务器部署指南启动服务。页脚显示本次构建的前后端版本，可点击查看对应提交。

### 域名与 HTTPS

由 OpenResty 提供 HTTPS，并将网站请求转发到 `GATEWAY_NETWORK_ALIAS` 配置的网关别名，端口为 `80`。OpenResty 容器与 gateway 需加入同一个 Docker 网络。完整配置见 [OpenResty 接入说明](https://github.com/NWUCA/NWU.ICU/blob/master/deploy/openresty.md)。

上线后检查首页、课程评价、资料页和登录页面。资料投稿、批量下载及管理员 Passkey 也需要实际操作验证。

### 更新

每次更新都要保留配套的前后端提交号，备份数据库和配置，再部署新镜像。服务器资源有限时，可使用 [GitHub Actions 镜像发布](https://github.com/NWUCA/NWU.ICU/blob/master/deploy/registry-images.md)，由服务器拉取构建好的镜像。

现有 `nwu.icu` 的更新步骤见[日常更新速查](https://github.com/NWUCA/NWU.ICU/blob/master/deploy/quick-update.md)。自建站点应保留自己的域名、存储路径和代理配置，不直接套用该站点专用配置。

## 反馈与贡献

使用问题可在站内留言板反馈，代码问题和改进建议可提交 issue 或 PR。
