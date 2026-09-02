// ---------- Helpers ----------

function isFillable(el) {
  if (!el || el.disabled) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "select") return true;
  if (tag === "textarea") return true;
  if (tag === "input") {
    const type = (el.type || "text").toLowerCase();
    const skip = ["button", "submit", "reset", "file", "hidden", "image"];
    return !skip.includes(type);
  }
  return false;
}

// Build a fairly stable identifier for an element even if id/name is missing.
function getLabelText(el) {
  // 1. <label for="id">
  if (el.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lbl && lbl.innerText.trim()) return lbl.innerText.trim();
  }
  // 2. wrapped inside a <label>
  const parentLabel = el.closest("label");
  if (parentLabel && parentLabel.innerText.trim()) {
    return parentLabel.innerText.trim();
  }
  // 3. nearest preceding text in same row (common in table-based gov forms)
  const row = el.closest("tr, .form-group, .row, div");
  if (row) {
    const clone = row.cloneNode(true);
    clone.querySelectorAll("input, select, textarea, button, script, style").forEach(n => n.remove());
    const text = clone.innerText.trim().replace(/\s+/g, " ");
    if (text) return text.slice(0, 80);
  }
  return el.placeholder || el.getAttribute("aria-label") || "";
}

// Build a robust CSS-ish path fallback (index among same-tag siblings within body)
function getIndexPath(el) {
  const all = Array.from(document.querySelectorAll(el.tagName.toLowerCase()));
  return all.indexOf(el);
}

function describeField(el) {
  return {
    id: el.id || "",
    name: el.name || "",
    tag: el.tagName.toLowerCase(),
    type: (el.type || "").toLowerCase(),
    label: getLabelText(el),
    indexPath: getIndexPath(el)
  };
}

// ---------- CAPTURE ----------

function captureForm() {
  const fields = [];
  const elements = document.querySelectorAll("input, select, textarea");

  elements.forEach((el) => {
    if (!isFillable(el)) return;
    const desc = describeField(el);

    if (el.tagName.toLowerCase() === "select") {
      const selectedOption = el.options[el.selectedIndex];
      fields.push({
        ...desc,
        value: el.value,
        text: selectedOption ? selectedOption.text.trim() : ""
      });
    } else if (desc.type === "checkbox") {
      fields.push({ ...desc, checked: el.checked, value: el.value });
    } else if (desc.type === "radio") {
      if (el.checked) {
        fields.push({ ...desc, checked: true, value: el.value });
      }
    } else {
      // text, email, tel, number, date, textarea, etc.
      if (el.value !== "") {
        fields.push({ ...desc, value: el.value });
      }
    }
  });

  return {
    url: location.href,
    capturedAt: Date.now(),
    fields
  };
}

// ---------- FIND ELEMENT FOR A CAPTURED FIELD ----------

function findElement(desc) {
  // Priority 1: id
  if (desc.id) {
    const el = document.getElementById(desc.id);
    if (el) return el;
  }
  // Priority 2: name (+ tag, and for radio also matches by value later)
  if (desc.name) {
    const candidates = document.querySelectorAll(
      `${desc.tag}[name="${CSS.escape(desc.name)}"]`
    );
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      if (desc.type === "radio" || desc.type === "checkbox") {
        // handled separately by caller (needs value match)
        return candidates;
      }
      return candidates[0];
    }
  }
  // Priority 3: label text match among same-tag elements
  if (desc.label) {
    const sameTag = Array.from(document.querySelectorAll(desc.tag)).filter(isFillable);
    const match = sameTag.find((el) => getLabelText(el) === desc.label);
    if (match) return match;
  }
  // Priority 4: index path fallback
  if (typeof desc.indexPath === "number") {
    const all = Array.from(document.querySelectorAll(desc.tag));
    if (all[desc.indexPath]) return all[desc.indexPath];
  }
  return null;
}

// ---------- SET VALUE (native setter so frameworks detect the change) ----------

function nativeSetValue(el, value) {
  const tag = el.tagName.toLowerCase();
  const proto = tag === "textarea" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

function setSelectValue(el, desc) {
  // Try exact value match first
  let matched = Array.from(el.options).find((o) => o.value === desc.value);
  // Fall back to matching visible text (values often regenerate on cascading loads)
  if (!matched && desc.text) {
    matched = Array.from(el.options).find(
      (o) => o.text.trim().toLowerCase() === desc.text.trim().toLowerCase()
    );
  }
  if (matched) {
    el.value = matched.value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  return false;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Wait until a select's options actually contain the target value/text,
// useful for cascading dropdowns (District -> Block -> Village) loaded via AJAX.
async function waitAndSetSelect(el, desc, timeoutMs = 6000, pollMs = 250) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (setSelectValue(el, desc)) return true;
    await wait(pollMs);
  }
  return false;
}

// ---------- FILL ----------

async function fillForm(fields) {
  const report = { filled: 0, skipped: 0, notFound: [] };

  for (const desc of fields) {
    let el = findElement(desc);

    if (desc.type === "radio") {
      const radios = document.querySelectorAll(
        `input[type="radio"][name="${CSS.escape(desc.name)}"]`
      );
      const target = Array.from(radios).find((r) => r.value === desc.value);
      if (target) {
        target.checked = true;
        target.dispatchEvent(new Event("change", { bubbles: true }));
        target.dispatchEvent(new Event("click", { bubbles: true }));
        report.filled++;
      } else {
        report.notFound.push(desc.label || desc.name || desc.id);
      }
      continue;
    }

    if (Array.isArray(el)) {
      // multiple candidates with same name (checkbox group) — match by value
      const target = el.find((c) => c.value === desc.value);
      el = target || el[0];
    }

    if (!el) {
      report.notFound.push(desc.label || desc.name || desc.id);
      continue;
    }

    if (desc.type === "checkbox") {
      el.checked = !!desc.checked;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      report.filled++;
    } else if (desc.tag === "select") {
      // Small delay before each select lets a previous cascading dropdown
      // finish loading its dependent options.
      await wait(300);
      const ok = await waitAndSetSelect(el, desc);
      if (ok) report.filled++;
      else report.notFound.push(desc.label || desc.name || desc.id);
      // Extra pause after a successful select in case it triggers the next cascade.
      await wait(400);
    } else {
      nativeSetValue(el, desc.value);
      report.filled++;
    }
  }

  return report;
}

// ---------- MESSAGE LISTENER ----------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CAPTURE") {
    const data = captureForm();
    sendResponse({ ok: true, data });
  } else if (msg.type === "FILL") {
    fillForm(msg.data.fields).then((report) => {
      sendResponse({ ok: true, report });
    });
    return true; // async response
  }
  return true;
});
