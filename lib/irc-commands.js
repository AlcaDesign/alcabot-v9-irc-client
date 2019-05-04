//@ts-check

/**
 * @typedef {import("./irc-typedef").IRCData} IRCData
 * @typedef {import("./irc-typedef").IRCClient} IRCClient
 */

const { cleanChannel } = require('./irc-util');
const actionStart = '\u0001ACTION ';
const actionEnd = '\u0001';

/**
 * A noop function
 */
function noop() {
}

/**
 * Received the 376 command (ENDOFMOTD) from Twitch.
 *
 * @this {IRCClient}
 */
function ENDOFMOTD() {
	this.emit('connected');
}

/**
 * @typedef {Object} ClearChatTags
 * @property {string} [banDuration] The ban duration in seconds. If this
 * property exists, the user was timed out.
 * @property {string} roomId The ID of the channel.
 * @property {string} [targetUserId] The ID of the user.
 * @property {string} tmiSentTs Timestamp from the client.
 *
 * @typedef {string[]} ClearChatParams
 * 0: channel - The name of the channel.
 *
 * @typedef {?string} ClearChatTail The name of the user. If null, the whole
 * channel was cleared.
 */

/**
 * A user's messages or an entire channel's messages was deleted.
 *
 * @param {IRCData} data IRC data
 * @param {ClearChatTags} [tags=data.tags] The tags
 * @param {ClearChatParams} [params=data.params] The params
 * @param {ClearChatTail} [tail=data.tail] The tail
 * @see https://dev.twitch.tv/docs/irc/commands/#clearchat-twitch-commands
 */
function CLEARCHAT(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('CLEARCHAT', data);
	const channel = cleanChannel(params[0]);
	console.log({
		channel
	});
}

/**
 * @typedef {Object} ClearMsgTags
 * @property {string} login Name of the user who sent the message.
 * @property {string} [roomId=""] Probably an empty string, ignore.
 * @property {string} targetMsgId The UUID of the deleted message.
 * @property {string} [tmiSentTs="-6795364578871"] A not so useful timestamp,
 * ignore.
 *
 * @typedef {Object} ClearMsgParams
 * 
 * @typedef {Object} ClearMsgTail
 */

/**
 * A user's messages or an entire channel's messages was deleted.
 *
 * @param {IRCData} data IRC data
 * @param {ClearMsgTags} [tags=data.tags] The tags
 * @param {ClearMsgParams} [params=data.params] The params
 * @param {ClearMsgTail} [tail=data.tail] The tail
 * @see https://dev.twitch.tv/docs/irc/commands/#clearmsg-twitch-commands
 */
function CLEARMSG(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('CLEARMSG', data);
}

/**
 *
 * @param {IRCData} data IRC data
 */
function G_USERSTATE(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('GLOBALUSERSTATE', data);
}

/**
 * Channel starts or stops host mode.
 *
 * @param {IRCData} data IRC data
 * @see https://dev.twitch.tv/docs/irc/commands/#hosttarget-twitch-commands
 */
function HOSTTARGET(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('HOSTTARGET', data);
}

/**
 * User joined a channel.
 *
 * @param {IRCData} data IRC data
 * @see https://dev.twitch.tv/docs/irc/membership/#join-twitch-membership
 * @this {IRCClient}
 * @emits join
 */
function JOIN(data, tags=data.tags, params=data.params, tail=data.tail) {
	const user = data.prefix.user;
	const isSameName = this.identity.user === user;
	const { anonymous } = this.identity;
	if(isSameName && !anonymous) {
		return;
	}
	const channel = cleanChannel(data.params[0]);
	const self = anonymous && isSameName;
	this.emit('join', { channel, user, self, raw: data });
}

/**
 * General notices from the server.
 *
 * @param {IRCData} data IRC data
 * @see https://dev.twitch.tv/docs/irc/commands/#notice-twitch-commands
 */
function NOTICE(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('NOTICE', data);
}

/**
 * User parted a channel.
 *
 * @param {IRCData} data IRC data
 */
function PART(data, tags=data.tags, params=data.params, tail=data.tail) {
	const { user } = data.prefix;
	const self = this.identity.user === user;
	const channel = cleanChannel(data.params[0]);
	this.emit('part', { channel, user, self, raw: data });
}

/**
 * To ensure the connection is not terminated, immediately respond to this
 * command with a PONG.
 *
 * @param {IRCData} data IRC data
 * @see https://dev.twitch.tv/docs/irc/guide/#connecting-to-twitch-irc
 */
function PING(data, tags=data.tags, params=data.params, tail=data.tail) {
	this.write('PONG :tmi.twitch.tv');
}

/**
 * When a regular message is sent in a channel.
 *
 * @param {IRCData} data IRC data
 */
function PRIVMSG(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('PRIVMSG', require('util').inspect(data, { depth: Infinity, colors: true }));
	tags.isAction = tail.startsWith(actionStart) && tail.endsWith(actionEnd);
	if(tags.isAction) {
		data.tail = tail = tail.slice(actionStart.length, -actionEnd.length);
	}
}

/**
 * Rejoin channels after a restart.
 *
 * @param {IRCData} data IRC data
 * @see https://dev.twitch.tv/docs/irc/commands/#reconnect-twitch-commands
 */
function RECONNECT(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('RECONNECT', data);
}

/**
 * Identifies the channel’s chat settings (e.g., slow mode duration).
 *
 * @param {IRCData} data IRC data
 * @see https://dev.twitch.tv/docs/irc/commands/#roomstate-twitch-commands
 */
function ROOMSTATE(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('ROOMSTATE', data);
}

/**
 * Announces Twitch-specific events to the channel (e.g., a user’s subscription
 * notification).
 *
 * @param {IRCData} data IRC data
 * @see https://dev.twitch.tv/docs/irc/commands/#usernotice-twitch-commands
 */
function USERNOTICE(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('USERNOTICE', data);
}

/**
 * Identifies a user’s chat settings or properties (e.g., chat color).
 *
 * @param {IRCData} data IRC data
 * @see https://dev.twitch.tv/docs/irc/commands/#userstate-twitch-commands
 * @this {IRCClient}
 */
function USERSTATE(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('USERSTATE', data);
	const channel = cleanChannel(data.params[0]);
	const { user } = this.identity;
	this.emit('join', { channel, user, self: true, raw: data });
	this.emit(
		'userstate',
		Object.assign({}, data.tags, { channel, raw: data })
	);
}

/**
 * @typedef {Object} WhisperTags
 * @property {string} [banDuration]
 *
 * @typedef {string[]} WhisperParams
 * 0: The name of the whisperer.
 *
 * @typedef {?string} WhisperTail
 * The message that the whisperer
 */
/**
 * When a whisper is sent to the client user.
 *
 * @param {IRCData} data IRC data
 * @param {WhisperTags} [tags=data.tags] The tags
 * @param {WhisperParams} [params=data.params] The params
 * @param {ClearChatTail} [tail=data.tail] The tail
 * @see https://dev.twitch.tv/docs/irc/commands/#clearchat-twitch-commands
 */
function WHISPER(data, tags=data.tags, params=data.params, tail=data.tail) {
	console.log('WHISPER', data);

}

module.exports = {
	CLEARCHAT,
	CLEARMSG,
	GLOBALUSERSTATE: G_USERSTATE,
	HOSTTARGET,
	JOIN,
	MODE: noop,
	NOTICE,
	PART,
	PING,
	PRIVMSG,
	RECONNECT,
	ROOMSTATE,
	USERNOTICE,
	USERSTATE,
	WHISPER,

	CAP: noop,

	'001': noop,
	'002': noop,
	'003': noop,
	'004': noop,
	'353': noop,
	'366': noop,
	'372': noop,
	'375': noop,
	'376': ENDOFMOTD
};