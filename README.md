# LangChain4j 中文文档

这个目录包含 LangChain4j 文档站点，基于 [Docusaurus](https://docusaurus.io/) 构建。

站点当前默认以简体中文作为根路径内容，英文版本位于 `/en`。

## 目录

- [前置要求](#前置要求)
- [安装依赖](#安装依赖)
- [本地开发](#本地开发)
- [构建站点](#构建站点)

## 前置要求

- [Node.js](https://nodejs.org/en/download) 20+

如果你使用 nvm 管理 Node.js 版本，先执行：

```shell
nvm use
```

## 安装依赖

安装全部 Node 依赖：

```bash
npm ci
```

## 本地开发

启动本地开发服务器：

```bash
npm run start
```

大多数改动都会自动热更新，无需手动重启。

## 构建站点

生成可部署的静态文件到 `build` 目录，可直接部署到 Vercel、GitHub Pages 等静态托管平台：

```bash
npm run build
```
