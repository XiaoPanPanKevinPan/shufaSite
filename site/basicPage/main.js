/**
 * This script inject a <header> as the first child of the <body>
 * and a <footer> as the last element of the <body>. It also inject
 * the ./main.css into the script.
 * 
 * It expects the webpage has this strucutre:
 *   <body><header /><main /><footer /></body>
 */

const headerHtml = `
<div>
	<a href="/"><h1>書法資料庫</h1></a>
	<div id="menu">
		<a href="/search">搜尋</a>
	</div>
</div>`;

const footerHtml = `
<div>
	版權所有 blahblahblah。
	建議使用最新版瀏覽器訪問本網站。
</div>
`;

const headerCss = `

`;

const footerCss = `

`;

// # here starts the script
// script paths can be relative to this module or the page who imported this module
const moduleBased = (str) => new URL(str, import.meta.url).toString();
const pageBased = (str) => str;

// import css
fetch(moduleBased("./main.css"))
	.then(res => res.text())
	.then(css => new CSSStyleSheet({ baseURL: moduleBased("./main.css") }).replace(css))
	.then(sheet => document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]);

// baseURL for css
const baseURL = import.meta.url;

// header
const headerEl = document.createElement("header");
document.body.insertBefore(headerEl, document.body.childNodes[0]);

const headerRoot = headerEl.attachShadow({ mode: "open" });
headerRoot.innerHTML = headerHtml;
new CSSStyleSheet({ baseURL })
	.replace(headerCss)
	.then(sheet => headerRoot.adoptedStyleSheets = [sheet]);

// footer
const footerEl = document.createElement("footer");
document.body.appendChild(footerEl);

const footerRoot = footerEl.attachShadow({ mode: "open" });
footerRoot.innerHTML = footerHtml;
new CSSStyleSheet({ baseURL })
	.replace(footerCss)
	.then(sheet => footerRoot.adoptedStyleSheets = [sheet]);
