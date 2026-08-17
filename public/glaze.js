// cococopi-site client runtime: forged prime interactions
(function() {
  "use strict";

  // 1. Cursor Forge Glow
  const glow = document.getElementById('forge-glow');
  if (glow) {
    let glowVisible = false;
    document.addEventListener('mousemove', (e) => {
      if (!glowVisible) {
        glow.style.opacity = '0.5';
        glowVisible = true;
      }
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
      glowVisible = false;
    });
  }

  // 2. 3D Tilt + Spark Effects on Tiles
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    // Tilt
    tile.addEventListener('mousemove', (e) => {
      const rect = tile.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -8; // max 8deg
      const rotateY = (x - centerX) / centerX * 8;
      
      // Preserve the base translateY(-10px) from CSS hover
      tile.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });

    tile.addEventListener('mouseleave', () => {
      // Reset to CSS hover state (handled by CSS :hover)
      tile.style.transform = '';
    });

    // Sparks
    tile.addEventListener('mouseenter', (e) => {
      const container = tile.querySelector('.spark-container');
      if (!container) return;
      
      // Create 8-12 sparks
      const count = 8 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        // Random start position (around cursor)
        const rect = tile.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        
        // Random direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 80;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        spark.style.left = startX + 'px';
        spark.style.top = startY + 'px';
        spark.style.setProperty('--tx', tx + 'px');
        spark.style.setProperty('--ty', ty + 'px');
        
        container.appendChild(spark);
        
        // Remove after animation
        setTimeout(() => spark.remove(), 1000);
      }
    });
  });

  // 3. Scroll Reveal (fade in sections and tiles)
  const revealElements = document.querySelectorAll('.section, .tile, .note, .ingot');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    revealObserver.observe(el);
  });

  // 4. Typewriter for terminal (already in CSS, but ensure it runs)
  const termBody = document.querySelector('.term-body');
  if (termBody) {
    const tw = termBody.querySelector('.tw');
    if (tw) {
      // Force reflow to ensure animation triggers
      tw.style.animation = 'none';
      tw.offsetHeight; // trigger reflow
      tw.style.animation = null;
    }
  }

  // 5. Letter-by-letter hero reveal (Bodoni Moda, molten italic)
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    const foil = heroTitle.querySelector('.foil');
    if (foil) {
      const text = foil.textContent;
      foil.textContent = '';
      for (let i = 0; i < text.length; i++) {
        const c = document.createElement('span');
        c.textContent = text[i];
        c.style.opacity = '0';
        c.style.display = 'inline-block';
        c.style.animation = `letterIn 0.5s ease forwards ${0.15 + i * 0.09}s`;
        foil.appendChild(c);
      }
      const style = document.createElement('style');
      style.textContent = `@keyframes letterIn { from { opacity: 0; transform: translateY(0.4em) rotate(3deg); filter: blur(4px); } to { opacity: 1; transform: none; filter: none; } }`;
      document.head.appendChild(style);
    }
  }

  // 6. Ember glow parallax on scroll
  const embers = document.querySelector('.embers');
  if (embers) {
    let raf = null;
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          embers.style.transform = `translateY(${y * 0.18}px)`;
        }
        raf = null;
      });
    }, { passive: true });
  }

})();
