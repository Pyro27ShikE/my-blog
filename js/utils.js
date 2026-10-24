// 목록과 본문 페이지에서 함께 쓰는 도우미

export const SLUG_RE = /^[a-z0-9-]+$/;

// '2026-10-24' → '2026년 10월 24일'
export function formatDate(value) {
  const text = String(value ?? '');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return text;
  return `${Number(m[1])}년 ${Number(m[2])}월 ${Number(m[3])}일`;
}

// posts.json은 불리언, front matter는 문자열로 들어옴
export function isDraft(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

// 초안 표시, 날짜, 태그를 담은 메타 정보 요소들을 만듦
export function createMeta(container, { date, tags, draft }) {
  if (isDraft(draft)) {
    const badge = document.createElement('span');
    badge.className = 'draft-badge';
    badge.textContent = '초안';
    container.append(badge);
  }

  if (date) {
    const time = document.createElement('time');
    time.dateTime = String(date);
    time.textContent = formatDate(date);
    container.append(time);
  }

  const tagList = Array.isArray(tags) ? tags : tags ? [tags] : [];
  if (tagList.length) {
    const ul = document.createElement('ul');
    ul.className = 'tags';
    ul.setAttribute('aria-label', '태그');
    for (const tag of tagList) {
      const li = document.createElement('li');
      li.className = 'tag';
      li.textContent = tag;
      ul.append(li);
    }
    container.append(ul);
  }
}

export function showMessage(element, text) {
  element.textContent = text;
  element.hidden = false;
}
