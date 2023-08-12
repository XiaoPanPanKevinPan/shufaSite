/**
 * This script inject a <header> as the first child of the <body>
 * and a <footer> as the last element of the <body>. It also inject
 * the ./main.css into the script.
 * 
 * It expects the webpage has this strucutre:
 *   <body><header /><main /><footer /></body>
 */

// paths can be relative to this module or the page who imported this module
const moduleBased = (str) => new URL(str, import.meta.url).toString();
const pageBased = (str) => str;

const headerHtml = `
<div>
	<h1><a href="${moduleBased("../")}">書法資料庫</a></h1>
	<div id="menu">
		<a href="${moduleBased("../search/")}">搜尋</a>
	</div>
</div>
<style> @import "${moduleBased("../general.css")}" </style>
`;

const footerHtml = `
<div>
	版權所有 blahblahblah。
	建議使用最新版瀏覽器訪問本網站。
</div>
<style> @import "${moduleBased("../general.css")}" </style>
`;

const headerCss = `
/* @import won't work here */

h1 {
	margin: 0;
	font-weight: normal;
}

:host > div {
	padding: var(--padding);

	display: flex;
	flex-flow: row wrap;
	gap: 1em;

	align-items: center;
}

:host {
	background-color: white;
	box-shadow: 0 0 0.5rem black;
	margin-bottom: 0.5rem;
}

a {
	color: inherit;
	text-decoration: none;
}
`;

const footerCss = `
/* @import won't work here */

:host {
	border-top: solid 1px black;
}

:host > div {
	display: flex;
	flex-flow: row wrap;
	padding: var(--padding);
}
`;

// # here starts the script
// import css for the whole page
document.head.insertAdjacentHTML("beforeend", `<style> @import "${moduleBased("./main.css")}" </style>`);

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
