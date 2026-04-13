# 云端部署（Render）- 中文步骤

目标：把后端部署到云端，电脑关机后手机依然可用。

## 1. 推送代码到 GitHub

确保以下文件已在仓库中：

- `render.yaml`（项目根目录）
- `apps/api` 下后端代码

## 2. 在 Render 创建 Blueprint

1. 打开 Render 控制台
2. 点击 `New +`
3. 选择 `Blueprint`
4. 连接你的 GitHub 仓库并开始部署

Render 会自动创建：

- Web Service: `money-mobile-api`
- PostgreSQL: `money-mobile-postgres`

## 3. 配置环境变量

部署完成后，进入 Web Service 的 `Environment`，设置：

- `PUBLIC_BASE_URL=https://你的-api-域名`
- `CORS_ORIGIN=`（可留空，移动端不受浏览器 CORS 限制）

其余变量已由 `render.yaml` 自动处理：

- `DATABASE_URL`（来自 Render PostgreSQL）
- `JWT_SECRET`（自动生成）

## 4. 验证后端

部署成功后在浏览器打开：

- `https://你的-api-域名/health`

应该返回：

```json
{"status":"ok","timestamp":"..."}
```

## 5. 手机 App 切到云端地址

在 `apps/mobile` 构建 APK 前设置：

```env
EXPO_PUBLIC_API_URL=https://你的-api-域名
```

然后重新打包并安装 APK 到手机。

---

如果你把 `https://你的-api-域名` 发给我，我可以直接帮你把前端地址切过去并重打 APK。
