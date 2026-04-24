# LangChain4j Documentation

This directory contains the LangChain4j documentation site, built with [Docusaurus](https://docusaurus.io/).

The site currently serves Simplified Chinese on the root path, with the English version available under `/en`.

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

Build the deployable static site into the `build` directory. The generated artifacts can be deployed to Vercel, GitHub Pages, or any other static hosting platform.

```bash
npm run build
```
