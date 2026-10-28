# 屬靈父母手冊 App v1.1.1

v1.1.1：圖示改用主視覺方圖（321、十字架、屬靈家庭與新芽），輸出 32–1024 共 11 種尺寸，另有 maskable 192／512。

國度321空中團契・落實321。單一檔案 vanilla JS PWA，繁體／简体／English 三語。

## 部署（GitHub Pages）
把本資料夾全部檔案上傳到 repo 根目錄，開啟 Pages。更新時請同步調高 sw.js 的 VERSION。

## v1.1.0 新增
- 三語：右上角「繁／简／EN」切換；簡體由 OpenCC（t2s）自繁體轉出，英文經文採 NIV。
- 逐句跟讀：章節內每一句都可點選「從這句朗讀」；朗讀時句子高亮、自動捲動，手動捲動即暫停跟隨，按 ↓ 回到朗讀位置；上一句／下一句、語速、鎖屏控制（MediaSession）。
- 語音：預設先用 Azure 雲端（azure-tts.spch321.workers.dev），失敗時自動改用裝置語音。
- 小智陪伴：右下角「小智」，依目前章節給建議問題；句子選單可「問小智這句」；對話保存在本機最近 30 則。
- 帶領者：手冊附錄新增「小組帶領者手冊」，每章新增「帶領者專區」。

## 雲端服務介面（如與既有 Worker 不同，可在「設定 → 進階」改網址，或調整 app.js 的 fetchAzure／xzSend）
- 朗讀：POST JSON `{text, voice, lang, rate}` → 回傳 audio/mpeg（或 JSON `{audio: base64}`）。語音：zh-TW-HsiaoChenNeural、zh-CN-XiaoxiaoNeural、en-US-JennyNeural。
- 小智：POST JSON `{system, messages:[{role,content}], max_tokens, lang}` → 可接受 Anthropic 格式 `{content:[{text}]}`，或 `{reply}`／`{text}`／OpenAI `choices` 格式。

## 資料
localStorage 鍵 spf321.v1；「設定與備份」可匯出／匯入。
