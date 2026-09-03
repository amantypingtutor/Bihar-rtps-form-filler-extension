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

**RTPS Bihar Autofill** started as a Chrome Extension built to solve one specific, painful problem: the [serviceonline.bihar.gov.in](https://serviceonline.bihar.gov.in) form **times out** before you can finish typing everything by hand.

Fill the form once, save it as a **profile**, and refill the entire form — including all dropdowns — in **one click** next time.

It has since grown into a full offline document toolkit: an **Image & PDF Compressor**, a **Front+Back Document Creator**, an **Image → PDF converter**, a **PDF Merger**, and an **Image Merger** — all running locally in your browser, no uploads, no internet required.

---

### ✨ Features

#### 📝 RTPS Form Autofill
- **Capture** — Fill the form manually once, then save all field values (text fields *and* dropdown selections) as a named profile.
- **Autofill** — Reopen the form later, pick a saved profile, and every single field — including cascading dropdowns like **District → Block → Village** — gets filled automatically. The extension waits for AJAX-loaded dropdown options before selecting them.
- **Multiple profiles** — Save separate profiles for different certificate types: Caste, Income, Residence, and more.
- **Export / Import** — Download any profile (or all of them) as a JSON file. Import on another browser or computer in seconds.
- **Email a profile** — Downloads the profile JSON and opens Gmail compose pre-filled, ready to attach and send.
- **100% local** — All data lives in `chrome.storage.local` on your machine. Nothing ever goes to any server.

#### 🗜️ Image & PDF Compressor
- Set a **target size in KB** for any image or PDF — or leave it blank for best-quality/original output.
- Quality-preserving strategy: keeps JPEG quality in a safe, artifact-free range first; only reduces resolution slightly (barely noticeable) rather than nuking quality (very noticeable) when a smaller target demands it.
- If target is **larger** than original → losslessly upscales / re-encodes to hit the target size without hurting quality.
- PDF compression rasterizes each page and rebuilds the PDF — exactly how top online compressors work — but **entirely offline** using bundled `pdf.js` and `pdf-lib`.
- **Download Original** button always available alongside the compressed version.

#### 🪪 Front + Back Document Creator
- Upload a **Front** image and a **Back** image (e.g. Aadhaar, ID card).
- Built-in **crop tool** — drag directly on the image to select and crop each side independently.
- Both sides get arranged on a single blank **A4 page**, labeled "FRONT SIDE" / "BACK SIDE" — just like a printed ID document.
- Set a target KB size (or leave blank for original quality) and download as **JPEG, PNG, or PDF** — three independent export options.

#### 🖼️➡️📄 Image → PDF
- Convert any image (JPEG/PNG) into a PDF.
- Shows original image size before you choose a target KB for the output PDF.
- Leave target blank for best-quality conversion.

#### 📑 Merge PDF
- Combine multiple PDFs into one, in whatever order you arrange them (↑/↓ reorder controls).
- Merge at **original quality** (perfect, lossless — pages are copied directly) or set a target KB to compress the merged result.

#### 🧩 Image Merger
- Combine multiple images into a single image — vertical stack or horizontal stack layout.
- Export as JPEG, PNG, or PDF, with the same target-KB / original-quality choice as everywhere else.

---

### 📦 Installation

**Desktop (Chrome / Edge on Windows, Mac, Linux):**
1. Download `rtps-autofill.zip` from this repo and extract it — *or* download the whole repo as ZIP (`Code → Download ZIP`).
2. Go to `chrome://extensions`, turn on **Developer mode**.
3. Click **Load unpacked** → select the extracted folder.
4. Pin the extension via the 🧩 puzzle-piece menu for quick access.

**Android phone:**
Mobile Chrome doesn't support extensions at all. Use **Microsoft Edge Canary** instead:
1. Install **Microsoft Edge Canary** from the Play Store.
2. Open it → Settings → About Microsoft Edge → tap the version number 5 times to unlock **Developer Options**.
3. Settings → Developer Options → **"Extension install by crx"**.
4. Select `rtps-autofill.crx` from this repo.

**No install at all — just use the website:**
The Compressor & Document tools also run as a plain website (works on *any* device/browser, no extension needed): open `index.html` from this repo, or the GitHub Pages URL if one is set up for this repo.

---

### 🚀 How to Use

**Autofill a Form:**
1. Open the RTPS form and fill it in manually as usual.
2. Click the extension icon → type a profile name → hit **"Is Page Ka Data Capture Karo"**.
3. Next time: open the empty form → refresh → click the extension → hit **Autofill** next to your saved profile. Done.

**Compress / Convert / Merge a File:**
1. Click the extension icon → **"🗜️ Compressor Tool Kholo"** (or open `compressor.html` / the website directly).
2. Pick the relevant tab (Image, PDF, Front+Back, Image→PDF, Merge PDF, or Image Merger).
3. Upload your file(s), optionally set a target KB, and download.

---

### 🔒 Privacy

- Zero network requests — except to the RTPS Bihar site itself (to read and fill fields).
- All saved profiles and compressed files stay on your device unless *you* export or email them.
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

## 🌸 Hinglish

### Ye hai kya?

**RTPS Bihar Autofill** shuru hua tha ek Chrome Extension ke roop mein, jo ek khaas problem solve karta hai: [serviceonline.bihar.gov.in](https://serviceonline.bihar.gov.in) ka form **timeout** ho jata hai isse pehle ki sab kuch manually type ho paaye.

Form ek baar bharo, ek **profile** ke roop mein save karo, aur agli baar pura form — sabhi dropdowns samet — **ek click mein** bhar jayega.

Ab isme ek pura offline document toolkit bhi jud gaya hai: **Image & PDF Compressor**, **Front+Back Document Creator**, **Image → PDF converter**, **PDF Merger**, aur **Image Merger** — sab kuch tumhare browser ke andar hi local chalta hai, koi upload nahi, koi internet nahi chahiye.

---

### ✨ Features

#### 📝 RTPS Form Autofill
- **Capture** — Form ko ek baar manually bharo, phir sabhi field values (typed text *aur* dropdown selections) ko naam dekar profile ke roop mein save karo.
- **Autofill** — Baad mein form dubara kholo, saved profile choose karo, aur sabhi fields — **District → Block → Village** jaise cascading dropdowns samet — automatically bhar jayenge. Extension AJAX se load hone wale dropdown options ka wait karta hai unhe select karne se pehle.
- **Multiple profiles** — Alag-alag certificate types (Caste, Income, Residence, etc.) ke liye alag profiles save karo.
- **Export / Import** — Kisi bhi profile (ya sabhi) ko JSON file mein download karo. Dusre browser/computer mein seconds mein import karo.
- **Email a profile** — Profile ka JSON download hota hai aur Gmail compose khul jaata hai, subject/body pehle se bhara hua, attach karke bhej do.
- **100% local** — Sara data `chrome.storage.local` mein tumhare apne machine par rehta hai. Kuch bhi kisi server par nahi jaata.

#### 🗜️ Image & PDF Compressor
- Kisi bhi image ya PDF ke liye **target size KB mein** set karo — ya khali chhodo best-quality/original output ke liye.
- Quality-preserving strategy: pehle JPEG quality ko ek safe, artifact-free range mein rakhta hai; jab chota target chahiye ho to quality bahut kam karne (jo bahut noticeable hota hai) ke bajaye resolution thodi si kam karta hai (jo mushkil se noticeable hota hai).
- Agar target **original se bada** hai → quality kharab kiye bina lossless upscale/re-encode karke size badhata hai.
- PDF compression har page ko rasterize karke naya PDF banata hai — bilkul jaisa top online compressors karte hain — lekin poori tarah **offline**, bundled `pdf.js` aur `pdf-lib` se.
- **Download Original** button hamesha compressed version ke saath available rehta hai.

#### 🪪 Front + Back Document Creator
- Ek **Front** image aur ek **Back** image upload karo (jaise Aadhaar, ID card).
- Built-in **crop tool** — image par seedha drag karke har side ko alag-alag crop select/karo.
- Dono sides ek blank **A4 page** par arrange ho jaati hain, "FRONT SIDE" / "BACK SIDE" label ke saath — bilkul jaise printed ID document hota hai.
- Target KB size set karo (ya khali chhodo original quality ke liye) aur **JPEG, PNG, ya PDF** — teeno alag export options mein download karo.

#### 🖼️➡️📄 Image → PDF
- Kisi bhi image (JPEG/PNG) ko PDF mein convert karo.
- Output PDF ke liye target KB choose karne se pehle original image size dikhata hai.
- Best-quality conversion ke liye target khali chhod do.

#### 📑 Merge PDF
- Multiple PDFs ko ek mein combine karo, jis order mein tum arrange karo usi order mein (↑/↓ reorder controls).
- **Original quality** mein merge karo (perfect, lossless — pages directly copy hoti hain) ya target KB set karke merged result ko compress karo.

#### 🧩 Image Merger
- Multiple images ko ek single image mein combine karo — vertical stack ya horizontal stack layout.
- JPEG, PNG, ya PDF ke roop mein export karo, sab jagah jaisa hi target-KB / original-quality choice ke saath.

---

### 📦 Installation

**Desktop (Windows, Mac, Linux par Chrome/Edge):**
1. Is repo se `rtps-autofill.zip` download karke extract karo — *ya* poora repo ZIP mein download karo (`Code → Download ZIP`).
2. `chrome://extensions` par jao, **Developer mode** ON karo.
3. **Load unpacked** dabao → extract ki hui folder select karo.
4. 🧩 puzzle-piece menu se extension pin kar do quick access ke liye.

**Android phone:**
Mobile Chrome extensions support hi nahi karta. Iske liye **Microsoft Edge Canary** use karo:
1. Play Store se **Microsoft Edge Canary** install karo.
2. Kholo → Settings → About Microsoft Edge → version number 5 baar tap karo (**Developer Options** unlock ho jayega).
3. Settings → Developer Options → **"Extension install by crx"**.
4. Is repo se `rtps-autofill.crx` select karo.

**Bina install kiye — seedha website use karo:**
Compressor & Document tools ek normal website ki tarah bhi chalte hain (kisi bhi device/browser par, extension ki zaroorat nahi): is repo se `index.html` kholo, ya agar is repo ke liye GitHub Pages URL set hai to wahi.

---

### 🚀 Kaise Use Karein

**Form Autofill:**
1. RTPS form kholo aur normally manually bharo.
2. Extension icon click karo → profile ka naam likho → **"Is Page Ka Data Capture Karo"** dabao.
3. Agli baar: khali form kholo → refresh karo → extension click karo → apne saved profile ke saamne **Autofill** dabao. Ho gaya.

**File Compress / Convert / Merge karna:**
1. Extension icon click karo → **"🗜️ Compressor Tool Kholo"** (ya `compressor.html` / website seedha kholo).
2. Relevant tab choose karo (Image, PDF, Front+Back, Image→PDF, Merge PDF, ya Image Merger).
3. Apni file(s) upload karo, chaho to target KB set karo, aur download karo.

---

### 🔒 Privacy

- RTPS Bihar site ke alawa (form fields padhne/bharne ke liye) koi bhi network request nahi.
- Saved profiles aur compressed files tumhare device par hi rehti hain, jab tak tum khud unhe export ya email na karo.
- `pdf.js` aur `pdf-lib` locally bundled hain — kuch bhi CDN se load nahi hota.

---

### ⚠️ Disclaimer

Ye ek **independent, unofficial tool** hai — Government of Bihar, RTPS, ya ServicePlus portal se koi sambandh nahi. Ye sirf tumhare khud diye hue data se form-filling automate karta hai. Ye kisi bhi verification, submission, ya approval process ko bypass nahi karta.

---

### 📄 License

**MIT** — Free to use, modify, aur share karne ke liye.

---

## 🕉️ हिंदी

### यह क्या है?

**RTPS Bihar Autofill** की शुरुआत एक Chrome Extension के रूप में हुई थी, जो एक खास समस्या हल करने के लिए बनाया गया: [serviceonline.bihar.gov.in](https://serviceonline.bihar.gov.in) का फॉर्म हाथ से सब कुछ टाइप करते-करते **टाइमआउट** हो जाता है।

फॉर्म एक बार भरो, उसे एक **प्रोफाइल** के रूप में सेव करो, और अगली बार पूरा फॉर्म — सभी ड्रॉपडाउन समेत — **एक क्लिक में** भर जाएगा।

अब इसमें एक पूरा ऑफलाइन दस्तावेज़ टूलकिट भी जुड़ गया है: **Image & PDF Compressor**, **Front+Back Document Creator**, **Image → PDF Converter**, **PDF Merger**, और **Image Merger** — यह सब आपके ब्राउज़र के अंदर ही, बिना इंटरनेट के, स्थानीय रूप से चलता है।

---

### ✨ विशेषताएं (Features)

#### 📝 RTPS फॉर्म ऑटोफिल
- **Capture** — फॉर्म को एक बार हाथ से भरो, फिर सभी field values (टाइप किए गए text और dropdown selections दोनों) को नाम देकर एक प्रोफाइल में सेव करो।
- **Autofill** — बाद में फॉर्म दोबारा खोलो, सेव की हुई प्रोफाइल चुनो, और हर field — District → Block → Village जैसे cascading dropdowns समेत — अपने आप भर जाएगी। Extension AJAX से लोड होने वाले dropdown options का इंतज़ार करता है, तब जाकर सही विकल्प चुनता है।
- **Multiple Profiles** — अलग-अलग प्रमाणपत्रों (जाति, आय, निवास, आदि) के लिए अलग-अलग प्रोफाइल सेव करो।
- **Export / Import** — किसी भी प्रोफाइल (या सभी) को JSON फ़ाइल के रूप में डाउनलोड करो। किसी दूसरे ब्राउज़र या कंप्यूटर में सेकंडों में import करो।
- **Email करना** — प्रोफाइल की JSON फ़ाइल डाउनलोड होती है और Gmail compose पहले से भरा हुआ खुल जाता है, बस attach करके भेज दो।
- **100% स्थानीय (Local)** — सारा डेटा `chrome.storage.local` में आपकी अपनी मशीन पर रहता है। कुछ भी किसी सर्वर पर नहीं जाता।

#### 🗜️ Image और PDF Compressor
- किसी भी image या PDF के लिए **target size KB में** सेट करो — या खाली छोड़ दो सबसे अच्छी गुणवत्ता (original) के लिए।
- गुणवत्ता-सुरक्षित तरीका: पहले JPEG quality को एक सुरक्षित, बिना धब्बे वाले दायरे में रखता है; जब छोटा target चाहिए हो तो quality बहुत कम करने (जो साफ दिखता है) की बजाय resolution थोड़ी सी कम करता है (जो मुश्किल से दिखता है)।
- अगर target **original से बड़ा** है → गुणवत्ता खराब किए बिना lossless upscale/re-encode करके size बढ़ाता है।
- PDF compression हर page को rasterize करके नया PDF बनाता है — बिल्कुल वैसे जैसे बड़े online compressor tools करते हैं — लेकिन पूरी तरह **offline**, बंडल किए गए `pdf.js` और `pdf-lib` से।
- **Download Original** बटन हमेशा compressed version के साथ उपलब्ध रहता है।

#### 🪪 Front + Back Document Creator
- एक **Front** image और एक **Back** image अपलोड करो (जैसे आधार कार्ड, ID card)।
- Built-in **crop tool** — image पर सीधे drag करके हर side को अलग-अलग crop करो।
- दोनों sides एक खाली **A4 page** पर व्यवस्थित हो जाती हैं, "FRONT SIDE" / "BACK SIDE" लेबल के साथ — बिल्कुल जैसे प्रिंट किया हुआ ID document होता है।
- Target KB size सेट करो (या खाली छोड़ दो original quality के लिए) और **JPEG, PNG, या PDF** — तीनों अलग-अलग विकल्पों में डाउनलोड करो।

#### 🖼️➡️📄 Image से PDF
- किसी भी image (JPEG/PNG) को PDF में बदलो।
- Output PDF के लिए target KB चुनने से पहले original image का size दिखाता है।
- सबसे अच्छी गुणवत्ता के लिए target खाली छोड़ दो।

#### 📑 PDF मर्ज करना
- कई PDFs को एक में जोड़ो, जिस क्रम में आप उन्हें व्यवस्थित करें (↑/↓ बटन से क्रम बदलें)।
- **Original quality** में मर्ज करो (एकदम सही, कोई नुकसान नहीं — pages सीधे copy होते हैं) या target KB सेट करके मर्ज किए गए result को compress करो।

#### 🧩 Image Merger
- कई images को एक ही image में जोड़ो — vertical stack या horizontal stack layout में।
- JPEG, PNG, या PDF के रूप में export करो, बाकी सभी tools जैसे ही target-KB / original-quality विकल्प के साथ।

---

### 📦 इंस्टॉलेशन

**डेस्कटॉप (Windows, Mac, Linux पर Chrome/Edge):**
1. इस repo से `rtps-autofill.zip` डाउनलोड करके extract करो — *या* पूरा repo ZIP में डाउनलोड करो (`Code → Download ZIP`)।
2. `chrome://extensions` पर जाओ, **Developer mode** ON करो।
3. **Load unpacked** दबाओ → extract की हुई folder select करो।
4. 🧩 puzzle-piece मेनू से extension pin कर दो जल्दी access के लिए।

**Android फोन:**
Mobile Chrome extensions support ही नहीं करता। इसके लिए **Microsoft Edge Canary** इस्तेमाल करो:
1. Play Store से **Microsoft Edge Canary** इंस्टॉल करो।
2. खोलो → Settings → About Microsoft Edge → version number को 5 बार tap करो (**Developer Options** unlock हो जाएगा)।
3. Settings → Developer Options → **"Extension install by crx"**।
4. इस repo से `rtps-autofill.crx` select करो।

**बिना इंस्टॉल किए — सीधे website इस्तेमाल करो:**
Compressor और Document tools एक साधारण website की तरह भी चलते हैं (किसी भी device/browser पर, extension की जरूरत नहीं): इस repo से `index.html` खोलो, या अगर इस repo के लिए GitHub Pages URL सेट है तो वही।

---

### 🚀 कैसे इस्तेमाल करें

**फॉर्म ऑटोफिल:**
1. RTPS फॉर्म खोलो और हमेशा की तरह हाथ से भरो।
2. Extension icon पर click करो → प्रोफाइल का नाम लिखो → **"Is Page Ka Data Capture Karo"** दबाओ।
3. अगली बार: खाली फॉर्म खोलो → refresh करो → extension पर click करो → अपनी सेव की हुई प्रोफाइल के सामने **Autofill** दबाओ। हो गया।

**File Compress / Convert / Merge करना:**
1. Extension icon पर click करो → **"🗜️ Compressor Tool Kholo"** (या `compressor.html` / website सीधे खोलो)।
2. संबंधित tab चुनो (Image, PDF, Front+Back, Image→PDF, Merge PDF, या Image Merger)।
3. अपनी फ़ाइल(एं) अपलोड करो, चाहो तो target KB सेट करो, और डाउनलोड करो।

---

### 🔒 Privacy (गोपनीयता)

- RTPS Bihar साइट के अलावा (form fields पढ़ने/भरने के लिए) कोई भी network request नहीं होती।
- Saved profiles और compressed files आपके device पर ही रहती हैं, जब तक आप खुद उन्हें export या email न करें।
- `pdf.js` और `pdf-lib` locally बंडल किए गए हैं — कुछ भी किसी CDN से load नहीं होता।

---

### ⚠️ अस्वीकरण (Disclaimer)

यह एक **स्वतंत्र, गैर-आधिकारिक उपकरण (independent, unofficial tool)** है — इसका बिहार सरकार, RTPS, या ServicePlus portal से कोई संबंध नहीं है। यह केवल आपके द्वारा दिए गए डेटा से फॉर्म भरना automate करता है। यह किसी भी verification, submission, या approval प्रक्रिया को bypass नहीं करता।

---

### 📄 लाइसेंस

**MIT** — इस्तेमाल करने, बदलने, और शेयर करने के लिए स्वतंत्र।

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
**CEO & Founder — [Aman Typing Tutor](https://aman-typing-tutor.vercel.app)**

🔥

**Aman Typing Tutor** — India's fastest-growing typing practice platform.
Built solo. Shipped daily. Running on discipline.

---

*"Jab sab log form timeout se pareshan the, maine extension bana di."* ⚡

</div>
