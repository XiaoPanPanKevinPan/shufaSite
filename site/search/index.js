import * as cbs from "../searchCbs.js";

const qrys = (...x) => [...document.querySelectorAll(...x)];
const qry = (...x) => document.querySelector(...x);


{// render options when site's loaded 
	const renderCb = (cbsInfo) =>
		cbsInfo.reduce((result, cb) => // cb for codebook
			result + `
			<details class="codebook">
				<summary class="title">${cb.name || ""}</summary>
				<div class="description">${cb.description || ""}</div>
				<dl class="variants">${renderVariants(cb.children, cb)}</dl>
			</details>`
		, "")

	const renderVariants = (vrs, cb) => 
		vrs.reduce((result, vr) => // vr for variant
			result + `
				<div class="variant">
					<div class="title">${vr.name || ""}</div>
					<div class="description">${vr.description || ""}</div>
					<ul class="formats">${renderFormats(vr.formats, cb, vr)}</ul>
				</div>
			`
		, "");

	const renderFormats = (formats, cb, vr) =>
		vr.formats.reduce((result, fm) => 
			result + `
				<li><label>
					<input class="format" type="checkbox" value="${JSON.stringify({
						cbPath: cb.path,
						varPath: vr.path,
						formatPath: fm.path
					}).replace(/"/g, "&quot;")}" />
					${fm.description}
				</label></li>
			`
		, "");

	qry("#search #codebooks").insertAdjacentHTML("beforeend", renderCb(cbs.cbsInfo));
} // end of render options

// button for expand & collapse all codebooks
qry("#search #expandAllCbs").addEventListener("click", e => {
	qrys("#search details.codebook").forEach(cb => cb.open = true);
});
qry("#search #collapseAllCbs").addEventListener("click", e => {
	qrys("#search details.codebook").forEach(cb => cb.open = false);
});

// show results after clicked
qry("#search #submit").addEventListener("click", e => {
	const cbVarFms = qrys(`#search input[type="checkbox"]`)
		.map(ele => JSON.parse(ele.value));
	const chars = qry(`#search input[type="text"][name="chars"]`).value;
});
