# APK 私有打包指南（不公开发布）

## 目标
- 生成可安装到自己手机的 Android APK
- 不上架 Google Play
- 使用 Expo EAS Internal Distribution

## 一次性准备
1. 安装 EAS CLI（如果没装）
```bash
npm i -g eas-cli
```

2. 登录 Expo 账号
```bash
eas login
```

3. 进入项目
```bash
cd C:\Users\raidengo\Documents\money-mobile-app\apps\mobile
```

4. 首次配置 EAS（会关联 projectId）
```bash
npm run eas:configure
```

## 打包 APK（私有分发）
```bash
npm run eas:apk
```

构建完成后会返回下载链接，直接在手机下载安装即可。

## 真机联调后端（重要）
你的手机不能访问 `localhost`，请把 API 地址改成电脑局域网 IP：

`EXPO_PUBLIC_API_URL=http://你的电脑IP:3000`

示例：
`EXPO_PUBLIC_API_URL=http://192.168.1.23:3000`

并确保：
- 后端正在运行
- Windows 防火墙放行 3000 端口
- 手机和电脑在同一 Wi-Fi

## 可选命令
- 预览 APK（内部安装）：`npm run eas:apk`
- 生产 AAB（上架用，可暂时不需要）：`npm run eas:aab`
