# 編み図生成ツール (Knitting Image Maker)

画像から編み目パターン（編み図）を生成する Web アプリケーションです。

## 🌐 デモ（GitHub Pages）

**[https://KojiKobayashi.github.io/knitting_image_maker/](https://KojiKobayashi.github.io/knitting_image_maker/)**

## ✨ 機能概要

- **画像アップロード**: JPEG / PNG / BMP 形式の画像を読み込み
- **処理範囲の選択**: アップロードした画像上でドラッグして処理する矩形範囲を指定
- **カラーパレット**: デフォルトは Merino Rainbow 96 色。CSV ファイルで独自パレットを読み込み可能
- **変換設定**:
  - 色数・横セル数の指定
  - ゲージ（目数・段数）による縦横比の自動調整
  - ノイズ除去の有効化
- **編み図の生成**: k-means クラスタリングで画像を指定色数に減色し、グリッド状の編み図を生成
- **編集モード**: 生成後の編み図をペイントツール・スポイトで手編集可能
- **ダウンロード**:
  - 編み図 PNG
  - 色番号付き PNG
  - 使用色 CSV
  - 色番グリッド CSV
- **多言語対応**: 日本語 / English の切り替えに対応

## 🛠️ ローカルでの開発・実行手順

### 前提条件

- [Node.js](https://nodejs.org/) 20 以上

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/KojiKobayashi/knitting_image_maker.git
cd knitting_image_maker

# 依存パッケージをインストール
npm ci
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:5173/knitting_image_maker/](http://localhost:5173/knitting_image_maker/) を開くと起動します。

### プロダクションビルド

```bash
# ビルド（dist/ ディレクトリに出力）
npm run build

# ビルド結果のプレビュー
npm run preview
```

## 📂 プロジェクト構成

```
knitting_image_maker/
├── src/
│   ├── App.tsx                    # アプリのルートコンポーネント
│   ├── i18n.ts                    # 多言語対応（日本語/英語）
│   ├── components/
│   │   ├── EditableResultView.tsx # 編み図表示・編集画面
│   │   ├── ImageInfoPanel.tsx     # 画像情報パネル
│   │   ├── ImageUploader.tsx      # 画像アップロード
│   │   ├── PaletteUploader.tsx    # パレット CSV アップロード
│   │   ├── ProcessButton.tsx      # 生成ボタン
│   │   ├── RectSelector.tsx       # 処理範囲選択
│   │   ├── ResultView.tsx         # 結果表示
│   │   └── SettingsPanel.tsx      # 設定パネル
│   ├── lib/
│   │   ├── colorUtils.ts          # 色変換ユーティリティ
│   │   ├── defaultPalette.ts      # デフォルトカラーパレット
│   │   ├── imageProcessor.ts      # 画像処理ロジック
│   │   ├── kmeans.ts              # k-means クラスタリング
│   │   └── paletteLoader.ts       # CSV パレット読み込み
│   ├── workers/
│   │   └── processor.worker.ts    # Web Worker（重い処理の非同期実行）
│   └── types/                     # TypeScript 型定義
├── index.html
├── vite.config.ts                 # Vite 設定（base: '/knitting_image_maker/'）
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🚀 デプロイ

`main` ブランチへの push をトリガーに GitHub Actions が自動でビルドし、GitHub Pages へデプロイします（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 参照）。

手動でデプロイ環境を再現する場合:

```bash
npm ci
npm run build
# dist/ の内容を静的ファイルサーバーへ配置
```

## 🔧 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | [React](https://react.dev/) 18 |
| 言語 | [TypeScript](https://www.typescriptlang.org/) 5 |
| ビルドツール | [Vite](https://vitejs.dev/) 5 |
| スタイリング | [Tailwind CSS](https://tailwindcss.com/) 3 |
| 多言語対応 | [i18next](https://www.i18next.com/) |
| 非同期処理 | Web Workers API |
| CI/CD | GitHub Actions + GitHub Pages |
