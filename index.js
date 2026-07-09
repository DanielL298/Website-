// Full-screen "featured" slider: one slide fills the screen, auto-plays,
// and can be advanced manually with the prev/next buttons or dots.

// -------------------------------------------------------------------
// HEADER VISIBILITY
// Header stays hidden while at the very top of the page, and slides
// in as soon as the user scrolls down at all.
// -------------------------------------------------------------------
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const SHOW_THRESHOLD = -10; // px scrolled before header appears

  const updateHeader = () => {
    header.classList.toggle('is-visible', window.scrollY > SHOW_THRESHOLD);
  };

  updateHeader(); // set correct state on load (e.g. reload mid-page)
  window.addEventListener('scroll', updateHeader, { passive: true });
})();

document.querySelectorAll('[data-featured-controls]').forEach((controls) => {
  const trackId = controls.getAttribute('data-featured-controls');
  const track = document.getElementById(trackId);
  if (!track) return;

  const section = track.closest('.featured');
  const slides = Array.from(track.querySelectorAll('.featured-slide'));
  const prevBtn = controls.querySelector('.prev');
  const nextBtn = controls.querySelector('.next');
  const dotsWrap = controls.querySelector('.featured-dots');

  let index = 0;
  const AUTOPLAY_DELAY = 4000; // ms per slide
  let autoplayTimer = null;

  // Build dots
  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i, true));
    dotsWrap.appendChild(dot);
    return dot;
  });

  const render = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  };

  const goTo = (i, userTriggered) => {
    index = (i + slides.length) % slides.length;
    render();
    if (userTriggered) restartAutoplay();
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer = setInterval(next, AUTOPLAY_DELAY);
  };

  const stopAutoplay = () => {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  const restartAutoplay = () => {
    startAutoplay();
  };

  nextBtn.addEventListener('click', () => goTo(index + 1, true));
  prevBtn.addEventListener('click', () => goTo(index - 1, true));

  render();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    startAutoplay();
  }
});

// -------------------------------------------------------------------
// WORK GRID LIGHTBOX
// Clicking a work item enlarges its image. Each item can carry its own
// small set of extra images (via data-images on the .work-item), which
// are only reachable by clicking through the lightbox's prev/next/dots.
// -------------------------------------------------------------------
(() => {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const media = lightbox.querySelector('.lightbox-media');
  const titleEl = lightbox.querySelector('.lightbox-title');
  const dotsWrap = lightbox.querySelector('.lightbox-dots');
  const navWrap = lightbox.querySelector('.lightbox-nav');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  const closeBtn = lightbox.querySelector('[data-lightbox-close]');

  const items = Array.from(document.querySelectorAll('#all-work .work-item'));

  let currentImages = [];
  let currentIndex = 0;
  let currentTitle = '';

  const renderSlide = () => {
    const src = currentImages[currentIndex] || '';
    media.src = src;
    media.alt = currentTitle;
    titleEl.textContent = currentTitle;
    Array.from(dotsWrap.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  };

  const buildDots = () => {
    dotsWrap.innerHTML = '';
    currentImages.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.setAttribute('aria-label', `Go to image ${i + 1}`);
      dot.addEventListener('click', () => {
        currentIndex = i;
        renderSlide();
      });
      dotsWrap.appendChild(dot);
    });
  };

  const showNext = () => {
    if (!currentImages.length) return;
    currentIndex = (currentIndex + 1) % currentImages.length;
    renderSlide();
  };

  const showPrev = () => {
    if (!currentImages.length) return;
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    renderSlide();
  };

  const openLightbox = (images, startIndex, title) => {
    currentImages = images;
    currentIndex = startIndex;
    currentTitle = title || '';
    navWrap.style.display = currentImages.length > 1 ? 'flex' : 'none';
    buildDots();
    renderSlide();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  items.forEach((item) => {
    const trigger = item.querySelector('.card-media');
    if (!trigger) return;

    // Extra images live only in data-images — not shown on the grid itself,
    // only revealed once the lightbox is open.
    const raw = item.getAttribute('data-images');
    const images = raw
      ? raw.split(',').map((s) => s.trim()).filter(Boolean)
      : [trigger.getAttribute('src')];
    const title = item.querySelector('h3')?.textContent.trim() || '';

    trigger.style.cursor = 'zoom-in';
    trigger.addEventListener('click', () => openLightbox(images, 0, title));
  });

  nextBtn.addEventListener('click', showNext);
  prevBtn.addEventListener('click', showPrev);
  closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  });
})();