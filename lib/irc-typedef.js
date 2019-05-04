/**
 * @typedef {Object} IRCData Some IRC data.
 * @property {string} command The IRC command, all caps.
 * @property {Object} tags An object of tags.
 * @property {string[]} params Command parameters.
 * @property {?string} tail The data after the message.
 * @property {Object} prefix An object of special information.
 * @property {?string} prefix.name
 * @property {?string} prefix.user
 * @property {?string} prefix.host
 * @property {string} raw The original, raw IRC data.
 * 
 * @typedef {Object} IRCClientOptions IRC client options.
 * @property {string} [user] Login username.
 * @property {string} [pass] Login password.
 * 
 * @typedef ClientIdentity
 * @property {Object} identity IRC identity.
 * @property {string} [identity.user] Login username.
 * @property {string} [identity.pass] OAuth token.
 * @property {string} [identity.anonymous] 
 * 
 * @typedef IRCClient
 * @augments import("events").EventEmitter
 * @property {ClientIdentity} identity IRC identity.
 */

module.exports = {};