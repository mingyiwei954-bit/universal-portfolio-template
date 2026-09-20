// Decorative click hearts on non-interactive areas of the page.
;(() => {
  const excluded = [
    'a', 'button', 'input', 'textarea', 'select', 'label', 'summary',
    '[role="button"]', '[role="link"]', '[role="tab"]', '[role="switch"]',
    '[role="checkbox"]', '[role="radio"]', '[role="slider"]',
    '[contenteditable]:not([contenteditable="false"])',
    '[data-no-heart]', '[data-zoom]', '[data-lightbox]', '[data-fancybox]',
    '.zoomable', '.lightbox', '.language-toggle', '.nav__toggle', '.nav__close',
    '#theme-button', '.services__button', '.services__modal',
    '.swiper-button-next', '.swiper-button-prev', '.swiper-pagination'
  ].join(',');
  let lastHeartTime = 0;
  let heartStreak = 0;
  let lastBurstHue = null;
  function spawnHeart(x, y, size, color) {
    const heart = document.createElement('span');
    heart.className = 'skill-click-heart';
    heart.setAttribute('aria-hidden', 'true');
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.setProperty('--heart-angle', `${Math.random() * 56 - 28}deg`);
    heart.style.setProperty('--heart-drift', `${Math.random() * 24 - 12}px`);
    heart.style.setProperty('--heart-size', `${size}px`);
    heart.style.color = color;
    heart.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12Z"/></svg>';
    document.body.appendChild(heart);
    const active = document.querySelectorAll('.skill-click-heart');
    if (active.length > 40) active[0].remove();
    heart.addEventListener('animationend', () => heart.remove(), { once: true });
    setTimeout(() => heart.remove(), 1500);
  }
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    if (event.defaultPrevented || event.target.closest(excluded)) return;
    // Custom image viewers often advertise their action with a zoom cursor.
    for (let node = event.target; node && node !== document.body; node = node.parentElement) {
      const cursor = getComputedStyle(node).cursor;
      if (cursor === 'zoom-in' || cursor === 'zoom-out' || cursor === 'pointer') return;
    }
    if (window.getSelection()?.toString()) return;
    document.dispatchEvent(new Event('homepage-like'));
    const now = performance.now();
    heartStreak = now - lastHeartTime <= 1000 ? heartStreak + 1 : 1;
    lastHeartTime = now;
    const baseSize = Math.max(18, Math.min(22, window.innerWidth * .032));
    const gradualGrowth = 1 + Math.min(heartStreak - 1, 30) * .025;
    const size = Math.min(baseSize * gradualGrowth, Math.min(80, window.innerWidth * .18));
    spawnHeart(event.clientX, event.clientY, size, 'hsl(352, 85%, 59%)');
    if (heartStreak % 10 === 0) {
      const burstLevel = Math.min(heartStreak / 10, 5);
      const burstSize = baseSize * (1.5 + (burstLevel - 1) * .5);
      // Shift the palette each time, keeping the same saturation and lightness.
      const burstHue = lastBurstHue === null ? Math.random() * 360 : (lastBurstHue + 65 + Math.random() * 230) % 360;
      lastBurstHue = burstHue;
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft || 0;
      const top = viewport?.offsetTop || 0;
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      const margin = Math.min(Math.max(56, burstSize / 2 + 48), width / 5, height / 5);
      // One random point in each quadrant keeps all four visible and spread out.
      for (let i = 0; i < 4; i++) {
        const x = left + margin + (i % 2 + Math.random()) * (width - margin * 2) / 2;
        const y = top + margin + (Math.floor(i / 2) + Math.random()) * (height - margin * 2) / 2;
        const hue = (burstHue + i * 18 + Math.random() * 12) % 360;
        spawnHeart(x, y, burstSize, `hsl(${hue}, 85%, 59%)`);
      }
    }
  });
})();
