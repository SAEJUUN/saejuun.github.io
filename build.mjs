// 포트폴리오 사이트를 만든다. 의존성 없이 node build.mjs 로 실행한다.
//   content/works.json   작업 목록 (작업 하나 = 상세 페이지 하나, /work/<slug>/)
//   content/profile.json 소개·경력·연락처
// 결과는 _site/ 에 쓰고, GitHub Actions 가 이 폴더를 GitHub Pages 로 배포한다.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "_site");
const read = (file) => JSON.parse(readFileSync(join(root, file), "utf8"));

const profile = read("content/profile.json");
const CATEGORIES = {
  uxui: "UX·UI",
  brand: "Brand",
  advertising: "Advertising",
  package: "Package",
  editorial: "Editorial",
  public: "Public",
};

// 타임라인 순서: 끝난 날이 최근인 작업부터, 기간을 모르는 작업은 맨 뒤
const works = read("content/works.json").sort(
  (a, b) => (b.end || "0").localeCompare(a.end || "0") || (b.start || "0").localeCompare(a.start || "0")
);

const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const dot = (d) => d.replaceAll("-", ".");
/** "2023-03-02" ~ "2023-10-14" → "2023.03.02 – 10.14" */
const period = (w) => {
  if (!w.start) return "";
  if (!w.end || w.end === w.start) return dot(w.start);
  return w.start.slice(0, 4) === w.end.slice(0, 4) ? `${dot(w.start)} – ${dot(w.end.slice(5))}` : `${dot(w.start)} – ${dot(w.end)}`;
};
/** 카드에 쓰는 짧은 기간: "2023.03 – 10" */
const shortPeriod = (w) => {
  if (!w.start) return "";
  const s = dot(w.start.slice(0, 7));
  if (!w.end || w.end.slice(0, 7) === w.start.slice(0, 7)) return s;
  return w.start.slice(0, 4) === w.end.slice(0, 4) ? `${s} – ${w.end.slice(5, 7)}` : `${s} – ${dot(w.end.slice(0, 7))}`;
};
const year = (w) => (w.end || w.start || "").slice(0, 4);

/** JPEG 의 가로·세로를 읽어 img 에 적는다. 이미지가 늦게 떠도 화면이 밀리지 않는다. */
const size = (src) => {
  const buf = readFileSync(join(root, "assets", src));
  for (let i = 2; i < buf.length; ) {
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
      return ` width="${buf.readUInt16BE(i + 7)}" height="${buf.readUInt16BE(i + 5)}"`;
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return "";
};
const url = (path) => profile.siteUrl + path;

const layout = ({ title, description, path, image, body, nav, jsonLd }) => `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url(path)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url(path)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${url("/assets/" + (image || "work/horang-brand-cover.jpg"))}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
  <link rel="stylesheet" href="/styles.css">${jsonLd ? `\n  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
</head>
<body>
  <a class="skip-link" href="#main">본문으로 바로가기</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="wordmark" href="/">${esc(profile.name)}<span>${esc(profile.nameEn.toUpperCase())}</span></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="메뉴 열기"><span></span><span></span></button>
      <nav id="site-nav" class="site-nav" aria-label="주요 메뉴">
        <a href="/work/"${nav === "work" ? ' aria-current="page"' : ""}>Work</a>
        <a href="/about/"${nav === "about" ? ' aria-current="page"' : ""}>About</a>
        <a class="nav-cta" href="/about/#contact">Contact</a>
      </nav>
    </div>
  </header>
  <main id="main">
${body}
  </main>
  <footer class="site-footer">
    <div class="wrap footer-inner">
      <p>© <span data-year>${new Date().getFullYear()}</span> ${esc(profile.name)} ${esc(profile.nameEn)}</p>
      <p><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a> · <a href="${esc(profile.github)}">GitHub</a></p>
    </div>
  </footer>
  <script src="/script.js"></script>
</body>
</html>
`;

const card = (w) => `<li data-cat="${w.category}"><a class="card" href="/work/${w.slug}/">
          <div class="thumb thumb-${w.coverFit || "cover"}"><img src="/assets/${esc(w.cover)}" alt="${esc(w.coverAlt)}"${size(w.cover)} loading="lazy"></div>
          <p class="card-cat">${CATEGORIES[w.category]}${w.award ? ` <span class="award">${esc(w.award)}</span>` : ""}</p>
          <h3>${esc(w.title)}</h3>
          ${shortPeriod(w) ? `<p class="card-meta">${shortPeriod(w)}</p>` : ""}
        </a></li>`;

// ===== 홈 =====
const home = layout({
  title: `${profile.name} — UI·UX · 브랜드 디자이너 포트폴리오`,
  description: `${profile.headline.join(" ")} ${profile.intro}`,
  path: "/",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    alternateName: profile.nameEn,
    jobTitle: "UI·UX · 브랜드 디자이너",
    url: url("/"),
    email: `mailto:${profile.email}`,
    sameAs: [profile.github],
  },
  body: `    <section class="hero wrap">
      <p class="kicker">${esc(profile.role)}</p>
      <h1>${profile.headline.map(esc).join("<br>")}</h1>
      <p class="lead">${esc(profile.intro)}</p>
      <div class="actions">
        <a class="btn" href="/work/">작업 보기</a>
        <a class="btn btn-ghost" href="/about/">소개</a>
      </div>
      <dl class="stats">
        <div><dt>작업</dt><dd>${works.length}</dd></div>
        <div><dt>분야</dt><dd>${new Set(works.map((w) => w.category)).size}</dd></div>
        <div><dt>수상</dt><dd>${profile.awards.length}</dd></div>
      </dl>
    </section>

    <section class="section wrap">
      <div class="section-head section-head-row">
        <div>
          <p class="kicker">Recent Work</p>
          <h2>최근 작업</h2>
        </div>
        <a class="text-link" href="/work/">전체 작업 ${works.length} ›</a>
      </div>
      <ul class="grid">
        ${works.slice(0, 6).map(card).join("\n        ")}
      </ul>
    </section>

    <section class="section wrap contact">
      <p class="kicker">Contact</p>
      <h2>끝까지 책임감 있게 함께하겠습니다.</h2>
      <p class="lead">채용, 협업, 디자인 의뢰 모두 메일로 연락 주세요.</p>
      <a class="btn" href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>
    </section>`,
});

// ===== 작업 목록 (연도별 타임라인) =====
const years = [...new Set(works.map(year))];
const workList = layout({
  title: `작업 — ${profile.name}`,
  description: `${profile.name}의 작업 ${works.length}개. ${Object.values(CATEGORIES).join(" · ")}`,
  path: "/work/",
  nav: "work",
  body: `    <section class="page wrap">
      <div class="section-head">
        <p class="kicker">Work</p>
        <h1 class="page-title">작업</h1>
        <p class="lead">최근에 끝낸 작업부터 시간순으로 모았습니다. 작업을 누르면 자세히 볼 수 있습니다.</p>
      </div>

      <div class="filters" role="group" aria-label="분야로 거르기">
        <button type="button" class="chip is-active" data-filter="all" aria-pressed="true">전체 <span>${works.length}</span></button>
        ${Object.entries(CATEGORIES)
          .map(([key, label]) => {
            const n = works.filter((w) => w.category === key).length;
            return n ? `<button type="button" class="chip" data-filter="${key}" aria-pressed="false">${label} <span>${n}</span></button>` : "";
          })
          .join("\n        ")}
      </div>

      ${years
        .map(
          (y) => `<section class="year" data-year-group>
        <h2 class="year-title">${y || "기간 미정"}</h2>
        <ul class="grid">
          ${works.filter((w) => year(w) === y).map(card).join("\n          ")}
        </ul>
      </section>`
        )
        .join("\n\n      ")}
    </section>`,
});

// ===== 작업 상세 =====
const FIELDS = [
  ["type", "구분"],
  ["period", "기간"],
  ["role", "역할"],
  ["tools", "도구"],
  ["keywords", "키워드"],
  ["result", "결과"],
];
const detail = (w, i) => {
  const prev = works[i - 1];
  const next = works[i + 1];
  const values = { ...w, period: period(w) };
  // 비어 있는 항목은 보여주지 않는다. 내용을 받으면 works.json 에 채운다.
  const meta = FIELDS.filter(([key]) => values[key]);
  const figure = (img) => `<figure class="${img.layout ? `fig-${img.layout}` : ""}">
          <img src="/assets/${esc(img.src)}" alt="${esc(img.alt)}"${size(img.src)} loading="lazy">${img.caption ? `\n          <figcaption>${esc(img.caption)}</figcaption>` : ""}
        </figure>`;
  return layout({
    title: `${w.title} — ${profile.name}`,
    description: w.description || `${CATEGORIES[w.category]} · ${w.title}`,
    path: `/work/${w.slug}/`,
    image: w.cover,
    nav: "work",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: w.title,
      genre: CATEGORIES[w.category],
      ...(w.description && { description: w.description }),
      ...(w.start && { dateCreated: w.start }),
      image: url("/assets/" + w.cover),
      creator: { "@type": "Person", name: profile.name, url: url("/") },
    },
    body: `    <article class="page wrap case">
      <a class="back-link" href="/work/">‹ 작업 목록</a>
      <header class="case-head">
        <p class="kicker">${CATEGORIES[w.category]} Design</p>
        <h1 class="page-title">${esc(w.title)}</h1>
        ${meta.length ? `<dl class="case-meta">
          ${meta.map(([key, label]) => `<div><dt>${label}</dt><dd>${esc(values[key])}</dd></div>`).join("\n          ")}
        </dl>` : ""}
        ${w.description ? `<p class="case-text">${esc(w.description)}</p>` : ""}
      </header>

      <div class="case-images">
        ${w.images.map(figure).join("\n        ")}
      </div>

      <nav class="pager" aria-label="다른 작업">
        ${prev ? `<a class="pager-item" href="/work/${prev.slug}/"><span>이전 작업</span>${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a class="pager-item pager-next" href="/work/${next.slug}/"><span>다음 작업</span>${esc(next.title)}</a>` : "<span></span>"}
      </nav>
    </article>`,
  });
};

// ===== 소개 =====
const cvList = (items) =>
  items
    .map((x) => `<li><span>${esc(x.date)}</span><p>${esc(x.text)}${x.prize ? ` <b>${esc(x.prize)}</b>` : ""}</p></li>`)
    .join("\n            ");
const about = layout({
  title: `소개 — ${profile.name}`,
  description: profile.about,
  path: "/about/",
  nav: "about",
  body: `    <section class="page wrap">
      <div class="section-head">
        <p class="kicker">About</p>
        <h1 class="page-title">${esc(profile.aboutTitle)}</h1>
      </div>
      <p class="lead">${esc(profile.about)}</p>

      <div class="cv">
        <section><h2>경력</h2><ul>
            ${cvList(profile.career)}
        </ul></section>
        <section><h2>학력</h2><ul>
            ${cvList(profile.education)}
        </ul></section>
        <section><h2>수상</h2><ul>
            ${cvList(profile.awards)}
        </ul></section>
        <section><h2>활동</h2><ul>
            ${cvList(profile.activities)}
        </ul></section>
        <section><h2>도구</h2><ul class="tools">
            ${profile.tools.map((t) => `<li>${esc(t)}</li>`).join("")}
        </ul></section>
      </div>
    </section>

    <section class="section wrap contact" id="contact">
      <p class="kicker">Contact</p>
      <h2>끝까지 책임감 있게 함께하겠습니다.</h2>
      <p class="lead">채용, 협업, 디자인 의뢰 모두 메일로 연락 주세요.</p>
      <a class="btn" href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>
    </section>`,
});

const notFound = layout({
  title: `페이지를 찾을 수 없습니다 — ${profile.name}`,
  description: "주소가 바뀌었거나 없는 페이지입니다.",
  path: "/404.html",
  body: `    <section class="page wrap">
      <p class="kicker">404</p>
      <h1 class="page-title">페이지를 찾을 수 없습니다.</h1>
      <div class="actions"><a class="btn" href="/work/">작업 보기</a></div>
    </section>`,
});

// ===== 쓰기 =====
rmSync(out, { recursive: true, force: true });
const write = (path, html) => {
  const file = join(out, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};
write("index.html", home);
write("work/index.html", workList);
works.forEach((w, i) => write(`work/${w.slug}/index.html`, detail(w, i)));
write("about/index.html", about);
write("404.html", notFound);

const today = new Date().toISOString().slice(0, 10);
const pages = ["/", "/work/", ...works.map((w) => `/work/${w.slug}/`), "/about/"];
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${url(p)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`
);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${url("/sitemap.xml")}\n`);

for (const file of ["styles.css", "script.js", "favicon.svg"]) cpSync(join(root, file), join(out, file));
cpSync(join(root, "assets"), join(out, "assets"), { recursive: true });

console.log(`built ${pages.length} pages → _site/`);
