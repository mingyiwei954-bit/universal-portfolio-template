/*==================== ACCORDION SKILLS ====================*/
const skillsContent = document.getElementsByClassName('skills__content'),
    skillsHeader = document.querySelectorAll('.skills__header')

function toggleSkills() {
    let itemClass = this.parentNode.className

    for (i = 0; i < skillsContent.length; i++) {
        skillsContent[i].className = 'skills__content skills__close'
    }
    if (itemClass === 'skills__content skills__close') {
        this.parentNode.className = 'skills__content skills__open'
    }
}

skillsHeader.forEach((el) => {
    el.addEventListener('click', toggleSkills)
})

/*==================== QUALIFICATION TABS ====================*/


/*==================== SERVICES MODAL ====================*/
const modalViews = document.querySelectorAll('.services__modal'),
    modalBtns = document.querySelectorAll('.services__button'),
    modalCloses = document.querySelectorAll('.services__modal-close')

let modal = function (modalClick) {
    modalViews[modalClick].classList.add('active-modal')
}

modalBtns.forEach((modalBtn, i) => {
    modalBtn.addEventListener('click', () => {
        modal(i)
    })
})

modalCloses.forEach((modalClose) => {
    modalClose.addEventListener('click', () => {
        modalViews.forEach((modalView) => {
            modalView.classList.remove('active-modal')
        })
    })
})
/*==================== PORTFOLIO SWIPER  ====================*/
let swiperPortfolio = new Swiper('.portfolio__container', {
    cssMode: true,
    loop: true,

    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
});

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.pageYOffset

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 50;
        sectionId = current.getAttribute('id')

        const navLink = document.querySelector('.nav__menu a[href*=' + sectionId + ']')
        if (!navLink) return
        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
            navLink.classList.add('active-link')
        }else{
            navLink.classList.remove('active-link')
        }
    })
}
window.addEventListener('scroll', scrollActive)

/*==================== CHANGE BACKGROUND HEADER ====================*/
function scrollHeader(){
    const nav = document.getElementById('header')
    // When the scroll is greater than 200 viewport height, add the scroll-header class to the header tag
    if(this.scrollY >= 80) nav.classList.add('scroll-header'); else nav.classList.remove('scroll-header')
}
window.addEventListener('scroll', scrollHeader)


/*==================== SHOW SCROLL UP ====================*/
function scrollUp(){
    const scrollUp = document.getElementById('scroll-up');
    // When the scroll is higher than 560 viewport height, add the show-scroll class to the a tag with the scroll-top class
    if(this.scrollY >= 560) scrollUp.classList.add('show-scroll'); else scrollUp.classList.remove('show-scroll')
}
window.addEventListener('scroll', scrollUp)


/*==================== DARK LIGHT THEME ====================*/ 
const themeButton = document.getElementById('theme-button')
const darkTheme = 'dark-theme'
const iconTheme = 'uil-sun'

// Previously selected topic (if user selected)
const selectedTheme = localStorage.getItem('selected-theme')
const selectedIcon = localStorage.getItem('selected-icon')

// We obtain the current theme that the interface has by validating the dark-theme class
const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? 'dark' : 'light'
const getCurrentIcon = () => themeButton.classList.contains(iconTheme) ? 'uil-moon' : 'uil-sun'

// We validate if the user previously chose a topic
if (selectedTheme) {
  // If the validation is fulfilled, we ask what the issue was to know if we activated or deactivated the dark
  document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme)
  themeButton.classList[selectedIcon === 'uil-moon' ? 'add' : 'remove'](iconTheme)
}

// Activate / deactivate the theme with a soft, reversible dissolve.
const themeMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let themeTransitionTimer

themeButton.addEventListener('click', () => {
    const goingDark = !document.body.classList.contains(darkTheme)
    const applyTheme = () => {
        document.body.classList.toggle(darkTheme, goingDark)
        themeButton.classList.toggle(iconTheme, goingDark)
        localStorage.setItem('selected-theme', getCurrentTheme())
        localStorage.setItem('selected-icon', getCurrentIcon())
    }

    clearTimeout(themeTransitionTimer)
    document.body.classList.remove('theme-to-dark', 'theme-to-light')

    if (themeMotion.matches) {
        document.body.classList.remove('theme-transitioning')
        applyTheme()
        return
    }

    document.body.classList.add('theme-transitioning', goingDark ? 'theme-to-dark' : 'theme-to-light')
    requestAnimationFrame(applyTheme)
    themeTransitionTimer = setTimeout(() => {
        document.body.classList.remove('theme-transitioning', 'theme-to-dark', 'theme-to-light')
    }, 1050)
})
// Keep each moving text layer clear of its own fixed text.
;(() => {
  const cards = [...document.querySelectorAll('.practice-card')];
  const updateFade = () => {
    cards.forEach(card => {
      const layer = card.querySelector('.practice-marquee');
      if (!layer) return;
      const bounds = layer.getBoundingClientRect();
      let textRight = bounds.left;
      card.querySelectorAll('.practice-heading h3, .practice-subtitle').forEach(text => {
        const range = document.createRange();
        range.selectNodeContents(text);
        for (const rect of range.getClientRects()) textRight = Math.max(textRight, rect.right);
      });
      const start = Math.max(0, textRight - bounds.left + 8);
      layer.style.setProperty('--practice-fade-start', `${start}px`);
      layer.style.setProperty('--practice-fade-end', `${start + 64}px`);
      layer.querySelectorAll('.practice-track').forEach((track, index) => {
        const list = track.querySelector('.practice-list');
        // Each copy fills the viewport; two identical copies make a seamless loop.
        list.style.minWidth = `${bounds.width}px`;
        track.querySelectorAll('.practice-list').forEach(copy => copy.style.minWidth = `${bounds.width}px`);
        const distance = list.getBoundingClientRect().width;
        track.style.animationDuration = `${distance / (index === 0 ? 26 : 21)}s`;
      });
    });
  };
  const observer = new ResizeObserver(updateFade);
  cards.forEach(card => {
    observer.observe(card);
    card.querySelectorAll('.practice-heading span, .practice-subtitle span').forEach(text => observer.observe(text));
  });
  const textObserver = new MutationObserver(updateFade);
  cards.forEach(card => card.querySelectorAll('.practice-heading, .practice-subtitle').forEach(text => textObserver.observe(text, { childList: true, characterData: true, subtree: true })));
  if (document.fonts) document.fonts.ready.then(updateFade);
  updateFade();
})();

;(() => {
  const title = document.querySelector('.home_title');
  if (!title) return;
  const originalSize = parseFloat(getComputedStyle(title).fontSize);
  const fitTitle = () => {
    title.style.fontSize = `${originalSize}px`;
    const available = title.parentElement.clientWidth;
    if (title.scrollWidth > available) {
      title.style.fontSize = `${originalSize * available / title.scrollWidth * .98}px`;
    }
  };
  new ResizeObserver(fitTitle).observe(title.parentElement);
  new MutationObserver(fitTitle).observe(title, {subtree: true, childList: true, characterData: true});
  document.fonts?.ready.then(fitTitle);
  fitTitle();
})();
