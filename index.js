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
// through Technology into the hero-caption section above. Each ember follows a
// randomized 3-stage zigzag path
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
// WORK CAROUSEL ("Take a closer look")
// Infinite loop: the real project items are repeated in several sets,
// the carousel starts on the middle set, and after every slide it
// silently jumps back to the middle set if it has drifted into the
// outer ones (the sets look identical, so the jump is invisible).
//
// Controls: arrow buttons, keyboard arrows (when the carousel is in
// view), sideways mouse wheel / trackpad scroll, swipe or drag, and
// clicking a side project to bring it to the centre. Clicking the
// centred project opens the lightbox (next section).
//
// NOTE: this block must stay ABOVE the lightbox block so the cloned
// items get their lightbox click handlers.
// To add a project, just add another <article class="work-item"> in
// index.html — the carousel picks it up automatically.
// -------------------------------------------------------------------
(() => {
  const carousel = document.getElementById('work-carousel');
  if (!carousel) return;

  const viewport = carousel.querySelector('.work-viewport');
  const track = carousel.querySelector('.work-track');
  const prevBtn = carousel.querySelector('.work-prev');
  const nextBtn = carousel.querySelector('.work-next');

  const originals = Array.from(track.children);
  const n = originals.length;
  if (!n) return;

  // Build the repeated sets. Few projects -> more sets so the screen is always full.
  const copies = n >= 4 ? 3 : 5;
  const mid = Math.floor(copies / 2);
  for (let c = 0; c < copies; c++) {
    if (c === mid) continue;
    const frag = document.createDocumentFragment();
    originals.forEach((el) => {
      const clone = el.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('[tabindex]').forEach((t) => t.setAttribute('tabindex', '-1'));
      frag.appendChild(clone);
    });
    if (c < mid) track.insertBefore(frag, track.firstChild);
    else track.appendChild(frag);
  }

  const items = Array.from(track.querySelectorAll('.work-item'));
  const minPos = mid * n;        // first item of the middle set
  const maxPos = minPos + n - 1; // last item of the middle set
  let pos = minPos;

  const centre = () => {
    const el = items[pos];
    const x = viewport.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
    track.style.transform = `translateX(${x}px)`;
    items.forEach((it, i) => it.classList.toggle('is-active', i === pos));
  };

  const snap = () => {
    track.classList.add('no-anim');
    centre();
    void track.offsetWidth; // flush so the jump is instant
    track.classList.remove('no-anim');
  };

  const wrapPos = () => {
    while (pos > maxPos) pos -= n;
    while (pos < minPos) pos += n;
  };

  const goTo = (p) => {
    pos = p;
    centre();
  };
  const next = () => goTo(pos + 1);
  const prev = () => goTo(pos - 1);

  // After sliding, if we've left the middle set, jump back by whole sets.
  track.addEventListener('transitionend', (e) => {
    if (e.target !== track || e.propertyName !== 'transform') return;
    if (pos >= minPos && pos <= maxPos) return;
    wrapPos();
    snap();
  });

  // Reduced motion: no transition runs, so wrap straight away.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const wrapNow = () => {
      wrapPos();
      snap();
    };
    nextBtn.addEventListener('click', wrapNow);
    prevBtn.addEventListener('click', wrapNow);
  }

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  // ---- keyboard (only while the carousel is on screen) ----
  let inView = false;
  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
  }, { threshold: 0.4 }).observe(carousel);

  document.addEventListener('keydown', (e) => {
    if (!inView) return;
    if (document.getElementById('lightbox')?.classList.contains('active')) return;
    if (document.getElementById('service-modal')?.classList.contains('active')) return;
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // ---- sideways wheel / trackpad ----
  let wheelLock = false;
  viewport.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 20) return;
    e.preventDefault();
    if (wheelLock) return;
    wheelLock = true;
    e.deltaX > 0 ? next() : prev();
    setTimeout(() => { wheelLock = false; }, 450);
  }, { passive: false });

  // ---- swipe / drag ----
  let startX = null;
  let dragged = false;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startX = e.clientX;
    dragged = false;
  });

  viewport.addEventListener('pointermove', (e) => {
    if (startX === null) return;
    if (Math.abs(e.clientX - startX) > 8) viewport.classList.add('is-dragging');
  });

  const endDrag = (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    viewport.classList.remove('is-dragging');
    if (Math.abs(dx) > 50) {
      dragged = true; // swallow the click that follows a drag
      dx < 0 ? next() : prev();
    }
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);

  // ---- clicks: side items centre first, centre item opens the lightbox ----
  // Capture phase so we run before the lightbox handlers below.
  const intercept = (e) => {
    if (dragged) {
      e.stopPropagation();
      e.preventDefault();
      dragged = false;
      return;
    }
    const item = e.target.closest('.work-item');
    if (!item) return;
    const i = items.indexOf(item);
    if (i !== -1 && i !== pos) {
      e.stopPropagation();
      e.preventDefault();
      goTo(i);
    }
  };
  track.addEventListener('click', intercept, true);
  track.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') intercept(e);
  }, true);

  // ---- keep centred on resize / once images have loaded ----
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(snap, 100);
  });
  window.addEventListener('load', snap);

  snap();
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