const data = window.PORTFOLIO_DATA || { images: [], videos: [] };
const PAGE_SIZE = 24;
let activeFilter = "all";
let visibleCount = PAGE_SIZE;

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

function filteredImages() {
  const nonFeatured = data.images.filter((item) => !item.featured);
  return activeFilter === "all" ? nonFeatured : nonFeatured.filter((item) => item.category === activeFilter);
}

function renderArchive() {
  const grid = $("#archive-grid");
  const items = filteredImages();
  grid.innerHTML = "";
  items.slice(0, visibleCount).forEach((item) => {
    const figure = document.createElement("figure");
    figure.className = "archive-item";
    figure.tabIndex = 0;
    figure.setAttribute("role", "button");
    figure.setAttribute("aria-label", `View ${item.title}`);
    figure.innerHTML = `<img src="${item.src}" alt="${escapeText(item.title)}" loading="lazy" width="${item.width}" height="${item.height}" /><figcaption class="archive-label"><span>${escapeText(item.title)}</span><span>${escapeText(item.categoryLabel)}</span></figcaption>`;
    figure.addEventListener("click", () => openLightbox(item));
    figure.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") openLightbox(item); });
    grid.append(figure);
  });
  $("#load-more").hidden = visibleCount >= items.length;
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
  document.body.classList.remove("is-locked");
}

function initFilters() {
  $$(".filter").forEach((button) => button.addEventListener("click", () => {
    $$(".filter").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    activeFilter = button.dataset.filter;
    visibleCount = PAGE_SIZE;
    renderArchive();
  }));
  $("#load-more").addEventListener("click", () => { visibleCount += PAGE_SIZE; renderArchive(); });
}

function initInteractions() {
  const dialog = $("#lightbox");
  $(".lightbox-close", dialog).addEventListener("click", closeLightbox);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeLightbox(); });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeLightbox(); });

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
  renderArchive();
  initFilters();
  initInteractions();
}

init();
