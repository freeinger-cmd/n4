# N4 日語學習 PWA

JLPT N4 學習 App，支援離線使用，可安裝到手機主畫面。

## 功能
- 📇 **單字抽認卡** — 67個高頻單字 + 記憶技巧（7大主題 + 真題）
- 🔊 **聽力練習** — 聽日文發音猜單字
- ✍️ **文法練習** — て形・た形・ない形・使役形・受身形・ば形
- ⭐ **複習清單** — 自動記錄答錯內容
- 💾 **進度儲存** — 關掉再開不會消失

## 部署步驟（GitHub Pages，免費）

### 第一步：上傳到 GitHub
```bash
git init
git add .
git commit -m "N4 study PWA"
```

去 GitHub 建立新 repository，然後：
```bash
git remote add origin https://github.com/你的帳號/n4-study.git
git push -u origin main
```

### 第二步：開啟 GitHub Pages
1. 進入 repository → Settings
2. 左側選 Pages
3. Source 選 "Deploy from a branch"
4. Branch 選 main / root
5. 儲存後等 1-2 分鐘

你的網址會是：`https://你的帳號.github.io/n4-study/`

### 第三步：加到手機主畫面

**iPhone (Safari)：**
1. 用 Safari 開啟你的網址
2. 點底部「分享」按鈕 
3. 選「加入主畫面」
4. 完成！桌面會出現 App 圖示

**Android (Chrome)：**
1. 用 Chrome 開啟你的網址
2. 右上角「⋮」→「安裝應用程式」
3. 或等待自動出現安裝橫幅

## 新增單字方法

打開 `src/data.js`，在 `VOCAB` 陣列中新增：
```javascript
{jp:'新單字', rd:'よみかた', mn:'中文意思', mem:'記憶技巧', ex:'例句。', tag:'tq'},
```

tag 可以是：t1(日常生活) t2(工作學校) t3(身體健康)
           t4(情緒個性) t5(交通移動) t6(購物金錢)
           t7(時間行程) tq(真題)

改完之後 `git add . && git commit -m "新增單字" && git push` 即可更新。

## 本地測試
```bash
# 需要 http server（不能直接開 index.html，PWA 需要 http）
npx serve .
# 或
python3 -m http.server 8080
```
然後開 http://localhost:8080
