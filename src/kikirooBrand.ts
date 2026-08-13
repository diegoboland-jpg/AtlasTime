const BRAND_FROM = "AtlasTime";
const BRAND_TO = "Kikiroo";

function replaceBrandText(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  textNodes.forEach((node) => {
    if (node.nodeValue?.includes(BRAND_FROM)) {
      node.nodeValue = node.nodeValue.replaceAll(BRAND_FROM, BRAND_TO);
    }
  });

  root.querySelectorAll?.("[aria-label],[title]").forEach((element) => {
    for (const attribute of ["aria-label", "title"]) {
      const value = element.getAttribute(attribute);
      if (value?.includes(BRAND_FROM)) element.setAttribute(attribute, value.replaceAll(BRAND_FROM, BRAND_TO));
    }
  });
}

export function applyKikirooBrand() {
  document.title = "Kikiroo — Time. Anywhere. Together.";
  replaceBrandText(document);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) replaceBrandText(node as Element);
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.includes(BRAND_FROM)) {
          node.nodeValue = node.nodeValue.replaceAll(BRAND_FROM, BRAND_TO);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
