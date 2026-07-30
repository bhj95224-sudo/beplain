function handleCarouselArrowClick(track, direction) {
  const item = track.querySelector(".carousel_item");
  const step = item ? item.getBoundingClientRect().width + 24 : 240;
  track.scrollBy({ left: direction * step, behavior: "smooth" });
}

function initCarousel() {
  const carousel = document.querySelector(".carousel");
  if (!carousel) return;

  const track = carousel.querySelector(".carousel_track");
  const prevButton = carousel.querySelector(".carousel_arrow_prev");
  const nextButton = carousel.querySelector(".carousel_arrow_next");

  prevButton.addEventListener("click", () => handleCarouselArrowClick(track, -1));
  nextButton.addEventListener("click", () => handleCarouselArrowClick(track, 1));
}

function initScrollTop() {
  const scrollTopButton = document.querySelector(".scroll_top");
  if (!scrollTopButton) return;

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initCarousel();
  initScrollTop();
});
