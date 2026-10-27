// Analytics consent gate (EU ePrivacy): gtag.js and its cookies load only after an explicit opt-in.
// Choice persists in localStorage; visiting /#cookie-settings reopens the banner to change it.

const GA_ID = 'G-8VS99S2PJ9';
const STORAGE_KEY = 'pf-analytics-consent';
const SETTINGS_HASH = '#cookie-settings';

function readChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function storeChoice(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked (private mode): the choice simply lasts for this page view
  }
}

let analyticsLoaded = false;

function loadAnalytics() {
  if (analyticsLoaded) return;
  analyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

// Withdrawal: drop GA cookies already set on this domain; gtag stays inert until next reload
function clearAnalyticsCookies() {
  const host = window.location.hostname;
  const domains = ['', host, `.${host.replace(/^www\./, '')}`];
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (!name.startsWith('_ga')) return;
    domains.forEach((d) => {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
    });
  });
}

export function initConsent() {
  const banner = document.getElementById('consent-banner');
  if (!banner) return;

  const acceptBtn = banner.querySelector('[data-consent="granted"]');
  const declineBtn = banner.querySelector('[data-consent="denied"]');

  const show = () => banner.classList.add('is-visible');
  const hide = () => banner.classList.remove('is-visible');

  acceptBtn.addEventListener('click', () => {
    storeChoice('granted');
    loadAnalytics();
    hide();
  });

  declineBtn.addEventListener('click', () => {
    storeChoice('denied');
    clearAnalyticsCookies();
    hide();
  });

  const choice = readChoice();
  if (choice === 'granted') loadAnalytics();
  if (!choice || window.location.hash === SETTINGS_HASH) show();

  window.addEventListener('hashchange', () => {
    if (window.location.hash === SETTINGS_HASH) show();
  });
}
