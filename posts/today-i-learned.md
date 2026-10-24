---
title: 오늘 배운 것
date: 2026-10-24
tags: [공부, 웹, 클로드 코드]
description: 클로드 코드로 블로그를 만들면서 배운 HTML, CSS, JavaScript의 역할을 정리했습니다.
---

오늘은 클로드 코드와 함께 이 블로그를 만들었습니다.
프레임워크 없이 **HTML, CSS, JavaScript**만 썼는데, 덕분에 세 가지가 각자 무슨 일을 하는지 또렷하게 보였어요.

한 줄로 줄이면 이렇습니다.

> HTML은 **뼈대**, CSS는 **옷**, JavaScript는 **움직임**이다.

## HTML: 내용과 구조

HTML은 페이지에 **무엇이 있는지**를 적습니다. 제목, 문단, 목록, 링크, 버튼 같은 것들이요.

```html
<header>
  <a href="./">내 블로그</a>
  <button type="button">다크 모드</button>
</header>
<main>
  <article>
    <h1>글 제목</h1>
    <p>본문</p>
  </article>
</main>
```

배운 점:

- `div`만 쓰지 않고 `header`, `main`, `article`, `footer` 같은 **시맨틱 태그**를 쓰면 구조가 읽기 쉽고, 화면 낭독기 같은 보조 기술도 내용을 더 잘 이해합니다.
- `<meta name="viewport">` 한 줄이 있어야 휴대폰에서 글자가 작게 줄어들지 않습니다.

## CSS: 모양과 배치

CSS는 HTML에 **어떻게 보일지**를 입힙니다. 색, 글꼴, 여백, 배치가 모두 CSS의 일입니다.

```css
:root {
  --bg: #ffffff;
  --text: #1f2328;
}

:root[data-theme="dark"] {
  --bg: #16181d;
  --text: #e6e8eb;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

배운 점:

- 색을 **CSS 변수**로 모아 두면 다크 모드는 변수 값만 바꾸면 됩니다. 컴포넌트마다 색을 따로 고칠 필요가 없어요.
- `@media` 쿼리로 화면 폭에 따라 배치를 바꿀 수 있습니다. 이 블로그의 목차는 넓은 화면에서는 오른쪽에 붙고, 휴대폰에서는 접힌 상자로 바뀝니다.
- 읽기 좋은 글은 **줄 길이와 줄 간격**에서 나옵니다. 본문 폭을 680px 정도로 제한하고 `line-height`를 넉넉히 주니 훨씬 편해졌어요.
- `word-break: keep-all`을 쓰면 한글 단어가 줄 끝에서 어색하게 끊기지 않습니다.

## JavaScript: 동작과 데이터

JavaScript는 페이지가 **무엇을 할지**를 정합니다. 클릭에 반응하고, 파일을 불러오고, 화면 내용을 바꿉니다.

```js
const res = await fetch('posts/today-i-learned.md');
const markdown = await res.text();
document.getElementById('post-body').innerHTML = markdownToHtml(markdown).html;
```

이 블로그에서 JavaScript가 하는 일:

1. `posts.json`을 읽어 글 목록을 그립니다.
2. 마크다운 파일을 불러와 HTML로 바꿉니다.
3. 본문의 제목을 모아 목차를 만들고, 지금 읽는 위치를 강조합니다.
4. 다크 모드 버튼을 누르면 테마를 바꾸고 `localStorage`에 기억합니다.

배운 점:

- 브라우저는 보안 때문에 `file://`로 연 페이지에서 `fetch`를 막습니다. 그래서 `python -m http.server` 같은 **로컬 서버**가 필요했어요.
- 남이 쓴 글을 `innerHTML`에 그대로 넣으면 위험할 수 있습니다. 특수문자를 이스케이프하고 `javascript:` 링크를 막는 처리가 꼭 필요해요.

## 세 가지를 나눠 두는 이유

| 언어 | 맡은 일 | 이 블로그의 파일 |
|:---|:---|:---|
| HTML | 내용과 구조 | `index.html`, `post.html` |
| CSS | 모양과 배치 | `css/style.css` |
| JavaScript | 동작과 데이터 | `js/*.js` |

역할이 나뉘어 있으니 고칠 곳을 찾기 쉽습니다.
색을 바꾸고 싶으면 CSS만, 목록 정렬 방식을 바꾸고 싶으면 JavaScript만 보면 돼요.

## 마치며

프레임워크가 해 주던 일을 직접 해 보니 웹 페이지가 어떻게 돌아가는지 감이 잡혔습니다.
다음에는 태그별 모아보기나 검색 기능을 직접 만들어 보고 싶어요.
