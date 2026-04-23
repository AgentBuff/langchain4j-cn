# LangChain4j 中文文档

这是 LangChain4j 简体中文文档站点仓库，基于 [Docusaurus](https://docusaurus.io/) 构建。

在线访问地址：<https://langchain4j-cn.vercel.app/>

站点默认根路径展示简体中文内容，英文版本位于 `/en`。

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

生成可部署的静态文件到 `build` 目录，可直接部署到 Vercel 等静态托管平台：

```bash
npm run build
```
