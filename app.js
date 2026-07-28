/* =========================================================
   ペス / pesu — link site
   links.json / i18n.json / latest.json を読んで描画する。
   外部ライブラリなし。
   ========================================================= */

(() => {
  "use strict";

  const SUPPORTED = ["ja", "en", "zh"];
  const STORAGE_KEY = "pesu.lang";

  const $ = (sel) => document.querySelector(sel);

  /* ---------- 言語の決定 ---------- */

  function detectLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved)) return saved;
    for (const raw of navigator.languages || [navigator.language || ""]) {
      const tag = raw.toLowerCase();
      if (tag.startsWith("ja")) return "ja";
      if (tag.startsWith("zh")) return "zh";
      if (tag.startsWith("en")) return "en";
    }
    return "ja";
  }

  /** label/sub は {ja,en,zh} 形式。未翻訳なら日本語 → 英語の順にフォールバック */
  function pick(field, lang) {
    if (field == null) return "";
    if (typeof field === "string") return field;
    return field[lang] || field.ja || field.en || "";
  }

  /* ---------- 描画 ---------- */

  function renderCtas(ctas, lang) {
    const host = $("#ctas");
    host.textContent = "";
    let shown = 0;

    for (const item of ctas || []) {
      if (!item.url) continue;
      const a = document.createElement("a");
      a.className = "cta reveal";
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.setProperty("--accent", item.accent || "var(--fg-dim)");
      a.style.animationDelay = `${0.05 * shown}s`;

      const mark = document.createElement("span");
      mark.className = "cta__mark";
      mark.textContent = item.mark || "";

      const label = document.createElement("span");
      label.className = "cta__label";
      label.textContent = pick(item.label, lang);

      const sub = document.createElement("span");
      sub.className = "cta__sub";
      sub.textContent = pick(item.sub, lang);

      const arrow = document.createElement("span");
      arrow.className = "cta__arrow";
      arrow.textContent = "→";
      arrow.setAttribute("aria-hidden", "true");

      a.append(mark, arrow, label, sub);
      host.append(a);
      shown++;
    }

    host.hidden = shown === 0;
    // 1件しか無いときは横幅いっぱいに寄せる
    host.style.gridTemplateColumns = shown === 1 ? "1fr" : "";
  }

  function renderGroups(groups, lang) {
    const host = $("#links");
    host.textContent = "";
    let delay = 0;

    for (const group of groups || []) {
      const items = (group.items || []).filter((i) => i.url);
      if (items.length === 0) continue;

      const head = pick(group.head, lang);
      if (head) {
        const h = document.createElement("h2");
        h.className = "links__head";
        h.textContent = head;
        host.append(h);
      }

      for (const item of items) {
        const a = document.createElement("a");
        a.className = "link reveal";
        a.href = item.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.style.setProperty("--accent", item.accent || "var(--fg-dim)");
        a.style.animationDelay = `${0.12 + 0.04 * delay++}s`;

        const mark = document.createElement("span");
        mark.className = "link__mark";
        mark.textContent = item.mark || "→";

        const text = document.createElement("span");
        text.className = "link__text";

        const label = document.createElement("span");
        label.className = "link__label";
        label.textContent = pick(item.label, lang);
        text.append(label);

        const subText = pick(item.sub, lang);
        if (subText) {
          const sub = document.createElement("span");
          sub.className = "link__sub";
          sub.textContent = subText;
          text.append(sub);
        }

        const arrow = document.createElement("span");
        arrow.className = "link__arrow";
        arrow.textContent = "→";
        arrow.setAttribute("aria-hidden", "true");

        a.append(mark, text, arrow);
        host.append(a);
      }
    }
  }

  function renderLatest(latest, lang) {
    const el = $("#latest");
    if (!latest || !latest.videoId) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.href = latest.url || `https://www.youtube.com/watch?v=${latest.videoId}`;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    $("#latestTitle").textContent = latest.title || "";

    // latest.thumb はワークフローが実在を確認したURL。無ければ maxres を試す
    const primary =
      latest.thumb || `https://i.ytimg.com/vi/${latest.videoId}/maxresdefault.jpg`;
    const fallback = `https://i.ytimg.com/vi/${latest.videoId}/hqdefault.jpg`;

    const thumb = $("#latestThumb");
    // maxres が無い動画があるので、失敗したら hqdefault に落とす
    thumb.onerror = () => {
      thumb.onerror = null;
      thumb.src = fallback;
      setBackdrop(fallback);
    };
    thumb.src = primary;
    thumb.alt = latest.title || "";

    setBackdrop(primary);
  }

  /** 最新曲のサムネを、ぼかして全画面の背景に敷く */
  function setBackdrop(url) {
    document.documentElement.style.setProperty("--thumb", `url("${url}")`);
    // 読み込めたことを確認してからフェードインさせる（失敗時は黒のまま）
    const probe = new Image();
    probe.onload = () => document.querySelector(".bgart").classList.add("is-on");
    probe.src = url;
  }

  function applyStrings(strings, lang) {
    document.documentElement.lang = strings.htmlLang || lang;
    document.documentElement.dataset.lang = lang;

    for (const node of document.querySelectorAll("[data-i18n]")) {
      const value = strings[node.dataset.i18n];
      if (value == null) continue;
      node.textContent = "";
      // \n を改行として反映させる
      value.split("\n").forEach((line, i) => {
        if (i > 0) node.append(document.createElement("br"));
        node.append(document.createTextNode(line));
      });
    }

    const desc = document.querySelector('meta[name="description"]');
    if (desc && strings.metaDescription) desc.content = strings.metaDescription;

    for (const btn of document.querySelectorAll("[data-setlang]")) {
      btn.setAttribute("aria-current", String(btn.dataset.setlang === lang));
    }
  }

  /* ---------- 起動 ---------- */

  async function loadJson(path, fallback) {
    try {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) throw new Error(`${path}: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(err);
      return fallback;
    }
  }

  async function main() {
    $("#year").textContent = String(new Date().getFullYear());

    // アイコン未設置でも成立させる
    const avatarImg = $("#avatarImg");
    avatarImg.addEventListener("error", () => $("#avatar").classList.add("is-empty"));
    if (avatarImg.complete && avatarImg.naturalWidth === 0) {
      $("#avatar").classList.add("is-empty");
    }

    const [links, i18n, latest] = await Promise.all([
      loadJson("links.json", { ctas: [], groups: [] }),
      loadJson("i18n.json", {}),
      loadJson("latest.json", null),
    ]);

    let lang = detectLang();

    const draw = () => {
      applyStrings(i18n[lang] || i18n.ja || {}, lang);
      renderCtas(links.ctas, lang);
      renderGroups(links.groups, lang);
      renderLatest(latest, lang);
    };

    draw();

    $("#langbar").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-setlang]");
      if (!btn) return;
      lang = btn.dataset.setlang;
      localStorage.setItem(STORAGE_KEY, lang);
      draw();
    });
  }

  main();
})();
