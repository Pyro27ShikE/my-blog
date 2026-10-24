// 마크다운 → HTML 변환기 (외부 라이브러리 없이 직접 구현)
// 지원: 제목, 문단, 줄바꿈, 굵게/기울임/취소선, 인라인 코드, 링크, 이미지,
//       목록(중첩), 인용문, 수평선, 코드 블록, 표(GFM)
// 원문에 쓴 HTML 태그는 그대로 글자로 보여 줌(보안상 렌더링하지 않음)

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

// ===== Front matter =====

function stripQuotes(value) {
  return value.replace(/^(["'])(.*)\1$/, '$2');
}

export function parseFrontMatter(text) {
  const src = String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const match = src.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!match) return { meta: {}, body: src };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    if (!key) continue;
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((v) => stripQuotes(v.trim()))
        .filter(Boolean);
    } else {
      value = stripQuotes(value);
    }
    meta[key] = value;
  }
  return { meta, body: src.slice(match[0].length) };
}

// ===== 인라인 =====

// http(s), mailto, 상대 경로만 허용. javascript: 같은 나머지 스킴은 막음
function safeUrl(url) {
  // 브라우저는 URL 안의 공백·제어 문자를 무시하므로 검사 전에 지움
  const cleaned = url.replace(/[\u0000- \u007f]/g, '');
  if (/^(https?:|mailto:)/i.test(cleaned)) return cleaned;
  if (/^[a-z][a-z0-9+.-]*:/i.test(cleaned)) return '#';
  return cleaned;
}

function emphasis(s) {
  return s
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
    .replace(/\*(?=\S)([\s\S]*?\S)\*/g, '<em>$1</em>')
    .replace(/(^|[^\w])_(?=\S)([\s\S]*?\S)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
}

const PLACEHOLDER_RE = /\u0000(\d+)\u0000/g;

export function parseInline(text) {
  // 이미 변환한 조각은 자리표시자로 바꿔 두어 뒤 단계(굵게 등)가 건드리지 않게 함
  const tokens = [];
  const stash = (html) => `\u0000${tokens.push(html) - 1}\u0000`;
  const titleAttr = (title) => (title ? ` title="${title}"` : '');

  let s = escapeHtml(text);

  // 인라인 코드 (안의 글자는 그대로 둠)
  s = s.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, __, code) => stash(`<code>${code.trim()}</code>`));

  // Obsidian 위키링크 [[노트]] / [[노트|별칭]] → 연결할 글이 없으므로 글자로만 표시
  s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, name, alias) =>
    stash(`<span class="wikilink">${(alias || name).trim()}</span>`),
  );

  // 역슬래시 이스케이프: \* \_ \[ 등
  s = s.replace(/\\([\\`*_{}[\]()#+\-.!~|])/g, (_, c) => stash(c));

  // 이미지 ![alt](src "title")
  s = s.replace(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+&quot;(.*?)&quot;)?\s*\)/g, (_, alt, src, title) =>
    stash(`<img src="${safeUrl(src)}" alt="${alt}" loading="lazy"${titleAttr(title)}>`),
  );

  // 링크 [text](href "title")
  s = s.replace(/\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+&quot;(.*?)&quot;)?\s*\)/g, (_, label, href, title) => {
    const url = safeUrl(href);
    const external = /^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return stash(`<a href="${url}"${titleAttr(title)}${external}>${emphasis(label)}</a>`);
  });

  // 자동 링크 <https://...>
  s = s.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_, url) =>
    stash(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`),
  );

  s = emphasis(s);

  // 줄 끝 공백 두 칸 또는 역슬래시 → 줄바꿈
  s = s.replace(/(?: {2,}|\\)\n/g, '<br>\n');

  // 자리표시자 복원 (링크 안의 코드처럼 겹친 경우가 있어 반복)
  while (s.includes('\u0000')) {
    s = s.replace(PLACEHOLDER_RE, (_, i) => tokens[Number(i)]);
  }
  return s;
}

// ===== 블록 =====

const FENCE_RE = /^\s{0,3}(`{3,}|~{3,})\s*([\w+-]*)/;
const HEADING_RE = /^\s{0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/;
const HR_RE = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE_RE = /^\s{0,3}>/;
const LIST_RE = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const TABLE_SEP_RE = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;

const indentOf = (line) => line.match(/^\s*/)[0].length;

function isTableStart(lines, i) {
  return lines[i].includes('|') && i + 1 < lines.length && lines[i + 1].includes('-') && TABLE_SEP_RE.test(lines[i + 1]);
}

// 문단을 끊고 새 블록이 시작되는 줄인지
function startsBlock(lines, i) {
  const line = lines[i];
  if (FENCE_RE.test(line) || HEADING_RE.test(line) || HR_RE.test(line) || QUOTE_RE.test(line)) return true;
  const m = line.match(LIST_RE);
  if (m && (/[-*+]/.test(m[2]) || /^1[.)]$/.test(m[2]))) return true;
  return isTableStart(lines, i);
}

function plainText(html) {
  const map = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
  return html.replace(/<[^>]+>/g, '').replace(/&(?:amp|lt|gt|quot|#39);/g, (e) => map[e]);
}

function slugify(text) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
  return slug || 'section';
}

function uniqueId(base, ctx) {
  const count = ctx.usedIds.get(base) || 0;
  ctx.usedIds.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/(?<!\\)\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

function parseTable(lines, start) {
  const header = splitRow(lines[start]);
  const aligns = splitRow(lines[start + 1]).map((c) => {
    const left = c.startsWith(':');
    const right = c.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
  });

  let i = start + 2;
  const rows = [];
  while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
    rows.push(splitRow(lines[i]));
    i++;
  }

  const cell = (tag, text, col) => {
    const style = aligns[col] ? ` style="text-align:${aligns[col]}"` : '';
    return `<${tag}${style}>${parseInline(text)}</${tag}>`;
  };
  const head = `<tr>${header.map((c, col) => cell('th', c, col)).join('')}</tr>`;
  const body = rows.map((r) => `<tr>${header.map((_, col) => cell('td', r[col] ?? '', col)).join('')}</tr>`).join('');

  return {
    html: `<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`,
    next: i,
  };
}

function parseList(lines, start, ctx) {
  const first = lines[start].match(LIST_RE);
  const baseIndent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const startNumber = ordered ? parseInt(first[2], 10) : 1;

  const items = [];
  let current = null;
  let contentIndent = 0;
  let loose = false;
  let afterBlank = false;
  let i = start;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      // 빈 줄 뒤에도 이 목록이 이어지는지 확인
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j >= lines.length) break;
      const nextIndent = indentOf(lines[j]);
      const nextMarker = lines[j].match(LIST_RE);
      const continues =
        nextIndent > baseIndent ||
        (nextMarker && nextIndent === baseIndent && /\d/.test(nextMarker[2]) === ordered);
      if (!continues) break;
      current.push('');
      afterBlank = true;
      i++;
      continue;
    }

    const indent = indentOf(line);
    const marker = line.match(LIST_RE);

    // 같은 깊이의 새 항목
    if (marker && indent === baseIndent) {
      if (/\d/.test(marker[2]) !== ordered) break;
      if (afterBlank) loose = true;
      current = [marker[3]];
      contentIndent = marker[0].length - marker[3].length;
      items.push(current);
      afterBlank = false;
      i++;
      continue;
    }

    // 더 깊게 들여쓴 줄: 이 항목의 하위 내용(중첩 목록 포함)
    if (indent > baseIndent) {
      current.push(line.slice(Math.min(indent, contentIndent)));
      i++;
      continue;
    }

    // 들여쓰지 않고 바로 이어 쓴 문장은 항목 문단의 연속으로 봄
    if (!afterBlank && !marker && !startsBlock(lines, i)) {
      current.push(line.trim());
      i++;
      continue;
    }

    break;
  }

  const tag = ordered ? 'ol' : 'ul';
  const startAttr = ordered && startNumber !== 1 ? ` start="${startNumber}"` : '';
  const lis = items
    .map((itemLines) => {
      let html = parseBlocks(itemLines, ctx);
      // 빈 줄 없는 목록은 첫 문단의 <p>를 벗겨서 촘촘하게 보이게 함
      if (!loose) html = html.replace(/^<p>([\s\S]*?)<\/p>/, '$1');
      return `<li>${html}</li>`;
    })
    .join('');

  return { html: `<${tag}${startAttr}>${lis}</${tag}>`, next: i };
}

function parseBlocks(lines, ctx) {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // 코드 블록
    const fence = line.match(FENCE_RE);
    if (fence) {
      const marker = fence[1];
      const lang = fence[2];
      const fenceIndent = indentOf(line);
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker)) {
        // 여는 펜스만큼 들여쓴 부분은 걷어 냄
        code.push(lines[i].slice(Math.min(fenceIndent, indentOf(lines[i]))));
        i++;
      }
      i++; // 닫는 펜스
      const cls = lang ? ` class="language-${lang}"` : '';
      out.push(`<pre><code${cls}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    // 제목
    const heading = line.match(HEADING_RE);
    if (heading) {
      const level = heading[1].length;
      const inner = parseInline(heading[2]);
      if (level === 2 || level === 3) {
        const text = plainText(inner);
        const id = uniqueId(slugify(text), ctx);
        ctx.headings.push({ level, text, id });
        out.push(`<h${level} id="${id}">${inner}</h${level}>`);
      } else {
        out.push(`<h${level}>${inner}</h${level}>`);
      }
      i++;
      continue;
    }

    // 수평선 (목록보다 먼저 검사: "* * *")
    if (HR_RE.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }

    // 인용문
    if (QUOTE_RE.test(line)) {
      const quote = [];
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        quote.push(lines[i].replace(/^\s{0,3}> ?/, ''));
        i++;
      }
      out.push(`<blockquote>${parseBlocks(quote, ctx)}</blockquote>`);
      continue;
    }

    // 표
    if (isTableStart(lines, i)) {
      const table = parseTable(lines, i);
      out.push(table.html);
      i = table.next;
      continue;
    }

    // 목록
    if (LIST_RE.test(line)) {
      const list = parseList(lines, i, ctx);
      out.push(list.html);
      i = list.next;
      continue;
    }

    // 문단
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !startsBlock(lines, i)) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${parseInline(para.join('\n').trim())}</p>`);
  }

  return out.join('\n');
}

// 반환값: { html, headings: [{ level, text, id }] }
export function markdownToHtml(markdown) {
  const ctx = { headings: [], usedIds: new Map() };
  const lines = String(markdown)
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/\t/g, '    ')
    .split('\n');
  return { html: parseBlocks(lines, ctx), headings: ctx.headings };
}
