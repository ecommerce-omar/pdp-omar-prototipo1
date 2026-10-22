/* ============================================================
   categoria-data.js — dados ILUSTRATIVOS da página de categoria
   (PLP "Calçados Femininos"). Em produção, viriam da busca/catálogo
   VTEX (Intelligent Search): produtos, facetas, preços e estoque.
   Preços em centavos. NÃO usar como preços/estoque reais.
   ============================================================ */
window.OMAR_CATEGORY = {
  name: "Calçados Femininos",   // H1 base da PLP
  basePath: "feminino",         // raiz das URLs facetadas amigáveis (relativa à raiz do site)
  pixDiscountPct: 5,            // preço "no Pix" = preço regular - 5%
  freeShippingFrom: 19900,      // frete grátis para CARRINHO a partir de R$ 199
  // Subtotal simulado do carrinho (o header mostra 1 item). Em produção: orderForm VTEX.
  cart: { count: 1, subtotal: 8999 },
  installments: 10,             // 10x sem juros (padrão da loja)

  // Gênero gramatical de cada categoria (H1/breadcrumb: "Botas Femininas")
  categoryGender: {
    "Tênis": "m", "Chinelos": "m", "Sapatos": "m", "Tamancos": "m",
    "Botas": "f", "Sandálias": "f", "Sapatilhas": "f", "Bolsas": "f"
  },

  // Ordem de exibição da grade de tamanhos
  sizeOrder: ["33", "33/34", "34", "35", "35/36", "36", "37", "37/38", "38", "39", "39/40", "40", "41/42", "41", "42", "43/44", "44", "UN"],

  // Cores usadas no filtro (swatch) e no placeholder das imagens
  colors: {
    "Preto": "#222222", "Bege": "#d9c7a7", "Branco": "#f4f4f4", "Off White": "#efe9dc",
    "Marrom": "#7a4b2a", "Cinza": "#9aa0a6", "Rosa": "#f0b9c4", "Vermelho": "#c8102e"
  },

  // Filtros sugeridos (chips acima da vitrine).
  // price: faixa em centavos (null = sem limite) | sel: valores de facetas | isNew: lançamentos
  quickFilters: [
    { id: "ate-150", group: "preco", label: "Até R$ 150", price: { min: null, max: 15000 } },
    { id: "150-300", group: "preco", label: "R$ 150 – R$ 300", price: { min: 15000, max: 30000 } },
    { id: "acima-300", group: "preco", label: "Acima de R$ 300", price: { min: 30000, max: null } },
    { id: "tenis-casual", group: "sugestao", label: "Tênis Casual", sel: { category: ["Tênis"], style: ["Casual"] } },
    { id: "sandalias", group: "sugestao", label: "Sandálias", sel: { category: ["Sandálias"] } },
    { id: "conforto", group: "sugestao", label: "Linha Conforto", sel: { style: ["Conforto"] } },
    { id: "lancamentos", group: "sugestao", label: "Lançamentos", isNew: true },
    { id: "vizzano", group: "marca", label: "Vizzano", sel: { brand: ["Vizzano"] } },
    { id: "moleca", group: "marca", label: "Moleca", sel: { brand: ["Moleca"] } }
  ],

  // Avaliações por produto: [nota média, quantidade]. Sem entrada = sem avaliações.
  // Em produção, vir da integração de reviews (mesma fonte da PDP).
  ratings: {
    p01: [4.8, 124], p02: [4.6, 58], p03: [4.5, 212], p04: [4.7, 41], p05: [4.9, 530],
    p06: [4.4, 87], p07: [4.6, 33], p08: [4.7, 96], p09: [4.2, 19], p10: [4.5, 27],
    p11: [4.8, 143], p12: [4.9, 318], p13: [4.6, 12], p14: [4.3, 45], p15: [4.8, 402],
    p16: [4.6, 77], p17: [4.4, 8], p18: [4.1, 64], p19: [4.5, 29], p20: [4.7, 55],
    p21: [4.0, 38], p22: [4.3, 14], p23: [3.9, 11], p24: [4.8, 266], p25: [4.7, 189],
    p26: [4.4, 22], p28: [4.6, 31], p30: [4.2, 26]
  },

  // tags: "queima" => Grande Queima | "inverno" => Inverno 2026
  // style: estilo/linha (gera URL /feminino/{categoria}/{estilo})
  // rank: ordem de relevância | isNew: lançamento
  products: [
    { id: "p01", name: "Tênis New Balance Esportivo 327v1 Bege Feminino", brand: "New Balance", category: "Tênis", style: "Casual", color: "Bege", sizes: ["34", "35", "37", "38", "39", "40"], list: 59999, price: 59999, image: "/img/produto-principal.png", href: "/index.html", tags: [], rank: 1, isNew: true },
    { id: "p02", name: "Tênis Puma Casual Shuffle Downtown Branco Feminino", brand: "Puma", category: "Tênis", style: "Casual", color: "Branco", sizes: ["35", "36", "37", "38"], list: 36999, price: 36999, tags: [], rank: 2 },
    { id: "p03", name: "Tênis Vizzano Casual Branco Feminino 1444.100.29492.21007", brand: "Vizzano", category: "Tênis", style: "Casual", color: "Off White", sizes: ["34", "35", "36", "37", "38", "39"], list: 17999, price: 17999, tags: [], rank: 3 },
    { id: "p04", name: "Tênis New Balance 327v1 Rosa Claro Feminino", brand: "New Balance", category: "Tênis", style: "Casual", color: "Rosa", sizes: ["35", "36", "37", "39", "40"], list: 69999, price: 57999, image: "/img/produto-rosa.png", href: "/index.html", tags: [], rank: 4, isNew: true },
    { id: "p05", name: "Chinelo Grendene Ipanema Fashion Print Preto Feminino", brand: "Grendene", category: "Chinelos", style: "Casual", color: "Preto", sizes: ["33/34", "35/36", "37/38", "39/40"], list: 2999, price: 2999, tags: [], rank: 5 },
    { id: "p06", name: "Tênis Olympikus Esportivo Citrus 2 Cinza Feminino", brand: "Olympikus", category: "Tênis", style: "Esportivo", color: "Cinza", sizes: ["34", "35", "36", "37", "38", "39"], list: 19999, price: 19999, tags: [], rank: 6 },
    { id: "p07", name: "Bota Pegada Cano Curto Preto Feminino 280511", brand: "Pegada", category: "Botas", style: "Casual", color: "Preto", sizes: ["34", "35", "36", "37", "38"], list: 28999, price: 19999, tags: ["queima", "inverno"], rank: 7 },
    { id: "p08", name: "Bota Bottero Coturno Preto Feminina 349101", brand: "Bottero", category: "Botas", style: "Casual", color: "Preto", sizes: ["34", "35", "36", "37", "38", "39"], list: 33000, price: 19999, tags: ["queima", "inverno"], rank: 8 },
    { id: "p09", name: "Tênis Ramarim Casual Branco Feminino 74201-1", brand: "Ramarim", category: "Tênis", style: "Casual", color: "Branco", sizes: ["34", "35", "36", "37"], list: 19999, price: 9999, tags: ["queima"], rank: 9 },
    { id: "p10", name: "Bota Bottero Cano Curto Preto Feminino 376801", brand: "Bottero", category: "Botas", style: "Conforto", color: "Preto", sizes: ["35", "36", "37", "38", "39"], list: 43000, price: 26999, tags: ["queima", "inverno"], rank: 10 },
    { id: "p11", name: "Tênis New Balance 574 Feminino", brand: "New Balance", category: "Tênis", style: "Casual", color: "Cinza", sizes: ["35", "36", "37", "38", "39"], list: 59999, price: 49999, image: "/img/related/nb574.png", tags: [], rank: 11 },
    { id: "p12", name: "Tênis Nike Air Force 1 Feminino", brand: "Nike", category: "Tênis", style: "Casual", color: "Branco", sizes: ["34", "35", "36", "37", "38", "39", "40"], list: 75999, price: 52999, image: "/img/related/airforce.png", tags: [], rank: 12 },
    { id: "p13", name: "Bota Dakota Cano Alto Preto Feminina", brand: "Dakota", category: "Botas", style: "Conforto", color: "Preto", sizes: ["35", "36", "37", "38"], list: 39999, price: 32999, tags: ["inverno"], rank: 13, isNew: true },
    { id: "p14", name: "Bota Moleca Cano Curto Café Feminina", brand: "Moleca", category: "Botas", style: "Casual", color: "Marrom", sizes: ["34", "35", "36", "37", "38", "39"], list: 25999, price: 17999, tags: ["inverno"], rank: 14 },
    { id: "p15", name: "Chinelo Havaianas Slim Floral Marrom Feminino", brand: "Havaianas", category: "Chinelos", style: "Casual", color: "Marrom", sizes: ["33/34", "35/36", "37/38", "39/40"], list: 5999, price: 5699, tags: [], rank: 15 },
    { id: "p16", name: "Tênis Adidas Grand Court Feminino", brand: "Adidas", category: "Tênis", style: "Casual", color: "Branco", sizes: ["34", "35", "36", "37", "38", "39"], list: 37999, price: 29999, image: "/img/related/grandcourt.png", tags: [], rank: 16 },
    { id: "p17", name: "Sandália Beira Rio Salto Bloco Nude Feminina", brand: "Beira Rio", category: "Sandálias", style: "Social", color: "Bege", sizes: ["34", "35", "36", "37", "38", "39"], list: 15999, price: 12999, tags: [], rank: 17, isNew: true },
    { id: "p18", name: "Sandália Vizzano Rasteira Preta Feminina", brand: "Vizzano", category: "Sandálias", style: "Casual", color: "Preto", sizes: ["34", "35", "36", "37", "38"], list: 9999, price: 8999, tags: [], rank: 18 },
    { id: "p19", name: "Sapatilha Moleca Bico Fino Vermelha Feminina", brand: "Moleca", category: "Sapatilhas", style: "Social", color: "Vermelho", sizes: ["34", "35", "36", "37", "38", "39"], list: 8999, price: 7999, tags: [], rank: 19 },
    { id: "p20", name: "Tênis Asics Gel-Cacle 10 Feminino", brand: "Asics", category: "Tênis", style: "Esportivo", color: "Preto", sizes: ["35", "36", "37", "38", "39", "40"], list: 55999, price: 44999, image: "/img/related/gelcacle.png", tags: [], rank: 20 },
    { id: "p21", name: "Sapato Beira Rio Scarpin Preto Feminino", brand: "Beira Rio", category: "Sapatos", style: "Social", color: "Preto", sizes: ["34", "35", "36", "37", "38", "39"], list: 14999, price: 11999, tags: [], rank: 21 },
    { id: "p22", name: "Tamanco Piccadilly Plataforma Bege Feminino", brand: "Piccadilly", category: "Tamancos", style: "Conforto", color: "Bege", sizes: ["35", "36", "37", "38", "39"], list: 18999, price: 18999, tags: [], rank: 22 },
    { id: "p23", name: "Mule Mississipi Tressê Off White Feminino", brand: "Mississipi", category: "Sapatos", style: "Casual", color: "Off White", sizes: ["34", "35", "36", "37", "38"], list: 13999, price: 9999, tags: ["queima"], rank: 23 },
    { id: "p24", name: "Tênis Vans Old Skool Preto Feminino", brand: "Vans", category: "Tênis", style: "Casual", color: "Preto", sizes: ["35", "36", "37", "38", "39", "40", "41"], list: 44999, price: 39999, tags: [], rank: 24 },
    { id: "p25", name: "Chinelo Ipanema Anatomic Lapa Rosa Feminino", brand: "Grendene", category: "Chinelos", style: "Conforto", color: "Rosa", sizes: ["33/34", "35/36", "37/38", "39/40", "41/42"], list: 1599, price: 1499, tags: [], rank: 25 },
    { id: "p26", name: "Bota Vizzano Montaria Cano Alto Marrom Feminina", brand: "Vizzano", category: "Botas", style: "Social", color: "Marrom", sizes: ["34", "35", "36", "37", "38"], list: 35999, price: 24999, tags: ["queima", "inverno"], rank: 26 },
    { id: "p27", name: "Sandália Melissa Possession Rosa Feminina", brand: "Grendene", category: "Sandálias", style: "Casual", color: "Rosa", sizes: ["33/34", "35/36", "37/38", "39/40"], list: 14999, price: 13999, tags: [], rank: 27, isNew: true },
    { id: "p28", name: "Tênis Mizuno Wave Prophecy Branco Feminino", brand: "Mizuno", category: "Tênis", style: "Esportivo", color: "Branco", sizes: ["35", "36", "37", "38", "39"], list: 69999, price: 66499, tags: [], rank: 28 },
    { id: "p29", name: "Bolsa Feminina Transversal Preta UN", brand: "Vizzano", category: "Bolsas", style: "Casual", color: "Preto", sizes: ["UN"], list: 15999, price: 11999, tags: ["queima"], rank: 29 },
    { id: "p30", name: "Sapatilha Beira Rio Laço Bege Feminina", brand: "Beira Rio", category: "Sapatilhas", style: "Conforto", color: "Bege", sizes: ["34", "35", "36", "37", "38", "39"], list: 7999, price: 7999, tags: [], rank: 30 }
  ]
};
