# Safari shell（iOS）

## 前提条件

- Xcode がインストール済み
- Xcode に Apple Developer の Team が登録済み
- request header 変更の確認対象は iOS 16.4 以降
- Safari 向け build が通る

```bash
cd <repo-root>
vp run @header-injector/extension#build:safari
```

## 初期設定

```bash
cd <repo-root>
vp run @header-injector/extension#build:safari:ios
```

1. `apps/safari-shell` 配下の `.xcodeproj` を Xcode で開く
2. app target と extension target の `Signing & Capabilities` で `Team` を設定する
3. ローカル用の `Bundle Identifier` を設定する
4. Xcode から iPhone または iOS Simulator に Run する
5. iOS 側で `設定 > アプリ > Safari > 機能拡張` から `Header Injector` を有効化する

## リビルド

```bash
cd <repo-root>
vp run @header-injector/extension#build:safari
vp run @header-injector/extension#build:safari:ios:rebuild
```

その後、Xcode から再インストールする。

## 注意点

- `apps/safari-shell` は生成物置き場で、source of truth は `apps/extension` 側にある
- Xcode 側の手修正は署名や bundle identifier などローカル設定に限定する
- manifest や background の変更後は `build:safari` と `build:safari:ios:rebuild` をやり直す
- 再インストール後は iOS 側で拡張を一度 OFF/ON し直す
