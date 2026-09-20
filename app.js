const data = window.PORTFOLIO_DATA || { images: [], videos: [] };
const folderGroups = [
  { slug: "bunting", title: "Bunting", labels: ["Bunting"] },
  { slug: "durian-notes", title: "Durian Notes", labels: ["Editorial Notes"] },
  { slug: "ecommerce-posters", title: "E-commerce Posters", labels: ["E-commerce Campaigns"] },
  { slug: "ai-generate", title: "AI Generate", labels: ["AI Experiments"] },
  { slug: "label-stickers", title: "Label Sticker Bottle", labels: ["Packaging Design"] },
  { slug: "menu", title: "Menu", labels: ["Menu Design"] },
  { slug: "merchandise", title: "Merchandise", labels: ["Merchandise"] },
  { slug: "photography", title: "Photography", labels: ["Photography", "Wedding Photography"] },
  { slug: "posters", title: "Posters", labels: ["Campaign Posters"] },
  { slug: "social-media", title: "Social Media Posting", labels: ["Social Campaigns"] },
  { slug: "tray-paper", title: "Tray Paper", labels: ["Print Collateral"] },
  { slug: "tv-menu", title: "TV Menu", labels: ["Digital Menus"] },
  { slug: "wedding-cards", title: "Wedding Card Freelance", labels: ["Wedding Stationery"] },
];

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeText = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);

function imageCard(item, index) {
  const article = document.createElement("article");
  article.className = "project-card reveal";
  article.tabIndex = 0;
  article.setAttribute("role", "button");
  article.setAttribute("aria-label", `View ${item.title}`);
  article.innerHTML = `
    <div class="project-image"><img src="${item.src}" alt="${escapeText(item.title)}" ${index > 1 ? 'loading="lazy"' : ""} /></div>
    <div class="project-meta"><h3>${escapeText(item.title)}</h3><p>${escapeText(item.categoryLabel)}</p></div>`;
  article.addEventListener("click", () => openLightbox(item));
  article.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") openLightbox(item); });
  return article;
}

function renderFeatured() {
  const grid = $("#featured-grid");
  data.images.filter((item) => item.featured).slice(0, 6).forEach((item, index) => grid.append(imageCard(item, index)));
}

function renderMotion() {
  const grid = $("#motion-grid");
  data.videos.forEach((item) => {
    const article = document.createElement("article");
    article.className = `motion-card ${item.orientation === "landscape" ? "landscape" : ""}`;
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", `Play ${item.title}`);
    article.innerHTML = `
      <img src="${item.poster}" loading="lazy" alt="${escapeText(item.title)} video preview" />
      <div class="motion-overlay"><span class="motion-type">${escapeText(item.type)}</span><div class="motion-title"><h3>${escapeText(item.title)}</h3><span class="play">▶</span></div></div>`;
    article.addEventListener("click", () => openLightbox(item, true));
    article.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") openLightbox(item, true); });
    grid.append(article);
  });
}

function itemsForFolder(folder) {
  return data.images.filter((item) => folder.labels.includes(item.categoryLabel));
}

function openFolder(folder) {
  const dialog = $("#folder-dialog");
  const gallery = $("#folder-gallery");
  const items = itemsForFolder(folder);
  $("#folder-dialog-title").textContent = folder.title;
  $("#folder-dialog-count").textContent = `${items.length} artwork${items.length === 1 ? "" : "s"}`;
  gallery.innerHTML = "";
  items.forEach((item, index) => {
    const figure = document.createElement("figure");
    figure.className = "folder-artwork";
    figure.tabIndex = 0;
    figure.setAttribute("role", "button");
    figure.setAttribute("aria-label", `View ${item.title}`);
    figure.innerHTML = `<img src="${item.src}" alt="${escapeText(item.title)}" loading="${index > 7 ? "lazy" : "eager"}" ${index < 4 ? 'fetchpriority="high"' : ""} width="${item.width}" height="${item.height}" /><figcaption><strong>${escapeText(item.title)}</strong><span>View artwork ↗</span></figcaption>`;
    figure.addEventListener("click", () => openLightbox(item));
    figure.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") openLightbox(item); });
    gallery.append(figure);
  });
  dialog.showModal();
  document.body.classList.add("is-locked");
}

function closeFolder() {
  const dialog = $("#folder-dialog");
  dialog.close();
  $("#folder-gallery").innerHTML = "";
  document.body.classList.remove("is-locked");
}

function renderFolders() {
  const grid = $("#folder-grid");
  folderGroups.forEach((folder, index) => {
    const items = itemsForFolder(folder);
    if (!items.length) return;
    const previews = items.slice(0, 3).map((item, previewIndex) => `<img src="${item.src}" alt="" loading="lazy" style="--preview-index:${previewIndex}" />`).join("");
    const button = document.createElement("button");
    button.className = "category-folder reveal";
    button.type = "button";
    button.setAttribute("aria-label", `Open ${folder.title}, ${items.length} artworks`);
    button.innerHTML = `
      <span class="folder-previews" aria-hidden="true">${previews}</span>
      <span class="folder-shape">
        <span class="folder-number">${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeText(folder.title)}</strong>
        <span class="folder-meta"><span>${items.length} artworks</span><span>Open ↗</span></span>
      </span>`;
    button.addEventListener("click", () => openFolder(folder));
    grid.append(button);
  });
}

function openLightbox(item, isVideo = false) {
  const dialog = $("#lightbox");
  const media = $(".lightbox-media", dialog);
  media.innerHTML = isVideo
    ? `<video src="${item.src}" poster="${item.poster}" controls autoplay playsinline></video>`
    : `<img src="${item.src}" alt="${escapeText(item.title)}" />`;
  $(".lightbox-caption span", dialog).textContent = isVideo ? item.type : item.categoryLabel;
  $(".lightbox-caption strong", dialog).textContent = item.title;
  dialog.showModal();
  document.body.classList.add("is-locked");
}

function closeLightbox() {
  const dialog = $("#lightbox");
  const video = $("video", dialog);
  if (video) video.pause();
  dialog.close();
  $(".lightbox-media", dialog).innerHTML = "";
  document.body.classList.toggle("is-locked", Boolean($("#folder-dialog")?.open));
}

function initInteractions() {
  const dialog = $("#lightbox");
  $(".lightbox-close", dialog).addEventListener("click", closeLightbox);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeLightbox(); });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeLightbox(); });

  const folderDialog = $("#folder-dialog");
  $(".folder-dialog-close", folderDialog).addEventListener("click", closeFolder);
  folderDialog.addEventListener("click", (event) => { if (event.target === folderDialog) closeFolder(); });
  folderDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeFolder(); });

  const toggle = $(".menu-toggle");
  const nav = $("#site-nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$("a", nav).forEach((link) => link.addEventListener("click", () => { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }));

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
  }), { threshold: .08 });
  $$(".reveal").forEach((element) => observer.observe(element));

  window.addEventListener("scroll", () => {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    $(".scroll-progress").style.width = `${scrollable > 0 ? (scrollY / scrollable) * 100 : 0}%`;
  }, { passive: true });
}

function initHero() {
  const featured = data.images.filter((item) => item.featured);
  $$('[data-hero]').forEach((image) => {
    const item = featured[Number(image.dataset.hero)];
    if (item) image.src = item.src;
  });
}

function init() {
  $("#year").textContent = new Date().getFullYear();
  initHero();
  renderFeatured();
  renderMotion();
  renderFolders();
  initInteractions();
}

init();
