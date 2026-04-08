# Header Injector

[![CI](https://github.com/ryota-iso/header-injector/actions/workflows/ci.yml/badge.svg)](https://github.com/ryota-iso/header-injector/actions/workflows/ci.yml)

WebExtension ベースの request header 付与ツール。

主な用途:

- 特定環境向けの request header 付与
  - ex: `aws-cf-cd-**` 系 header を使った AB テスト

補足:

- Safari では任意の custom header は付与できない
- Safari で付与できるのは一部の既存標準 header のみ
- `aws-cf-cd-**` のような custom header を使う用途は実質 Chrome 系ブラウザ向け

## ディレクトリ構造

```text
.
├── apps/
│   ├── extension/      # Chrome / Safari 向け拡張本体
│   └── safari-shell/   # Safari iOS 向け Xcode shell
├── packages/
│   └── core/           # 型、validation、rule 変換
├── package.json
└── pnpm-workspace.yaml
```

## 環境構築

前提:

- `vp` がインストール済み
- Node.js `24.14.1`
- pnpm `10.33.0`
- Xcode（Safari iOS を使う場合）

セットアップ:

```bash
vp install
```

主要コマンド:

```bash
vp run @header-injector/extension#build                     # build all
vp run @header-injector/extension#build:chrome              # build Chrome
vp run @header-injector/extension#build:safari              # build Safari
vp run @header-injector/extension#build:safari:ios          # build Safari iOS
vp run @header-injector/extension#build:safari:ios:rebuild  # build Safari iOS with clean
```

Safari iOS の詳細は [apps/safari-shell/README.md](./apps/safari-shell/README.md) を参照。
