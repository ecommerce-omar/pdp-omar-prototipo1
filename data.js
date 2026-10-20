/* ============================================================
   data.js — dados ILUSTRATIVOS do produto (protótipo).
   Produto baseado no mockup da Omar: New Balance 327v1 Bege Feminino.
   Em produção, estes dados viriam do catálogo/VTEX (produto, SKUs,
   preços, estoque, imagens, avaliações). A estrutura espelha o que
   uma PDP recebe: um produto com variações (cor) e, dentro de cada
   cor, os tamanhos/SKUs.
   NÃO usar estes valores como preços/estoque reais.
   ============================================================ */
window.OMAR_PRODUCT = {
  id: "NB327V1",
  name: "Tênis New Balance 327v1 Bege Feminino",
  code: "110942",                 // Código exibido na PDP (mockup)
  brand: { name: "New Balance", url: "#" },
  rating: { value: 4.8, count: 124, recommend: 96 }, // 4,8 (124) · 96% recomendam
  pixDiscountPct: 5,              // PIX com 5% de desconto (mockup)
  // Preço de Club Omar é uma CONDIÇÃO COMERCIAL específica (item 5),
  // não substitui o preço regular do catálogo. Fonte única deste valor.
  clubOmarPrice: 28000,          // centavos => R$ 280,00
  colors: [
    {
      id: "bege",
      label: "Bege",
      swatch: "#cdbfa6",
      // Imagens do produto recortadas do mockup de exemplo.
      // Em produção, usar a mídia real cadastrada no SKU (catálogo/VTEX).
      media: [
        { type: "image", src: "img/produto-principal.png", alt: "Tênis New Balance 327v1 bege feminino, vista lateral" },
        { type: "image", src: "img/thumb-2.png", alt: "Tênis New Balance 327v1 bege feminino, vista alternativa" },
        { type: "image", src: "img/thumb-3.png", alt: "Tênis New Balance 327v1 bege feminino, detalhe" },
        { type: "image", src: "img/thumb-4.png", alt: "Tênis New Balance 327v1 bege feminino, detalhe do cabedal" },
        { type: "video", poster: "img/produto-principal.png", alt: "Vídeo do produto New Balance 327v1 bege feminino" }
      ],
      refBase: "NB327V1-BEGE",
      // disponibilidade por tamanho (36 indisponível, conforme mockup)
      sizes: [
        { size: "34", available: true },
        { size: "35", available: true },
        { size: "36", available: false },
        { size: "37", available: true },
        { size: "38", available: true },
        { size: "39", available: true },
        { size: "40", available: true }
      ],
      price: { list: 69999, now: 55999, installments: { count: 10, value: 5599 } } // centavos
    },
    {
      id: "rosa",
      label: "Rosa claro",
      swatch: "#e8cfcf",
      media: [
        { type: "image", src: "img/produto-rosa.png", alt: "Tênis New Balance 327v1 rosa claro feminino, vista lateral" },
        { type: "image", src: "img/thumb-3.png", alt: "Tênis New Balance 327v1 rosa claro feminino, detalhe" },
        { type: "video", poster: "img/produto-rosa.png", alt: "Vídeo do produto New Balance 327v1 rosa claro feminino" }
      ],
      refBase: "NB327V1-ROSA",
      sizes: [
        { size: "34", available: false },
        { size: "35", available: true },
        { size: "36", available: true },
        { size: "37", available: true },
        { size: "38", available: false },
        { size: "39", available: true },
        { size: "40", available: true }
      ],
      price: { list: 69999, now: 57999, installments: { count: 10, value: 5799 } }
    }
  ],
  // Produtos relacionados conforme o mockup.
  // Cada item tem image (imagem principal), href (link p/ a PDP),
  // preço, preço antigo e desconto quando disponíveis.
  // Em produção, estes campos viriam do catálogo/VTEX.
  related: [
    { name: "Tênis New Balance 574 Feminino", href: "#", image: "img/related/nb574.png", price: "R$ 499,99", oldPrice: "R$ 599,99", discount: "-20%" },
    { name: "Tênis Nike Air Force 1 Feminino", href: "#", image: "img/related/airforce.png", price: "R$ 529,99", oldPrice: "R$ 759,99", discount: "-30%" },
    { name: "Tênis Adidas Grand Court Feminino", href: "#", image: "img/related/grandcourt.png", price: "R$ 299,99", oldPrice: "R$ 379,99", discount: "-20%" },
    { name: "Tênis Asics Gel-Cacle 10 Feminino", href: "#", image: "img/related/gelcacle.png", price: "R$ 449,99", oldPrice: "R$ 559,99", discount: "-20%" },
    // Sem imagem cadastrada: deve cair no placeholder (teste do fallback)
    { name: "Meia Esportiva Feminina Cano Baixo", href: "#", image: "", price: "R$ 29,90" }
  ]
};

/* Gera um placeholder SVG (data-uri) — evita dependências externas. */
function ph(bg, text) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>` +
    `<rect width='100%' height='100%' fill='${bg}'/>` +
    `<text x='50%' y='50%' font-family='Segoe UI, Arial' font-size='26' ` +
    `fill='#6b6150' text-anchor='middle' dominant-baseline='middle'>${text}</text>` +
    `</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
