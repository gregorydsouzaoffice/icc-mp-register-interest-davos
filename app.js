/* ICC MP Davos Circle 2027 · register-interest form
   Submissions are appended as rows to the Google Sheet behind SheetDB. */

const CONFIG = {
  SHEETDB_URL: "https://sheetdb.io/api/v1/5jbygah71womk",
  // Leave empty to write to the first tab. Set to a tab name (e.g. "Davos 2027")
  // to keep these rows on their own tab.
  SHEET_TAB: "",
  // Expressions of interest close at the end of 5 November 2026, India time.
  DEADLINE: new Date("2026-11-05T23:59:59+05:30"),
  CONTACT_WHATSAPP: "+91 98260 43012",
};

(() => {
  const params = new URLSearchParams(location.search);
  const isClosed = params.get("state") === "closed" || Date.now() > CONFIG.DEADLINE.getTime();

  const form = document.getElementById("eoi-form");
  const panels = {
    open: document.querySelector('[data-panel="open"]'),
    done: document.querySelector('[data-panel="done"]'),
    closed: document.querySelector('[data-panel="closed"]'),
  };
  const statusBox = form.querySelector(".form__status");
  const submitBtn = form.querySelector("[data-submit]");
  const submitLabel = form.querySelector("[data-submit-label]");
  const dock = document.querySelector("[data-dock]");

  function showPanel(name) {
    Object.entries(panels).forEach(([key, el]) => { el.hidden = key !== name; });
  }

  /* ── closed after the deadline ─────────────────────────── */
  if (isClosed) {
    showPanel("closed");
    document.querySelectorAll("[data-cta]").forEach((a) => { a.textContent = "Contact Shanu Mehta"; a.setAttribute("href", "#register"); });
    const dl = document.querySelector("[data-deadline-text]");
    if (dl) dl.textContent = "Registrations closed on 5 November 2026.";
    if (dock) dock.remove();
    return;
  }

  /* ── mobile dock: visible between the hero button and the form ── */
  if (dock && "IntersectionObserver" in window) {
    const heroCta = document.querySelector(".cover [data-cta]");
    const register = document.getElementById("register");
    const seen = { hero: true, form: false };
    const sync = () => {
      const show = !seen.hero && !seen.form && panels.open.hidden === false;
      dock.classList.toggle("is-visible", show);
      dock.setAttribute("aria-hidden", show ? "false" : "true");
      dock.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        // treat the hero button as 'seen' until the visitor has scrolled past it
        if (e.target === heroCta) seen.hero = e.isIntersecting || e.boundingClientRect.top > 0;
        if (e.target === register) seen.form = e.isIntersecting;
      });
      sync();
    }, { threshold: 0 }).observe(heroCta);
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { seen.form = e.isIntersecting; });
      sync();
    }, { rootMargin: "0px 0px -35% 0px" }).observe(register);
  }

  /* ── validation ───────────────────────────────────────── */
  const textFields = [
    { id: "f-name", test: (v) => v.trim().length >= 2 },
    { id: "f-mobile", test: (v) => { const d = v.replace(/\D/g, ""); return d.length === 10 || (d.length >= 11 && d.length <= 15); } },
    { id: "f-email", test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) },
  ];

  function setFieldState(input, ok) {
    const err = document.getElementById(input.id + "-err");
    input.setAttribute("aria-invalid", ok ? "false" : "true");
    if (err) {
      err.hidden = ok;
      if (!ok) input.setAttribute("aria-describedby", err.id);
      else input.removeAttribute("aria-describedby");
    }
  }

  function setChoiceState(fs, ok) {
    fs.setAttribute("aria-invalid", ok ? "false" : "true");
    const err = fs.querySelector(".field__error");
    if (err) err.hidden = ok;
  }

  function validate() {
    let firstBad = null;
    textFields.forEach(({ id, test }) => {
      const el = document.getElementById(id);
      const ok = test(el.value);
      setFieldState(el, ok);
      if (!ok && !firstBad) firstBad = el;
    });
    form.querySelectorAll(".choice[data-required]").forEach((fs) => {
      const ok = !!fs.querySelector("input:checked");
      setChoiceState(fs, ok);
      if (!ok && !firstBad) firstBad = fs.querySelector("input");
    });
    const consent = document.getElementById("f-consent");
    setFieldState(consent, consent.checked);
    if (!consent.checked && !firstBad) firstBad = consent;
    return firstBad;
  }

  // Clear an error as soon as the person fixes it.
  textFields.forEach(({ id, test }) => {
    const el = document.getElementById(id);
    el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true" && test(el.value)) setFieldState(el, true); });
    el.addEventListener("blur", () => { if (el.value.trim() !== "") setFieldState(el, test(el.value)); });
  });
  form.querySelectorAll(".choice").forEach((fs) => fs.addEventListener("change", () => setChoiceState(fs, true)));
  document.getElementById("f-consent").addEventListener("change", (e) => { if (e.target.checked) setFieldState(e.target, true); });

  /* ── payload: keys must match the Google Sheet header row exactly ── */
  function istTimestamp(d = new Date()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).formatToParts(d).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
  }

  function buildRow() {
    const fd = new FormData(form);
    // Google Sheets treats text starting with + = - @ as a formula ("+91 98…" shows #ERROR!).
    // A leading apostrophe stores it as plain text and stays hidden in the sheet.
    const sheetText = (v) => (/^[=+\-@]/.test(v) ? "'" + v : v);
    const val = (k) => sheetText((fd.get(k) || "").toString().trim());
    return {
      "Submitted At": istTimestamp(),
      "Full Name": val("Full Name"),
      "Mobile (WhatsApp)": val("Mobile (WhatsApp)"),
      "Email": val("Email").toLowerCase(),
      "Schengen Visa": val("Schengen Visa"),
      "Notes": val("Notes"),
    };
  }

  function endpoint() {
    return CONFIG.SHEET_TAB
      ? `${CONFIG.SHEETDB_URL}?sheet=${encodeURIComponent(CONFIG.SHEET_TAB)}`
      : CONFIG.SHEETDB_URL;
  }

  function showError(message) {
    const wa = CONFIG.CONTACT_WHATSAPP.replace(/\D/g, "");
    statusBox.innerHTML = `${message} If it keeps failing, <a href="https://wa.me/${wa}">WhatsApp Shanu Mehta</a> on ${CONFIG.CONTACT_WHATSAPP}.`;
    statusBox.hidden = false;
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitLabel.textContent = busy ? "Registering…" : "Register your interest";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusBox.hidden = true;

    const firstBad = validate();
    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.closest(".field, .choice, .consent")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const row = buildRow();
    const firstName = row["Full Name"].split(/\s+/)[0];

    // spam trap filled: act normally, send nothing
    if (document.getElementById("f-website").value) { finish(firstName); return; }

    setBusy(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(endpoint(), {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ data: [row] }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !(Number(body.created) >= 1)) throw new Error(`SheetDB responded ${res.status}`);
      finish(firstName);
    } catch (err) {
      console.error(err);
      setBusy(false);
      showError(navigator.onLine === false
        ? "You appear to be offline, so your registration wasn’t sent. Reconnect and press Register your interest again."
        : "Your registration wasn’t sent. Your answers are still here, so press Register your interest to try again.");
    }
  });

  function finish(firstName) {
    const slot = panels.done.querySelector("[data-first-name]");
    slot.textContent = firstName ? `, ${firstName}` : "";
    showPanel("done");
    if (dock) { dock.classList.remove("is-visible"); dock.tabIndex = -1; }
    const register = document.getElementById("register");
    register.scrollIntoView({ behavior: "smooth", block: "start" });
    panels.done.querySelector(".register__done-title").focus({ preventScroll: true });
  }
})();
