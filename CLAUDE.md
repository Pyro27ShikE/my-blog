# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code가 따라야 할 안내서입니다.

## 프로젝트 개요

마크다운(`.md`) 파일로 쓴 글을 읽어 블로그 웹사이트로 보여 주는 정적 사이트입니다.

- **프레임워크·빌드 도구 없음**: 순수 HTML, CSS, JavaScript(ES 모듈)만 사용합니다.
  React, Vue, Tailwind, Bootstrap, jQuery, npm 패키지, 번들러(Vite, Webpack 등)를 도입하지 않습니다.
- **외부 라이브러리 없음**: 마크다운 파서도 직접 구현합니다(`js/markdown.js`).
  꼭 필요해 보이면 추가하기 전에 사용자에게 먼저 물어봅니다.
- **목표**: 깔끔하고 읽기 좋은 디자인, 다크 모드 지원, 모바일에서도 편한 레이아웃.

## 폴더 구조

```
my-blog/
├── index.html          # 글 목록 페이지
├── post.html           # 글 본문 페이지 (post.html?slug=파일명)
├── css/
│   └── style.css       # 전체 스타일 (색상 토큰, 다크 모드, 반응형)
├── js/
│   ├── main.js         # 글 목록 렌더링
│   ├── post.js         # 마크다운을 불러와 본문 렌더링
│   ├── markdown.js     # 마크다운 → HTML 변환기 (직접 구현)
│   ├── theme.js        # 다크/라이트 모드 전환
│   └── utils.js        # 날짜 형식, 태그 표시 등 공용 도우미
├── posts/
│   ├── posts.json      # 글 목록 (메타데이터)
│   └── *.md            # 글 원본
└── images/             # 글에 쓰는 이미지
```

## 동작 방식

1. `index.html`이 `posts/posts.json`을 `fetch`해서 글 목록을 날짜 내림차순으로 보여 줍니다.
2. 글을 누르면 `post.html?slug=<slug>`로 이동합니다.
3. `post.js`가 `posts/<slug>.md`를 `fetch`하고, 앞부분의 front matter를 읽은 뒤
   `markdown.js`로 본문을 HTML로 바꿔 화면에 넣습니다.

정적 사이트는 폴더 안의 파일 목록을 읽을 수 없으므로, **새 글을 추가하면 `posts.json`에도 항목을 추가해야 합니다.**
(목록 자동 생성 스크립트는 쓰지 않고 손으로 관리합니다.)

### 첫 버전 범위

- 포함: 글 목록, 글 본문, 다크 모드, 본문 목차
- 아직 안 함: 태그별 모아보기, 검색, 코드 하이라이트 (태그는 표시만 함)

### 본문 목차

- 본문의 `h2`, `h3`로 목차를 만들고, 각 제목에 `id`를 붙여 링크로 이동합니다.
  - id는 제목 글자로 만듭니다(한글 유지, 공백은 하이픈, 중복이면 `-2`, `-3` 접미사).
- 제목이 2개 미만이면 목차를 숨깁니다.
- 넓은 화면(`min-width: 1200px`)에서는 본문 오른쪽에 고정(`position: sticky`),
  그보다 좁으면 글 제목 아래에 접이식(`<details>`)으로 둡니다(`post.js`가 위치를 옮김).
- 스크롤 위치에 맞춰 현재 읽는 항목을 강조합니다(`IntersectionObserver`).

### 글 파일 형식

```markdown
---
title: 글 제목
date: 2026-10-24
tags: [일상, 개발]
description: 목록에 보일 한 줄 요약
draft: true        # 선택. 쓰는 중인 글이면 true
---

본문은 여기부터 마크다운으로 씁니다.
```

제목은 front matter의 `title`로 페이지가 직접 그리므로, 본문에 `# 제목`(h1)을 또 쓰지 않습니다.

### 초안(draft)

- `draft: true`인 글은 **목록에 그대로 보이되** 목록과 본문에 '초안' 배지가 붙습니다.
- front matter와 `posts.json` 두 곳에 같이 적습니다(`posts.json`에서는 불리언 `true`).
- 공개할 준비가 되면 두 곳에서 `draft`를 지우거나 `false`로 바꿉니다.

### posts.json 형식

```json
[
  {
    "slug": "first-post",
    "title": "글 제목",
    "date": "2026-10-24",
    "tags": ["일상"],
    "description": "목록에 보일 한 줄 요약",
    "draft": true
  }
]
```

`slug`는 `.md` 파일 이름(확장자 제외)과 같아야 합니다. 영문 소문자, 숫자, 하이픈만 씁니다.

## 마크다운 파서 지원 범위

`js/markdown.js`는 다음을 지원해야 합니다.

- 제목(`#` ~ `######`), 문단, 줄바꿈
- 굵게, 기울임, 취소선, 인라인 코드
- 링크, 이미지
- 순서 있는/없는 목록 (중첩 포함)
- 인용문(`>`), 수평선(`---`)
- 코드 블록(``` ``` ```, 언어 이름은 `class="language-xxx"`로 남김)
- 표(GFM 형식)
- Obsidian 위키링크(`[[노트]]`, `[[노트|별칭]]`): 연결할 글이 없으므로 링크 없이 글자로만 표시

**보안**: 마크다운 원문의 HTML 특수문자(`< > & " '`)는 반드시 이스케이프한 뒤 변환합니다.
`innerHTML`에 넣기 전에 `javascript:` 링크를 막습니다.

## 디자인 원칙

### 읽기 좋은 본문
- 본문 폭은 `max-width: 680px` 안팎(한 줄 약 35~40자)으로 제한하고 가운데 정렬합니다.
- 본문 글자 크기 `17~18px`, 줄 간격 `1.75` 안팎, 문단 사이 여백을 넉넉히 둡니다.
- 글꼴은 외부 웹폰트 없이 시스템 글꼴을 씁니다:
  `-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`.
- 장식은 최소화합니다. 그림자·그라데이션·애니메이션은 꼭 필요할 때만 가볍게 씁니다.
- `word-break: keep-all`로 한글 단어가 중간에 끊기지 않게 합니다.

### 색상과 다크 모드
- 모든 색은 `:root`의 CSS 변수로 정의하고, 컴포넌트에서는 변수만 씁니다. 색상 값을 직접 쓰지 않습니다.
  ```css
  :root {
    --bg: #ffffff;  --text: #1f2328;  --text-muted: #656d76;
    --accent: #2f6feb;  --border: #e5e7eb;  --code-bg: #f6f8fa;
  }
  ```
- 다크 모드 우선순위:
  1. 사용자가 토글로 고른 값 (`localStorage`의 `theme`, `<html data-theme="dark|light">`)
  2. 없으면 운영체제 설정 (`prefers-color-scheme`)
- 다크 모드 변수는 `@media (prefers-color-scheme: dark)` 안의 `:root:not([data-theme="light"])`와
  `:root[data-theme="dark"]` 두 곳에 정의합니다.
- 페이지가 처음 그려질 때 색이 깜빡이지 않도록, 테마를 정하는 짧은 스크립트를 `<head>` 안에 인라인으로 둡니다.
- `localStorage` 접근은 `try/catch`로 감쌉니다.

### 모바일 대응
- 모바일 우선으로 작성하고, 넓은 화면은 `min-width` 미디어 쿼리로 확장합니다.
- 모든 HTML에 `<meta name="viewport" content="width=device-width, initial-scale=1">`를 넣습니다.
- 좌우 여백은 최소 `16px`, 가로 스크롤이 생기지 않게 합니다.
- 코드 블록과 표는 그 요소 안에서만 가로 스크롤(`overflow-x: auto`)되게 합니다.
- 이미지는 `max-width: 100%; height: auto;`.
- 버튼·링크 등 터치 영역은 최소 `44px`.

### 접근성
- 시맨틱 태그(`header`, `nav`, `main`, `article`, `footer`)를 씁니다.
- 텍스트 대비는 WCAG AA(4.5:1) 이상을 지킵니다. 다크 모드도 확인합니다.
- 테마 토글 버튼에는 `aria-label`을 붙입니다.
- `prefers-reduced-motion`이면 전환 효과를 끕니다.

## 코드 작성 규칙

- JavaScript는 `<script type="module">`과 `import/export`를 씁니다. 전역 변수를 만들지 않습니다.
- `const`/`let`만 쓰고 `var`는 쓰지 않습니다. 비동기는 `async/await`.
- `fetch` 실패(글이 없음 등)에는 사용자에게 보이는 안내 문구를 띄웁니다.
- 들여쓰기 2칸, 문자열은 작은따옴표, 세미콜론 사용.
- CSS 클래스 이름은 소문자 + 하이픈(`post-list`, `post-title`).
- 주석은 짧게, 왜 그렇게 했는지가 필요할 때만 한국어로 씁니다.

## 로컬에서 실행하기

브라우저는 `file://`로 연 페이지에서 `fetch`를 막기 때문에 로컬 서버가 필요합니다.

```bash
python -m http.server 8000
```

그다음 브라우저에서 `http://localhost:8000`을 엽니다.
(Node가 있다면 `npx serve` 도 가능하지만, 프로젝트에 npm 의존성은 추가하지 않습니다.)

## 새 글 추가 순서

1. `posts/<slug>.md` 파일을 만들고 front matter를 채웁니다.
2. `posts/posts.json`에 같은 `slug`로 항목을 추가합니다.
3. 로컬 서버에서 목록과 본문이 잘 보이는지, 다크 모드와 모바일 폭(375px)에서도 확인합니다.

## Obsidian에서 글 가져오기

- 볼트 위치: `C:\Users\hyuns\Documents\Obsidian Vault` (게시용 글은 주로 `40 Output` 폴더)
- 볼트의 원본은 **읽기만 하고 수정하지 않습니다.** 블로그에는 복사본을 만듭니다.
- 옮길 때 바꾸는 것:
  - front matter를 이 블로그 형식(`title`, `date`, `tags`, `description`, `draft`)으로 바꿉니다.
    Obsidian의 `created`는 `date`로, `status: draft`는 `draft: true`로 옮깁니다.
  - 본문 첫 줄의 `# 제목`은 지웁니다.
  - 파일 이름(slug)은 한글 제목 대신 영문 소문자·하이픈으로 새로 짓습니다.
- 위키링크는 그대로 두어도 됩니다(파서가 글자로 바꿔 줌). 이미지 임베드(`![[그림.png]]`)는 아직 지원하지 않으므로
  그림을 `images/`에 복사하고 `![설명](images/그림.png)`로 바꿉니다.

## 변경 후 확인할 것

- 라이트/다크 모드 모두에서 글자와 배경 대비가 충분한지
- 375px(모바일) 폭에서 가로 스크롤이 없는지
- 브라우저 콘솔에 에러가 없는지
- 존재하지 않는 slug로 접근했을 때 안내 문구가 나오는지
