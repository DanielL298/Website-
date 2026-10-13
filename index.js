// Header
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const SHOW_THRESHOLD = -10; // px scrolled before it shows

  const updateHeader = () => {
    header.classList.toggle('is-visible', window.scrollY > SHOW_THRESHOLD);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
})();

// Touch swipe, used by the featured carousel and the work gallery
function addSwipe(el, { enabled = () => true, onStart, onDrag, onSwipe, onCancel }) {
  const SWIPE_THRESHOLD = 0.15; // fraction of the width
  const FLICK_SPEED = 0.4;      // px per ms
  const FLICK_MIN = 30;         // px

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let dragX = 0;
  let direction = null;

  el.addEventListener('pointerdown', (e) => {
    // touch only, one finger at a time
    if (e.pointerType === 'mouse' || pointerId !== null || !enabled()) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startTime = performance.now();
    dragX = 0;
    direction = null;
    if (onStart) onStart();
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!direction) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      direction = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (direction === 'x') el.setPointerCapture(pointerId);
    }
    if (direction !== 'x') return;

    dragX = dx;
    if (onDrag) onDrag(dragX);
  });

  el.addEventListener('pointerup', (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;

    if (direction === 'x') {
      const distance = Math.abs(dragX);
      const speed = distance / Math.max(1, performance.now() - startTime);
      const farEnough = distance > el.clientWidth * SWIPE_THRESHOLD;
      const flicked = speed > FLICK_SPEED && distance > FLICK_MIN;
      if (farEnough || flicked) {
        onSwipe(dragX < 0 ? 1 : -1);
        return;
      }
    }
    if (onCancel) onCancel();
  });

  // browser took over (scrolling or pinch-zoom)
  el.addEventListener('pointercancel', (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    if (onCancel) onCancel();
  });
}

// Featured carousel
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
  const AUTOPLAY_DELAY = 4000; // ms
  let autoplayTimer = null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    if (!prefersReducedMotion) startAutoplay();
  };

  nextBtn.addEventListener('click', () => goTo(index + 1, true));
  prevBtn.addEventListener('click', () => goTo(index - 1, true));

  // Swipe
  addSwipe(track, {
    enabled: () => slides.length > 1,
    onStart: stopAutoplay,
    onDrag: (dx) => {
      track.classList.add('is-dragging');
      track.style.transform = `translateX(calc(${-index * 100}% + ${dx}px))`;
    },
    onSwipe: (dir) => {
      track.classList.remove('is-dragging');
      goTo(index + dir, true);
    },
    onCancel: () => {
      track.classList.remove('is-dragging');
      render(); // snap back
      restartAutoplay();
    },
  });

  render();

  if (!prefersReducedMotion) {
    startAutoplay();
  }
});

// Embers
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

    const size = rand(1.5, 6.5).toFixed(1);
    const x = rand(0, 100).toFixed(1);
    const fall = rand(160, 420).toFixed(0);

    // zigzag path
    const drift1 = rand(-70, 70).toFixed(0);
    const drift2 = rand(-110, 110).toFixed(0);
    const drift3 = rand(-150, 150).toFixed(0);

    const spin1 = rand(-90, 90).toFixed(0);
    const spin2 = rand(-120, 120).toFixed(0);
    const spin3 = rand(-160, 160).toFixed(0);

    const duration = rand(3.5, 11).toFixed(1);
    const delay = -rand(0, 11).toFixed(1); // negative so they start staggered
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

  // Push embers away from the cursor (mouse only)
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const REPEL_RADIUS = 110;  // px
  const REPEL_STRENGTH = 26; // px
  const REPEL_EASE = 0.08;   // lower = softer

  const OFF_PAGE = -99999;
  const particles = Array.from(container.children).map((el) => ({ el, x: 0, y: 0 }));
  let mouseX = OFF_PAGE;
  let mouseY = OFF_PAGE;
  let inView = false;
  let frame = null;

  const tick = () => {
    frame = null;
    if (!inView) return;

    const rects = particles.map((p) => p.el.getBoundingClientRect());
    let settling = false;

    particles.forEach((p, i) => {
      const r = rects[i];
      const cx = r.left + r.width / 2 - p.x;
      const cy = r.top + r.height / 2 - p.y;
      const dx = cx - mouseX;
      const dy = cy - mouseY;
      const dist = Math.hypot(dx, dy) || 1;

      let targetX = 0;
      let targetY = 0;
      if (dist < REPEL_RADIUS) {
        const force = (1 - dist / REPEL_RADIUS) ** 2 * REPEL_STRENGTH;
        targetX = (dx / dist) * force;
        targetY = (dy / dist) * force;
      }

      p.x += (targetX - p.x) * REPEL_EASE;
      p.y += (targetY - p.y) * REPEL_EASE;
      if (Math.abs(p.x) > 0.05 || Math.abs(p.y) > 0.05) settling = true;

      p.el.style.translate = `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`;
    });

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

  // cursor left the window
  window.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget) {
      mouseX = OFF_PAGE;
      mouseY = OFF_PAGE;
    }
  });

  // only run while the embers are near the screen
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    start();
  }, { rootMargin: '450px 0px' }).observe(container);
})();

// Work gallery
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

    const trigger = item.querySelector('.work-stack') || cover;

    const raw = item.getAttribute('data-images');
    const images = raw
      ? raw.split(',').map((s) => s.trim()).filter(Boolean)
      : [cover.getAttribute('src')];
    const title = item.querySelector('h3')?.textContent.trim() || '';

    // image count
    const countEl = item.querySelector('.work-count');
    if (countEl) {
      countEl.textContent = `${images.length} image${images.length === 1 ? '' : 's'}`;
    }

    // fanned images behind the cover
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

  // Swipe
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let swipeCount = 0;

  addSwipe(lightbox, {
    enabled: () => lightbox.classList.contains('active') && currentImages.length > 1,
    onDrag: (dx) => {
      media.style.transition = 'none';
      media.style.transform = `translateX(${dx}px)`;
    },
    onSwipe: (dir) => {
      const thisSwipe = ++swipeCount;
      media.style.transition = 'none';
      media.style.transform = '';
      if (!reduceMotion) media.style.opacity = '0';

      if (dir > 0) showNext(); else showPrev();
      if (reduceMotion) return;

      // fade the new image in once it's loaded
      const reveal = () => {
        if (thisSwipe !== swipeCount) return;
        media.style.opacity = '';
        media.animate(
          [
            { transform: `translateX(${dir * 60}px)`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 250, easing: 'ease-out' }
        );
      };
      media.decode().then(reveal, reveal);
    },
    onCancel: () => {
      media.style.transition = reduceMotion ? 'none' : 'transform 0.25s ease';
      media.style.transform = ''; // snap back
    },
  });

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

// Contact form (Web3Forms)
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

// Service popup
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