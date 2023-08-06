import * as ps from "node:process";
import fs from "node:fs";
import fsP from "node:fs/promises";
import path from "node:path";

// 要求輸入字帖變體的路徑
if(!ps.argv[2]){
	console.log("請輸入字帖變體的路徑");
	ps.exit(1)
}

// 路徑應該要存在
const cbVarPath = path.resolve(ps.argv[2]); // cb 就是 copybook（字帖），var 就是 variant（變體）
if(!fs.existsSync(cbVarPath)){
	console.log("所輸入的字帖變體路徑不存在，請再次確認");
	ps.exit(1);
}

// 字帖資料夾應該要有 summary.json
const summaryPath = path.resolve(cbVarPath, "../summary.json");
if(!fs.existsSync(summaryPath)){
	console.log("字帖資料夾內，應該要有 summary.json");
	ps.exit(1);
}

// 讀取 summary.json
const varPathInCb = path.parse(cbVarPath).name;
let formats = JSON.parse(await fsP.readFile(summaryPath, { encoding: "utf8" }))
	.children
	.filter(c => c.path == varPathInCb)
	?.[0]?.formats || undefined;

if(!formats || formats.length == 0){
	console.log(`
字帖資料夾中的 summary.json 可能有錯，導致無法讀取格式訊息。

請確保 .children 陣列中，有物件的名稱是 ${varPathInCb}，
且該物件的 formats 並非空陣列。

由於上述錯誤，本程式先行退出。
`);
	ps.exit();
}

// 檢驗 summary.json 中，本變體的格式列表正確
let allFormatsExist = true;
formats.forEach(format => {
	const formatExists = fs.existsSync(path.resolve(cbVarPath, format.path));

	if(formatExists) return;
	allFormatsExist = false;
	console.log(`path 為 ${format.path} 的格式不存在。請修正 summary.json。`);
});

if(!allFormatsExist){
	console.log("由於格式列表不正確，本程式先行退出。");
	ps.exit();
}

// 取得檔案列表
formats = await Promise.all(formats.map(async format => {
	const files = (await fsP.readdir(path.join(cbVarPath, format.path), { withFileTypes: true }))
		.filter(f => f.isFile())
		.filter(f => f.name.match(new RegExp(`^[0-9a-f]+_[0-9]+${format.fnExt}$`)));
	return {
		...format,
		fns: files.map(f => f.name),
		mainFns: files.map(f => f.name.replace(new RegExp(`${format.fnExt}$`), ""))
	};
}));

// 確認各格式中，檔案列表相同
let allSame = true;
if(formats.length >= 2){
	const [mainFm, ...otherFms] = formats; // fm 就是 format
	otherFms.forEach(fm => {
		const onlyFmHas = fm.mainFns.filter(fn => !mainFm.mainFns.includes(fn));
		const fmLacks = mainFm.mainFns.filter(fn => !fm.mainFns.includes(fn));

		if(onlyFmHas.length != 0){
			console.log("相較於 ${mainFm.path} 資料夾，${fm.path} 資料夾多出了這些字形檔案：", onlyFmHas);
			allSame = false;
		}

		if(fmLacks.length != 0){
			console.log("相較於 ${mainFm.path} 資料夾，${fm.path} 資料夾缺少了這些字形檔案：", onlyFmHas);
			allSame = false;
		}
	})
}

if(!allSame){
	console.log(
`由於各格式中的字形數量不符，本程式先行終止。

修正後，請再執行本程式。
屆時，將確認各字的字形編號是否連續，在編輯時請特別注意。`
	);
	ps.exit();
}

console.log("已確認各格式的資料夾中，各字的字形數量相同。");

// 把字形編號按字排進列表，稍後確認各字的字形編號是否連續
const shapes = formats[0].mainFns.map(fn => fn.split("_"));
	// 由於已確認各列表相同，所以只需要確認任一列表
const chars = {};
shapes.forEach(shape => {
	if(!chars.hasOwnProperty(shape[0]))
		chars[shape[0]] = [];
	chars[shape[0]].push(parseInt(shape[1]));
})

// 排序各字，然後確認字形編號是否連續
let allContinuous = true;
Object.entries(chars).forEach(([hex, arr]) => {
	arr.sort((a, b) => a > b ? 1 : a < b ? -1 : 0);

	const isContinuous = arr.every((num, index) => num == index);

	if(isContinuous) return;
	
	console.log(`文字「${String.fromCodePoint(parseInt(hex, 16))}」（編號 ${hex}）的字形編號不連續！`);
	allContinuous = false;
});

if(!allContinuous) {
	console.log("由於部分字形編號不連續，本程式先行退出。");
	ps.exit();
}
console.log("已確認各字的各字形，編號皆有連續。");

// 開始索引
const maxPerChar = Object.entries(chars)
	.map(([hex, arr]) => [arr.length, String.fromCodePoint(parseInt(hex, 16))])
	.sort((a, b) => a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0);

console.log("正在建立索引……");
const index = maxPerChar.reduce(([maxSoFar, result], [currentMax, currentChar]) => {
	if(maxSoFar === currentMax) 
		return [maxSoFar, `${result}${currentChar}`];
	return [currentMax, `${result}\n${currentMax},${currentChar}`]
}, [0, ""])[1] + "\n"; // each line end with \n

console.log("已建立索引。正在寫入索引（index.txt）……");
await fsP.writeFile(path.join(cbVarPath, "index.txt"), index);
console.log("已寫入索引。");
