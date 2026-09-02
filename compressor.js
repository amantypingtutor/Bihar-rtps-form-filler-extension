// ============ Shared helpers ============

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function setupDropZone(dropEl, inputEl, onFile) {
  dropEl.addEventListener("click", () => inputEl.click());
  dropEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropEl.classList.add("dragover");
  });
  dropEl.addEventListener("dragleave", () => dropEl.classList.remove("dragover"));
  dropEl.addEventListener("drop", (e) => {
    e.preventDefault();
    dropEl.classList.remove("dragover");
    if (e.dataTransfer.files.length) onFile(e.dataTransfer.files[0]);
  });
  inputEl.addEventListener("change", () => {
    if (inputEl.files.length) onFile(inputEl.files[0]);
  });
}

// ============ Tabs ============

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  });
});

// ============ IMAGE COMPRESSOR ============

let selectedImageFile = null;

const imageDrop = document.getElementById("imageDrop");
const imageInput = document.getElementById("imageInput");
const imageFileInfo = document.getElementById("imageFileInfo");
const imageTargetKb = document.getElementById("imageTargetKb");
const imageCompressBtn = document.getElementById("imageCompressBtn");
const imageProgressWrap = document.getElementById("imageProgressWrap");
const imageProgressFill = document.getElementById("imageProgressFill");
const imageProgressLabel = document.getElementById("imageProgressLabel");
const imageResultBox = document.getElementById("imageResultBox");
const imageOrigSize = document.getElementById("imageOrigSize");
const imageFinalSize = document.getElementById("imageFinalSize");
const imageTargetSizeShown = document.getElementById("imageTargetSizeShown");
const imagePreview = document.getElementById("imagePreview");
const imageDownloadBtn = document.getElementById("imageDownloadBtn");

setupDropZone(imageDrop, imageInput, (file) => {
  selectedImageFile = file;
  imageFileInfo.style.display = "block";
  imageFileInfo.textContent = `📄 ${file.name} — ${formatBytes(file.size)}`;
  imageCompressBtn.disabled = false;
  imageResultBox.style.display = "none";
});

function loadImageEl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function drawToCanvas(img, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

// Shrink: binary search JPEG quality, and if still too big at min quality, downscale resolution too.
async function shrinkImageToTarget(img, targetBytes, onProgress) {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  let bestBlob = null;

  async function searchQualityAt(w, h, steps) {
    let low = 0.05, high = 0.95, localBest = null;
    const canvas = drawToCanvas(img, w, h);
    for (let i = 0; i < steps; i++) {
      const mid = (low + high) / 2;
      const blob = await canvasToBlob(canvas, "image/jpeg", mid);
      if (!localBest || Math.abs(blob.size - targetBytes) < Math.abs(localBest.size - targetBytes)) {
        localBest = blob;
      }
      if (blob.size > targetBytes) high = mid; else low = mid;
    }
    return localBest;
  }

  bestBlob = await searchQualityAt(width, height, 8);
  onProgress && onProgress(0.5);

  // If still noticeably above target even at low quality, reduce resolution progressively.
  if (bestBlob.size > targetBytes * 1.15) {
    const scales = [0.85, 0.7, 0.55, 0.4, 0.25];
    for (let i = 0; i < scales.length; i++) {
      const s = scales[i];
      const candidate = await searchQualityAt(width * s, height * s, 6);
      onProgress && onProgress(0.5 + ((i + 1) / scales.length) * 0.5);
      if (Math.abs(candidate.size - targetBytes) < Math.abs(bestBlob.size - targetBytes)) {
        bestBlob = candidate;
      }
      if (candidate.size <= targetBytes * 1.08) break;
    }
  }

  onProgress && onProgress(1);
  return bestBlob;
}

// Grow: lossless PNG first, then upscale resolution (no quality lost, just more pixel data) until target reached.
async function growImageToTarget(img, targetBytes, onProgress) {
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  let canvas = drawToCanvas(img, width, height);
  let bestBlob = await canvasToBlob(canvas, "image/png");
  onProgress && onProgress(0.15);

  if (bestBlob.size >= targetBytes) return bestBlob;

  let scale = 1;
  const maxIterations = 10;
  for (let i = 0; i < maxIterations; i++) {
    scale += 0.5;
    const w = width * scale;
    const h = height * scale;
    if (w * h > 60000000) break; // safety cap to avoid crashing the tab
    const c = drawToCanvas(img, w, h);
    const b = await canvasToBlob(c, "image/png");
    onProgress && onProgress(0.15 + ((i + 1) / maxIterations) * 0.85);
    bestBlob = b;
    if (b.size >= targetBytes) break;
  }

  return bestBlob;
}

imageCompressBtn.addEventListener("click", async () => {
  if (!selectedImageFile) return;
  const targetKb = parseFloat(imageTargetKb.value);
  if (!targetKb || targetKb <= 0) {
    alert("Pehle target size (KB) likho");
    return;
  }
  const targetBytes = targetKb * 1024;

  imageCompressBtn.disabled = true;
  imageProgressWrap.style.display = "block";
  imageResultBox.style.display = "none";
  imageProgressFill.style.width = "0%";
  imageProgressLabel.textContent = "Image load ho rahi hai...";

  try {
    const img = await loadImageEl(selectedImageFile);
    const onProgress = (p) => {
      imageProgressFill.style.width = Math.round(p * 100) + "%";
      imageProgressLabel.textContent = `Processing... ${Math.round(p * 100)}%`;
    };

    let resultBlob;
    if (targetBytes < selectedImageFile.size) {
      imageProgressLabel.textContent = "Size kam ki ja rahi hai...";
      resultBlob = await shrinkImageToTarget(img, targetBytes, onProgress);
    } else {
      imageProgressLabel.textContent = "Size badhayi ja rahi hai...";
      resultBlob = await growImageToTarget(img, targetBytes, onProgress);
    }

    imageOrigSize.textContent = formatBytes(selectedImageFile.size);
    imageFinalSize.textContent = formatBytes(resultBlob.size);
    imageTargetSizeShown.textContent = formatBytes(targetBytes);

    const url = URL.createObjectURL(resultBlob);
    imagePreview.src = url;
    const ext = resultBlob.type === "image/png" ? "png" : "jpg";
    imageDownloadBtn.href = url;
    imageDownloadBtn.download = `compressed.${ext}`;

    imageResultBox.className = "result-box";
    imageResultBox.style.display = "block";
  } catch (err) {
    console.error(err);
    imageResultBox.className = "result-box error";
    imageResultBox.style.display = "block";
    imageOrigSize.textContent = "-";
    imageFinalSize.textContent = "Error: " + err.message;
  } finally {
    imageProgressWrap.style.display = "none";
    imageCompressBtn.disabled = false;
  }
});

// ============ PDF COMPRESSOR ============

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "libs/pdf.worker.min.js";
}

let selectedPdfFile = null;

const pdfDrop = document.getElementById("pdfDrop");
const pdfInput = document.getElementById("pdfInput");
const pdfFileInfo = document.getElementById("pdfFileInfo");
const pdfTargetKb = document.getElementById("pdfTargetKb");
const pdfCompressBtn = document.getElementById("pdfCompressBtn");
const pdfProgressWrap = document.getElementById("pdfProgressWrap");
const pdfProgressFill = document.getElementById("pdfProgressFill");
const pdfProgressLabel = document.getElementById("pdfProgressLabel");
const pdfResultBox = document.getElementById("pdfResultBox");
const pdfOrigSize = document.getElementById("pdfOrigSize");
const pdfFinalSize = document.getElementById("pdfFinalSize");
const pdfTargetSizeShown = document.getElementById("pdfTargetSizeShown");
const pdfDownloadBtn = document.getElementById("pdfDownloadBtn");

setupDropZone(pdfDrop, pdfInput, (file) => {
  selectedPdfFile = file;
  pdfFileInfo.style.display = "block";
  pdfFileInfo.textContent = `📄 ${file.name} — ${formatBytes(file.size)}`;
  pdfCompressBtn.disabled = false;
  pdfResultBox.style.display = "none";
});

async function renderPageToJpeg(pdfPage, renderScale, quality) {
  const viewport = pdfPage.getViewport({ scale: renderScale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await pdfPage.render({ canvasContext: ctx, viewport }).promise;
  const blob = await canvasToBlob(canvas, "image/jpeg", quality);
  const arrayBuffer = await blob.arrayBuffer();
  return arrayBuffer;
}

async function buildPdfFromRenderedPages(pageDataList) {
  const { PDFDocument } = PDFLib;
  const newPdf = await PDFDocument.create();
  for (const pageData of pageDataList) {
    const jpgImage = await newPdf.embedJpg(pageData.jpegBytes);
    const page = newPdf.addPage([pageData.ptWidth, pageData.ptHeight]);
    page.drawImage(jpgImage, { x: 0, y: 0, width: pageData.ptWidth, height: pageData.ptHeight });
  }
  return await newPdf.save();
}

async function tryPdfTrial(pdfDoc, basePageDims, renderScale, quality, onProgress) {
  const pageDataList = [];
  for (let i = 0; i < basePageDims.length; i++) {
    const page = await pdfDoc.getPage(i + 1);
    const jpegBytes = await renderPageToJpeg(page, renderScale, quality);
    pageDataList.push({
      jpegBytes,
      ptWidth: basePageDims[i].width,
      ptHeight: basePageDims[i].height
    });
    onProgress && onProgress((i + 1) / basePageDims.length);
  }
  const bytes = await buildPdfFromRenderedPages(pageDataList);
  return bytes;
}

pdfCompressBtn.addEventListener("click", async () => {
  if (!selectedPdfFile) return;
  const targetKb = parseFloat(pdfTargetKb.value);
  if (!targetKb || targetKb <= 0) {
    alert("Pehle target size (KB) likho");
    return;
  }
  const targetBytes = targetKb * 1024;

  pdfCompressBtn.disabled = true;
  pdfProgressWrap.style.display = "block";
  pdfResultBox.style.display = "none";
  pdfProgressFill.style.width = "0%";

  try {
    const arrayBuffer = await selectedPdfFile.arrayBuffer();
    pdfProgressLabel.textContent = "PDF padha ja raha hai...";

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const basePageDims = [];
    for (let i = 0; i < numPages; i++) {
      const page = await pdfDoc.getPage(i + 1);
      const vp = page.getViewport({ scale: 1 });
      basePageDims.push({ width: vp.width, height: vp.height });
    }

    const shrinking = targetBytes < selectedPdfFile.size;
    const trials = shrinking
      ? [
          { scale: 2.0, quality: 0.82 },
          { scale: 1.5, quality: 0.75 },
          { scale: 1.5, quality: 0.55 },
          { scale: 1.0, quality: 0.6 },
          { scale: 1.0, quality: 0.35 },
          { scale: 0.75, quality: 0.4 },
          { scale: 0.6, quality: 0.3 }
        ]
      : [
          { scale: 1.5, quality: 0.9 },
          { scale: 2.0, quality: 0.92 },
          { scale: 2.5, quality: 0.95 },
          { scale: 3.0, quality: 0.97 },
          { scale: 3.5, quality: 0.98 }
        ];

    let bestBytes = null;
    let hitTarget = false;

    for (let t = 0; t < trials.length; t++) {
      const trial = trials[t];
      pdfProgressLabel.textContent = `Trial ${t + 1}/${trials.length} — pages render ho rahe hain...`;
      const bytes = await tryPdfTrial(pdfDoc, basePageDims, trial.scale, trial.quality, (p) => {
        const overall = (t + p) / trials.length;
        pdfProgressFill.style.width = Math.round(overall * 100) + "%";
      });

      if (shrinking) {
        // Looking for the highest-quality trial that still meets the target.
        if (bytes.length <= targetBytes * 1.1) {
          bestBytes = bytes;
          hitTarget = true;
          break;
        }
        bestBytes = bytes; // keep the most recent (most compressed so far) as fallback
      } else {
        // Looking for the smallest trial that already reaches the target.
        bestBytes = bytes;
        if (bytes.length >= targetBytes) {
          hitTarget = true;
          break;
        }
      }
    }

    pdfOrigSize.textContent = formatBytes(selectedPdfFile.size);
    pdfFinalSize.textContent = formatBytes(bestBytes.length) + (hitTarget ? "" : " (target exactly nahi mila, closest possible)");
    pdfTargetSizeShown.textContent = formatBytes(targetBytes);

    const blob = new Blob([bestBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    pdfDownloadBtn.href = url;
    pdfDownloadBtn.download = "compressed.pdf";

    pdfResultBox.className = "result-box";
    pdfResultBox.style.display = "block";
  } catch (err) {
    console.error(err);
    pdfResultBox.className = "result-box error";
    pdfResultBox.style.display = "block";
    pdfOrigSize.textContent = "-";
    pdfFinalSize.textContent = "Error: " + err.message;
  } finally {
    pdfProgressWrap.style.display = "none";
    pdfCompressBtn.disabled = false;
  }
});
