/* ============================================================
   app.js — comportamento da PDP (protótipo).
   Liga seleção de variação -> imagens, preço, SKU, disponibilidade.
   Ações de compra/frete são SIMULADAS (estados loading/erro/sucesso).
   Pontos marcados como [PENDENTE] dependem de integração real.
   ============================================================ */
(function () {
  "use strict";

  const P = window.OMAR_PRODUCT;
  const money = (cents) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Estado atual da seleção
  const state = {
    colorId: P.colors[0].id,
    size: null,
    mediaIndex: 0
  };

  const el = (sel) => document.querySelector(sel);
  const currentColor = () => P.colors.find((c) => c.id === state.colorId);

  // ---------------------------------------------------------
  // Galeria
  // ---------------------------------------------------------
  function renderGallery() {
    const color = currentColor();
    const media = color.media;
    const main = el("#galleryMain");
    const dots = el("#galleryDots");
    const thumbs = el("#galleryThumbs");

    // Garante índice válido (ex.: ao trocar de variação)
    if (state.mediaIndex >= media.length) state.mediaIndex = 0;
    const m = media[state.mediaIndex];

    // --- Miniaturas na lateral ---
    // Todas as miniaturas exibem a PRIMEIRA foto da variação.
    // A miniatura de vídeo mantém o ícone de play por cima.
    const firstImage = media.find((x) => x.type === "image") || media[0];
    thumbs.innerHTML = "";
    media.forEach((item, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery__thumb" + (item.type === "video" ? " gallery__thumb--video" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(i === state.mediaIndex));
      btn.setAttribute("aria-label", item.alt);

      const img = document.createElement("img");
      img.src = firstImage.src;      // sempre a primeira foto
      img.alt = firstImage.alt;
      img.loading = "lazy";
      btn.appendChild(img);

      if (item.type === "video") {
        const play = document.createElement("span");
        play.className = "gallery__thumb-play";
        play.setAttribute("aria-hidden", "true");
        play.textContent = "▶";
        btn.appendChild(play);
      }

      btn.addEventListener("click", () => { state.mediaIndex = i; renderGallery(); });
      li.appendChild(btn);
      thumbs.appendChild(li);
    });

    main.classList.remove("is-zoomed");
    main.innerHTML = "";

    if (m.type === "video") {
      // Suporte a vídeo quando houver mídia cadastrada
      const vid = document.createElement("video");
      vid.controls = true;
      vid.poster = m.poster;
      vid.className = "gallery__media gallery__media--enter";
      vid.setAttribute("aria-label", m.alt);
      main.appendChild(vid);
      requestAnimationFrame(() => vid.classList.remove("gallery__media--enter"));
    } else {
      const img = document.createElement("img");
      img.src = m.src;
      img.alt = m.alt;
      img.className = "gallery__media gallery__media--enter";
      img.loading = state.mediaIndex === 0 ? "eager" : "lazy";
      // Zoom no clique
      img.addEventListener("click", () => main.classList.toggle("is-zoomed"));
      main.appendChild(img);
      // Transição suave de entrada
      requestAnimationFrame(() => img.classList.remove("gallery__media--enter"));
    }

    // Setas só fazem sentido com mais de uma mídia
    const multiple = media.length > 1;
    el(".gallery__nav--prev").style.display = multiple ? "" : "none";
    el(".gallery__nav--next").style.display = multiple ? "" : "none";

    // Indicadores (dots)
    dots.innerHTML = "";
    if (multiple) {
      media.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "gallery__dot" + (i === state.mediaIndex ? " is-active" : "");
        dot.setAttribute("aria-label", "Ir para a imagem " + (i + 1));
        dot.addEventListener("click", () => { state.mediaIndex = i; renderGallery(); });
        dots.appendChild(dot);
      });
    }
  }

  // Navegação circular: passa do fim para o início e vice-versa.
  function navMedia(delta) {
    const total = currentColor().media.length;
    state.mediaIndex = (state.mediaIndex + delta + total) % total;
    renderGallery();
  }

  // ---------------------------------------------------------
  // Preço / SKU (atualiza conforme variação)
  // ---------------------------------------------------------
  function renderPrice() {
    const color = currentColor();
    const pr = color.price;
    const disc = Math.round((1 - pr.now / pr.list) * 100);
    const pixPct = P.pixDiscountPct || 0;
    const pixValue = Math.round(pr.now * (1 - pixPct / 100));

    el(".price-box__old-value").textContent = money(pr.list);
    el(".price-box .price-box__discount").textContent = "-" + disc + "%";
    el(".price-box__value").textContent = money(pr.now);
    el(".price-box__pix-value").textContent = money(pixValue);
    el(".price-box__pix-label").textContent = "no PIX (" + pixPct + "% de desconto)";
    el(".price-box__installments").textContent =
      "ou em até " + pr.installments.count + "x de " + money(pr.installments.value) + " sem juros";

    // Badge de desconto na galeria (ex.: "-20% OFF")
    el("#galleryBadge").textContent = disc > 0 ? "-" + disc + "% OFF" : "";

    // CTA fixo mobile: preço regular + condição Club Omar
    const sticky = el(".sticky-cta__price");
    if (sticky) {
      sticky.querySelector("span").textContent = money(pr.now);
      sticky.querySelector("strong").textContent = "Club Omar: " + money(P.clubOmarPrice);
    }

    // Club Omar: valor fixo da condição comercial, independente da cor
    el(".club-omar__amount").textContent = money(P.clubOmarPrice);
  }

  function renderSku() {
    // Código do produto é fixo; acrescenta o tamanho (SKU) quando selecionado.
    const ref = P.code + (state.size ? "-" + state.size : "");
    el("#skuRef").textContent = ref;
  }

  // ---------------------------------------------------------
  // Seletor de cor
  // ---------------------------------------------------------
  function renderColors() {
    const wrap = el(".selector__options--color");
    wrap.innerHTML = "";
    P.colors.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip chip--color";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(c.id === state.colorId));
      b.setAttribute("aria-label", "Cor " + c.label);
      b.title = c.label;
      const dot = document.createElement("span");
      dot.style.background = c.swatch;
      b.appendChild(dot);
      b.addEventListener("click", () => {
        state.colorId = c.id;
        state.mediaIndex = 0;
        state.size = null; // tamanho depende da cor/estoque
        el("#colorChosen").textContent = c.label;
        el("#sizeChosen").textContent = "Selecione";
        renderAll();
      });
      wrap.appendChild(b);
    });
    el("#colorChosen").textContent = currentColor().label;
  }

  // ---------------------------------------------------------
  // Seletor de tamanho (indica indisponíveis - item 4.2)
  // ---------------------------------------------------------
  function renderSizes() {
    const wrap = el(".selector__options--size");
    wrap.innerHTML = "";
    currentColor().sizes.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = s.size;
      b.setAttribute("role", "radio");
      if (!s.available) {
        b.setAttribute("aria-disabled", "true");
        b.setAttribute("aria-label", "Tamanho " + s.size + " indisponível");
        b.disabled = true;
      } else {
        b.setAttribute("aria-checked", String(s.size === state.size));
        b.addEventListener("click", () => {
          state.size = s.size;
          el("#sizeChosen").textContent = s.size;
          el("#sizeError").hidden = true;
          renderSizes();
          renderSku();
        });
      }
      wrap.appendChild(b);
    });
  }

  // ---------------------------------------------------------
  // Ações de compra (simuladas: loading -> sucesso)
  // ---------------------------------------------------------
  function requireSize() {
    if (!state.size) {
      el("#sizeError").hidden = false;
      el("#sizeSelector").scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  function setStatus(msg, kind) {
    const s = el("#actionStatus");
    s.textContent = msg;
    s.className = "action-status" + (kind ? " is-" + kind : "");
  }

  function fakeAsync(btn, loadingMsg, successMsg) {
    btn.setAttribute("aria-busy", "true");
    setStatus(loadingMsg, "");
    // [PENDENTE] Integração real com carrinho/checkout VTEX.
    return new Promise((res) => setTimeout(res, 700)).then(() => {
      btn.removeAttribute("aria-busy");
      setStatus(successMsg, "success");
    });
  }

  function bindActions() {
    el("#btnAddCart").addEventListener("click", function () {
      if (!requireSize()) return;
      const ref = currentColor().refBase + "-" + state.size;
      fakeAsync(this, "Adicionando ao carrinho...", "Produto " + ref + " adicionado ao carrinho (simulação).");
    });

    el("#btnBuyNow").addEventListener("click", function () {
      if (!requireSize()) return;
      fakeAsync(this, "Processando...", "Redirecionando para o checkout (simulação).");
    });

    el("#stickyBuy").addEventListener("click", () => el("#btnBuyNow").click());

    el("#btnFav").addEventListener("click", function () {
      this.classList.toggle("is-active");
      const on = this.classList.contains("is-active");
      this.innerHTML = on ? "♥ Favoritado" : "♡ Favoritar";
    });

    el("#btnShare").addEventListener("click", async function () {
      const data = { title: P.name, url: location.href };
      if (navigator.share) {
        try { await navigator.share(data); } catch (e) { /* cancelado */ }
      } else {
        try {
          await navigator.clipboard.writeText(location.href);
          setStatus("Link copiado para a área de transferência.", "success");
        } catch (e) {
          setStatus("Não foi possível compartilhar neste navegador.", "error");
        }
      }
    });
  }

  // ---------------------------------------------------------
  // Frete (simulado) — item 4.2
  // ---------------------------------------------------------
  function bindShipping() {
    const form = el("#cepForm");
    const input = el("#cepInput");
    const results = el("#shippingResults");

    // máscara simples de CEP
    input.addEventListener("input", () => {
      let v = input.value.replace(/\D/g, "").slice(0, 8);
      if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5);
      input.value = v;
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const digits = input.value.replace(/\D/g, "");
      results.innerHTML = "";
      if (digits.length !== 8) {
        results.innerHTML = '<li style="color:var(--omar-red)">Informe um CEP válido com 8 dígitos.</li>';
        return;
      }
      results.innerHTML = '<li>Calculando...</li>';
      // [PENDENTE] Cálculo real via integração logística/VTEX shipping.
      setTimeout(() => {
        results.innerHTML =
          '<li><span>Entrega padrão</span><span>5 a 8 dias úteis — R$ 24,90</span></li>' +
          '<li><span>Entrega expressa</span><span>2 a 3 dias úteis — R$ 39,90</span></li>' +
          '<li><span>Retirar na loja</span><span>Disponível em 1 dia — Grátis</span></li>';
      }, 700);
    });
  }

  // ---------------------------------------------------------
  // Guia de tamanhos (modal acessível) — item 4.7
  // ---------------------------------------------------------
  function bindSizeGuide() {
    const modal = el("#sizeGuideModal");
    const openBtn = el("#openSizeGuide");
    let lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      modal.querySelector(".modal__close").focus();
      document.addEventListener("keydown", onKey);
    }
    function close() {
      modal.hidden = true;
      document.removeEventListener("keydown", onKey);
      if (lastFocus) lastFocus.focus();
    }
    function onKey(e) { if (e.key === "Escape") close(); }

    openBtn.addEventListener("click", open);
    modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  }

  // ---------------------------------------------------------
  // Q&A: busca simples
  // ---------------------------------------------------------
  function bindQA() {
    const input = el("#qaSearch");
    const items = Array.from(document.querySelectorAll(".qa__item"));
    input.addEventListener("input", () => {
      const q = input.value.toLowerCase().trim();
      items.forEach((it) => {
        it.hidden = q && !it.textContent.toLowerCase().includes(q);
      });
    });
  }

  // ---------------------------------------------------------
  // Produtos relacionados — item 4.11
  // ---------------------------------------------------------
  function renderRelated() {
    const wrap = el("#relatedCarousel");
    wrap.innerHTML = "";
    P.related.forEach((r) => {
      const a = document.createElement("a");
      a.href = r.href || "#";              // link para a PDP do produto
      a.className = "product-card";

      // --- área da imagem ---
      const imgBox = document.createElement("div");
      imgBox.className = "product-card__img";

      if (r.discount) {
        const badge = document.createElement("span");
        badge.className = "product-card__discount";
        badge.textContent = r.discount;
        imgBox.appendChild(badge);
      }

      // Imagem principal do produto. Sem imagem -> placeholder (sem quebrar).
      if (r.image) {
        const img = document.createElement("img");
        img.className = "product-card__photo";
        img.src = r.image;
        img.alt = r.name;
        img.loading = "lazy";            // carregamento otimizado
        img.decoding = "async";
        img.width = 240;                 // dimensões reservadas (evita CLS)
        img.height = 240;
        // Se a URL falhar, troca pelo placeholder em tempo de execução
        img.addEventListener("error", function () {
          this.replaceWith(makeRelatedPlaceholder());
        });
        imgBox.appendChild(img);
      } else {
        imgBox.appendChild(makeRelatedPlaceholder());
      }

      // --- corpo do card ---
      const body = document.createElement("div");
      body.className = "product-card__body";

      const name = document.createElement("p");
      name.className = "product-card__name";
      name.textContent = r.name;
      body.appendChild(name);

      if (r.oldPrice) {
        const old = document.createElement("p");
        old.className = "product-card__old";
        const s = document.createElement("s");
        s.textContent = r.oldPrice;
        old.appendChild(s);
        body.appendChild(old);
      }

      const price = document.createElement("p");
      price.className = "product-card__price";
      price.textContent = r.price;
      body.appendChild(price);

      a.appendChild(imgBox);
      a.appendChild(body);
      wrap.appendChild(a);
    });
  }

  // Placeholder visual para produto sem imagem cadastrada.
  function makeRelatedPlaceholder() {
    const ph = document.createElement("span");
    ph.className = "product-card__placeholder";
    ph.setAttribute("aria-hidden", "true");
    ph.textContent = "👟";
    return ph;
  }

  // ---------------------------------------------------------
  // Navegação da galeria por setas
  // ---------------------------------------------------------
  function bindGalleryNav() {
    el(".gallery__nav--prev").addEventListener("click", () => navMedia(-1));
    el(".gallery__nav--next").addEventListener("click", () => navMedia(1));

    const stage = el(".gallery__stage");

    // Navegação por teclado quando a galeria está focada
    stage.setAttribute("tabindex", "0");
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { navMedia(-1); e.preventDefault(); }
      if (e.key === "ArrowRight") { navMedia(1); e.preventDefault(); }
    });

    // Swipe no mobile (gesto de deslizar)
    let startX = null;
    let startY = null;
    stage.addEventListener("touchstart", (e) => {
      const t = e.changedTouches[0];
      startX = t.clientX; startY = t.clientY;
    }, { passive: true });

    stage.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      // Só considera swipe horizontal relevante (ignora scroll vertical)
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        navMedia(dx < 0 ? 1 : -1); // arrasta p/ esquerda -> próxima
      }
      startX = null; startY = null;
    }, { passive: true });
  }

  // ---------------------------------------------------------
  // Menu do cabeçalho (hamburger) no mobile
  // ---------------------------------------------------------
  function bindHeaderMenu() {
    const toggle = el("#menuToggle");
    const nav = el("#mainNav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // ---------------------------------------------------------
  function renderAll() {
    renderGallery();
    renderColors();
    renderSizes();
    renderPrice();
    renderSku();
  }

  // Init
  renderAll();
  renderRelated();
  bindActions();
  bindShipping();
  bindSizeGuide();
  bindQA();
  bindGalleryNav();
  bindHeaderMenu();
})();
