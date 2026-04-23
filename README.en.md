# LangChain4j Documentation

This repository contains the Simplified Chinese LangChain4j documentation site, built with [Docusaurus](https://docusaurus.io/).

Live site: <https://langchain4j-cn.vercel.app/>

The root path serves Simplified Chinese by default, and the English version is available under `/en`.

## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Local Development](#local-development)
- [Build](#build)

## Prerequisites

- [Node.js](https://nodejs.org/en/download) 20+

If Node.js is managed with nvm, run:

```shell
nvm use
```

## Installation

Install all Node dependencies:

```bash
npm ci
```

## Local Development

Start the local development server:

```bash
npm run start
```

Most changes are reflected live without restarting the server.

## Build

Build the deployable static site into the `build` directory. The generated artifacts can be deployed to Vercel or any other static hosting platform.

```bash
npm run build
```