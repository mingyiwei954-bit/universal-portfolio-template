;(() => {
  const toggle = document.querySelector('.service-language-toggle');
  const symbol = toggle?.querySelector('.service-language-symbol');
  if (!toggle || !symbol) return;

  let language = 'zh';
  const render = () => {
    const isChinese = language === 'zh';
    toggle.dataset.language = language;
    toggle.setAttribute('aria-pressed', String(isChinese));
    toggle.setAttribute(
      'aria-label',
      isChinese ? '英文版本准备中' : '英文版本准备中，点击返回中文'
    );
    symbol.textContent = isChinese ? '中' : 'EN';
  };

  toggle.addEventListener('click', () => {
    language = language === 'zh' ? 'en' : 'zh';
    toggle.classList.remove('service-language-pulse');
    void toggle.offsetWidth;
    toggle.classList.add('service-language-pulse');
    render();
  });

  toggle.addEventListener('animationend', () => {
    toggle.classList.remove('service-language-pulse');
  });

  render();
})();
