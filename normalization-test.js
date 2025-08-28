/**
 * =================================================================================
 * SCRIPT DEFINITIVO v11 (CORREGIDO - A PRUEBA DE SVGs)
 * =================================================================================
 *
 * CORRECCIÓN CRÍTICA:
 * - Se solucionó el error "el.className.split is not a function".
 * - Se reemplazó el uso de `el.className` por `el.getAttribute('class')` en la poda
 *   de clases para manejar correctamente los elementos SVG y otros casos borde.
 *
 * USO:
 * - Copiar y pegar TODO este código en la consola del desarrollador.
 *
 * RESULTADO:
 * - Dibuja bordes visuales en islas y productos.
 * - Imprime el HTML limpio de cada isla en la consola, listo para copiar.
 */
(async function runFinalCorrectedSystem_V11() {
  console.log("%c🚀 INICIANDO SISTEMA DEFINITIVO v11 (CORREGIDO) 🚀", "color: #00A36C; font-size: 18px; font-weight: bold;");

  // --- MÓDULO 1: DEFINICIÓN DE TODAS LAS HERRAMIENTAS ---

  const injectDebuggerStyles = () => {
    const styleId = 'chatbot-debugger-styles-v11';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .chatbot-debug-zone-v11 { outline: 3px dashed #007bff !important; outline-offset: 3px; position: relative; }
      .chatbot-debug-zone-v11::before { content: 'Isla (v11)'; position: absolute; top: 0; left: 0; background-color: #007bff; color: white; padding: 2px 5px; font-size: 12px; font-family: sans-serif; z-index: 9998; }
      .chatbot-debug-product-v11 { outline: 2px solid #28a745 !important; outline-offset: -2px; position: relative; }
      .chatbot-debug-product-v11::before { content: 'Producto'; position: absolute; bottom: 0; right: 0; background-color: #28a745; color: white; padding: 1px 4px; font-size: 10px; z-index: 9999; }
    `;
    document.head.appendChild(style);
  };

  const normalizeAndPruneHtml = (rawHtml, baseUrl = window.location.origin) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const tagsAndSelectorsToRemove = ['script', 'style', 'link', 'head', 'meta', 'noscript', 'iframe', 'canvas', 'video', 'audio', 'header', 'footer', 'nav', 'aside', '[class*="cookie"]', '[class*="popup"]', '[class*="modal"]'];
    doc.querySelectorAll(tagsAndSelectorsToRemove.join(', ')).forEach(el => el.remove());
    doc.querySelectorAll('svg').forEach(svg => { if (svg.outerHTML.length > 500) { svg.innerHTML = '<!-- SVG Pruned -->'; } });
    const attributeWhitelist = ['class', 'href', 'src', 'alt', 'title'];
    doc.querySelectorAll('*').forEach(el => {
        const attributes = [...el.attributes];
        for (const attr of attributes) { if (!attributeWhitelist.includes(attr.name.toLowerCase())) { el.removeAttribute(attr.name); } }
    });
    doc.querySelectorAll('[class]').forEach(el => {
      // CORRECCIÓN CLAVE AQUÍ: Usar getAttribute para manejar SVGs y otros casos borde.
      const classAttr = el.getAttribute('class');
      if (!classAttr) return; // Si por alguna razón el atributo está vacío, saltar.

      const originalClasses = classAttr.split(/\s+/);
      const prunedClasses = originalClasses.filter(cls => !cls.includes(':') && !cls.includes('--') && !cls.match(/^[whbmtp-]/) && cls.length > 2).filter((v, i, a) => a.indexOf(v) === i);
      if (prunedClasses.length > 0) { el.className = prunedClasses.slice(0, 5).join(' '); } else { el.removeAttribute('class'); }
    });
    doc.querySelectorAll('[href], [src]').forEach(el => { try { const attrName = el.hasAttribute('href') ? 'href' : 'src'; const value = el.getAttribute(attrName); if (value && !value.startsWith('mailto:') && !value.startsWith('tel:') && !value.startsWith('javascript:')) { const absoluteUrl = new URL(value, baseUrl).href; el.setAttribute(attrName, absoluteUrl); } } catch (e) {} });
    let cleanHtml = doc.body.innerHTML;
    cleanHtml = cleanHtml.replace(/<!--[\s\S]*?-->/g, '');
    cleanHtml = cleanHtml.replace(/\s\s+/g, ' ').trim();
    return cleanHtml;
  };

  const findAndScoreProductZones = () => {
    const SCORE_THRESHOLD = 1.5;
    const candidateSelectors = 'section, div[class*="carousel"], div[class*="slider"], div[class*="grid"], div[class*="collection"], div[class*="list"]';
    const candidates = [];
    document.querySelectorAll(candidateSelectors).forEach(el => { const rect = el.getBoundingClientRect(); if (rect.height > 150 && rect.width > 200 && el.children.length > 1) { candidates.push(el); } });
    const scoredZones = [];
    const topLevelCandidates = candidates.filter(el => !candidates.some(parent => parent !== el && parent.contains(el)));
    topLevelCandidates.forEach(el => {
      let score = 0;
      const textContent = el.textContent.toLowerCase();
      const childCount = el.children.length;
      const keywordMatches = (textContent.match(/precio|comprar|añadir|carrito|oferta|\$|€|ver producto/gi) || []).length;
      score += keywordMatches * 0.5;
      const imageCount = el.querySelectorAll('img').length;
      if (imageCount > 1) { score += (imageCount / childCount) * 2; }
      const linkCount = el.querySelectorAll('a').length;
      if (linkCount > 1) { score += (linkCount / childCount); }
      if (textContent.length / childCount > 500 && textContent.length > 2000) { score -= 1; }
      if (score > 0) { scoredZones.push({ element: el, score: score }); }
    });
    const finalZones = scoredZones.filter(zone => zone.score >= SCORE_THRESHOLD).sort((a, b) => b.score - a.score);
    return finalZones.map(z => z.element);
  };
  
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  // --- MÓDULO 2: LÓGICA PRINCIPAL DE PROCESAMIENTO ---
  
  const processAllZones = () => {
    const finalHtmlPayloads = [];
    const zonesToProcess = findAndScoreProductZones();

    if (zonesToProcess.length === 0) {
      console.warn("ADVERTENCIA: No se encontró ninguna zona de productos de alta probabilidad.");
      return;
    }
    
    console.log(`Se encontraron ${zonesToProcess.length} zonas. Aplicando bordes y extrayendo HTML...`);

    const fakeAiRecipe = {
        itemContainerSelector: ".vtex-product-summary-2-x-container, .product-item",
        fields: {}
    };

    const applyRecipeToZone = (recipe, scopeElement) => {
        if (!recipe || !recipe.itemContainerSelector) return;
        const productElements = scopeElement.querySelectorAll(recipe.itemContainerSelector);
        if (productElements.length > 0) {
            productElements.forEach(el => el.classList.add('chatbot-debug-product-v11'));
        }
    };

    for (const zone of zonesToProcess) {
      zone.classList.add('chatbot-debug-zone-v11');
      const cleanHtml = normalizeAndPruneHtml(zone.innerHTML, window.location.href);
      finalHtmlPayloads.push(cleanHtml);
      applyRecipeToZone(fakeAiRecipe, zone);
    }

    window.aiPayloads = finalHtmlPayloads;

    console.log("%c✅ PROCESO COMPLETADO.", "background: #28a745; color: white; font-size: 14px; padding: 5px; border-radius: 3px;");
    console.log("El HTML limpio de cada isla está en el array de abajo y en 'window.aiPayloads'.");
    console.log(finalHtmlPayloads);
    console.log("%c💡 Para copiar el HTML de la primera isla, escribe en la consola: 'copy(window.aiPayloads[0])'", "font-weight: bold; color: blue; font-size: 12px;");
  };

  // --- MÓDULO 3: EJECUCIÓN Y VIGILANCIA ---
  
  injectDebuggerStyles();
  processAllZones();

  const observer = new MutationObserver(debounce(() => {
    console.log(`%c[OBSERVER] Cambios detectados. Re-evaluando...`, 'font-style: italic; color: #555;');
    document.querySelectorAll('.chatbot-debug-zone-v11, .chatbot-debug-product-v11').forEach(el => {
      el.classList.remove('chatbot-debug-zone-v11', 'chatbot-debug-product-v11');
    });
    processAllZones();
  }, 1500));
  
  observer.observe(document.body, { childList: true, subtree: true });

  window.stopChatbotSystemV11 = () => {
      observer.disconnect();
      document.querySelectorAll('.chatbot-debug-zone-v11, .chatbot-debug-product-v11').forEach(el => {
        el.classList.remove('chatbot-debug-zone-v11', 'chatbot-debug-product-v11');
      });
      document.getElementById('chatbot-debugger-styles-v11')?.remove();
      console.log("%c🛑 Sistema v11 detenido y elementos visuales limpiados.", "color: red; font-weight: bold;");
  };
  console.log("💡 Consejo: Escriba 'stopChatbotSystemV11()' para detener y limpiar.");

})();