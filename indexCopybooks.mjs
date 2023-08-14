
import * as ps from "node:process";
import fs from "node:fs";
import fsP from "node:fs/promises";
import path from "node:path";

// 要求輸入字帖集合的路徑
if(!ps.argv[2]){
	console.log("請輸入字帖集合的路徑");
	ps.exit(1)
}

// 路徑應該要存在
const cbsPath = path.resolve(ps.argv[2]); // cb 就是 copybook（字帖）
if(!fs.existsSync(cbsPath)){
	console.log("所輸入的字帖集合路徑不存在，請再次確認");
	ps.exit(1);
}

// 遍歷各字帖
console.log("正在讀取各字帖之 summary.json ……");
const cbPaths = (await fsP.readdir(cbsPath, { withFileTypes: true }))
	.filter(f => f.isDirectory())
	.map(f => ({full: path.resolve(cbsPath, f.name), min: f.name}));

const cbSummaries = Object.fromEntries(
	await Promise.all(cbPaths.map(async cbPath => {
		const summaryPath = path.resolve(cbPath.full, "summary.json");
		if(!fs.existsSync(summaryPath)){
			console.log(`在字帖集合中，資料夾 ${cbPath.min} 缺少 summary.json，疑似不是字帖，因此遭略過。`);
			return;
		}
		const summary = JSON.parse(await fsP.readFile(summaryPath, { encoding: "utf-8" }));
		return [cbPath.min, summary];
	}))
	.then(arr => arr.filter(x => x ? true: false)) // filter out undefineds
);

// 寫入 index.json 檔
console.log("已讀取字帖。正在寫入 index.json ……");
const indexContent = JSON.stringify(cbSummaries, undefined, "\t");
await fsP.writeFile(path.resolve(cbsPath, "index.json"), indexContent);

console.log("已經寫入完畢");
