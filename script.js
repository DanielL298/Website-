/* ============================================
   PIXELFORGE — script.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Scroll reveal ──────────────────────────
  const revealEls = document.querySelectorAll(
    '.service-card, .process__step, .contact__copy, .contact__form, .section-label, .section-title'
  );
  revealEls.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 80 * i);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => revealObserver.observe(el));


  // ── Animated stat counters ─────────────────
  const statNums = document.querySelectorAll('.stat__num');

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => countObserver.observe(el));

  function animateCount(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1200;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }


  // ── Mobile burger menu ─────────────────────
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  let menuOpen = false;

  burger.addEventListener('click', () => {
    menuOpen = !menuOpen;
    mobileMenu.classList.toggle('open', menuOpen);
    document.body.style.overflow = menuOpen ? 'hidden' : '';

    // Animate burger spans
    const spans = burger.querySelectorAll('span');
    if (menuOpen) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });


  // ── Nav background on scroll ───────────────
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 40
      ? 'rgba(13,13,13,0.98)'
      : 'rgba(13,13,13,0.85)';
  }, { passive: true });


  // ── Contact form handling ──────────────────
  const form = document.getElementById('contactForm');
  const successMsg = document.getElementById('formSuccess');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      highlightEmpty([
        { id: 'name',    val: name },
        { id: 'email',   val: email },
        { id: 'message', val: message }
      ]);
      return;
    }

    if (!isValidEmail(email)) {
      shakeField('email');
      return;
    }

    // Success state (wire up your backend/email service here)
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    setTimeout(() => {
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message →';
      successMsg.classList.add('visible');
      setTimeout(() => successMsg.classList.remove('visible'), 5000);
    }, 900);
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function highlightEmpty(fields) {
    fields.forEach(({ id, val }) => {
      if (!val) shakeField(id);
    });
  }

  function shakeField(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = '#ff4d4d';
    el.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(0)' }
    ], { duration: 320, easing: 'ease' });
    el.addEventListener('focus', () => { el.style.borderColor = ''; }, { once: true });
  }


  // ── Smooth scroll helpers ──────────────────
  window.scrollToContact = function () {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  };

  window.closeMenu = function () {
    menuOpen = false;
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
    const spans = burger.querySelectorAll('span');
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  };

});
