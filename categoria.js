/* ============================================================
   categoria.js — comportamento da página de categoria (protótipo).
   - H1, title, breadcrumb (Schema.org) e canonical dinâmicos
   - URLs facetadas amigáveis: /feminino/{categoria}/{estilo}?marca=...
   - Filtros sugeridos (chips) acima da vitrine
   - Sidebar: grade de tamanhos (botões), busca em Marca/Tamanho,
     contagem de produtos por opção, faixa de preço, cor
   - Faixa de frete grátis com progresso do carrinho + "faltam R$ X" nos cards
   - Ordenação, grade/lista, "carregar mais" rastreável (?pagina=N)
   - Bloco de texto SEO expansível
   [PENDENTE] Em produção, filtros/contagens/paginação vêm da API de
   busca (VTEX Intelligent Search) e a página deve ser renderizada no
   servidor (SSR) para que H1, title e breadcrumb já cheguem no HTML.
   ============================================================ */
(function () {
  "use strict";

  const C = window.OMAR_CATEGORY;
  const ALL = C.products;
  // Anexa a avaliação de cada produto: { value, count } (count 0 = sem avaliações)
  ALL.forEach((p) => { const r = (C.ratings || {})[p.id]; p.rating = r ? { value: r[0], count: r[1] } : { value: 0, count: 0 }; });
  const PAGE = 12;
  // Raiz do site ("/" local, "/pdp-omar-prototipo1/" no GitHub Pages)
  const ROOT = window.OMAR_ROOT || "/";
  const BASE = ROOT + C.basePath;
  const asset = (u) => (!u || /^(https?:|data:|#)/.test(u) ? u : ROOT + u.replace(/^\//, ""));
  // Links do HTML escritos a partir da raiz ("/feminino/tenis") ganham o prefixo da raiz
  document.querySelectorAll('a[href^="/"], link[rel="canonical"]').forEach((a) => a.setAttribute("href", asset(a.getAttribute("href"))));
  const HTTP = location.protocol.indexOf("http") === 0; // em file:// não mexe na URL

  const el = (sel) => document.querySelector(sel);
  const money = (cents) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pixOf = (p) => Math.round(p.price * (1 - C.pixDiscountPct / 100));
  const discountOf = (p) => Math.round((1 - pixOf(p) / p.list) * 100);
  const sizeIdx = (s) => { const i = C.sizeOrder.indexOf(s); return i === -1 ? 999 : i; };
  const plural = (n) => n.toLocaleString("pt-BR") + (n === 1 ? " produto" : " produtos");
  // "Tênis" -> "tenis", "33/34" -> "33-34", "Off White" -> "off-white"
  const slug = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Facetas da sidebar, na ordem do layout.
  // param: nome do parâmetro na URL | buttons: grade de botões | search: busca interna
  const FACETS = [
    { key: "sizes", title: "Tamanho", param: "tamanho", multi: true, buttons: true, search: true },
    { key: "category", title: "Categoria", param: "categoria" },
    { key: "style", title: "Estilo", param: "estilo" },
    { key: "brand", title: "Marca", param: "marca", search: true },
    { key: "color", title: "Cor", param: "cor", swatch: true, bottom: true }
  ];

  const PRICE_MIN = Math.floor(Math.min(...ALL.map((p) => p.price)) / 100) * 100;
  const PRICE_MAX = Math.ceil(Math.max(...ALL.map((p) => p.price)) / 100) * 100;
  const clampPrice = (v) => Math.min(PRICE_MAX, Math.max(PRICE_MIN, v));

  // Valores distintos de cada faceta + mapa slug -> valor (para ler a URL)
  const VALUES = {};
  const BY_SLUG = {};
  FACETS.forEach((f) => {
    const set = new Set();
    ALL.forEach((p) => (Array.isArray(p[f.key]) ? p[f.key] : [p[f.key]]).forEach((v) => set.add(v)));
    const arr = Array.from(set);
    VALUES[f.key] = f.key === "sizes" ? arr.sort((a, b) => sizeIdx(a) - sizeIdx(b)) : arr.sort((a, b) => a.localeCompare(b, "pt-BR"));
    BY_SLUG[f.key] = Object.fromEntries(VALUES[f.key].map((v) => [slug(v), v]));
  });

  function freshState() {
    return {
      sel: Object.fromEntries(FACETS.map((f) => [f.key, new Set()])),
      min: PRICE_MIN, max: PRICE_MAX,
      isNew: false,
      sort: "relevancia", page: 1
    };
  }
  const state = freshState();
  let view = "grid";
  const favs = new Set();

  function cloneState(st) {
    return Object.assign({}, st, { sel: Object.fromEntries(Object.entries(st.sel).map(([k, s]) => [k, new Set(s)])) });
  }

  // ---------------------------------------------------------
  // Filtragem (skip = faceta ignorada, para contagens facetadas)
  // ---------------------------------------------------------
  function matches(p, skip, st) {
    st = st || state;
    for (const f of FACETS) {
      if (f.key === skip) continue;
      const set = st.sel[f.key];
      if (!set.size) continue;
      const ok = f.multi ? p[f.key].some((v) => set.has(v)) : set.has(p[f.key]);
      if (!ok) return false;
    }
    if (p.price < st.min || p.price > st.max) return false;
    if (st.isNew && !p.isNew) return false;
    return true;
  }

  const SORTERS = {
    relevancia: (a, b) => a.rank - b.rank,
    menor: (a, b) => a.price - b.price,
    maior: (a, b) => b.price - a.price,
    desconto: (a, b) => discountOf(b) - discountOf(a),
    avaliacao: (a, b) => b.rating.value - a.rating.value || b.rating.count - a.rating.count,
    novos: (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || a.rank - b.rank,
    az: (a, b) => a.name.localeCompare(b.name, "pt-BR")
  };

  const filtered = () => ALL.filter((p) => matches(p)).sort(SORTERS[state.sort]);

  // ---------------------------------------------------------
  // URL facetada amigável
  //   1 categoria            -> /feminino/tenis
  //   1 categoria + 1 estilo -> /feminino/tenis/casual
  //   demais filtros         -> query string (?marca=vizzano,moleca&tamanho=36)
  // ---------------------------------------------------------
  function pathInfo(st) {
    const cats = Array.from(st.sel.category);
    const styles = Array.from(st.sel.style);
    const cat = cats.length === 1 ? cats[0] : null;
    const style = cat && styles.length === 1 ? styles[0] : null;
    return { cat, style };
  }

  function toURL(st) {
    st = st || state;
    const { cat, style } = pathInfo(st);
    let path = BASE;
    if (cat) path += "/" + slug(cat);
    if (style) path += "/" + slug(style);

    const filters = [];
    FACETS.forEach((f) => {
      if ((f.key === "category" && cat) || (f.key === "style" && style)) return;
      const vals = Array.from(st.sel[f.key]).map(slug).sort();
      if (vals.length) filters.push(f.param + "=" + vals.join(","));
    });
    if (st.min > PRICE_MIN || st.max < PRICE_MAX) filters.push("preco=" + st.min / 100 + "-" + st.max / 100);
    if (st.isNew) filters.push("lancamentos=1");

    const extra = [];
    if (st.sort !== "relevancia") extra.push("ordem=" + st.sort);
    if (st.page > 1) extra.push("pagina=" + st.page);

    const qs = filters.concat(extra);
    return { path, full: path + (qs.length ? "?" + qs.join("&") : ""), hasFilters: filters.length > 0 };
  }

  function fromURL() {
    const st = freshState();
    const path = location.pathname.replace(/\/+$/, "");
    if (path.indexOf(BASE) === 0) {
      const segs = path.slice(BASE.length).split("/").filter(Boolean);
      if (segs[0] && BY_SLUG.category[segs[0]]) st.sel.category.add(BY_SLUG.category[segs[0]]);
      if (segs[1] && BY_SLUG.style[segs[1]]) st.sel.style.add(BY_SLUG.style[segs[1]]);
    }
    const q = new URLSearchParams(location.search);
    FACETS.forEach((f) => {
      const raw = q.get(f.param);
      if (raw) raw.split(",").forEach((s) => { const v = BY_SLUG[f.key][s]; if (v) st.sel[f.key].add(v); });
    });
    const pr = q.get("preco");
    if (pr) {
      const [a, b] = pr.split("-").map((n) => Math.round(parseFloat(n) * 100));
      if (!isNaN(a)) st.min = clampPrice(a);
      if (!isNaN(b)) st.max = clampPrice(b);
      if (st.min > st.max) { const t = st.min; st.min = st.max; st.max = t; }
    }
    st.isNew = q.get("lancamentos") === "1";
    const o = q.get("ordem");
    if (o && SORTERS[o]) st.sort = o;
    const pg = parseInt(q.get("pagina"), 10);
    if (pg > 1) st.page = pg;
    return st;
  }

  function syncURL(mode) {
    const u = toURL();
    // Canonical aponta sempre para a URL limpa (sem query string).
    // Combinações com query string recebem noindex para evitar
    // explosão de páginas indexadas; as URLs de caminho são indexáveis.
    el("#canonical").href = (HTTP ? location.origin : "") + u.path;
    el("#metaRobots").content = u.hasFilters ? "noindex, follow" : "index, follow";
    if (!HTTP || mode === "none") return;
    if (location.pathname + location.search === u.full) return;
    history[mode === "replace" ? "replaceState" : "pushState"](null, "", u.full);
  }

  // ---------------------------------------------------------
  // H1, title, description e breadcrumb (Schema.org microdata)
  // ---------------------------------------------------------
  const femWord = (cat) => (C.categoryGender[cat] === "f" ? "Femininas" : "Femininos");

  function headingName() {
    const { cat, style } = pathInfo(state);
    if (!cat) return C.name;
    return cat + (style ? " " + style : "") + " " + femWord(cat);
  }

  function renderHeading(total) {
    const name = headingName();
    el("#catName").textContent = name;
    el("#catTotal").textContent = "(" + plural(total) + ")";
    document.title = name + ": as melhores marcas | Omar Calçados";
    el("#metaDesc").content = name + " na Omar Calçados: " + plural(ALL.filter((p) => matches(p, null, onlyPath())).length) +
      " das melhores marcas. Frete grátis a partir de R$ 199, 5% off no Pix e 1ª troca grátis.";
    renderBreadcrumb(name);
  }

  // Estado contendo só os filtros de caminho (para a description)
  function onlyPath() {
    const st = freshState();
    const { cat, style } = pathInfo(state);
    if (cat) st.sel.category.add(cat);
    if (style) st.sel.style.add(style);
    return st;
  }

  function renderBreadcrumb(name) {
    const { cat, style } = pathInfo(state);
    const crumbs = [{ name: "Home", url: ROOT }, { name: C.name, url: BASE }];
    if (cat) crumbs.push({ name: cat + " " + femWord(cat), url: BASE + "/" + slug(cat) });
    if (style) crumbs.push({ name: name, url: BASE + "/" + slug(cat) + "/" + slug(style) });

    el("#breadcrumbList").innerHTML = crumbs.map((c, i) => {
      const last = i === crumbs.length - 1;
      const inner = last
        ? `<span itemprop="name">${esc(c.name)}</span><link itemprop="item" href="${esc(c.url)}" />`
        : `<a itemprop="item" href="${esc(c.url)}"><span itemprop="name">${esc(c.name)}</span></a>`;
      return `<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"${last ? ' aria-current="page"' : ""}>${inner}<meta itemprop="position" content="${i + 1}" /></li>`;
    }).join("");
  }

  // ---------------------------------------------------------
  // Imagem placeholder (SVG) para produtos sem foto cadastrada
  // ---------------------------------------------------------
  function placeholder(p) {
    const fill = C.colors[p.color] || "#bbb";
    const line = "rgba(0,0,0,.25)";
    const sole = `<path d="M30 212h240a9 9 0 0 1 0 18H30a9 9 0 0 1 0-18z" fill="#e8e3da" stroke="${line}"/>`;
    let shape;
    if (p.category === "Botas") {
      shape = `<path d="M95 55h80v118c32 6 84 14 92 39H85z" fill="${fill}" stroke="${line}" stroke-width="2"/>` + sole;
    } else if (p.category === "Chinelos" || p.category === "Sandálias") {
      shape = `<path d="M40 200h220a12 12 0 0 1 0 24H40a12 12 0 0 1 0-24z" fill="#e8e3da" stroke="${line}"/>` +
        `<path d="M105 202Q150 120 200 202" fill="none" stroke="${fill}" stroke-width="16" stroke-linecap="round"/>` +
        `<path d="M150 145v57" stroke="${fill}" stroke-width="10" stroke-linecap="round"/>`;
    } else if (p.category === "Bolsas") {
      shape = `<path d="M110 110a40 40 0 0 1 80 0" fill="none" stroke="${fill}" stroke-width="10"/>` +
        `<rect x="70" y="110" width="160" height="120" rx="14" fill="${fill}" stroke="${line}" stroke-width="2"/>`;
    } else {
      shape = `<path d="M35 212c0-36 26-46 60-50l55-40c16-9 36-6 46 9l20 30c30 8 52 25 54 51z" fill="${fill}" stroke="${line}" stroke-width="2"/>` + sole;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#fff"/>${shape}</svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  // ---------------------------------------------------------
  // Card de produto
  // ---------------------------------------------------------
  const TAGS = { queima: "Grande Queima", inverno: "Inverno 2026" };
  const HEART = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20s-7-4.5-9.3-9.2C1 7 3 4 6 4c2 0 3.2 1.2 4 2.3C10.8 5.2 12 4 14 4c3 0 5 3 3.3 6.8C19 15.5 12 20 12 20Z"/></svg>';

  const CARET_DOWN = '<svg class="quickbuy__caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const fmtRating = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function ratingHTML(r) {
    if (!r.count) return '<p class="rating rating--empty"><span class="rating__stars" aria-hidden="true"></span> Sem avaliações</p>';
    const pct = Math.round((r.value / 5) * 100);
    return `<p class="rating" aria-label="Avaliação ${fmtRating(r.value)} de 5, ${r.count} ${r.count === 1 ? "avaliação" : "avaliações"}">
      <span class="rating__stars" aria-hidden="true"><span class="rating__fill" style="width:${pct}%"></span></span>
      <span class="rating__value" aria-hidden="true">${fmtRating(r.value)}</span>
      <span aria-hidden="true">(${r.count.toLocaleString("pt-BR")})</span>
    </p>`;
  }

  // ---------------------------------------------------------
  // Frete grátis: regra vale para o CARRINHO (subtotal >= limite),
  // não para cada produto. Mensagem do card considera o carrinho atual.
  // ---------------------------------------------------------
  const cart = Object.assign({ count: 0, subtotal: 0 }, C.cart);
  const FREE = C.freeShippingFrom;

  function shipHTML(p) {
    if (p.price >= FREE) return '<p class="plp-card__ship" data-ship>Frete grátis</p>';
    const missing = FREE - cart.subtotal - p.price;
    if (missing <= 0) return '<p class="plp-card__ship" data-ship>Frete grátis com seu carrinho</p>';
    return `<p class="plp-card__ship plp-card__ship--hint" data-ship>Faltam <b>${money(missing)}</b> p/ frete grátis</p>`;
  }

  function renderShipBar() {
    const missing = FREE - cart.subtotal;
    const status = el("#shipStatus");
    status.classList.toggle("is-done", missing <= 0);
    status.innerHTML = missing <= 0
      ? "Seu carrinho já tem frete grátis"
      : `Seu carrinho: ${money(cart.subtotal)} · faltam <strong>${money(missing)}</strong>`;
    el("#shipFill").style.width = Math.min(100, (cart.subtotal / FREE) * 100) + "%";
  }

  // Atualiza só as mensagens de frete dos cards (sem re-renderizar a vitrine)
  function refreshShipHints() {
    document.querySelectorAll(".plp-card").forEach((card) => {
      const p = ALL.find((x) => x.id === card.querySelector(".quickbuy").dataset.id);
      card.querySelector("[data-ship]").outerHTML = shipHTML(p);
    });
    renderShipBar();
  }

  // Tamanho pré-selecionado: único tamanho (UN) ou o tamanho já filtrado na sidebar
  function preselectedSize(p) {
    if (p.sizes.length === 1) return p.sizes[0];
    return p.sizes.slice().sort((a, b) => sizeIdx(a) - sizeIdx(b)).find((s) => state.sel.sizes.has(s)) || "";
  }

  function cardHTML(p, i) {
    const pix = pixOf(p);
    const off = discountOf(p);
    const inst = Math.round(p.price / C.installments);
    const img = p.image ? asset(p.image) : placeholder(p);
    const fav = favs.has(p.id);
    const tags = p.tags.map((t) => `<span class="tag tag--${t}">${TAGS[t]}</span>`).join("");
    const old = p.list > p.price ? `<p class="plp-card__old"><s>${money(p.list)}</s></p>` : "";
    const ship = shipHTML(p);
    const pre = preselectedSize(p);
    const sizes = p.sizes.slice().sort((a, b) => sizeIdx(a) - sizeIdx(b))
      .map((s) => `<option value="${esc(s)}"${s === pre ? " selected" : ""}>${esc(s)}</option>`).join("");
    const qid = "qb-" + p.id;

    return `<li class="plp-card">
      <div class="plp-card__top">
        <div class="plp-card__media">
          ${off > 0 ? `<span class="plp-card__off" aria-label="${off}% de desconto">-${off}%</span>` : ""}
          <img src="${img}" alt="" width="300" height="300" loading="${i < 6 ? "eager" : "lazy"}" decoding="async" />
        </div>
        <form class="quickbuy" data-id="${p.id}" novalidate>
          <div class="quickbuy__field">
            <label class="sr-only" for="${qid}">Tamanho de ${esc(p.name)}</label>
            <select class="quickbuy__size" id="${qid}" aria-describedby="${qid}-msg">
              <option value="">Selecione o tamanho</option>${sizes}
            </select>${CARET_DOWN}
          </div>
          <button type="submit" class="quickbuy__btn">Adicionar ao Carrinho</button>
          <p class="quickbuy__msg" id="${qid}-msg" role="status" aria-live="polite"></p>
        </form>
      </div>
      <div class="plp-card__body">
        <h3 class="plp-card__name"><a class="plp-card__link" href="${esc(asset(p.href) || "#")}">${esc(p.name)}</a></h3>
        ${ratingHTML(p.rating)}
        <div class="plp-card__mid">${old}${tags ? `<div class="plp-card__tags">${tags}</div>` : ""}</div>
        <p class="plp-card__price"><strong>${money(pix)}</strong> no Pix</p>
        <p class="plp-card__inst">ou <b>${money(p.price)}</b> ${C.installments}x de ${money(inst)} s/juros</p>
        ${ship}
      </div>
      <button type="button" class="plp-card__fav" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${fav ? "Remover dos" : "Adicionar aos"} favoritos: ${esc(p.name)}">${HEART}</button>
    </li>`;
  }

  // ---------------------------------------------------------
  // Compra rápida (simulada): valida tamanho, loading, sucesso
  // [PENDENTE] Integração real com o carrinho VTEX (orderForm/addToCart).
  // ---------------------------------------------------------
  function bindQuickBuy() {
    const grid = el("#plpGrid");

    grid.addEventListener("submit", (e) => {
      const form = e.target.closest(".quickbuy");
      if (!form) return;
      e.preventDefault();
      const select = form.querySelector(".quickbuy__size");
      const btn = form.querySelector(".quickbuy__btn");
      const msg = form.querySelector(".quickbuy__msg");
      if (btn.getAttribute("aria-busy") === "true") return;

      if (!select.value) {
        form.classList.add("is-error");
        select.setAttribute("aria-invalid", "true");
        msg.textContent = "Selecione um tamanho";
        select.focus();
        return;
      }

      form.classList.remove("is-error");
      form.classList.add("is-busy");
      btn.setAttribute("aria-busy", "true");
      btn.textContent = "Adicionando...";
      setTimeout(() => {
        const product = ALL.find((x) => x.id === form.dataset.id);
        cart.count += 1;
        cart.subtotal += product.price;
        const badge = el("#cartCount");
        badge.textContent = String(cart.count);
        badge.closest("a").setAttribute("aria-label", "Carrinho, " + cart.count + " itens");
        refreshShipHints();
        form.classList.replace("is-busy", "is-done");
        btn.removeAttribute("aria-busy");
        btn.textContent = "✓ Adicionado ao carrinho";
        msg.textContent = "";
        setTimeout(() => {
          form.classList.remove("is-done");
          btn.textContent = "Adicionar ao Carrinho";
        }, 2000);
      }, 600);
    });

    grid.addEventListener("change", (e) => {
      const select = e.target.closest(".quickbuy__size");
      if (!select || !select.value) return;
      const form = select.closest(".quickbuy");
      form.classList.remove("is-error");
      select.removeAttribute("aria-invalid");
      form.querySelector(".quickbuy__msg").textContent = "";
    });
  }

  // ---------------------------------------------------------
  // Vitrine
  // ---------------------------------------------------------
  function renderResults(list) {
    list = list || filtered();
    const total = list.length;
    const shown = Math.min(state.page * PAGE, total);
    const grid = el("#plpGrid");

    grid.innerHTML = list.slice(0, shown).map(cardHTML).join("");
    grid.classList.toggle("is-list", view === "list");
    grid.querySelectorAll("img").forEach((img, i) => {
      img.addEventListener("error", () => { img.src = placeholder(list[i]); }, { once: true });
    });

    el("#plpEmpty").hidden = total > 0;
    el("#plpMore").hidden = total === 0;
    el("#moreInfo").textContent = "Exibindo " + shown + " de " + plural(total);
    el("#moreBar").style.width = (total ? (shown / total) * 100 : 0) + "%";

    // Botão "Carregar mais" é um link real para a próxima página (rastreável)
    const more = el("#loadMore");
    const next = cloneState(state); next.page = state.page + 1;
    more.href = toURL(next).full;
    more.hidden = shown >= total;
  }

  // ---------------------------------------------------------
  // Filtros sugeridos (chips)
  // ---------------------------------------------------------
  const QUICK = C.quickFilters;

  function chipActive(q, st) {
    st = st || state;
    if (q.price) {
      const mn = q.price.min == null ? PRICE_MIN : q.price.min;
      const mx = q.price.max == null ? PRICE_MAX : q.price.max;
      if (st.min !== mn || st.max !== mx) return false;
    }
    if (q.sel) for (const k in q.sel) if (!q.sel[k].every((v) => st.sel[k].has(v))) return false;
    if (q.isNew && !st.isNew) return false;
    return true;
  }

  function applyChip(q, on, st) {
    st = st || state;
    if (q.price) {
      st.min = on && q.price.min != null ? clampPrice(q.price.min) : PRICE_MIN;
      st.max = on && q.price.max != null ? clampPrice(q.price.max) : PRICE_MAX;
    }
    if (q.sel) for (const k in q.sel) q.sel[k].forEach((v) => (on ? st.sel[k].add(v) : st.sel[k].delete(v)));
    if (q.isNew) st.isNew = on;
  }

  function chipCount(q) {
    const st = cloneState(state);
    applyChip(q, true, st);
    return ALL.filter((p) => matches(p, null, st)).length;
  }

  function buildQuick() {
    let lastGroup = null;
    el("#quickFilters").innerHTML = QUICK.map((q) => {
      const sep = lastGroup && lastGroup !== q.group ? '<span class="qchips__sep" aria-hidden="true"></span>' : "";
      lastGroup = q.group;
      return sep + `<button type="button" class="qchip" data-q="${q.id}" aria-pressed="false">
        <span>${esc(q.label)}</span><span class="qchip__n" data-n></span>
        <svg class="qchip__x" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>`;
    }).join("");

    el("#quickFilters").addEventListener("click", (e) => {
      const b = e.target.closest("[data-q]");
      if (!b || b.getAttribute("aria-disabled") === "true") return;
      const q = QUICK.find((x) => x.id === b.dataset.q);
      applyChip(q, !chipActive(q));
      syncPriceInputs();
      update();
    });
  }

  function updateQuick() {
    document.querySelectorAll(".qchip").forEach((b) => {
      const q = QUICK.find((x) => x.id === b.dataset.q);
      const on = chipActive(q);
      const n = on ? null : chipCount(q);
      b.setAttribute("aria-pressed", String(on));
      b.querySelector("[data-n]").textContent = n == null ? "" : "(" + n + ")";
      b.setAttribute("aria-disabled", String(n === 0));
      b.setAttribute("aria-label", q.label + (on ? ", aplicado. Clique para remover" : ", " + plural(n)));
    });
  }

  // ---------------------------------------------------------
  // Facetas da sidebar: monta uma vez, depois só atualiza
  // ---------------------------------------------------------
  const CARET = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M6 15l6-6 6 6z"/></svg>';

  function facetHTML(f) {
    const id = "facet-" + f.key;
    const search = f.search
      ? `<label class="sr-only" for="${id}-q">Buscar ${f.title.toLowerCase()}</label>
         <input type="search" class="facet__search" id="${id}-q" data-search="${f.key}" placeholder="Buscar ${f.title.toLowerCase()}..." autocomplete="off" />`
      : "";

    const opts = f.buttons
      ? `<div class="size-grid" role="group" aria-label="${f.title}">` + VALUES[f.key].map((v) =>
          `<button type="button" class="size-btn" data-facet="${f.key}" data-value="${esc(v)}" aria-pressed="false">${esc(v)}</button>`
        ).join("") + `</div><p class="facet__none" hidden>Nenhum tamanho encontrado.</p>`
      : `<ul class="facet__list">` + VALUES[f.key].map((v) => `
          <li><label class="facet__opt">
            <input type="checkbox" data-facet="${f.key}" value="${esc(v)}" />
            ${f.swatch ? `<span class="facet__swatch" style="background:${C.colors[v] || "#ccc"}" aria-hidden="true"></span>` : ""}
            <span class="facet__opt-name">${esc(v)}</span>
            <span class="facet__opt-count" data-count></span>
          </label></li>`).join("") + `</ul><p class="facet__none" hidden>Nenhuma opção encontrada.</p>`;

    return `<section class="facet">
      <h3><button type="button" class="facet__title" aria-expanded="true" aria-controls="${id}">${f.title}${CARET}</button></h3>
      <div class="facet__body" id="${id}">${search}${opts}</div>
    </section>`;
  }

  function buildFacets() {
    el("#facets").innerHTML = FACETS.filter((f) => !f.bottom).map(facetHTML).join("");
    el("#facetsBottom").innerHTML = FACETS.filter((f) => f.bottom).map(facetHTML).join("");

    const panel = el("#filters");

    panel.addEventListener("change", (e) => {
      const input = e.target.closest("input[type=checkbox][data-facet]");
      if (input) toggleValue(input.dataset.facet, input.value, input.checked);
    });

    panel.addEventListener("click", (e) => {
      const sb = e.target.closest(".size-btn");
      if (sb) {
        if (sb.getAttribute("aria-disabled") === "true" && sb.getAttribute("aria-pressed") !== "true") return;
        toggleValue("sizes", sb.dataset.value, sb.getAttribute("aria-pressed") !== "true");
        return;
      }
      const btn = e.target.closest(".facet__title");
      if (!btn || btn.classList.contains("facet__title--static")) return;
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      document.getElementById(btn.getAttribute("aria-controls")).hidden = open;
    });

    // Busca interna (Marca e Tamanho)
    panel.addEventListener("input", (e) => {
      const q = e.target.closest("[data-search]");
      if (!q) return;
      const term = slug(q.value);
      const body = q.parentElement;
      let visible = 0;
      body.querySelectorAll(".size-btn, .facet__opt").forEach((opt) => {
        const value = opt.dataset.value || opt.querySelector("input").value;
        const hit = !term || slug(value).includes(term);
        (opt.classList.contains("size-btn") ? opt : opt.parentElement).hidden = !hit;
        if (hit) visible++;
      });
      body.querySelector(".facet__none").hidden = visible > 0;
    });
  }

  function updateFacets() {
    FACETS.forEach((f) => {
      // Contagem considera os demais filtros, mas não a própria faceta
      const base = ALL.filter((p) => matches(p, f.key));
      const countOf = (v) => base.filter((p) => (f.multi ? p[f.key].includes(v) : p[f.key] === v)).length;

      if (f.buttons) {
        document.querySelectorAll(`.size-btn[data-facet="${f.key}"]`).forEach((b) => {
          const v = b.dataset.value;
          const n = countOf(v);
          const on = state.sel[f.key].has(v);
          b.setAttribute("aria-pressed", String(on));
          b.setAttribute("aria-disabled", String(n === 0 && !on));
          b.setAttribute("aria-label", "Tamanho " + v + " (" + plural(n) + ")");
          b.title = plural(n);
        });
        return;
      }
      document.querySelectorAll(`input[data-facet="${f.key}"]`).forEach((input) => {
        const v = input.value;
        const n = countOf(v);
        input.checked = state.sel[f.key].has(v);
        const label = input.closest(".facet__opt");
        label.querySelector("[data-count]").textContent = "(" + n.toLocaleString("pt-BR") + ")";
        label.classList.toggle("is-empty", n === 0 && !input.checked);
      });
    });
  }

  // ---------------------------------------------------------
  // Filtros aplicados (chips removíveis) + contador mobile
  // ---------------------------------------------------------
  function renderActive() {
    const chips = [];
    FACETS.forEach((f) => state.sel[f.key].forEach((v) => chips.push({ type: f.key, value: v, label: f.title + ": ", text: v })));
    if (state.isNew) chips.push({ type: "new", label: "", text: "Lançamentos" });
    if (state.min > PRICE_MIN || state.max < PRICE_MAX) {
      chips.push({ type: "price", label: "Preço: ", text: money(state.min) + " – " + money(state.max) });
    }

    el("#activeFilters").hidden = chips.length === 0;
    el("#activeList").innerHTML = chips.map((c) =>
      `<li><button type="button" class="active-chip" data-type="${c.type}" data-value="${esc(c.value || "")}" aria-label="Remover filtro ${esc(c.label + c.text)}">${esc(c.label)}<span>${esc(c.text)}</span> ✕</button></li>`
    ).join("");
    el("#filtersOpenCount").textContent = chips.length ? String(chips.length) : "";
  }

  // ---------------------------------------------------------
  // Faixa de preço
  // ---------------------------------------------------------
  const minIn = el("#priceMin");
  const maxIn = el("#priceMax");

  function syncPriceInputs() { minIn.value = state.min; maxIn.value = state.max; }

  function setupPrice() {
    [minIn, maxIn].forEach((i) => { i.min = PRICE_MIN; i.max = PRICE_MAX; });
    syncPriceInputs();

    const onInput = (e) => {
      let a = +minIn.value, b = +maxIn.value;
      if (a > b) { if (e.target === minIn) a = b; else b = a; } // não deixa cruzar
      minIn.value = a; maxIn.value = b;
      state.min = a; state.max = b;
      paintPrice();
    };
    minIn.addEventListener("input", onInput);
    maxIn.addEventListener("input", onInput);
    // Atualiza a vitrine ao soltar o controle
    minIn.addEventListener("change", () => update());
    maxIn.addEventListener("change", () => update());
  }

  function paintPrice() {
    const span = PRICE_MAX - PRICE_MIN || 1;
    el("#priceFill").style.left = ((state.min - PRICE_MIN) / span) * 100 + "%";
    el("#priceFill").style.right = 100 - ((state.max - PRICE_MIN) / span) * 100 + "%";
    el("#priceValues").textContent = money(state.min) + " – " + money(state.max);
    minIn.setAttribute("aria-valuetext", money(state.min));
    maxIn.setAttribute("aria-valuetext", money(state.max));
    minIn.style.zIndex = state.min >= PRICE_MAX - 100 ? 3 : "";
  }

  // ---------------------------------------------------------
  // Atualização geral
  // ---------------------------------------------------------
  function toggleValue(key, value, on) {
    if (on) state.sel[key].add(value); else state.sel[key].delete(value);
    update();
  }

  // opts.keepPage: mantém a página (load more / histórico) | opts.history: push|replace|none
  function update(opts) {
    opts = opts || {};
    if (!opts.keepPage) state.page = 1;
    const list = filtered();
    updateFacets();
    updateQuick();
    renderActive();
    paintPrice();
    renderShipBar();
    el("#sortSelect").value = state.sort;
    renderHeading(list.length);
    renderResults(list);
    el("#resultStatus").textContent = plural(list.length) + " encontrados";
    el("#filtersApply").textContent = "Ver " + plural(list.length);
    syncURL(opts.history || "push");
  }

  function clearAll() {
    Object.assign(state, freshState(), { sort: state.sort });
    syncPriceInputs();
    update();
  }

  // ---------------------------------------------------------
  // Eventos
  // ---------------------------------------------------------
  function bindControls() {
    el("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; update(); });

    document.querySelectorAll(".view-toggle__btn").forEach((b) => {
      b.addEventListener("click", () => {
        view = b.dataset.view;
        document.querySelectorAll(".view-toggle__btn").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        renderResults();
      });
    });

    el("#loadMore").addEventListener("click", (e) => {
      e.preventDefault(); // [PENDENTE] em produção, buscar a próxima página na API
      const firstNew = state.page * PAGE;
      state.page += 1;
      renderResults();
      syncURL("replace"); // voltar da PDP reabre na mesma página
      const next = el("#plpGrid").children[firstNew];
      if (next) next.querySelector("a").focus({ preventScroll: true });
    });

    el("#activeList").addEventListener("click", (e) => {
      const chip = e.target.closest(".active-chip");
      if (!chip) return;
      const { type, value } = chip.dataset;
      if (type === "new") state.isNew = false;
      else if (type === "price") { state.min = PRICE_MIN; state.max = PRICE_MAX; syncPriceInputs(); }
      else state.sel[type].delete(value);
      update();
    });

    el("#clearAll").addEventListener("click", clearAll);
    el("#emptyClear").addEventListener("click", clearAll);

    el("#plpGrid").addEventListener("click", (e) => {
      const b = e.target.closest("[data-fav]");
      if (!b) return;
      const id = b.dataset.fav;
      const on = !favs.has(id);
      if (on) favs.add(id); else favs.delete(id);
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", b.getAttribute("aria-label").replace(on ? "Adicionar aos" : "Remover dos", on ? "Remover dos" : "Adicionar aos"));
      el("#favCount").textContent = String(3 + favs.size);
    });

    // Texto SEO expansível
    el("#seoToggle").addEventListener("click", function () {
      const open = this.getAttribute("aria-expanded") !== "true";
      this.setAttribute("aria-expanded", String(open));
      el("#seoContent").classList.toggle("is-open", open);
      this.firstChild.textContent = (open ? "Ler menos" : "Ler mais sobre " + C.name) + " ";
    });

    el("#floaterClubClose").addEventListener("click", () => { el("#floaterClub").hidden = true; });

    // Voltar/avançar do navegador restaura os filtros da URL
    window.addEventListener("popstate", () => {
      Object.assign(state, fromURL());
      syncPriceInputs();
      update({ keepPage: true, history: "none" });
    });
  }

  // Gaveta de filtros (mobile)
  function bindDrawer() {
    const panel = el("#filters");
    const backdrop = el("#filtersBackdrop");
    const openBtn = el("#filtersOpen");
    let lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      panel.classList.add("is-open");
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      backdrop.hidden = false;
      openBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      el("#filtersClose").focus();
      document.addEventListener("keydown", onKey);
    }
    function close() {
      panel.classList.remove("is-open");
      panel.removeAttribute("role");
      panel.removeAttribute("aria-modal");
      backdrop.hidden = true;
      openBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      if (lastFocus) lastFocus.focus();
    }
    function onKey(e) { if (e.key === "Escape") close(); }

    openBtn.addEventListener("click", open);
    el("#filtersClose").addEventListener("click", close);
    el("#filtersApply").addEventListener("click", () => { close(); el("#catTitle").scrollIntoView({ behavior: "smooth", block: "start" }); });
    backdrop.addEventListener("click", close);
    window.matchMedia("(min-width: 901px)").addEventListener("change", (m) => { if (m.matches && panel.classList.contains("is-open")) close(); });
  }

  // Menu do cabeçalho (hamburger) no mobile — mesmo comportamento da PDP
  function bindHeaderMenu() {
    const toggle = el("#menuToggle");
    const nav = el("#mainNav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Init: lê os filtros da URL (/feminino/tenis/casual?marca=...)
  Object.assign(state, fromURL());
  buildQuick();
  buildFacets();
  setupPrice();
  bindControls();
  bindQuickBuy();
  bindDrawer();
  bindHeaderMenu();
  update({ keepPage: true, history: "replace" }); // /categoria.html vira /feminino
})();
