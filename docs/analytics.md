# Umami 访问统计

生产入口只在 `nwu.icu` 公共页面加载 `src/lib/analytics.ts` 中配置的网站 ID。
开发环境和管理页面不加载统计脚本，进入管理页继续使用独立页面重载。
原 Google Analytics 已移除。

gateway 提供两个精确匹配的同域代理：

- `/_site/client.js` → `http://umami:3000/script.js`
- `/_site/api/send` → `http://umami:3000/api/send`

Umami 根据脚本所在目录自动构造上报地址；不要为该脚本指定另一个 `data-host-url`。
服务器须沿用后端 `deploy/docker-compose.umami.yaml`，使 Umami 与 gateway 共享应用网络。
Nginx 使用 Docker DNS 在请求时解析 Umami，因此 Umami 不可用不会阻止 gateway 启动。
同域代理可以减少第三方域名屏蔽造成的漏报，不能保证所有拦截器都允许采集。

采集尊重浏览器 Do Not Track，移除 URL/referrer 中的查询参数和片段，遮盖已有敏感路径令牌，
排除管理页面和管理来源，不发送用户识别数据。代理不转发网站 Cookie 或 Authorization；
真实访客地址取自外层 OpenResty 覆盖的 `X-Real-IP`。gateway 的宿主机端口必须保持回环绑定。

只加载 `script.js`，不启用回放、热图或性能采集。使用 Umami 自带的 SPA 路由检测，
不要另外在 Vue Router 钩子里重复发送 pageview。回放或热图需另行评估并改用 `recorder.js`。

完整验证：Windows 下执行 `pnpm check`，部署后检查脚本 MIME、上报成功、SPA 导航、
管理页无统计请求以及已有 API 与容器健康。
