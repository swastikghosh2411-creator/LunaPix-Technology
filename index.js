/* ============================================================
   LUNAPIX — index.js
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. NAV SCROLL + BURGER ───────────────────────────── */
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');

  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  if (burger && drawer) {
    burger.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('aria-hidden', String(!open));
    });

    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        drawer.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
      });
    });
  }


  /* ── 2. CANVAS PARTICLE FIELD ─────────────────────────── */
  /* Only runs if a #heroCanvas element exists on the page   */
  const canvas = document.getElementById('heroCanvas');

  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

    const ctx  = canvas.getContext('2d');
    const RGB  = [181, 87, 58];   // terracotta accent in RGB
    const COUNT = 48;
    let W, H, particles, rafId;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function makeParticle() {
      return {
        x:     rand(0, W),
        y:     rand(0, H),
        r:     rand(0.6, 2.0),
        vx:    rand(-0.10, 0.10),
        vy:    rand(-0.15, -0.04),
        life:  rand(0, 1),
        speed: rand(0.002, 0.005),
      };
    }

    function initParticles() {
      particles = Array.from({ length: COUNT }, makeParticle);
    }

    function drawParticle(p) {
      const alpha = Math.sin(p.life * Math.PI) * 0.45;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${RGB[0]},${RGB[1]},${RGB[2]},${alpha.toFixed(3)})`;
      ctx.fill();
    }

    function drawConnections() {
      const threshold = 110;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < threshold) {
            const alpha = (1 - dist / threshold) * 0.06;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${RGB[0]},${RGB[1]},${RGB[2]},${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      drawConnections();

      for (const p of particles) {
        p.life += p.speed;
        p.x += p.vx;
        p.y += p.vy;

        if (p.life >= 1 || p.x < -10 || p.x > W + 10 || p.y < -10) {
          Object.assign(p, makeParticle());
          p.y    = H + 5;
          p.life = 0;
        }

        drawParticle(p);
      }

      rafId = requestAnimationFrame(tick);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        tick();
      }
    });

    window.addEventListener('resize', () => { resize(); initParticles(); }, { passive: true });
    resize();
    initParticles();
    tick();

  } else if (canvas) {
    /* reduced-motion: hide canvas entirely */
    canvas.style.display = 'none';
  }


  /* ── 3. SCROLL REVEAL ─────────────────────────────────── */
  const revealEls = document.querySelectorAll(
    '.ind-card, .services__cta-row, .plan-row, .care-row, .founder'
  );

  if (revealEls.length) {
    function getCols() {
      if (window.innerWidth >= 1024) return 4;
      if (window.innerWidth >= 600)  return 2;
      return 1;
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el    = entry.target;
        const index = Array.from(revealEls).indexOf(el);

        /* stagger cards by column, everything else by index */
        const isCard = el.classList.contains('ind-card');
        const delay  = isCard
          ? (index % getCols()) * 80
          : Math.min(index * 60, 300);

        setTimeout(() => el.classList.add('is-visible'), delay);
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.10 });

    revealEls.forEach(el => revealObserver.observe(el));
  }


  /* ── 4. CONTACT FORM ──────────────────────────────────── */
  const form   = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  if (form && status) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('.contact-form__submit');

      btn.disabled = true;
      status.textContent = 'Sending…';
      status.className   = 'contact-form__status';

      try {
        const res = await fetch(form.action, {
          method:  'POST',
          body:    new FormData(form),
          headers: { 'Accept': 'application/json' },
        });

        if (res.ok) {
          status.textContent = 'Message sent — we\'ll get back to you soon.';
          status.classList.add('is-success');
          form.reset();
        } else {
          throw new Error('Server error');
        }
      } catch {
        status.textContent = 'Something went wrong. Please try WhatsApp or email.';
        status.classList.add('is-error');
      } finally {
        btn.disabled = false;
      }
    });
  }

})();