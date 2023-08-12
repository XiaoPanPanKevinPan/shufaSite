import * as cbs from "../searchCbs.js";

const qrys = (...x) => [...document.querySelectorAll(...x)];
const qry = (...x) => document.querySelector(...x);


{// render options when site's loaded 
	const renderCb = (cbsInfo) =>
		Object.entries(cbsInfo).reduce((result, cb) => // cb for codebook
			result + `
			<details class="codebook">
				<summary class="title">${cb[1].name || ""}</summary>
				<div class="description">${cb[1].description || ""}</div>
				<div class="variants">${renderVariants(cb[1].variants, cb)}</div>
			</details>`
		, "")

	const renderVariants = (vrs, cb) => 
		Object.entries(vrs).reduce((result, vr) => // vr for variant
			result + `
				<div class="variant">
					<div class="title">${vr[1].name || ""}</div>
					<div class="description">${vr[1].description || ""}</div>
					<ul class="formats">${renderFormats(vr[1].formats, cb, vr)}</ul>
				</div>
			`
		, "");

	const renderFormats = (formats, cb, vr) =>
		Object.entries(formats).reduce((result, fm) => 
			result + `
				<li><label>
					<input class="format" type="checkbox" value="${JSON.stringify({
						cbPath: cb[0],
						varPath: vr[0],
						formatPath: fm[0]
					}).replace(/"/g, "&quot;")}" />
					<div>${fm[1].description}</div>
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
qry("#search #submit").addEventListener("click", async e => {
	const resultsEl = qry("#searchResults");
	resultsEl.innerHTML = "<h3>搜尋結果</h3>";

	// get input text
	const chars = [...new Set([...qry(`#search input[type="text"][name="chars"]`).value])];
		// [...new Set(arr)] to uniquify an array
	if(chars.length == 0)
		return resultsEl.innerHTML += `<div class="warningBlock">請輸入欲搜尋的文字！</div>`

	// get selected codebooks' variants' formats
	const cbVarFms = qrys(`#search input[type="checkbox"]`)
		.filter(ele => ele.checked)
		.map(ele => JSON.parse(ele.value));
	if(cbVarFms.length == 0)
		return resultsEl.innerHTML += `<div class="warningBlock">請選擇應被搜尋的資料庫！</div>`

	// search the strings by cbVarFm and fetch the data meanwhile
	const searchResults = await Promise.all(cbVarFms.map(async ({ cbPath, varPath, formatPath }) => ({
		cbPath, varPath, formatPath,
		result: await cbs.search(chars, { cbPath, varPath, formatPath })
			.then(resultObj => {
				Object.values(resultObj).forEach(imgsPerCh => 
					imgsPerCh.forEach(img => 
						img.blob = fetch(img.url).then(res => res.blob())
							// start fetching now, and access it later with img.blob.then() or await img.blob
					)
				);
				return resultObj;
			})
	})));

	// render the results 
	const resultCharEls = chars.map(ch => {
		const charEl = Object.assign(document.createElement("div"), {
			className: "char",
			innerHTML: `
				<h4 class="text">${ch}</h4>
				<div class="files"></div>
			`
		});
		const filesEl = charEl.children[1];

		const filenameGen = ({ ch, chId, cbPath, varPath, formatPath }) => {
			const cb = cbs.cbsInfo[cbPath];
			const vr = cb.variants[varPath];
			const fm = vr.formats[formatPath];
			return `${ch}_${cb.name}_${vr.name}_${formatPath}-${chId}${fm.fnExt}`
		}
		const fileEls = searchResults.reduce((result, { cbPath, varPath, formatPath, result: dict }) => {
			dict[ch].forEach((file) => {
				const filename = filenameGen({ch, chId: file.chId, cbPath, varPath, formatPath});
				const fileEl = Object.assign(document.createElement("label"), {
					className: "file",
					innerHTML: `
						<input type="checkbox" value="${JSON.stringify({
							cbPath, varPath, formatPath, ch, chId: file.chId, filename
						}).replaceAll('"', "&quot;")}" hidden="" />
						<img src="" />
						<div class="filename"><a href="${file.url}" download="${filename}">
							${filename}
						</a></div>
					`
				});
				const imgEl = fileEl.children[1];
				file.blob.then(blob => URL.createObjectURL(blob)).then(blobUrl => imgEl.src = blobUrl);
				result.push(fileEl);
			});
			return result;
		}, []); // const fileEls = searchResults.reduce((result, ...) => {})
		filesEl.append(...(fileEls.length == 0 ? ["沒有結果。建議嘗試其他異體字。"] : fileEls));

		return charEl;
	}); // resultCharEls = chars.map(ch => {})
	resultsEl.append(...resultCharEls);

	// render download buttons
	// implement later
});
