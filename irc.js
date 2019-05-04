//@ts-check
const tls = require('tls');
const tekko = require('tekko');
const { once, EventEmitter } = require('events');

const ircCommands = require('./lib/irc-commands');
const {
	formatChannel,
	cleanChannel,
	genAnonName,
	doSomeTagStuff
} = require('./lib/irc-util');

/**
 * @typedef {import('./lib/irc-typedef').IRCData} IRCData
 * @typedef {import('./lib/irc-typedef').IRCClientOptions} IRCClientOptions
 */

class IRCClient extends EventEmitter {
	/**
	 * Create an IRC client and begin connecting.
	 * 
	 * @param {IRCClientOptions} [options={}] IRC client options.
	 */
	constructor(options = {}) {
		super();
		const { IDENTITY_USER, IDENTITY_PASS } = process.env;
		this.identity = {
			user: options.user || IDENTITY_USER,
			pass: options.pass || IDENTITY_PASS,
			anonymous: false
		};
		if(!this.identity.user) {
			this.identity.user = genAnonName();
			this.identity.pass = 'alcablah';
			this.identity.anonymous = true;
		}
		this.connect().catch(() => {});
	}

	/**
	 * Listens for data on the socket.
	 * 
	 * @param {string} rawData Raw IRC data.
	 * @listens module:net.Socket~data
	 * @see https://nodejs.org/api/net.html#net_event_data
	 */
	_onData(rawData) {
		const splitData = rawData.trim().split('\r\n');
		for(const data of splitData) {
			/** @type {IRCData} */
			let parsedData;
			try {
				parsedData = tekko.parse(data);
			}
			catch(err) {
				console.error(err);
				return;
			}
			// @ts-ignore
			parsedData.tail = parsedData.trailing;
			// @ts-ignore
			delete parsedData.trailing;
			parsedData.raw = data;
			const { command } = parsedData;
			doSomeTagStuff(parsedData);
			if(command in ircCommands === false) {
				console.log('Command', command, 'does not exist');
				console.log(parsedData);
				continue;
			}
			console.log(parsedData);
			ircCommands[command].call(this, parsedData);
		}
	}

	/**
	 * Listens for when the socket is connected.
	 * 
	 * @listens module:net.Socket~connect
	 * @see https://nodejs.org/api/net.html#net_event_connect
	 */
	async _onConnect() {
		const addr = this.socket.address();
		// @ts-ignore
		console.log(`Socket connected to ${addr.address}:${addr.port}`);
		await this.sendCaps();
		await this.sendCredentials();
	}

	/**
	 * Listens for when the socket times out.
	 * 
	 * @listens module:net.Socket~timeout
	 * @see https://nodejs.org/api/net.html#net_event_timeout
	 */
	_onTimeout() {
		console.log('Socket timeout');
	}

	/**
	 * @param {Boolean} hadError `true` if the socket had a transmission error.
	 * @listens module:net.Socket~close
	 * @see https://nodejs.org/api/net.html#net_event_close_1
	 */
	_onClose(hadError) {
		console.log('Socket closed', { hadError });
	}

	/**
	 * For when an error occurs on the socket. The 'close' event will be called
	 * directly following this event.
	 * 
	 * @param {Error} err An error.
	 * @listens module:net.Socket~error
	 * @see https://nodejs.org/api/net.html#net_event_error_1
	 */
	_onError(err) {
		console.log('Socket errored', err);
		this.emit('error', err);
	}

	/**
	 * @listens module:net.Socket~end
	 * @see https://nodejs.org/api/net.html#net_event_end
	 */
	_onEnd() {
		console.log('Socket ended');
	}
	// * @param {{ ({ channel, self }: any): boolean; (arg0: any): void; }} cb
	/**
	 * @param {string | symbol} event
	 * @param {function} cb
	 */
	onceBy(event, cb) {
		return new Promise((resolve, reject) => {
			/** @param {any[]} args */
			const listener = async (...args) => {
				const result = cb(...args);
				if(result) {
					this.off(event, listener);
					resolve(args);
				}
			};
			this.on(event, listener);
		});
	}

	/**
	 * Connect to chat.
	 * 
	 * @returns {Promise} Promise that resolves on the connected event or
	 * rejects on error event.
	 */
	connect() {
		this.socket = tls.connect({
			host: 'irc.chat.twitch.tv',
			port: 6697
		});
		this.socket.setEncoding('utf8');
		this.socket.on('data', data => this._onData(data));
		this.socket.on('secureConnect', () => this._onConnect());
		this.socket.on('close', hadError => this._onClose(hadError));
		this.socket.on('timeout', () => this._onTimeout());
		this.socket.on('error', err => this._onError(err));
		this.socket.on('end', () => this._onEnd());
		return once(this, 'connected');
	}

	/**
	 * @typedef {Object} IRCClientWrite
	 * @property {boolean} hadFlushedImmediately From net.Socket, whether or not
	 * the data was flushed successfully immediately or was queued to memory.
	 * 
	 * 
	 * Write some data to the IRC socket.
	 * 
	 * @param {string} data Data to write to socket.
	 * @returns {Promise<IRCClientWrite>}
	 */
	write(data) {
		console.log('<', data);
		return new Promise((resolve, reject) => {
			const flushed = this.socket.write(data.trim() + '\r\n', () => {
				resolve({ hadFlushedImmediately: flushed });
			});
		});
	}

	/**
	 * Send IRC "CAP REQ" command.
	 */
	sendCaps() {
		const caps = 'twitch.tv/membership twitch.tv/tags twitch.tv/commands';
		return this.write(`CAP REQ :${caps}`);
	}

	/**
	 * Send IRC "PASS" and "NICK" commands.
	 */
	sendCredentials() {
		const { user, pass } = this.identity;
		// return this.write(`PASS ${pass}\r\nNICK ${user}`); // BAD
		return this.write(`PASS oauth:${pass}\r\nNICK ${user}`);
	}

	/**
	 * JOIN a Twitch channel/chatroom.
	 * 
	 * @param {string} channel A channel name or chatroom.
	 */
	async join(channel) {
		const cleanChan = cleanChannel(channel);
		const chan = formatChannel(channel);
		this.write('JOIN ' + chan);
		const [ args ] = await this.onceBy('join', ({ self, channel }) =>
			self && channel === cleanChan
		);
		return args;
	}

	/**
	 * PART a Twitch channel/chatroom.
	 * 
	 * @param {string} channel A channel name or chatroom.
	 */
	part(channel) {
		const chan = formatChannel(channel);
		return this.write('PART ' + chan);
	}

	/**
	 * PART a Twitch channel/chatroom.
	 * 
	 * @param {string} channel A channel name or chatroom.
	 * @param {string} message A message to send to the channel.
	 */
	say(channel, message) {
		const chan = formatChannel(channel);
		return this.write(`PRIVMSG ${chan} :${message}`);
	}
}

module.exports = IRCClient;