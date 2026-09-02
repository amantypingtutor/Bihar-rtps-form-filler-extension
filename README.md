# ⚡ RTPS Bihar Autofill

> **"Log kehte hain form bhar lo manually... main kehta hoon — ek click mein ho jaata hai."**
> — *Built by Aman Kumar, CEO & Founder, Aman Typing Tutor*

---

<div align="center">

### 🔥 One Extension. One Click. Zero Timeout. 🔥

**[serviceonline.bihar.gov.in](https://serviceonline.bihar.gov.in)** ka form kabhi bhi timeout nahi karega ab.
The RTPS portal form will never beat you with a timeout again.

*Built different. Built local. Built by Bihar, for Bihar.* 🦁

</div>

---

## 🌐 English

### What is this?

The **RTPS Bihar Autofill** Chrome Extension was built to solve one specific, painful problem:
the [serviceonline.bihar.gov.in](https://serviceonline.bihar.gov.in) form **times out** before you can finish typing everything by hand.

Fill the form once, save it as a **profile**, and refill the entire form — including all dropdowns — in **one click** next time.

Bonus: It also packs an offline **Image & PDF Compressor** that crushes your files to a target KB size — no internet, no uploads, no nonsense.

---

### ✨ Features

#### 📝 RTPS Form Autofill
- **Capture** — Fill the form manually once, then save all field values (text fields *and* dropdown selections) as a named profile.
- **Autofill** — Reopen the form later, pick a saved profile, and every single field — including cascading dropdowns like **District → Block → Village** — gets filled automatically. The extension waits for AJAX-loaded dropdown options before selecting them.
- **Multiple profiles** — Save separate profiles for different certificate types: Caste, Income, Residence, and more.
- **Export / Import** — Download any profile (or all of them) as a JSON file. Import on another browser or computer in seconds.
- **100% local** — All data lives in `chrome.storage.local` on your machine. Nothing ever goes to any server.

#### 🗜️ Image & PDF Compressor
- Set a **target size in KB** for any image or PDF.
- If target is **smaller** than original → compresses using quality-preserving binary search (JPEG quality adjustment + resolution scaling as fallback for extreme cases).
- If target is **larger** than original → losslessly upscales / re-encodes to hit the target size without hurting quality.
- PDF compression rasterizes each page and rebuilds the PDF — exactly how top online compressors work — but **entirely offline** using bundled `pdf.js` and `pdf-lib`.
- Your file never leaves your device. Period.

---

### 📦 Installation (Load Unpacked)

This extension is not on the Chrome Web Store. Install it manually in 5 steps:

1. **Download** this repo as a ZIP (`Code → Download ZIP`) and extract it.
2. Open Chrome → go to `chrome://extensions`
3. Turn on **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the extracted folder
6. Pin the extension via the 🧩 puzzle-piece menu for quick access

---

### 🚀 How to Use

**Autofill a Form:**
1. Open the RTPS form and fill it in manually as usual.
2. Click the extension icon → type a profile name → hit **"Is Page Ka Data Capture Karo"**.
3. Next time: open the empty form → click the extension → hit **Autofill** next to your saved profile. Done.

**Compress a File:**
1. Click the extension icon → **"🗜️ Compressor Tool Kholo"**
2. Choose Image or PDF tab → drop your file → set target KB → click **"Compress Karo"**
3. Download the output.

---

### 🔒 Privacy

- Zero network requests — except to the RTPS Bihar site itself (to read and fill fields).
- All saved profiles and compressed files stay on your device unless *you* export them.
- `pdf.js` and `pdf-lib` are bundled locally — nothing loaded from any CDN.

---

### 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Extension | Manifest V3, Vanilla JavaScript |
| PDF Rendering | [`pdf.js`](https://mozilla.github.io/pdf.js/) |
| PDF Generation | [`pdf-lib`](https://pdf-lib.js.org/) |
| Build step | None (zero dependencies to install) |

---

### ⚠️ Disclaimer

This is an **independent, unofficial tool** — not affiliated with the Government of Bihar, RTPS, or the ServicePlus portal in any way. It only automates form-filling using data *you* provide yourself. It does not bypass any verification, submission, or approval process.

---

### 📄 License

**MIT** — Free to use, modify, and share.

---

## 🌸 हिंदी / Hinglish

### यह क्या है?

**RTPS Bihar Autofill** Chrome Extension एक ही problem को solve करने के लिए बना है:
[serviceonline.bihar.gov.in](https://serviceonline.bihar.gov.in) का form बीच में **timeout** हो जाता है — जब तक सब manually type करो, session खत्म।

बस एक बार form भरो, **profile** save करो, और अगली बार पूरा form — सभी dropdowns समेत — **एक click में** भर जाएगा।

Bonus में एक offline **Image & PDF Compressor** भी है जो आपकी file को मनचाहे KB size में compress कर देता है — बिना internet, बिना upload, बिना झंझट।

---

### ✨ Features

#### 📝 RTPS Form Autofill
- **Capture** — एक बार form manually भरो, फिर सारे fields (text और dropdown दोनों) को एक profile में save करो।
- **Autofill** — अगली बार form खोलो, profile चुनो, और हर field — District → Block → Village जैसे cascading dropdowns भी — automatically भर जाएंगे। Extension AJAX-loaded dropdown options का इंतज़ार करके सही option select करती है।
- **Multiple profiles** — अलग-अलग certificates के लिए अलग profiles: Caste, Income, Residence, जो चाहो।
- **Export / Import** — कोई भी profile (या सब) JSON file में download करो। दूसरे browser या computer पर seconds में import करो।
- **100% local** — सारा data `chrome.storage.local` में तुम्हारे device पर रहता है। कोई server नहीं जाता कुछ भी।

#### 🗜️ Image & PDF Compressor
- Image या PDF के लिए **target size KB में** set करो।
- अगर target **original से छोटा** है → quality-preserving binary search से compress होगा (JPEG quality + resolution scaling)।
- अगर target **original से बड़ा** है → losslessly upscale/re-encode करेगा बिना quality घटाए।
- PDF compression हर page को rasterize करके नया PDF बनाता है — बिल्कुल वैसे जैसे बड़े online compressors करते हैं — पर पूरा **offline**, bundled `pdf.js` और `pdf-lib` से।
- तुम्हारी file कभी device से बाहर नहीं जाती।

---

### 📦 Installation (Load Unpacked)

यह extension Chrome Web Store पर नहीं है। 5 steps में manually install करो:

1. इस repo को ZIP में **Download** करो (`Code → Download ZIP`) और extract करो।
2. Chrome खोलो → `chrome://extensions` पर जाओ।
3. **Developer mode** ON करो (top-right toggle)।
4. **Load unpacked** click करो।
5. Extract किया हुआ folder select करो।
6. 🧩 puzzle-piece menu से extension pin करो quick access के लिए।

---

### 🚀 कैसे Use करें

**Form Autofill:**
1. RTPS form खोलो और manually भरो जैसे हमेशा भरते हो।
2. Extension icon click करो → profile name type करो → **"Is Page Ka Data Capture Karo"** press करो।
3. अगली बार: खाली form खोलो → extension click करो → **Autofill** press करो। हो गया।

**File Compress:**
1. Extension icon click करो → **"🗜️ Compressor Tool Kholo"**।
2. Image या PDF tab choose करो → file drop करो → target KB डालो → **"Compress Karo"** click करो।
3. Download करो।

---

### 🔒 Privacy

- कोई network request नहीं — सिर्फ RTPS Bihar site से (form fields पढ़ने और भरने के लिए)।
- Saved profiles और compressed files तुम्हारे device पर रहते हैं जब तक तुम खुद export न करो।
- `pdf.js` और `pdf-lib` locally bundled हैं — कोई CDN नहीं।

---

### ⚠️ Disclaimer

यह एक **unofficial, independent tool** है — Government of Bihar, RTPS, या ServicePlus portal से इसका कोई संबंध नहीं है। यह सिर्फ उस data से form fill करता है जो तुमने खुद दिया है। यह किसी verification, submission, या approval process को bypass नहीं करता।

---

### 📄 License

**MIT** — Free to use, free to modify, free to share.

---

<div align="center">

---

## 👑 Built By

```
 █████╗ ███╗   ███╗ █████╗ ███╗   ██╗
██╔══██╗████╗ ████║██╔══██╗████╗  ██║
███████║██╔████╔██║███████║██╔██╗ ██║
██╔══██║██║╚██╔╝██║██╔══██║██║╚██╗██║
██║  ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║
╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

### 🦁 Aman Kumar
**CEO & Founder — [Aman Typing Tutor](https://amantypingtutor.com)**


 🔥

**Aman Typing Tutor** — India's fastest-growing typing practice platform.
Built solo. Shipped daily. Running on discipline.

---

*"Jab sab log form timeout se pareshan the, maine extension bana di."* ⚡

</div>
