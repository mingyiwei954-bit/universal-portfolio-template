(() => {
  const layer = document.querySelector('.project__symbols');
  if (!layer) return;

  const symbols = ['❔', '❕', '💗', '✨', '💭'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer = 0;
  let visible = false;

  const spawn = () => {
    if (!visible || document.hidden || reduceMotion.matches) return;
    const symbol = document.createElement('span');
    symbol.className = 'project__symbol';
    symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    symbol.style.setProperty('--symbol-x', `${8 + Math.random() * 70}%`);
    symbol.style.setProperty('--symbol-y', `${6 + Math.random() * 52}%`);
    symbol.style.setProperty('--symbol-size', `${25 + Math.random() * 13}px`);
    symbol.style.setProperty('--symbol-angle', `${-16 + Math.random() * 32}deg`);
    symbol.style.setProperty('--symbol-drift', `${-10 + Math.random() * 20}px`);
    layer.appendChild(symbol);
    symbol.addEventListener('animationend', () => symbol.remove(), { once: true });
    window.setTimeout(() => symbol.remove(), 4000);
  };

  const start = () => {
    if (timer || reduceMotion.matches) return;
    spawn();
    timer = window.setInterval(spawn, 1450);
  };

  const stop = () => {
    window.clearInterval(timer);
    timer = 0;
    layer.replaceChildren();
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else stop();
  }, { threshold: .25 });

  observer.observe(layer.closest('.project'));
  reduceMotion.addEventListener?.('change', () => reduceMotion.matches ? stop() : visible && start());
})();
