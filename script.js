const header = document.getElementById('siteHeader');
const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');
const scrollProgress = document.getElementById('scrollProgress');
const currentLanguage = new URL(window.location.href).searchParams.get('lang') === 'ar' ? 'ar' : 'en';
const themeToggle = document.getElementById('themeToggle');
let storedTheme = null;
try { storedTheme = localStorage.getItem('portfolio-theme'); } catch (_) { /* Storage may be unavailable in private contexts. */ }
const initialTheme = storedTheme === 'light' ? 'light' : 'night';

document.documentElement.dataset.theme = initialTheme;

const updateThemeControl = (dictionary) => {
  const lightMode = document.documentElement.dataset.theme === 'light';
  const key = lightMode ? 'theme.toNight' : 'theme.toLight';
  const label = getValue(dictionary, key);
  if (themeToggle && label) {
    themeToggle.setAttribute('aria-pressed', String(lightMode));
    themeToggle.setAttribute('aria-label', label);
    const text = themeToggle.querySelector('[data-i18n="theme.toLight"]');
    if (text) text.textContent = label;
  }
};

const setTheme = (theme, dictionary) => {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('portfolio-theme', theme); } catch (_) { /* Keep the selected theme for the current page. */ }
  updateThemeControl(dictionary);
};

themeToggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'light' ? 'night' : 'light';
  setTheme(nextTheme, window.currentDictionary || {});
});

const setMenuState = (open) => {
  siteNav.classList.toggle('open', open);
  menuToggle.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
};

menuToggle.addEventListener('click', () => setMenuState(!siteNav.classList.contains('open')));
siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuState(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenuState(false); });

const getValue = (source, key) => key.split('.').reduce((value, part) => value?.[part], source);
const renderTimeline = (dictionary) => (Array.isArray(dictionary?.experience?.items) ? dictionary.experience.items : []).map((item) => `
  <article class="timeline-item">
    <div class="timeline-marker"><span></span></div>
    <div class="timeline-date">${item.date}</div>
    <div class="timeline-body"><h3>${item.title}</h3><p class="timeline-place">${item.place}</p>${item.summary ? `<p>${item.summary}</p>` : ''}${item.points ? `<ul class="timeline-points">${item.points.map((point) => `<li>${point}</li>`).join('')}</ul>` : ''}${item.subTitle ? `<h4>${item.subTitle}</h4><ul class="timeline-points">${item.subPoints.map((point) => `<li>${point}</li>`).join('')}</ul>` : ''}</div>
  </article>`).join('');

const applyLanguage = (dictionary) => {
  window.currentDictionary = dictionary;
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  document.title = dictionary.meta.title;
  document.getElementById('metaDescription')?.setAttribute('content', dictionary.meta.description);
  document.getElementById('ogTitle')?.setAttribute('content', dictionary.meta.title);
  document.getElementById('ogDescription')?.setAttribute('content', dictionary.meta.description);
  document.getElementById('twitterTitle')?.setAttribute('content', dictionary.meta.title);
  document.getElementById('twitterDescription')?.setAttribute('content', dictionary.meta.description);
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = getValue(dictionary, element.dataset.i18n);
    if (value !== undefined) element.innerHTML = value;
  });
  const timeline = document.getElementById('timeline');
  if (timeline) timeline.innerHTML = renderTimeline(dictionary);
  document.querySelectorAll('[data-lang]').forEach((link) => link.toggleAttribute('aria-current', link.dataset.lang === currentLanguage));
  updateThemeControl(dictionary);
};

const loadContent = async () => {
  for (const source of ['content.json', 'public/content.json']) {
    try {
      const response = await fetch(source);
      if (response.ok) return response.json();
    } catch (_) {
      // Try the next source layout used by the project and standalone package.
    }
  }
  throw new Error('Content unavailable');
};
loadContent().then((content) => { const dictionary = content?.[currentLanguage] || content?.en; if (dictionary?.experience?.items) applyLanguage(dictionary); }).catch(() => {});

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('visible'));
}

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.site-nav a')];
const updateScrollState = () => {
  const scrollTop = window.scrollY;
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress.style.width = `${pageHeight > 0 ? (scrollTop / pageHeight) * 100 : 0}%`;
  header.classList.toggle('scrolled', scrollTop > 24);
  const current = sections.reduce((active, section) => scrollTop + 140 >= section.offsetTop ? section.id : active, 'home');
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
};
window.addEventListener('scroll', updateScrollState, { passive: true });
window.addEventListener('resize', updateScrollState);
updateScrollState();
document.getElementById('year').textContent = new Date().getFullYear();
