# ⚡ RTPS Bihar Autofill

A lightweight Chrome extension built to solve one specific problem: the **[serviceonline.bihar.gov.in](https://serviceonline.bihar.gov.in)** (RTPS) form session times out before you can finish typing everything by hand.

Fill the form once, save it as a **profile**, and refill the entire form — including dropdowns — in one click next time.

As a bonus, it also includes an offline **Image & PDF Compressor** that resizes files to a target KB size.

---

## ✨ Features

### 📝 RTPS Form Autofill
- **Capture** — fills the form manually once, then save the current values (text fields *and* selected dropdown options) as a named profile.
- **Autofill** — reopen the form later, pick a saved profile, and every field — including cascading dropdowns like District → Block → Village — gets filled automatically. The extension waits for AJAX-loaded dropdown options before selecting them.
- **Multiple profiles** — save separate profiles for different certificate types (Caste, Income, Residence, etc.).
- **Export / Import** — download any profile (or all of them) as a JSON file, and import it on another browser/computer.
- **100% local** — all data is stored in `chrome.storage.local` on your own machine. Nothing is sent to any server.

### 🗜️ Image & PDF Compressor
- Set a **target size in KB** for an image or PDF.
- If the target is **smaller** than the original → compresses using quality-preserving binary search (JPEG quality adjustment, with resolution scaling as a fallback for extreme cases).
- If the target is **larger** than the original → losslessly upscales / re-encodes to increase file size without degrading quality.
- PDF compression works by rasterizing each page and rebuilding the PDF — similar to how most online PDF compressors work — entirely offline using bundled `pdf.js` and `pdf-lib`.
- Runs entirely in the browser — no file ever leaves your device.

---

## 📦 Installation (Load Unpacked)

This extension is not published on the Chrome Web Store — install it manually:

1. **Download** this repository as a ZIP (`Code → Download ZIP`) and extract it.
2. Open Chrome and go to `chrome://extensions`
3. Turn on **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the extracted folder
6. Pin the extension icon from the puzzle-piece (🧩) menu for quick access

---

## 🚀 How to Use

### Autofill a form
1. Open the RTPS form and fill it in manually as usual.
2. Click the extension icon → type a profile name → **Is Page Ka Data Capture Karo**.
3. Next time, open the (empty) form, refresh the page, click the extension icon, and hit **Autofill** next to your saved profile.

### Compress a file
1. Click the extension icon → **🗜️ Compressor Tool Kholo**.
2. Choose the Image or PDF tab, drop your file, enter a target size in KB, and click **Compress Karo**.
3. Download the result.

---

## 🔒 Privacy

- No network requests are made by this extension except to the RTPS Bihar site itself (to read/fill form fields).
- All saved profiles and compressed files stay on your device unless you explicitly export/download them.
- The bundled `pdf.js` and `pdf-lib` libraries are included locally — nothing is loaded from a CDN.

---

## 🛠️ Tech

- Manifest V3 Chrome Extension
- Vanilla JavaScript (no build step required)
- [`pdf.js`](https://mozilla.github.io/pdf.js/) for PDF rendering
- [`pdf-lib`](https://pdf-lib.js.org/) for PDF generation

---

## ⚠️ Disclaimer

This is an independent, unofficial tool and is not affiliated with the Government of Bihar or the RTPS/ServicePlus portal. It only automates form-filling using data you provide yourself — it does not bypass any verification, submission, or approval process.

---

## 📄 License

MIT — free to use, modify, and share.
