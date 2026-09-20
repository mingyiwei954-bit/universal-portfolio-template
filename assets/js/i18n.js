(() => {
    const toggle = document.getElementById('language-toggle');
    let language = 'zh';
    let typing;
    let desiredLanguage = language;
    let transitioning = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
    const roles = {
        zh: ['这里是职业标签', '这里是能力方向', '这里是身份介绍', '这里是专业方向', '这里是个人定位'],
        en: ['Your Professional Title', 'Your Area of Expertise', 'Your Role', 'Your Specialization', 'Your Positioning'],
    };

    function applyLanguage(nextLanguage) {
        if (typing && nextLanguage === language) return;
        language = nextLanguage;
        document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
        document.querySelectorAll('[data-zh][data-en]').forEach(element => {
            const separator = element.parentElement.classList.contains('home__subtitle') ? ' ' : '';
            element.textContent = element.dataset[language] + separator;
        });
        document.querySelectorAll('[data-zh-alt][data-en-alt]').forEach(element => {
            element.alt = element.dataset[`${language}Alt`];
        });
        document.querySelectorAll('[data-zh-label][data-en-label]').forEach(element => {
            element.setAttribute('aria-label', element.dataset[`${language}Label`]);
        });
        document.querySelectorAll('[data-zh-title][data-en-title]').forEach(element => {
            element.title = element.dataset[`${language}Title`];
        });
        toggle.dataset.language = language;
        toggle.setAttribute('aria-label', language === 'zh' ? '语言切换' : 'Language selection');
        toggle.querySelectorAll('button').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.language === language));
        });
        document.querySelector('meta[name="description"]').content = language === 'zh'
            ? '可复用的个人作品集模板：在这里添加你的简介、技能与项目。'
            : 'A reusable personal portfolio template. Add your profile, skills, and projects here.';
        if (typing) typing.destroy();
        typing = new Typed('.auto-input', {
            strings: roles[language],
            typeSpeed: 100,
            backSpeed: 100,
            loop: true,
        });
        if (window.AOS) AOS.refresh();
    }

    async function transitionLanguage(nextLanguage) {
        desiredLanguage = nextLanguage;
        if (transitioning || desiredLanguage === language) return;
        transitioning = true;
        try {
            while (desiredLanguage !== language) {
                if (!reducedMotion.matches) {
                    document.body.classList.add('language-changing');
                    if (typing) typing.stop();
                    await wait(280);
                }
                applyLanguage(desiredLanguage);
                // Settle the translated layout and carousel sizes while content is hidden.
                document.querySelectorAll('.swiper-container').forEach(container => {
                    if (container.swiper) container.swiper.update();
                });
                if (!reducedMotion.matches) {
                    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                }
                if (typing) typing.start();
                document.body.classList.remove('language-changing');
                if (!reducedMotion.matches) await wait(480);
            }
        } finally {
            document.body.classList.remove('language-changing');
            transitioning = false;
        }
    }

    toggle.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => transitionLanguage(button.dataset.language));
    });
    applyLanguage('zh');
})();
