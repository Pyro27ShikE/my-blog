// 글 목록 페이지
import { SLUG_RE, createMeta, showMessage } from './utils.js';

const list = document.getElementById('post-list');
const message = document.getElementById('message');

function createItem(post) {
  const li = document.createElement('li');
  li.className = 'post-item';

  const title = document.createElement('h2');
  title.className = 'post-item-title';
  const link = document.createElement('a');
  link.className = 'post-link';
  link.href = `post.html?slug=${post.slug}`;
  link.textContent = post.title || post.slug;
  title.append(link);
  li.append(title);

  if (post.description) {
    const desc = document.createElement('p');
    desc.className = 'post-item-desc';
    desc.textContent = post.description;
    li.append(desc);
  }

  const meta = document.createElement('div');
  meta.className = 'post-meta';
  createMeta(meta, post);
  if (meta.childElementCount) li.append(meta);

  return li;
}

async function loadPosts() {
  try {
    const res = await fetch('posts/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();

    const valid = (Array.isArray(posts) ? posts : [])
      .filter((post) => post && SLUG_RE.test(post.slug))
      .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));

    if (!valid.length) {
      showMessage(message, '아직 쓴 글이 없습니다.');
      return;
    }
    list.append(...valid.map(createItem));
  } catch (err) {
    console.error('글 목록을 불러오지 못했습니다:', err);
    showMessage(message, '글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

loadPosts();
