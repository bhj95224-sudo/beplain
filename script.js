function initCarousel() {
  const carousel = document.querySelector(".carousel");
  if (!carousel) return;

  const viewport = carousel.querySelector(".carousel_viewport");
  const track = carousel.querySelector(".carousel_track");
  const slides = Array.from(carousel.querySelectorAll(".carousel_slide"));
  const prevButton = carousel.querySelector(".carousel_arrow_prev");
  const nextButton = carousel.querySelector(".carousel_arrow_next");
  const status = carousel.querySelector(".carousel_status");
  let currentIndex = 0;
  let pointerStartX = 0;
  let pointerDeltaX = 0;
  let isDragging = false;

  carousel.tabIndex = 0;

  function getBasePercent() {
    return currentIndex * -(100 / slides.length);
  }

  function renderCarousel(shouldAnnounce = true) {
    track.style.transform = `translate3d(${getBasePercent()}%, 0, 0)`;

    slides.forEach((slide, index) => {
      const isActive = index === currentIndex;
      slide.classList.toggle("is_active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    if (shouldAnnounce && status) {
      const activeImage = slides[currentIndex].querySelector("img");
      status.textContent = `${activeImage.alt}, ${currentIndex + 1} / ${slides.length}`;
    }
  }

  function moveCarousel(step) {
    currentIndex = (currentIndex + step + slides.length) % slides.length;
    renderCarousel();
  }

  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    isDragging = true;
    pointerStartX = event.clientX;
    pointerDeltaX = 0;
    viewport.classList.add("is_dragging");
    track.classList.add("is_dragging");
    viewport.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!isDragging) return;
    pointerDeltaX = event.clientX - pointerStartX;
    track.style.transform = `translate3d(calc(${getBasePercent()}% + ${pointerDeltaX}px), 0, 0)`;
  }

  function finishDrag(event) {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove("is_dragging");
    track.classList.remove("is_dragging");

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    const dragThreshold = Math.min(120, viewport.clientWidth * 0.12);
    if (Math.abs(pointerDeltaX) >= dragThreshold) {
      moveCarousel(pointerDeltaX > 0 ? -1 : 1);
    } else {
      renderCarousel(false);
    }
  }

  prevButton.addEventListener("click", () => moveCarousel(-1));
  nextButton.addEventListener("click", () => moveCarousel(1));
  viewport.addEventListener("pointerdown", handlePointerDown);
  viewport.addEventListener("pointermove", handlePointerMove);
  viewport.addEventListener("pointerup", finishDrag);
  viewport.addEventListener("pointercancel", finishDrag);
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveCarousel(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveCarousel(1);
    }
  });

  renderCarousel(false);
}

function initScrollTop() {
  const scrollTopButton = document.querySelector(".scroll_top");
  if (!scrollTopButton) return;

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initCategoryNavigation() {
  const category = document.querySelector(".category");
  const categoryLogo = category?.querySelector(".category_logo");
  const links = Array.from(document.querySelectorAll(".category_link"));
  if (!category || !categoryLogo || links.length === 0) return;

  const sectionMap = new Map(
    links.map((link) => [link.getAttribute("href"), document.querySelector(link.getAttribute("href"))])
  );

  function setCategoryOpen(isOpen) {
    category.classList.toggle("is_open", isOpen);
    categoryLogo.setAttribute("aria-expanded", String(isOpen));
  }

  function handleCategoryLogoClick(event) {
    if (window.innerWidth >= 1024) return;

    event.preventDefault();
    const isCategoryOpen = category.classList.contains("is_open");

    if (!isCategoryOpen) {
      setCategoryOpen(true);
      return;
    }

    setCategoryOpen(false);
    categoryLogo.blur();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCategoryLinkClick(event) {
    const link = event.currentTarget;
    const targetSelector = link.getAttribute("href");
    const targetSection = sectionMap.get(targetSelector);

    if (!targetSection) return;

    event.preventDefault();
    setActiveLink(targetSection.id);
    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targetSection.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
    setCategoryOpen(false);
    link.blur();
  }

  categoryLogo.addEventListener("click", handleCategoryLogoClick);
  links.forEach((link) => link.addEventListener("click", handleCategoryLinkClick));

  document.addEventListener("click", (event) => {
    if (category.contains(event.target)) return;
    setCategoryOpen(false);
    if (category.contains(document.activeElement)) document.activeElement.blur();
  });

  category.addEventListener("mouseleave", () => {
    setCategoryOpen(false);
    if (category.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) setCategoryOpen(false);
  });

  function setActiveLink(sectionId) {
    let hasActiveLink = false;

    links.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${sectionId}`;
      link.classList.toggle("is_active", isActive);
      if (isActive) {
        hasActiveLink = true;
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    category.classList.toggle("has_selection", hasActiveLink);
  }

  if (!("IntersectionObserver" in window)) return;

  const categoryTargets = new Map([
    [document.querySelector(".hero_view"), null],
    [document.querySelector(".story_group_first"), "introduction"],
    [document.querySelector(".merit"), "merit"],
    [document.querySelector(".product_line"), "line"],
  ]);

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleEntry) setActiveLink(categoryTargets.get(visibleEntry.target));
    },
    { rootMargin: "-20% 0px -55%", threshold: [0, 0.05, 0.2] }
  );

  categoryTargets.forEach((sectionId, target) => {
    if (target) observer.observe(target);
  });
}

function initCategoryPosition() {
  const category = document.querySelector(".category");
  if (!category) return;

  let isFrameRequested = false;

  function updateCategoryPosition() {
    category.classList.toggle("is_scrolled", window.scrollY > 24);
    isFrameRequested = false;
  }

  function handleCategoryScroll() {
    if (isFrameRequested) return;
    isFrameRequested = true;
    window.requestAnimationFrame(updateCategoryPosition);
  }

  updateCategoryPosition();
  window.addEventListener("scroll", handleCategoryScroll, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  initCarousel();
  initScrollTop();
  initCategoryPosition();
  initCategoryNavigation();
});
