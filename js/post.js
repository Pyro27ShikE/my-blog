// 글 본문 페이지: 마크다운을 불러와 본문과 목차를 그림
import { parseFrontMatter, markdownToHtml } from './markdown.js';
import { SLUG_RE, createMeta, showMessage } from './utils.js';

const BLOG_NAME = '내 블로그';
const WIDE_QUERY = window.matchMedia('(min-width: 1200px)');

const els = {
  header: document.getElementById('post-header'),
  title: document.getElementById('post-title'),
  meta: document.getElementById('post-meta'),
  body: document.getElementById('post-body'),
  message: document.getElementById('message'),
  toc: document.getElementById('toc'),
  tocBox: document.getElementById('toc-box'),
  tocList: document.getElementById('toc-list'),
};

function renderToc(headings) {
  if (headings.length < 2) return;

  const links = new Map();
  for (const { level, text, id } of headings) {
    const li = document.createElement('li');
    li.className = `toc-level-${level}`;
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.textContent = text;
    li.append(a);
    els.tocList.append(li);
    links.set(id, a);
  }
  els.toc.hidden = false;

  // 넓은 화면: 오른쪽 여백에 펼쳐 둠 / 좁은 화면: 글 제목 바로 아래에 접어 둠
  const place = () => {
    const wide = WIDE_QUERY.matches;
    if (wide) els.toc.append(els.tocBox);
    else els.header.after(els.tocBox);
    els.tocBox.open = wide;
  };
  place();
  WIDE_QUERY.addEventListener('change', place);

  // 화면 위쪽 30% 선을 지난 마지막 제목을 지금 읽는 항목으로 강조
  const targets = headings.map(({ id }) => document.getElementById(id)).filter(Boolean);
  const setActive = (activeId) => {
    for (const [id, a] of links) {
      const active = id === activeId;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };
  const update = () => {
    const line = window.innerHeight * 0.3;
    let current = null;
    for (const el of targets) {
      if (el.getBoundingClientRect().top <= line) current = el.id;
      else break;
    }
    setActive(current);
  };
  const observer = new IntersectionObserver(update, { rootMargin: '0px 0px -70% 0px' });
  targets.forEach((el) => observer.observe(el));
  update();
}

function fail(text) {
  showMessage(els.message, text);
  document.title = `글을 찾을 수 없음 · ${BLOG_NAME}`;
}

async function loadPost() {
  const slug = new URLSearchParams(window.location.search).get('slug') || '';
  if (!SLUG_RE.test(slug)) {
    fail('글 주소가 올바르지 않습니다.');
    return;
  }

  let res;
  try {
    res = await fetch(`posts/${slug}.md`);
  } catch (err) {
    console.error('글을 불러오지 못했습니다:', err);
    fail('글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    return;
  }
  if (!res.ok) {
    fail('요청한 글을 찾을 수 없습니다.');
    return;
  }

  const { meta, body } = parseFrontMatter(await res.text());
  const { html, headings } = markdownToHtml(body);
  const title = meta.title || slug;

  document.title = `${title} · ${BLOG_NAME}`;
  els.title.textContent = title;
  createMeta(els.meta, meta);
  els.header.hidden = false;
  // markdown.js가 원문을 이스케이프하고 위험한 링크를 막은 결과만 넣음
  els.body.innerHTML = html;

  renderToc(headings);

  // 본문이 늦게 그려지므로 주소의 #제목 위치로 다시 이동
  if (window.location.hash) {
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    target?.scrollIntoView();
  }
}

loadPost();
