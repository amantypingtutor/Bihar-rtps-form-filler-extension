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
const imageDownloadOrigBtn = document.getElementById("imageDownloadOrigBtn");

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

// Works with either an <img> (naturalWidth/naturalHeight) or a <canvas> (width/height) as source.
function getSourceDims(src) {
  return {
    width: src.naturalWidth || src.width,
    height: src.naturalHeight || src.height
  };
}

function drawToCanvas(src, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

// Shrink: quality-preserving strategy — prefers keeping JPEG quality in a "safe" band (0.5-0.95)
// at full resolution first. Only reduces quality below that (which causes visible artifacts) as
// a last resort, preferring a small resolution reduction (barely noticeable) over heavy JPEG
// quantization (very noticeable — blocky artifacts) whenever both could reach the same target size.
async function shrinkImageToTarget(imgSrc, targetBytes, onProgress) {
  const { width, height } = getSourceDims(imgSrc);

  async function searchAt(scale, qLow, qHigh, steps) {
    const w = width * scale, h = height * scale;
    const canvas = drawToCanvas(imgSrc, w, h);
    let low = qLow, high = qHigh, best = null;
    for (let i = 0; i < steps; i++) {
      const mid = (low + high) / 2;
      const blob = await canvasToBlob(canvas, "image/jpeg", mid);
      if (!best || Math.abs(blob.size - targetBytes) < Math.abs(best.size - targetBytes)) best = blob;
      if (blob.size > targetBytes) high = mid; else low = mid;
    }
    return best;
  }

  // Attempt 1: full resolution, good-quality band only (0.5–0.95) — no visible degradation.
  let best = await searchAt(1.0, 0.5, 0.95, 7);
  onProgress && onProgress(0.3);
  if (best.size <= targetBytes * 1.1) {
    onProgress && onProgress(1);
    return best;
  }

  // Attempt 2: target needs more shrinking — reduce resolution slightly instead of nuking
  // quality further. A modest resolution drop is far less visually damaging than low-quality JPEG.
  const scales = [0.85, 0.7, 0.55, 0.42, 0.3];
  for (let i = 0; i < scales.length; i++) {
    const candidate = await searchAt(scales[i], 0.55, 0.9, 6);
    onProgress && onProgress(0.3 + ((i + 1) / scales.length) * 0.6);
    if (Math.abs(candidate.size - targetBytes) < Math.abs(best.size - targetBytes)) best = candidate;
    if (candidate.size <= targetBytes * 1.08) { onProgress && onProgress(1); return best; }
  }

  // Attempt 3 (last resort, very small targets only): allow lower quality at the smallest scale.
  if (best.size > targetBytes * 1.3) {
    const candidate = await searchAt(0.22, 0.3, 0.6, 6);
    if (Math.abs(candidate.size - targetBytes) < Math.abs(best.size - targetBytes)) best = candidate;
  }

  onProgress && onProgress(1);
  return best;
}

// Grow: lossless PNG first, then upscale resolution (no quality lost, just more pixel data) until target reached.
async function growImageToTarget(imgSrc, targetBytes, onProgress) {
  const { width, height } = getSourceDims(imgSrc);

  let canvas = drawToCanvas(imgSrc, width, height);
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
    const c = drawToCanvas(imgSrc, w, h);
    const b = await canvasToBlob(c, "image/png");
    onProgress && onProgress(0.15 + ((i + 1) / maxIterations) * 0.85);
    bestBlob = b;
    if (b.size >= targetBytes) break;
  }

  return bestBlob;
}

// Downscale-only shrink for PNG (lossless format has no "quality" knob — only resolution changes size).
async function shrinkPngToTarget(imgSrc, targetBytes, onProgress) {
  const { width, height } = getSourceDims(imgSrc);
  let canvas = drawToCanvas(imgSrc, width, height);
  let bestBlob = await canvasToBlob(canvas, "image/png");
  if (bestBlob.size <= targetBytes) return bestBlob;

  const scales = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
  for (let i = 0; i < scales.length; i++) {
    const c = drawToCanvas(imgSrc, width * scales[i], height * scales[i]);
    const b = await canvasToBlob(c, "image/png");
    onProgress && onProgress((i + 1) / scales.length);
    bestBlob = b;
    if (b.size <= targetBytes) break;
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

    const origUrl = URL.createObjectURL(selectedImageFile);
    imageDownloadOrigBtn.href = origUrl;
    imageDownloadOrigBtn.download = selectedImageFile.name;

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
const pdfDownloadOrigBtn = document.getElementById("pdfDownloadOrigBtn");

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
          { scale: 2.0, quality: 0.88 },
          { scale: 2.0, quality: 0.72 },
          { scale: 1.5, quality: 0.8 },
          { scale: 1.5, quality: 0.6 },
          { scale: 1.2, quality: 0.65 },
          { scale: 1.0, quality: 0.55 },
          { scale: 0.85, quality: 0.5 },
          { scale: 0.65, quality: 0.45 }
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

    const origPdfUrl = URL.createObjectURL(selectedPdfFile);
    pdfDownloadOrigBtn.href = origPdfUrl;
    pdfDownloadOrigBtn.download = selectedPdfFile.name;

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

// ============================================================
// SHARED: multi-file drop zone (accepts multiple files at once)
// ============================================================

function setupMultiDropZone(dropEl, inputEl, onFiles) {
  dropEl.addEventListener("click", () => inputEl.click());
  dropEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropEl.classList.add("dragover");
  });
  dropEl.addEventListener("dragleave", () => dropEl.classList.remove("dragover"));
  dropEl.addEventListener("drop", (e) => {
    e.preventDefault();
    dropEl.classList.remove("dragover");
    if (e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files));
  });
  inputEl.addEventListener("change", () => {
    if (inputEl.files.length) onFiles(Array.from(inputEl.files));
    inputEl.value = ""; // allow re-adding more later
  });
}

// Export a composed canvas (source of truth for pixels) as jpeg/png/pdf,
// honoring an optional target size (null/blank = best quality, no forced compression).
async function exportCanvasAsFormat(canvas, format, targetBytes, onProgress) {
  if (format === "jpeg") {
    if (!targetBytes) {
      onProgress && onProgress(1);
      return await canvasToBlob(canvas, "image/jpeg", 0.95);
    }
    const probe = await canvasToBlob(canvas, "image/jpeg", 0.95);
    if (targetBytes >= probe.size) return await growImageToTarget(canvas, targetBytes, onProgress);
    return await shrinkImageToTarget(canvas, targetBytes, onProgress);
  }
  if (format === "png") {
    if (!targetBytes) {
      onProgress && onProgress(1);
      return await canvasToBlob(canvas, "image/png");
    }
    const probe = await canvasToBlob(canvas, "image/png");
    if (targetBytes >= probe.size) return await growImageToTarget(canvas, targetBytes, onProgress);
    return await shrinkPngToTarget(canvas, targetBytes, onProgress);
  }
  if (format === "pdf") {
    return await canvasToPdfBytes(canvas, targetBytes, onProgress);
  }
}

async function canvasToPdfBytes(canvas, targetBytes, onProgress) {
  const { PDFDocument } = PDFLib;
  // Treat the composed canvas as rendered at 150 DPI, convert to PDF points (72 pts/inch).
  const ptW = (canvas.width * 72) / 150;
  const ptH = (canvas.height * 72) / 150;

  async function buildAtQuality(quality) {
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    const bytes = await blob.arrayBuffer();
    const pdfDoc = await PDFDocument.create();
    const jpg = await pdfDoc.embedJpg(bytes);
    const page = pdfDoc.addPage([ptW, ptH]);
    page.drawImage(jpg, { x: 0, y: 0, width: ptW, height: ptH });
    return await pdfDoc.save();
  }

  if (!targetBytes) {
    const bytes = await buildAtQuality(0.93);
    onProgress && onProgress(1);
    return bytes;
  }

  let low = 0.2, high = 0.97, best = null;
  for (let i = 0; i < 7; i++) {
    const mid = (low + high) / 2;
    const bytes = await buildAtQuality(mid);
    if (!best || Math.abs(bytes.length - targetBytes) < Math.abs(best.length - targetBytes)) best = bytes;
    onProgress && onProgress((i + 1) / 7);
    if (bytes.length > targetBytes) high = mid; else low = mid;
  }
  return best;
}

// ============================================================
// GENERIC CROP CONTROLLER (used by Document Creator's Front & Back)
// ============================================================

function createCropController(prefix, onChange) {
  const dropEl = document.getElementById(prefix + "Drop");
  const inputEl = document.getElementById(prefix + "Input");
  const cropWrap = document.getElementById(prefix + "CropWrap");
  const displayCanvas = document.getElementById(prefix + "DisplayCanvas");
  const overlayCanvas = document.getElementById(prefix + "OverlayCanvas");
  const controlsEl = document.getElementById(prefix + "CropControls");
  const cropStartBtn = document.getElementById(prefix + "CropStartBtn");
  const cropConfirmBtn = document.getElementById(prefix + "CropConfirmBtn");
  const cropCancelBtn = document.getElementById(prefix + "CropCancelBtn");
  const resetBtn = document.getElementById(prefix + "ResetBtn");

  const state = {
    originalImg: null,
    workingSrc: null,
    file: null,
    cropping: false,
    selRect: null,
    dragStart: null
  };

  const MAX_DISPLAY_W = 300;

  function clearOverlay() {
    const ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }

  function renderDisplay() {
    const { width, height } = getSourceDims(state.workingSrc);
    const scale = Math.min(1, MAX_DISPLAY_W / width);
    const dw = Math.round(width * scale);
    const dh = Math.round(height * scale);
    displayCanvas.width = dw;
    displayCanvas.height = dh;
    overlayCanvas.width = dw;
    overlayCanvas.height = dh;
    const ctx = displayCanvas.getContext("2d");
    ctx.drawImage(state.workingSrc, 0, 0, dw, dh);
    clearOverlay();
    cropWrap.style.display = "inline-block";
    controlsEl.style.display = "flex";
    onChange && onChange();
  }

  setupDropZone(dropEl, inputEl, async (file) => {
    state.file = file;
    const img = await loadImageEl(file);
    state.originalImg = img;
    state.workingSrc = img;
    renderDisplay();
  });

  cropStartBtn.addEventListener("click", () => {
    state.cropping = true;
    cropStartBtn.style.display = "none";
    cropConfirmBtn.style.display = "inline-block";
    cropCancelBtn.style.display = "inline-block";
  });

  cropCancelBtn.addEventListener("click", () => {
    state.cropping = false;
    state.selRect = null;
    clearOverlay();
    cropStartBtn.style.display = "inline-block";
    cropConfirmBtn.style.display = "none";
    cropCancelBtn.style.display = "none";
  });

  resetBtn.addEventListener("click", () => {
    if (!state.originalImg) return;
    state.workingSrc = state.originalImg;
    renderDisplay();
  });

  function getPointerPos(e) {
    const rect = overlayCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (overlayCanvas.width / rect.width),
      y: (clientY - rect.top) * (overlayCanvas.height / rect.height)
    };
  }

  function drawSelRect() {
    clearOverlay();
    if (!state.selRect) return;
    const ctx = overlayCanvas.getContext("2d");
    ctx.fillStyle = "rgba(37,99,235,0.2)";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    const { x, y, w, h } = state.selRect;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  function onPointerDown(e) {
    if (!state.cropping) return;
    e.preventDefault();
    const pos = getPointerPos(e);
    state.dragStart = pos;
    state.selRect = { x: pos.x, y: pos.y, w: 0, h: 0 };
  }
  function onPointerMove(e) {
    if (!state.cropping || !state.dragStart) return;
    e.preventDefault();
    const pos = getPointerPos(e);
    const x = Math.min(pos.x, state.dragStart.x);
    const y = Math.min(pos.y, state.dragStart.y);
    const w = Math.abs(pos.x - state.dragStart.x);
    const h = Math.abs(pos.y - state.dragStart.y);
    state.selRect = { x, y, w, h };
    drawSelRect();
  }
  function onPointerUp() {
    state.dragStart = null;
  }

  overlayCanvas.addEventListener("mousedown", onPointerDown);
  overlayCanvas.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  overlayCanvas.addEventListener("touchstart", onPointerDown, { passive: false });
  overlayCanvas.addEventListener("touchmove", onPointerMove, { passive: false });
  overlayCanvas.addEventListener("touchend", onPointerUp);

  cropConfirmBtn.addEventListener("click", () => {
    if (!state.selRect || state.selRect.w < 5 || state.selRect.h < 5) {
      alert("Pehle image par ungli/mouse se drag karke crop area select karo");
      return;
    }
    const { width, height } = getSourceDims(state.workingSrc);
    const scaleX = width / displayCanvas.width;
    const scaleY = height / displayCanvas.height;
    const sx = state.selRect.x * scaleX;
    const sy = state.selRect.y * scaleY;
    const sw = state.selRect.w * scaleX;
    const sh = state.selRect.h * scaleY;

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = Math.max(1, Math.round(sw));
    cropCanvas.height = Math.max(1, Math.round(sh));
    const ctx = cropCanvas.getContext("2d");
    ctx.drawImage(state.workingSrc, sx, sy, sw, sh, 0, 0, cropCanvas.width, cropCanvas.height);

    state.workingSrc = cropCanvas;
    state.selRect = null;
    state.cropping = false;
    cropStartBtn.style.display = "inline-block";
    cropConfirmBtn.style.display = "none";
    cropCancelBtn.style.display = "none";
    renderDisplay();
  });

  return state;
}

// ============================================================
// DOCUMENT CREATOR (Front + Back on one A4 page)
// ============================================================

const docTargetKb = document.getElementById("docTargetKb");
const docDownloadJpegBtn = document.getElementById("docDownloadJpegBtn");
const docDownloadPngBtn = document.getElementById("docDownloadPngBtn");
const docDownloadPdfBtn = document.getElementById("docDownloadPdfBtn");
const docProgressWrap = document.getElementById("docProgressWrap");
const docProgressFill = document.getElementById("docProgressFill");
const docProgressLabel = document.getElementById("docProgressLabel");
const docResultBox = document.getElementById("docResultBox");
const docFinalSize = document.getElementById("docFinalSize");
const docPreview = document.getElementById("docPreview");

function updateDocButtons() {
  const ready = !!(frontCtrl.workingSrc && backCtrl.workingSrc);
  docDownloadJpegBtn.disabled = !ready;
  docDownloadPngBtn.disabled = !ready;
  docDownloadPdfBtn.disabled = !ready;
}

const frontCtrl = createCropController("front", updateDocButtons);
const backCtrl = createCropController("back", updateDocButtons);

function composeDocA4(frontSrc, backSrc) {
  const pageW = 1240, pageH = 1754; // A4 @ ~150 DPI
  const margin = 50;
  const labelSpace = 44;
  const gap = 40;

  const canvas = document.createElement("canvas");
  canvas.width = pageW;
  canvas.height = pageH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, pageW, pageH);

  const usableW = pageW - margin * 2;
  const halfH = (pageH - margin * 2 - gap) / 2;
  const regionH = halfH - labelSpace;

  function drawFitted(src, regionX, regionY, regionW, regionH, label) {
    ctx.fillStyle = "#333";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, regionX + regionW / 2, regionY - 14);

    const { width, height } = getSourceDims(src);
    const scale = Math.min(regionW / width, regionH / height);
    const dw = width * scale;
    const dh = height * scale;
    const dx = regionX + (regionW - dw) / 2;
    const dy = regionY + (regionH - dh) / 2;
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.strokeRect(regionX, regionY, regionW, regionH);
    ctx.drawImage(src, dx, dy, dw, dh);
  }

  const region1Y = margin + labelSpace;
  drawFitted(frontSrc, margin, region1Y, usableW, regionH, "FRONT SIDE");

  const region2Y = region1Y + regionH + gap + labelSpace;
  drawFitted(backSrc, margin, region2Y, usableW, regionH, "BACK SIDE");

  return canvas;
}

async function handleDocExport(format) {
  if (!frontCtrl.workingSrc || !backCtrl.workingSrc) return;
  const targetKbVal = parseFloat(docTargetKb.value);
  const targetBytes = targetKbVal > 0 ? targetKbVal * 1024 : null;

  docDownloadJpegBtn.disabled = docDownloadPngBtn.disabled = docDownloadPdfBtn.disabled = true;
  docProgressWrap.style.display = "block";
  docResultBox.style.display = "none";
  docProgressFill.style.width = "0%";
  docProgressLabel.textContent = "A4 page banayi ja rahi hai...";

  try {
    const composed = composeDocA4(frontCtrl.workingSrc, backCtrl.workingSrc);
    const onProgress = (p) => { docProgressFill.style.width = Math.round(p * 100) + "%"; };

    let result, filename, isPdf = false;
    if (format === "jpeg") {
      result = await exportCanvasAsFormat(composed, "jpeg", targetBytes, onProgress);
      filename = "document.jpg";
    } else if (format === "png") {
      result = await exportCanvasAsFormat(composed, "png", targetBytes, onProgress);
      filename = "document.png";
    } else {
      result = await exportCanvasAsFormat(composed, "pdf", targetBytes, onProgress);
      filename = "document.pdf";
      isPdf = true;
    }

    const blob = isPdf ? new Blob([result], { type: "application/pdf" }) : result;
    const url = URL.createObjectURL(blob);
    docFinalSize.textContent = formatBytes(blob.size);
    if (!isPdf) {
      docPreview.src = url;
      docPreview.style.display = "block";
    } else {
      docPreview.style.display = "none";
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    docResultBox.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  } finally {
    docProgressWrap.style.display = "none";
    updateDocButtons();
  }
}

docDownloadJpegBtn.addEventListener("click", () => handleDocExport("jpeg"));
docDownloadPngBtn.addEventListener("click", () => handleDocExport("png"));
docDownloadPdfBtn.addEventListener("click", () => handleDocExport("pdf"));

// ============================================================
// IMAGE → PDF
// ============================================================

let i2pFile = null, i2pImg = null;

const i2pDrop = document.getElementById("i2pDrop");
const i2pInput = document.getElementById("i2pInput");
const i2pFileInfo = document.getElementById("i2pFileInfo");
const i2pTargetKb = document.getElementById("i2pTargetKb");
const i2pConvertBtn = document.getElementById("i2pConvertBtn");
const i2pProgressWrap = document.getElementById("i2pProgressWrap");
const i2pProgressFill = document.getElementById("i2pProgressFill");
const i2pProgressLabel = document.getElementById("i2pProgressLabel");
const i2pResultBox = document.getElementById("i2pResultBox");
const i2pOrigSize = document.getElementById("i2pOrigSize");
const i2pFinalSize = document.getElementById("i2pFinalSize");
const i2pDownloadBtn = document.getElementById("i2pDownloadBtn");

setupDropZone(i2pDrop, i2pInput, async (file) => {
  i2pFile = file;
  i2pImg = await loadImageEl(file);
  i2pFileInfo.style.display = "block";
  i2pFileInfo.textContent = `📄 ${file.name} — ${formatBytes(file.size)}`;
  i2pConvertBtn.disabled = false;
  i2pResultBox.style.display = "none";
});

i2pConvertBtn.addEventListener("click", async () => {
  if (!i2pImg) return;
  const targetKbVal = parseFloat(i2pTargetKb.value);
  const targetBytes = targetKbVal > 0 ? targetKbVal * 1024 : null;

  i2pConvertBtn.disabled = true;
  i2pProgressWrap.style.display = "block";
  i2pResultBox.style.display = "none";
  i2pProgressFill.style.width = "0%";
  i2pProgressLabel.textContent = "PDF banaya ja raha hai...";

  try {
    const canvas = drawToCanvas(i2pImg, i2pImg.naturalWidth, i2pImg.naturalHeight);
    const onProgress = (p) => { i2pProgressFill.style.width = Math.round(p * 100) + "%"; };
    const resultBytes = await canvasToPdfBytes(canvas, targetBytes, onProgress);

    const blob = new Blob([resultBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    i2pOrigSize.textContent = formatBytes(i2pFile.size);
    i2pFinalSize.textContent = formatBytes(blob.size);
    i2pDownloadBtn.href = url;
    i2pDownloadBtn.download = "converted.pdf";
    i2pResultBox.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  } finally {
    i2pProgressWrap.style.display = "none";
    i2pConvertBtn.disabled = false;
  }
});

// ============================================================
// MERGE PDF
// ============================================================

let mergeFiles = [];

const mergeDrop = document.getElementById("mergeDrop");
const mergeInput = document.getElementById("mergeInput");
const mergeFileList = document.getElementById("mergeFileList");
const mergeTargetKb = document.getElementById("mergeTargetKb");
const mergeBtn = document.getElementById("mergeBtn");
const mergeProgressWrap = document.getElementById("mergeProgressWrap");
const mergeProgressFill = document.getElementById("mergeProgressFill");
const mergeProgressLabel = document.getElementById("mergeProgressLabel");
const mergeResultBox = document.getElementById("mergeResultBox");
const mergePageCount = document.getElementById("mergePageCount");
const mergeFinalSize = document.getElementById("mergeFinalSize");
const mergeDownloadBtn = document.getElementById("mergeDownloadBtn");

function renderMergeList() {
  mergeFileList.innerHTML = "";
  mergeFiles.forEach((f, idx) => {
    const row = document.createElement("div");
    row.className = "file-list-item";

    const name = document.createElement("div");
    name.className = "fname";
    name.textContent = `${idx + 1}. ${f.name} (${formatBytes(f.size)})`;

    const upBtn = document.createElement("button");
    upBtn.textContent = "↑";
    upBtn.addEventListener("click", () => {
      if (idx > 0) {
        [mergeFiles[idx - 1], mergeFiles[idx]] = [mergeFiles[idx], mergeFiles[idx - 1]];
        renderMergeList();
      }
    });

    const downBtn = document.createElement("button");
    downBtn.textContent = "↓";
    downBtn.addEventListener("click", () => {
      if (idx < mergeFiles.length - 1) {
        [mergeFiles[idx + 1], mergeFiles[idx]] = [mergeFiles[idx], mergeFiles[idx + 1]];
        renderMergeList();
      }
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "✖";
    delBtn.addEventListener("click", () => {
      mergeFiles.splice(idx, 1);
      renderMergeList();
    });

    row.appendChild(name);
    row.appendChild(upBtn);
    row.appendChild(downBtn);
    row.appendChild(delBtn);
    mergeFileList.appendChild(row);
  });
  mergeBtn.disabled = mergeFiles.length < 2;
}

setupMultiDropZone(mergeDrop, mergeInput, (files) => {
  const pdfs = files.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
  mergeFiles.push(...pdfs);
  renderMergeList();
});

mergeBtn.addEventListener("click", async () => {
  if (mergeFiles.length < 2) return;
  const targetKbVal = parseFloat(mergeTargetKb.value);
  const targetBytes = targetKbVal > 0 ? targetKbVal * 1024 : null;

  mergeBtn.disabled = true;
  mergeProgressWrap.style.display = "block";
  mergeResultBox.style.display = "none";
  mergeProgressFill.style.width = "0%";
  const onProgress = (p) => { mergeProgressFill.style.width = Math.round(p * 100) + "%"; };

  try {
    mergeProgressLabel.textContent = "PDFs merge ho rahi hain (original quality)...";
    const { PDFDocument } = PDFLib;
    const mergedDoc = await PDFDocument.create();
    let totalPages = 0;
    for (let i = 0; i < mergeFiles.length; i++) {
      const bytes = await mergeFiles[i].arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);
      const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach((p) => mergedDoc.addPage(p));
      totalPages += pages.length;
      onProgress(((i + 1) / mergeFiles.length) * 0.5);
    }
    let mergedBytes = await mergedDoc.save();

    if (targetBytes && mergedBytes.length > targetBytes * 1.1) {
      mergeProgressLabel.textContent = "Target size ke liye compress ho raha hai...";
      const arrBuf = mergedBytes.buffer.slice(mergedBytes.byteOffset, mergedBytes.byteOffset + mergedBytes.byteLength);
      const loadingTask = pdfjsLib.getDocument({ data: arrBuf });
      const pdfDocJs = await loadingTask.promise;
      const numPages = pdfDocJs.numPages;
      const baseDims = [];
      for (let i = 0; i < numPages; i++) {
        const pg = await pdfDocJs.getPage(i + 1);
        const vp = pg.getViewport({ scale: 1 });
        baseDims.push({ width: vp.width, height: vp.height });
      }
      const trials = [
        { scale: 2.0, quality: 0.85 }, { scale: 1.5, quality: 0.75 }, { scale: 1.5, quality: 0.55 },
        { scale: 1.0, quality: 0.6 }, { scale: 1.0, quality: 0.4 }, { scale: 0.75, quality: 0.4 },
        { scale: 0.6, quality: 0.3 }
      ];
      let best = mergedBytes;
      for (let t = 0; t < trials.length; t++) {
        const bytes = await tryPdfTrial(pdfDocJs, baseDims, trials[t].scale, trials[t].quality, (p) => {
          onProgress(0.5 + ((t + p) / trials.length) * 0.5);
        });
        best = bytes;
        if (bytes.length <= targetBytes * 1.1) break;
      }
      mergedBytes = best;
    } else {
      onProgress(1);
    }

    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    mergePageCount.textContent = totalPages;
    mergeFinalSize.textContent = formatBytes(blob.size);
    mergeDownloadBtn.href = url;
    mergeDownloadBtn.download = "merged.pdf";
    mergeResultBox.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  } finally {
    mergeProgressWrap.style.display = "none";
    mergeBtn.disabled = mergeFiles.length < 2;
  }
});

// ============================================================
// IMAGE MERGER
// ============================================================

let imgMergeFiles = [];

const imgMergeDrop = document.getElementById("imgMergeDrop");
const imgMergeInput = document.getElementById("imgMergeInput");
const imgMergeFileList = document.getElementById("imgMergeFileList");
const imgMergeLayout = document.getElementById("imgMergeLayout");
const imgMergeTargetKb = document.getElementById("imgMergeTargetKb");
const imgMergeJpegBtn = document.getElementById("imgMergeJpegBtn");
const imgMergePngBtn = document.getElementById("imgMergePngBtn");
const imgMergePdfBtn = document.getElementById("imgMergePdfBtn");
const imgMergeProgressWrap = document.getElementById("imgMergeProgressWrap");
const imgMergeProgressFill = document.getElementById("imgMergeProgressFill");
const imgMergeResultBox = document.getElementById("imgMergeResultBox");
const imgMergeFinalSize = document.getElementById("imgMergeFinalSize");
const imgMergePreview = document.getElementById("imgMergePreview");

function renderImgMergeList() {
  imgMergeFileList.innerHTML = "";
  imgMergeFiles.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "file-list-item";

    const name = document.createElement("div");
    name.className = "fname";
    name.textContent = `${idx + 1}. ${item.file.name} (${formatBytes(item.file.size)})`;

    const upBtn = document.createElement("button");
    upBtn.textContent = "↑";
    upBtn.addEventListener("click", () => {
      if (idx > 0) {
        [imgMergeFiles[idx - 1], imgMergeFiles[idx]] = [imgMergeFiles[idx], imgMergeFiles[idx - 1]];
        renderImgMergeList();
      }
    });

    const downBtn = document.createElement("button");
    downBtn.textContent = "↓";
    downBtn.addEventListener("click", () => {
      if (idx < imgMergeFiles.length - 1) {
        [imgMergeFiles[idx + 1], imgMergeFiles[idx]] = [imgMergeFiles[idx], imgMergeFiles[idx + 1]];
        renderImgMergeList();
      }
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "✖";
    delBtn.addEventListener("click", () => {
      imgMergeFiles.splice(idx, 1);
      renderImgMergeList();
    });

    row.appendChild(name);
    row.appendChild(upBtn);
    row.appendChild(downBtn);
    row.appendChild(delBtn);
    imgMergeFileList.appendChild(row);
  });
  const ready = imgMergeFiles.length >= 2;
  imgMergeJpegBtn.disabled = !ready;
  imgMergePngBtn.disabled = !ready;
  imgMergePdfBtn.disabled = !ready;
}

setupMultiDropZone(imgMergeDrop, imgMergeInput, async (files) => {
  for (const f of files) {
    if (!f.type.startsWith("image/")) continue;
    const img = await loadImageEl(f);
    imgMergeFiles.push({ file: f, img });
  }
  renderImgMergeList();
});

function composeMergedImages(items, layout) {
  const gap = 20;
  if (layout === "vertical") {
    const maxW = Math.max(...items.map((it) => it.img.naturalWidth));
    let totalH = gap;
    items.forEach((it) => { totalH += it.img.naturalHeight + gap; });
    const canvas = document.createElement("canvas");
    canvas.width = maxW;
    canvas.height = totalH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let y = gap;
    items.forEach((it) => {
      const x = (maxW - it.img.naturalWidth) / 2;
      ctx.drawImage(it.img, x, y);
      y += it.img.naturalHeight + gap;
    });
    return canvas;
  } else {
    const maxH = Math.max(...items.map((it) => it.img.naturalHeight));
    let totalW = gap;
    items.forEach((it) => { totalW += it.img.naturalWidth + gap; });
    const canvas = document.createElement("canvas");
    canvas.width = totalW;
    canvas.height = maxH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let x = gap;
    items.forEach((it) => {
      const y = (maxH - it.img.naturalHeight) / 2;
      ctx.drawImage(it.img, x, y);
      x += it.img.naturalWidth + gap;
    });
    return canvas;
  }
}

async function handleImgMergeExport(format) {
  if (imgMergeFiles.length < 2) return;
  const targetKbVal = parseFloat(imgMergeTargetKb.value);
  const targetBytes = targetKbVal > 0 ? targetKbVal * 1024 : null;
  const layout = imgMergeLayout.value;

  imgMergeJpegBtn.disabled = imgMergePngBtn.disabled = imgMergePdfBtn.disabled = true;
  imgMergeProgressWrap.style.display = "block";
  imgMergeResultBox.style.display = "none";
  imgMergeProgressFill.style.width = "0%";
  const onProgress = (p) => { imgMergeProgressFill.style.width = Math.round(p * 100) + "%"; };

  try {
    const composed = composeMergedImages(imgMergeFiles, layout);
    let result, filename, isPdf = false;
    if (format === "jpeg") {
      result = await exportCanvasAsFormat(composed, "jpeg", targetBytes, onProgress);
      filename = "merged.jpg";
    } else if (format === "png") {
      result = await exportCanvasAsFormat(composed, "png", targetBytes, onProgress);
      filename = "merged.png";
    } else {
      result = await exportCanvasAsFormat(composed, "pdf", targetBytes, onProgress);
      filename = "merged.pdf";
      isPdf = true;
    }

    const blob = isPdf ? new Blob([result], { type: "application/pdf" }) : result;
    const url = URL.createObjectURL(blob);
    imgMergeFinalSize.textContent = formatBytes(blob.size);
    if (!isPdf) {
      imgMergePreview.src = url;
      imgMergePreview.style.display = "block";
    } else {
      imgMergePreview.style.display = "none";
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    imgMergeResultBox.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  } finally {
    imgMergeProgressWrap.style.display = "none";
    renderImgMergeList();
  }
}

imgMergeJpegBtn.addEventListener("click", () => handleImgMergeExport("jpeg"));
imgMergePngBtn.addEventListener("click", () => handleImgMergeExport("png"));
imgMergePdfBtn.addEventListener("click", () => handleImgMergeExport("pdf"));
