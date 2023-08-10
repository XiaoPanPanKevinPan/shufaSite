/**
 * The data from ./copybooks/index.json
 */

// script paths can be relative to this module or the page who imported this module
const moduleBased = (str) => new URL(str, import.meta.url).toString();
const pageBased = (str) => str;

const cbsInfo = await fetch(moduleBased("./copybooks/index.json"))
	.then(res => {
		if(!res.ok)	
			throw "應有一個字帖集合位於 ./copybooks，且其中應有一檔案 index.json 描述字帖內容";
		return res.json();
	});

const getCbVarIndex = (() => {
	const cache = {};

	/**
	 * Get the index of a copybook's variant. 
	 * In the index is an object of char and imageAmount pair.
	 * @async
	 * @function getCbVarIndex
	 * @param {Object} options
	 * @param {string} options.cbPath - the path of the copybook which the variant belongs to
	 * @param {stirng} options.varPath - the path of the variant itself
	 * @returns {Object} In each entries, the key is a character which the variant has files for it,
	 *     and the value is how many files are there for the character.
	 */
	return async ({cbPath, varPaht}) => {
		if(cache[cbPath]?.[varPath])
			return cache[cbPath][varPath];

		const index = await fetch(moduleBased(`./copybooks/${cbVar.cbPath}/${cbVar.varPath}/index.txt`))
			.then(res => res.text())
			.then(text => 
				text.split('\n')

					// clear empty lines
					.filter(line => line ? true : false)

				  	// "12,天地玄黃,宇宙洪荒" -> ["12", "天地玄黃,宇宙洪荒"]
					.map(line => [line.slice(0, line.indexOf(',')), line.slice(line.indexOf(',') + 1)])

					// ["7", "之乎者也"] -> [7, ["之", "乎", "者", "也"]]
					.map(([num, chars]) => [parseInt(num), [...chars]])

					// [[3, ['天', '地']], [4, ['人', '和']]] -> {天: 3, 地: 3, 人: 4, 和: 4}
					.reduce((result, [num, chars]) => 
						chars.reduce((result, ch) => ({...result, [ch]: num}), result),
					{})
			);

		// set cache
		cache[cbVar.cbPath] ??= {};
		cache[cbVar.cbPath][cbVar.varPath] = index;

		return index;
	}
})(); 

/**
 * Get the image paths from a copybook variant.
 * @param {string} query - the chars to query for image paths
 * @param {Object} options - the copybook variants that images are stored
 * @param {string} options.cbPath - the path of the copybook which the variant belongs to
 * @param {stirng} options.varPath - the path of the variant itself
 * @param {stirng} options.formatPath - the mimetype of the image files
 * @returns {Object} In each entries, the key {string} is an char from the `query`, and value 
 *     is an array of filenames {string} of the images.
 */

const getImageNames = async (query, { cbPath, varPath, formatPath }) => {
	const chars = [...query];

	// get the image amount for each char
	const index = await getCbVarIndex({ cbPath, varPath, formatPath });

	// get the format
	const format = cbsInfo[cbPath].variants[varPath].formats[formatPath];
	if(!format) throw "options 似乎不正確，因為我們無法在 database 中找到相關的訊息。"

	return chars.reduce((result, ch) => {
		const len = index[ch] || 0;
		result[ch] ??= [];
		for(let i = 0; i < len; i++)
			result[ch].push(`${ch.codePointAt().toString(16)}_${i}${format.fnExt}`)
		return result;
	}, {})
}

export {
	cbsInfo,
	getCbVarIndex,
	getImageNames
};
