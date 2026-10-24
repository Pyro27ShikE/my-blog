// 다크/라이트 모드 전환
// 우선순위: 사용자가 고른 값(data-theme) → 운영체제 설정

const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');
const button = document.querySelector('.theme-toggle');

function currentTheme() {
  return root.dataset.theme || (media.matches ? 'dark' : 'light');
}

function updateButton() {
  if (!button) return;
  const theme = currentTheme();
  const label = theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환';
  button.dataset.current = theme;
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
}

function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch (e) {
    // 저장할 수 없는 환경(사생활 보호 모드 등)이면 이번 방문에만 적용
  }
  updateButton();
}

button?.addEventListener('click', toggleTheme);
media.addEventListener('change', updateButton);
updateButton();
