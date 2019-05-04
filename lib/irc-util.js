//@ts-check

/**
 * @typedef {import('./irc-typedef').IRCData} IRCData
 */

// /** @type {string[]} Keys to be deleted from the tags object. */
// const deleteTags = [ 'user-type', 'turbo', 'subscriber' ];
const booleanTags = [
	'mod', 'subsOnly', 'r9k', 'rituals', 'slow', 'emoteOnly'
];

/**
 * Returns a channel name without the "#" at the start.
 * 
 * @param {string} channel A channel name, with or without "#".
 */
function cleanChannel(channel) {
	return channel[0] === '#' ? channel.slice(1) : channel;
}

/**
 * Returns a channel name with the necessary requirements of lowercase and
 * starting with a "#".
 * 
 * @param {string} channel A channel name, with or without "#".
 */
function formatChannel(channel) {
	return (channel[0] !== '#' ? '#' : '') + channel.toLowerCase();
}

/**
 * Generate a random justinfan username.
 * 
 * @returns {string} Returns a random justinfan username.
 */
function genAnonName() {
	return 'justinfan' + Math.ceil(Math.random() * 70000 + 30000);
}

/**
 * Parse a complex tag value.
 * 
 * @param {Object} tags An IRC tags object.
 * @param {string} tagKey The key to parse on tags.
 * @param {string} [a=','] The primary split character.
 * @param {string} [b=','] The secondary split character.
 * @param {?string} [c=null] The tertiary split character.
 * @param {?string} [d=null] The quaternary split character.
 * @returns {Object} tags Returns the original tags object with the changes.
 */
function parseComplexTag(tags, tagKey, a = ',', b = '/', c = null, d = null) {
	const { [tagKey]: raw } = tags;
	if(raw === undefined) {
		return tags;
	}
	tags[tagKey] = {};
	if(typeof raw !== 'string' || !raw.length) {
		return tags;
	}
	const spl = raw.split(a);
	for(const s of spl) {
		const [ key, _val ] = s.split(b);
		const val = c === null || !_val ? _val : _val.split(c);
		tags[tagKey][key] = val || null;
	}
	return tags;
}

/**
 * Do some tag stuff.
 * 
 * @param {IRCData} parsedData
 */
function doSomeTagStuff(parsedData) {
	const { tags } = parsedData;
	for(let key in tags) {
		// if(deleteTags.includes(key)) {
		// 	delete tags[key];
		// 	continue;
		// }
		let val = tags[key];
		if(key.includes('-')) {
			delete tags[key];
			const keySpl = key.split('-');
			if(keySpl.length === 2) {
				key = keySpl[0] + keySpl[1][0].toUpperCase() +
					keySpl[1].slice(1);
			}
			else if(keySpl.length === 3) {
				key = keySpl[0] + keySpl[1][0].toUpperCase() +
					keySpl[1].slice(1) + keySpl[2][0].toUpperCase() +
					keySpl[2].slice(1);
			}
			else {
				key = keySpl.reduce(
					(p, n) => p + n[0].toUpperCase() + n.slice(1)
				);
			}
			// tags[key] = val;
		}
		if(booleanTags.includes(key)) {
			val = val === '1';
		}
		else if(key === 'followersOnly') {
			val = val === '-1' ? false : val === '0' || parseInt(val);
		}
		tags[key] = val;
	}
	parseComplexTag(tags, 'badges');
	parseComplexTag(tags, 'badgeInfo');
	parseComplexTag(tags, 'emotes', '/', ':', ',');
}

module.exports = {
	cleanChannel,
	formatChannel,
	genAnonName,
	parseComplexTag,
	doSomeTagStuff
};