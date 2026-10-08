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

  // -----------------------------------------------------------------
  // CURSOR REPEL
  // Embers gently drift away from the mouse when it gets close, then
  // ease back onto their normal path once it moves off. This uses the
  // separate CSS `translate` property, which stacks on top of the
  // keyframe `transform`, so the rise/zigzag animation keeps running
  // untouched underneath. Mouse/trackpad only — touch screens skip it.
  // -----------------------------------------------------------------
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const REPEL_RADIUS = 110;  // px: how close the cursor has to get before embers react
  const REPEL_STRENGTH = 26; // px: the furthest an ember gets nudged (keep it small for subtle)
  const REPEL_EASE = 0.08;   // 0-1: lower = softer, lazier drift; higher = snappier

  const OFF_PAGE = -99999;
  const particles = Array.from(container.children).map((el) => ({ el, x: 0, y: 0 }));
  let mouseX = OFF_PAGE;
  let mouseY = OFF_PAGE;
  let inView = false;
  let frame = null;

  const tick = () => {
    frame = null;
    if (!inView) return;

    // Read every ember's position first, then write, so the browser
    // only has to work out the layout once per frame.
    const rects = particles.map((p) => p.el.getBoundingClientRect());
    let settling = false;

    particles.forEach((p, i) => {
      const r = rects[i];
      // where the ember would be without our nudge
      const cx = r.left + r.width / 2 - p.x;
      const cy = r.top + r.height / 2 - p.y;
      const dx = cx - mouseX;
      const dy = cy - mouseY;
      const dist = Math.hypot(dx, dy) || 1;

      let targetX = 0;
      let targetY = 0;
      if (dist < REPEL_RADIUS) {
        // strongest right under the cursor, fading smoothly to nothing at the edge
        const force = (1 - dist / REPEL_RADIUS) ** 2 * REPEL_STRENGTH;
        targetX = (dx / dist) * force;
        targetY = (dy / dist) * force;
      }

      p.x += (targetX - p.x) * REPEL_EASE;
      p.y += (targetY - p.y) * REPEL_EASE;
      if (Math.abs(p.x) > 0.05 || Math.abs(p.y) > 0.05) settling = true;

      p.el.style.translate = `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`;
    });

    // Keep going while the cursor is on the page (embers keep rising
    // into it even if it's still), or until every ember has eased back.
    if (mouseX !== OFF_PAGE || settling) frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (!frame && inView) frame = requestAnimationFrame(tick);
  };

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    start();
  }, { passive: true });

  // cursor left the browser window: let the embers drift back
  window.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget) {
      mouseX = OFF_PAGE;
      mouseY = OFF_PAGE;
    }
  });

  // Only run while the embers are on (or near) the screen. The margin
  // covers the embers that rise up out of #tech into the section above.
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    start();
  }, { rootMargin: '450px 0px' }).observe(container);
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
    const cover = item.querySelector('.card-media');
    if (!cover) return;

    // The whole fanned stack is clickable (falls back to the cover image).
    const trigger = item.querySelector('.work-stack') || cover;

    // All images for this project live in data-images; they are only
    // revealed once the lightbox is open.
    const raw = item.getAttribute('data-images');
    const images = raw
      ? raw.split(',').map((s) => s.trim()).filter(Boolean)
      : [cover.getAttribute('src')];
    const title = item.querySelector('h3')?.textContent.trim() || '';

    // Image count under the title, worked out automatically.
    const countEl = item.querySelector('.work-count');
    if (countEl) {
      countEl.textContent = `${images.length} image${images.length === 1 ? '' : 's'}`;
    }

    // Fill the two fanned layers behind the cover with the next two images.
    const toUrl = (src) => `url("${new URL(src, document.baseURI).href}")`;
    if (images[1]) trigger.style.setProperty('--back-1', toUrl(images[1]));
    if (images[2]) trigger.style.setProperty('--back-2', toUrl(images[2]));

    const open = () => openLightbox(images, 0, title);
    trigger.addEventListener('click', open);
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
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

// -------------------------------------------------------------------
// CONTACT FORM (Web3Forms)
// Sends the message without leaving the page, then swaps the form for
// a thank-you line. If anything fails, visitors are pointed to the
// studio email instead.
// -------------------------------------------------------------------
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = form.querySelector('.contact-status');
  const button = form.querySelector('.contact-submit');
  const FALLBACK = 'Sorry, that didn\'t send. Please email us at hello@crwciblestudios.com instead.';

  const setStatus = (text, type) => {
    status.textContent = text;
    status.classList.remove('is-success', 'is-error');
    if (type) status.classList.add(`is-${type}`);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    button.disabled = true;
    setStatus('Sending…');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        form.reset();
        form.classList.add('is-sent');
        setStatus('Thanks, your message has been sent. We\'ll get back to you soon.', 'success');
      } else {
        console.error('Contact form error:', data.message || response.status);
        setStatus(FALLBACK, 'error');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setStatus(FALLBACK, 'error');
    } finally {
      button.disabled = false;
    }
  });
})();

// -------------------------------------------------------------------
// SERVICE POPUP
// Clicking (or pressing Enter on) a service card opens a box with its
// image, title and the longer description from its .service-detail.
// Close with the X, by clicking outside the box, or with Escape.
// -------------------------------------------------------------------
(() => {
  const modal = document.getElementById('service-modal');
  if (!modal) return;

  const box = modal.querySelector('.service-modal-box');
  const media = modal.querySelector('.service-modal-media');
  const numEl = modal.querySelector('.service-modal-num');
  const titleEl = modal.querySelector('.service-modal-title');
  const textEl = modal.querySelector('.service-modal-text');
  const closeBtn = modal.querySelector('[data-service-close]');
  let lastCard = null;

  const open = (card) => {
    const img = card.querySelector('.service-media img');
    media.hidden = !img;
    media.src = img ? img.getAttribute('src') : '';
    media.alt = img ? img.alt : '';
    numEl.textContent = card.querySelector('.service-num')?.textContent || '';
    titleEl.textContent = card.querySelector('h3')?.textContent || '';

    // Long description if there is one, otherwise the card's short text
    const detail = card.querySelector('.service-detail');
    if (detail) {
      textEl.innerHTML = detail.innerHTML;
    } else {
      const p = document.createElement('p');
      p.textContent = card.querySelector('.service-body p')?.textContent || '';
      textEl.replaceChildren(p);
    }

    lastCard = card;
    box.scrollTop = 0;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  const close = () => {
    if (!modal.classList.contains('active')) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (lastCard) lastCard.focus();
  };

  document.querySelectorAll('#services .service-card').forEach((card) => {
    card.addEventListener('click', () => open(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(card);
      }
    });
  });

  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
})();