# 김새준 — Portfolio

UI·UX · 브랜드 디자이너 김새준의 포트폴리오 사이트입니다.

🔗 **https://saejuun.github.io/**

## 페이지

| 주소 | 내용 |
|---|---|
| `/` | 첫 화면, 최근 작업 6개, 연락처 |
| `/work/` | 전체 작업 — 연도별 타임라인(최근에 끝난 작업부터), 분야별 거르기 |
| `/work/<slug>/` | 작업 상세 — 구분·기간·역할·도구·키워드·결과, 설명, 이미지, 이전·다음 작업 |
| `/about/` | 소개, 경력·학력·수상·활동·도구, 연락처 |

## 내용 고치기

글과 이미지는 두 파일만 고치면 됩니다. HTML 은 배포할 때 자동으로 만들어집니다.

- `content/works.json` — 작업 목록. 작업 하나가 상세 페이지 하나입니다.
- `content/profile.json` — 이름, 소개 문구, 경력·학력·수상·활동·도구, 이메일
- `assets/work/` — 작업 이미지 (가로 1600px 안팎 JPG 권장)

작업 하나의 항목:

| 항목 | 설명 |
|---|---|
| `slug` | 주소에 쓰는 영문 이름 (`/work/bus/`) |
| `title`, `category` | 제목, 분야(`uxui` `brand` `advertising` `package` `editorial` `public`) |
| `start`, `end` | 기간 `YYYY-MM-DD`. 목록 순서와 연도 묶음이 이 날짜로 정해지고, 비우면 "기간 미정"에 들어갑니다 |
| `type`, `role`, `tools`, `keywords`, `result` | 구분 · 역할 · 도구 · 키워드 · 결과. **모르면 `""` 로 비워 두면 화면에 안 보입니다** |
| `award` | 카드에 붙는 수상 표시 (예: `금상`) |
| `description` | 설명 글 |
| `cover`, `coverAlt`, `coverFit` | 카드 이미지, 대체 글, 맞춤(`cover` 꽉 채움 · `contain` 전체 보이기 · `top` 위쪽 기준) |
| `images` | 상세 이미지 목록 `{ src, alt, caption, layout }` — `layout` 은 `poster`(세로 포스터) · `narrow`(좁게) |

## 미리 보기 · 배포

```bash
node build.mjs          # _site/ 에 페이지 생성 (Node 18 이상, 설치할 패키지 없음)
npx serve _site         # 브라우저에서 확인
```

`main` 브랜치에 올리면 `.github/workflows/pages.yml` 이 `node build.mjs` 를 실행하고 `_site/` 를 GitHub Pages 로 배포합니다.
