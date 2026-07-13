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
// EMBERS
// Glowing particles that spark off the seam between Technology and
// Work below it (the bottom edge of #tech) and rise/scatter up
// through Technology into the hero-caption section above. Each ember follows a randomized 3-stage zigzag path
// (rather than a straight line) for a chaotic, fire-like scatter.
// Skips entirely if the user prefers reduced motion.
// -------------------------------------------------------------------
(() => {
  const container = document.getElementById('embers');
  if (!container) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const EMBER_COUNT = 40;
  const EASES = ['ease-in-out', 'ease-out', 'cubic-bezier(.3,.6,.7,.1)'];
  const rand = (min, max) => Math.random() * (max - min) + min;
  const frag = document.createDocumentFragment();

  for (let i = 0; i < EMBER_COUNT; i++) {
    const ember = document.createElement('span');
    ember.className = 'ember';

    const size = rand(1.5, 6.5).toFixed(1); // varied spark sizes
    const x = rand(0, 100).toFixed(1); // spawn position across the seam
    const fall = rand(160, 420).toFixed(0); // how far it falls before fading out

    // Three independent sideways offsets create a zigzag path instead
    // of a straight drift, with each ember free to swing a different
    // direction/amount at each stage.
    const drift1 = rand(-70, 70).toFixed(0);
    const drift2 = rand(-110, 110).toFixed(0);
    const drift3 = rand(-150, 150).toFixed(0);

    const spin1 = rand(-90, 90).toFixed(0);
    const spin2 = rand(-120, 120).toFixed(0);
    const spin3 = rand(-160, 160).toFixed(0);

    const duration = rand(3.5, 11).toFixed(1); // varied fall speeds
    const delay = -rand(0, 11).toFixed(1); // negative = staggered/random start
    const peakOpacity = rand(0.3, 0.85).toFixed(2);
    const ease = EASES[Math.floor(Math.random() * EASES.length)];

    ember.style.setProperty('--size', `${size}px`);
    ember.style.setProperty('--x', `${x}%`);
    ember.style.setProperty('--fall', `${fall}px`);
    ember.style.setProperty('--drift1', `${drift1}px`);
    ember.style.setProperty('--drift2', `${drift2}px`);
    ember.style.setProperty('--drift3', `${drift3}px`);
    ember.style.setProperty('--spin1', `${spin1}deg`);
    ember.style.setProperty('--spin2', `${spin2}deg`);
    ember.style.setProperty('--spin3', `${spin3}deg`);
    ember.style.setProperty('--duration', `${duration}s`);
    ember.style.setProperty('--delay', `${delay}s`);
    ember.style.setProperty('--peak-opacity', peakOpacity);
    ember.style.setProperty('--ease', ease);

    frag.appendChild(ember);
  }

  container.appendChild(frag);
})();

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