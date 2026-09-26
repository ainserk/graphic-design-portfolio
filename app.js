const data = window.PORTFOLIO_DATA || { images: [], videos: [] };
const folderGroups = [
  { slug: "social-media", title: "Social Media Posting", labels: ["Social Campaigns"] },
  { slug: "posters", title: "Posters", labels: ["Campaign Posters"] },
  { slug: "bunting", title: "Bunting", labels: ["Bunting"] },
  { slug: "durian-notes", title: "Durian Notes", labels: ["Editorial Notes"] },
  { slug: "ecommerce-posters", title: "E-commerce Posters", labels: ["E-commerce Campaigns"] },
  { slug: "ai-generate", title: "AI Generate", labels: ["AI Experiments"] },
  { slug: "label-stickers", title: "Label Sticker Bottle", labels: ["Packaging Design"] },
  { slug: "menu", title: "Menu", labels: ["Menu Design"] },
  { slug: "merchandise", title: "Merchandise", labels: ["Merchandise"] },
  { slug: "photography", title: "Photography", labels: ["Photography", "Wedding Photography"] },
  { slug: "tray-paper", title: "Tray Paper", labels: ["Print Collateral"] },
  { slug: "tv-menu", title: "TV Menu", labels: ["Digital Menus"] },
  { slug: "wedding-cards", title: "Wedding Card Freelance", labels: ["Wedding Stationery"] },
];
const videoFolderGroups = [
  { slug: "awareness", title: "Awareness" },
  { slug: "engagement", title: "Engagement" },
  { slug: "hardsell-video", title: "Hardsell Video" },
  { slug: "product-focus", title: "Product Focus" },
  { slug: "ugc-video", title: "UGC Video" },
  { slug: "video-editing", title: "Video Editing" },
  { slug: "video-generate", title: "Video Generate" },
];

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeText = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
let videoStoryObserver;
let videoStoryResizeHandler;

function drawVideoStoryMap(gallery) {
  $(".video-story-map", gallery)?.remove();
  const pins = $$(".video-pin", gallery);
  if (pins.length < 2) return;
  const galleryRect = gallery.getBoundingClientRect();
  const points = pins.map((pin) => {
    const rect = pin.getBoundingClientRect();
    return `${Math.round(rect.left - galleryRect.left + gallery.scrollLeft + rect.width / 2)},${Math.round(rect.top - galleryRect.top + gallery.scrollTop + rect.height / 2)}`;
  }).join(" ");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("video-story-map");
  svg.setAttribute("viewBox", `0 0 ${gallery.scrollWidth} ${gallery.scrollHeight}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.style.width = `${gallery.scrollWidth}px`;
  svg.style.height = `${gallery.scrollHeight}px`;
  svg.innerHTML = `<polyline points="${points}" />${points.split(" ").map((point) => {
    const [cx, cy] = point.split(",");
    return `<circle cx="${cx}" cy="${cy}" r="9" />`;
  }).join("")}`;
  gallery.append(svg);
}

function videosForFolder(folder) {
  return data.videos.filter((item) => item.category === folder.slug);
}

function openVideoFolder(folder) {
  const dialog = $("#video-folder-dialog");
  const gallery = $("#video-folder-gallery");
  const items = videosForFolder(folder);
  $("#video-folder-dialog-title").textContent = folder.title;
  $("#video-folder-dialog-count").textContent = `${items.length} video${items.length === 1 ? "" : "s"}`;
  gallery.innerHTML = "";
  items.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = `video-story-slide ${item.orientation === "landscape" ? "landscape" : "portrait"}`;
    article.style.setProperty("--story-index", index);
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", `Play ${item.title}`);
    article.innerHTML = `
      <div class="video-story-decor" aria-hidden="true"><span class="story-loop">loop</span><span class="story-hearts">♥ ♥</span><span class="story-tape"></span></div>
      <div class="video-polaroid">
        <span class="video-pin" aria-hidden="true"></span>
        <div class="video-folder-poster">
          <img src="${item.poster}" alt="${escapeText(item.title)} video preview" loading="${index > 2 ? "lazy" : "eager"}" />
          <span class="video-play" aria-hidden="true">▶</span>
        </div>
        <div class="video-folder-meta"><strong>${escapeText(item.title)}</strong><span>Play video ↗</span></div>
      </div>
      <span class="video-story-count" aria-hidden="true">${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}</span>
      ${index < items.length - 1 ? '<span class="video-story-next" aria-hidden="true">Scroll for next ↓</span>' : '<span class="video-story-next is-last" aria-hidden="true">End of folder ✦</span>'}`;
    article.addEventListener("click", () => openLightbox(item, true));
    article.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") openLightbox(item, true); });
    gallery.append(article);
  });
  dialog.showModal();
  gallery.scrollTop = 0;
  videoStoryObserver?.disconnect();
  videoStoryObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    entry.target.classList.toggle("is-active", entry.isIntersecting && entry.intersectionRatio >= .55);
  }), { root: gallery, threshold: [.2, .55, .85] });
  $$(".video-story-slide", gallery).forEach((slide) => videoStoryObserver.observe(slide));
  $(".video-story-slide", gallery)?.classList.add("is-active");
  requestAnimationFrame(() => requestAnimationFrame(() => drawVideoStoryMap(gallery)));
  videoStoryResizeHandler = () => drawVideoStoryMap(gallery);
  window.addEventListener("resize", videoStoryResizeHandler);
  document.body.classList.add("is-locked");
}

function closeVideoFolder() {
  const dialog = $("#video-folder-dialog");
  videoStoryObserver?.disconnect();
  if (videoStoryResizeHandler) window.removeEventListener("resize", videoStoryResizeHandler);
  videoStoryResizeHandler = null;
  dialog.close();
  $("#video-folder-gallery").innerHTML = "";
  document.body.classList.remove("is-locked");
}

function renderVideoFolders() {
  const grid = $("#video-folder-grid");
  videoFolderGroups.forEach((folder, index) => {
    const items = videosForFolder(folder);
    if (!items.length) return;
    const previews = items.slice(0, 3).map((item, previewIndex) => `<img src="${item.poster}" alt="" loading="lazy" style="--preview-index:${previewIndex}" />`).join("");
    const button = document.createElement("button");
    button.className = "video-category-folder reveal";
    button.type = "button";
    const videoCountLabel = `${items.length} video${items.length === 1 ? "" : "s"}`;
    button.setAttribute("aria-label", `Open ${folder.title}, ${videoCountLabel}`);
    button.innerHTML = `
      <span class="video-folder-previews" aria-hidden="true">${previews}</span>
      <span class="video-folder-shape">
        <span class="video-folder-number">${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeText(folder.title)}</strong>
        <span class="video-folder-summary"><span>${videoCountLabel}</span><span>Open ▶</span></span>
      </span>`;
    button.addEventListener("click", () => openVideoFolder(folder));
    grid.append(button);
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
  document.body.classList.toggle("is-locked", Boolean($("#folder-dialog")?.open || $("#video-folder-dialog")?.open));
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

  const videoFolderDialog = $("#video-folder-dialog");
  $(".video-folder-dialog-close", videoFolderDialog).addEventListener("click", closeVideoFolder);
  videoFolderDialog.addEventListener("click", (event) => { if (event.target === videoFolderDialog) closeVideoFolder(); });
  videoFolderDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeVideoFolder(); });

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
  renderVideoFolders();
  renderFolders();
  initInteractions();
}

init();
