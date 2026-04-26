import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ja: {
    translation: {
      // App.tsx
      'app.title': '編み図生成',
      'app.subtitle': '画像から編み目パターンを生成',
      'app.settings': '変換設定',
      'app.error': '不明なエラーが発生しました。',
      'app.workerError': 'Worker エラー: ',
      'app.placeholder': '画像をアップロードして「編み図を生成」ボタンを押してください',

      // ProcessButton.tsx
      'button.generate': '編み図を生成',
      'button.processing': '処理中...',

      // ImageUploader.tsx
      'uploader.label': '画像ファイル',
      'uploader.hint': 'クリックまたはドラッグ＆ドロップ',
      'uploader.formats': 'JPEG / PNG / BMP',
      'uploader.error': 'JPEG、PNG、BMP 形式の画像を選択してください。',

      // PaletteUploader.tsx
      'palette.label': 'カラーパレット CSV（任意）',
      'palette.default': '未選択: Merino Rainbow 96色（デフォルト）を使用',
      'palette.errorNoData': '有効な色データが見つかりませんでした。',
      'palette.errorLoad': 'CSVの読み込みに失敗しました。',

      // SettingsPanel.tsx
      'settings.colorCount': '色数: {{count}}',
      'settings.horizontalCells': '横セル数: {{count}}',
      'settings.denoise': 'ノイズ除去',
      'settings.advancedShow': '詳細設定を表示',
      'settings.advancedHide': '詳細設定を隠す',
      'settings.cellHeight': 'セル高さ: {{value}}px',
      'settings.cellWidth': 'セル幅: {{value}}px',
      'settings.lineThickness': '通常グリッド線: {{value}}px',
      'settings.thickLineThickness': '太グリッド線: {{value}}px',
      'settings.thickLineInterval': '太線間隔: {{value}}',
      'settings.sampling': 'K-means でサンプリング画素を使う',

      // ImageInfoPanel.tsx
      'info.title': '出力画像情報',
      'info.horizontalCells': '横セル数',
      'info.verticalCells': '縦セル数',
      'info.imageWidth': '画像横サイズ',
      'info.imageHeight': '画像縦サイズ',

      // RectSelector.tsx
      'rectSelector.title': '元画像・範囲選択',
      'rectSelector.reset': '全体にリセット',
      'rectSelector.hint': '画像上をドラッグして処理範囲を選択できます（デフォルト: 画像全体）',
      'rectSelector.imageAlt': 'アップロードした元画像',
      'rectSelector.range': '選択範囲: ({{x}}, {{y}}) — {{w}} × {{h}} px',

      // ResultView.tsx & EditableResultView.tsx
      'result.original': '元画像',
      'result.originalAlt': 'アップロードした元画像',
      'result.range': '処理範囲: ({{x}}, {{y}}) — {{w}} × {{h}} px',
      'result.title': '生成結果',
      'result.back': '矩形選択に戻る',
      'result.download': 'PNG ダウンロード',
      'result.downloadNumbered': '🔢 番号付き PNG',
      'result.downloadColorCsv': '📄 使用色CSV',
      'result.downloadGridCsv': '🔢 色番グリッドCSV',
      'result.diagramAlt': '編み図',
      'result.colorListTitle': '使用色一覧 ({{count}}色)',
      'result.tableHeader.preview': 'プレビュー',
      'result.tableHeader.type': '系統',
      'result.tableHeader.colorNumber': '色番',
      'result.tableHeader.count': 'セル数',
      'result.tableHeader.product': '商品',
      'result.tableHeader.action': '操作',

      // EditableResultView.tsx - Edit Mode
      'edit.title': '✏️ 編集モード',
      'edit.undo': '↩ Undo',
      'edit.undoTooltip': '元に戻す (Ctrl+Z)',
      'edit.redo': '↪ Redo',
      'edit.redoTooltip': 'やり直す (Ctrl+Y)',
      'edit.paint': '🖌️ ペイント',
      'edit.paintTooltip': 'ペイントツール',
      'edit.eyedropper': '💧 スポイト',
      'edit.eyedropperTooltip': 'スポイトツール (E キー)',
      'edit.selectedColor': '選択色:',
      'edit.generating': '⏳ 生成中…',
      'edit.applying': '⏳ 反映中…',
      'edit.hint': 'ヒント: Ctrl+Z で元に戻す / Ctrl+Y でやり直す / E キーでスポイト切替 / ドラッグで連続塗り',
      'edit.exit': '✓ 編集終了',
      'edit.usedColorsTab': '使用中 ({{count}}色)',
      'edit.allColorsTab': '全色 ({{count}}色)',
      'edit.colorPanelLabel': 'カラーパネル',
      'edit.usedColorsHint': 'クリックで塗る色を選択 / 全置換で一括変換',
      'edit.allColorsSearch': '色番・系統で絞り込み…',
      'edit.replaceAllTooltip': 'この色をすべて「{{type}} {{number}}」で置換',
      'edit.replaceAll': '全置換',
      'edit.status.used': '使用中',
      'edit.status.unused': '未使用',

      // Palette types
      'palette.type.ピンク': 'ピンク',
      'palette.type.赤': '赤',
      'palette.type.オレンジ': 'オレンジ',
      'palette.type.黄': '黄',
      'palette.type.茶': '茶',
      'palette.type.ベージュ': 'ベージュ',
      'palette.type.緑': '緑',
      'palette.type.青': '青',
      'palette.type.紺': '紺',
      'palette.type.紫': '紫',
      'palette.type.灰': '灰',
      'palette.type.白': '白',
      'palette.type.黒': '黒',

      // Language selector
      'language.toggle': 'EN',
    },
  },
  en: {
    translation: {
      // App.tsx
      'app.title': 'Knitting Pattern Generator',
      'app.subtitle': 'Generate knitting patterns from images',
      'app.settings': 'Settings',
      'app.error': 'An unknown error occurred.',
      'app.workerError': 'Worker error: ',
      'app.placeholder': 'Upload an image and click "Generate Pattern" button',

      // ProcessButton.tsx
      'button.generate': 'Generate Pattern',
      'button.processing': 'Processing...',

      // ImageUploader.tsx
      'uploader.label': 'Image File',
      'uploader.hint': 'Click or drag & drop',
      'uploader.formats': 'JPEG / PNG / BMP',
      'uploader.error': 'Please select a JPEG, PNG, or BMP image.',

      // PaletteUploader.tsx
      'palette.label': 'Color Palette CSV (Optional)',
      'palette.default': 'Not selected: Using Merino Rainbow (96 colors, default)',
      'palette.errorNoData': 'No valid color data found.',
      'palette.errorLoad': 'Failed to load CSV.',

      // SettingsPanel.tsx
      'settings.colorCount': 'Color Count: {{count}}',
      'settings.horizontalCells': 'Horizontal Cells: {{count}}',
      'settings.denoise': 'Denoise',
      'settings.advancedShow': 'Show Advanced Settings',
      'settings.advancedHide': 'Hide Advanced Settings',
      'settings.cellHeight': 'Cell Height: {{value}}px',
      'settings.cellWidth': 'Cell Width: {{value}}px',
      'settings.lineThickness': 'Normal Grid Line: {{value}}px',
      'settings.thickLineThickness': 'Thick Grid Line: {{value}}px',
      'settings.thickLineInterval': 'Thick Line Interval: {{value}}',
      'settings.sampling': 'Use K-means sampling',

      // ImageInfoPanel.tsx
      'info.title': 'Output Image Info',
      'info.horizontalCells': 'Horizontal Cells',
      'info.verticalCells': 'Vertical Cells',
      'info.imageWidth': 'Image Width',
      'info.imageHeight': 'Image Height',

      // RectSelector.tsx
      'rectSelector.title': 'Select Image Area',
      'rectSelector.reset': 'Reset to Full Image',
      'rectSelector.hint': 'Drag on the image to select processing area (default: full image)',
      'rectSelector.imageAlt': 'Uploaded source image',
      'rectSelector.range': 'Selected area: ({{x}}, {{y}}) — {{w}} × {{h}} px',

      // ResultView.tsx & EditableResultView.tsx
      'result.original': 'Original Image',
      'result.originalAlt': 'Uploaded source image',
      'result.range': 'Processing area: ({{x}}, {{y}}) — {{w}} × {{h}} px',
      'result.title': 'Generated Pattern',
      'result.back': 'Back to Area Selection',
      'result.download': 'Download PNG',
      'result.downloadNumbered': '🔢 Download with Numbers',
      'result.downloadColorCsv': '📄 Color List CSV',
      'result.downloadGridCsv': '🔢 Grid CSV',
      'result.diagramAlt': 'Knitting diagram',
      'result.colorListTitle': 'Color List ({{count}} colors)',
      'result.tableHeader.preview': 'Preview',
      'result.tableHeader.type': 'Type',
      'result.tableHeader.colorNumber': 'Number',
      'result.tableHeader.count': 'Cell Count',
      'result.tableHeader.product': 'Product',
      'result.tableHeader.action': 'Action',

      // EditableResultView.tsx - Edit Mode
      'edit.title': '✏️ Edit Mode',
      'edit.undo': '↩ Undo',
      'edit.undoTooltip': 'Undo (Ctrl+Z)',
      'edit.redo': '↪ Redo',
      'edit.redoTooltip': 'Redo (Ctrl+Y)',
      'edit.paint': '🖌️ Paint',
      'edit.paintTooltip': 'Paint Tool',
      'edit.eyedropper': '💧 Eyedropper',
      'edit.eyedropperTooltip': 'Eyedropper Tool (E key)',
      'edit.selectedColor': 'Selected Color:',
      'edit.generating': '⏳ Generating…',
      'edit.applying': '⏳ Applying…',
      'edit.hint': 'Hint: Ctrl+Z undo / Ctrl+Y redo / E key eyedropper toggle / Drag to paint',
      'edit.exit': '✓ Exit Edit',
      'edit.usedColorsTab': 'Used ({{count}} colors)',
      'edit.allColorsTab': 'All ({{count}} colors)',
      'edit.colorPanelLabel': 'Color Panel',
      'edit.usedColorsHint': 'Click to select paint color / Replace all to replace',
      'edit.allColorsSearch': 'Filter by number or type...',
      'edit.replaceAllTooltip': 'Replace all colors with "{{type}} {{number}}"',
      'edit.replaceAll': 'Replace All',
      'edit.status.used': 'Used',
      'edit.status.unused': 'Unused',

      // Palette types
      'palette.type.ピンク': 'Pink',
      'palette.type.赤': 'Red',
      'palette.type.オレンジ': 'Orange',
      'palette.type.黄': 'Yellow',
      'palette.type.茶': 'Brown',
      'palette.type.ベージュ': 'Beige',
      'palette.type.緑': 'Green',
      'palette.type.青': 'Blue',
      'palette.type.紺': 'Navy',
      'palette.type.紫': 'Purple',
      'palette.type.灰': 'Gray',
      'palette.type.白': 'White',
      'palette.type.黒': 'Black',

      // Language selector
      'language.toggle': '日',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
