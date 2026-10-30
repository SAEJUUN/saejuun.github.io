# 김새준 — Portfolio

UI·UX · 브랜드 디자이너 김새준의 포트폴리오 사이트입니다.

🔗 **https://saejuun.github.io/**

## 구성

- `index.html` — 첫 화면, 작업 목록(분야별 거르기), 작업 상세 11개, 소개(경력·학력·수상·활동·도구), 연락처
- `assets/work/` — 작업 이미지 (포트폴리오 PDF 에서 잘라낸 것)
- `styles.css` — 레이아웃과 스타일 (Pretendard, 강조색 민트 `#86d0c7`)
- `script.js` — 모바일 메뉴, 분야 거르기, 연도 표시

## 작업 추가하는 법

1. 이미지를 `assets/work/` 에 넣습니다. (가로 1600px 이하 JPG 권장)
2. `index.html` 의 `<ul class="grid">` 에 카드 `<li data-cat="분야">` 를 하나 복사해 고칩니다.
3. 아래 `<div class="cases">` 에 `<article class="case" id="...">` 를 하나 복사해 내용과 이미지를 바꿉니다. 카드의 `href="#..."` 와 `id` 를 맞춥니다.

분야(`data-cat`)는 `uxui`, `brand`, `advertising`, `package`, `editorial`, `public` 중 하나입니다.

## 배포

빌드 과정 없는 HTML·CSS·JS 정적 사이트입니다. `main` 브랜치에 푸시하면 `.github/workflows/pages.yml` 이 GitHub Pages 로 배포합니다. 수동 재배포는 Actions 탭의 **Deploy to GitHub Pages → Run workflow** 입니다.
