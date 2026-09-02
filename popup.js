const statusEl = () => document.getElementById("status");

function showStatus(msg, isError = false) {
  const el = statusEl();
  el.textContent = msg;
  el.style.color = isError ? "#dc2626" : "#16a34a";
  setTimeout(() => { el.textContent = ""; }, 2500);
}

function getProfiles() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["rtpsProfiles"], (res) => {
      resolve(res.rtpsProfiles || {});
    });
  });
}

function saveProfiles(profiles) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ rtpsProfiles: profiles }, resolve);
  });
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

function sendMessageToTab(tabId, msg) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, msg, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

// ---------- Render profile list ----------

async function renderProfiles() {
  const profiles = await getProfiles();
  const listEl = document.getElementById("profileList");
  const emptyNote = document.getElementById("emptyNote");
  listEl.innerHTML = "";

  const names = Object.keys(profiles);
  emptyNote.style.display = names.length === 0 ? "block" : "none";

  names.forEach((name) => {
    const profile = profiles[name];
    const row = document.createElement("div");
    row.className = "profile-row";

    const nameSpan = document.createElement("div");
    nameSpan.className = "profile-name";
    nameSpan.textContent = `${name} (${profile.fields.length} fields)`;

    const btnWrap = document.createElement("div");
    btnWrap.className = "row-btns";

    const fillBtn = document.createElement("button");
    fillBtn.className = "btn-primary";
    fillBtn.textContent = "Autofill";
    fillBtn.addEventListener("click", () => autofillProfile(name));

    const exportBtn = document.createElement("button");
    exportBtn.className = "btn-outline";
    exportBtn.textContent = "Download";
    exportBtn.addEventListener("click", () => exportProfile(name));

    const emailBtn = document.createElement("button");
    emailBtn.className = "btn-email";
    emailBtn.textContent = "Email";
    emailBtn.addEventListener("click", () => emailProfile(name));

    const delBtn = document.createElement("button");
    delBtn.className = "btn-danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteProfile(name));

    btnWrap.appendChild(fillBtn);
    btnWrap.appendChild(exportBtn);
    btnWrap.appendChild(emailBtn);
    btnWrap.appendChild(delBtn);

    row.appendChild(nameSpan);
    row.appendChild(btnWrap);
    listEl.appendChild(row);
  });
}

// ---------- Create profile (capture) ----------

async function captureCurrentPage() {
  const nameInput = document.getElementById("profileNameInput");
  const name = nameInput.value.trim();
  if (!name) {
    showStatus("Pehle profile ka naam likho", true);
    return;
  }

  const tab = await getActiveTab();
  if (!tab) {
    showStatus("Active tab nahi mila", true);
    return;
  }

  const response = await sendMessageToTab(tab.id, { type: "CAPTURE" });
  if (!response || !response.ok) {
    showStatus("Page se data nahi mila. RTPS site khuli hai na? Ek baar refresh karke try karo.", true);
    return;
  }

  if (!response.data.fields.length) {
    showStatus("Form mein koi bhara hua data nahi mila", true);
    return;
  }

  const profiles = await getProfiles();
  profiles[name] = response.data;
  await saveProfiles(profiles);

  nameInput.value = "";
  showStatus(`✅ Profile "${name}" save ho gaya (${response.data.fields.length} fields)`);
  renderProfiles();
}

// ---------- Autofill ----------

async function autofillProfile(name) {
  const profiles = await getProfiles();
  const profile = profiles[name];
  if (!profile) return;

  const tab = await getActiveTab();
  if (!tab) {
    showStatus("Active tab nahi mila", true);
    return;
  }

  showStatus("Fill ho raha hai... thoda wait karo (dropdowns ke liye)");

  const response = await sendMessageToTab(tab.id, { type: "FILL", data: profile });
  if (!response || !response.ok) {
    showStatus("Autofill fail hua. Page refresh karke fir try karo.", true);
    return;
  }

  const { filled, notFound } = response.report;
  if (notFound.length > 0) {
    showStatus(`✅ ${filled} fields bhare. ${notFound.length} nahi mile (page alag ho sakta hai).`);
  } else {
    showStatus(`✅ Sabhi ${filled} fields bhar diye gaye!`);
  }
}

// ---------- Delete ----------

async function deleteProfile(name) {
  const profiles = await getProfiles();
  delete profiles[name];
  await saveProfiles(profiles);
  showStatus(`🗑️ "${name}" delete ho gaya`);
  renderProfiles();
}

// ---------- Export ----------

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function exportProfile(name) {
  const profiles = await getProfiles();
  const single = { [name]: profiles[name] };
  downloadJson(`rtps-profile-${name}.json`, single);
  showStatus(`⬇️ "${name}" download ho gaya`);
}

// ---------- Email ----------
// Browsers don't allow auto-attaching a file to an email for security reasons —
// so this downloads the JSON first, then opens Gmail compose with subject/body
// ready, and the person attaches the just-downloaded file manually (paperclip icon).

async function emailProfile(name) {
  const profiles = await getProfiles();
  const single = { [name]: profiles[name] };
  const filename = `rtps-profile-${name}.json`;
  downloadJson(filename, single);

  const subject = "RTPS PROFILE CAST INCOME RESIDENT APPLY FORM";
  const body =
    `Profile: ${name}\n\n` +
    `📎 Is email ke saath abhi jo file download hui hai (${filename}) usko attach karo ` +
    `(paperclip icon se) — browser security ki wajah se file automatically attach nahi ho sakti, ` +
    `isliye ye ek manual step hai.`;

  const gmailUrl =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    "&su=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);

  chrome.tabs.create({ url: gmailUrl });
  showStatus(`⬇️ File download ho gayi, Gmail khul raha hai — attach karna mat bhoolna`);
}

async function exportAll() {
  const profiles = await getProfiles();
  if (Object.keys(profiles).length === 0) {
    showStatus("Koi profile save nahi hai", true);
    return;
  }
  downloadJson("rtps-profiles-all.json", profiles);
  showStatus("⬇️ Sabhi profiles download ho gaye");
}

// ---------- Import ----------

async function importFile(file) {
  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    // Basic validation: each entry should have a "fields" array
    const validEntries = Object.entries(imported).filter(
      ([, val]) => val && Array.isArray(val.fields)
    );

    if (validEntries.length === 0) {
      showStatus("File mein valid profile data nahi mila", true);
      return;
    }

    const profiles = await getProfiles();
    validEntries.forEach(([name, data]) => {
      profiles[name] = data;
    });
    await saveProfiles(profiles);

    showStatus(`✅ ${validEntries.length} profile(s) import ho gaye`);
    renderProfiles();
  } catch (e) {
    showStatus("File padhne mein error aaya — sahi JSON file select karo", true);
  }
}

// ---------- Wire up events ----------

document.getElementById("openCompressorBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("compressor.html") });
});

document.getElementById("captureBtn").addEventListener("click", captureCurrentPage);
document.getElementById("exportAllBtn").addEventListener("click", exportAll);

document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) importFile(file);
  e.target.value = "";
});

renderProfiles();
