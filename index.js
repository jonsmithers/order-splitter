(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
class Order {
    static split(config) {
        return new Order(config).split();
    }
    constructor(config = {tip: 0, tax: 0, untaxedFees: 0, taxedFees: 0, isTipPercentage: false, people: {}}) {

        // validation
        {
            var defaults = {
                'isTipPercentage': false,
                'untaxedFees':     0,
                'people':          {},
                'tax':             0,
                'taxedFees':       0,
                'tip':             0,
            };
            var typeValidationMap = {
                'isTipPercentage': 'boolean',
                'untaxedFees':     'number',
                'people':          'object',
                'tax':             'number',
                'taxedFees':       'number',
                'tip':             'number'
            };

            Object.entries(defaults).forEach(function([key, default0]) {
                config[key] = config[key] || default0;
            });

            Object.entries(config).forEach(function([key, value]) {
                var expectedType = typeValidationMap[key];
                if (!expectedType) {
                    throw new Error(`Unexpected key ${key}`);
                }
                if (typeof value !== expectedType) {
                    throw new Error(`config.${key} must be of type ${expectedType}`);
                }
                delete typeValidationMap[key];
            });
            Object.keys(typeValidationMap).forEach(key => {
                throw new Error(`Missing key ${key}`);
            });
            Object.values(config.people).forEach(personCost => {
                if (typeof personCost !== 'number') {
                    throw new Error('config.people\'s values must be numbers');
                }
            });
        }

        // convert object to Map
        config.people = Object.entries(config.people).reduce((map, [key, value]) => map.set(key, value), new Map());

        Object.assign(this, config);
    }

    withTip(tip, asPercentage=false) {
        console.warn('withTip() is deprecated');
        this.isTipPercentage = asPercentage;
        this.tip = tip;
        this.isTipPercentage = asPercentage;
        return this;
    }

    withNonTaxedFees(...fees) {
        console.warn("withNonTaxedFees() is deprecated");
        this.untaxedFees = fees.reduce((acc, val) => acc+val);
        return this;
    }

    withTaxedFees(...fees) {
        console.warn("withTaxedFees() is deprecated");
        this.taxedFees = fees.reduce((acc, val) => acc+val);
        return this;
    }

    withTax(tax) {
        console.warn("withTax() is deprecated");
        this.tax = tax;
        return this;
    }

    withPerson(name, price) {
        console.warn("withPerson() is deprecated");
        let newPrice = price;
        if(this.people.has(name)) {
            newPrice += this.people.get(name);
        }
        this.people.set(name, newPrice);
        return this;
    }

    get taxPercent() {
        if(this.subTotal === 0) {
            return 0;
        }
        return this.tax/this.subTotal;
    }

    get taxPercentDisplay() {
        return this.taxPercent*100;
    }

    get fee() {
        return this.untaxedFees;
    }

    get tipPercent() {
        if(this.isTipPercentage) {
            return this.tip;
        } else {
            if(this.subTotal === 0) {
                return 0;
            }
            return this.tipDollars / this.subTotal;
        }
    }

    get tipDollars() {
        if (this.isTipPercentage) {
            return this.tipPercent * this.subTotal;
        } else {
            return this.tip;
        }
    }

    get feesPerPerson() {
        return this.fee/this.people.size;
    }

    get total() {
        return this.subTotal + this.fee + this.tipDollars + this.tax;
    }

    get hasPeople() {
        return !!Array.from(this.people.values()).length;
    }

    split() {

        this.totals = new Map();
        if (!this.hasPeople) {
            this.subTotal, this.totalPrice = 0;
            return this;
        }
        this.subTotal = Array.from(this.people.values()).reduce((sum, value) => sum+value);
        this.subTotal += this.taxedFees;

        for (let [name, price] of this.people.entries()) {
            let totalForPerson = price;
            totalForPerson += price * this.taxPercent;
            totalForPerson += price * this.tipPercent;
            totalForPerson += this.feesPerPerson;
            this.totals.set(name, totalForPerson);
        }
        let totalPrice = Array.from(this.totals.values()).reduce((acc, val) => acc+val);
        if(Math.round(totalPrice*100) != Math.round(this.total*100)) {
            throw new Error('Everyone\'s share does not add up to total');
        }
        return this;
    }

    // not used. we should delete this
    toJSON() {
        let ret = {};
        ret.people = Array.from(this.people);
        ret.tipDollars = this.tipDollars;
        ret.tax = this.tax;
        ret.untaxedFees = this.untaxedFees;
        ret.taxedFees = this.taxedFees;
        ret.isTipPercentage = this.isTipPercentage;
        return ret;
    }
    
    // not used. we should delete this
    static fromJSON(json) {
        let order = new Order();
        order.people = new Map(json.people);
        order.withTip(json.tipDollars, false)
            .withTax(json.tax)
            .withNonTaxedFees(json.untaxedFees)
            .withTaxedFees(json.taxedFees);
        return order.split();
    }
}
module.exports = Order;

}).call(this,require("pBGvAp"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../common/order.js","/../common")
},{"buffer":4,"pBGvAp":6}],2:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
    const Order = require('./order.js');

    class OrderUpHtmlParser {
        parse(containerElement) {

            var highlight = element => {
                element.style.background = 'repeating-linear-gradient(45deg, yellow, yellow 10px, #fafa0a 10px, #fafa0a 20px )';
                element.title = 'OrderSplitter is using this value';
            };

            var untaxedFees = 0, tip, tax, people;

            var summaryTable = Array.from(containerElement.querySelectorAll('#order-confirmation-page tr'));
            if (summaryTable) {
                [people] = summaryTable.map(tr => Array.from(tr.querySelectorAll('td'))).filter(tds => tds.length).reduce(function([people, lastItemCost], [left_td, center_td, right_td]) {
                    let name, price;

                    if (right_td && right_td.classList.contains('price-table')) {
                        price = right_td.innerText;
                        highlight(right_td);
                        lastItemCost = Number(price.match('\\$([0-9.]+)')[1]);
                    }

                    if (center_td && (name = center_td.querySelector('li strong'))) {
                        highlight(name);
                        name = name.innerText;
                        people[name] = lastItemCost;
                        lastItemCost = null;
                    }

                    return [people, lastItemCost];
                }, [{}, null]);
            }

            var infoTable = Array.from(containerElement.querySelectorAll('div.order-information tr'));
            if (infoTable) {
                infoTable.map(tr => Array.from(tr.querySelectorAll('td'))).filter(tds => tds.length).forEach(function([left, right]) {

                    let match = right.textContent.match('\\$([0-9.]+)');
                    var value = match && Number(match[1]);

                    switch (left.textContent) {
                        case 'Sales Tax':
                            tax = value;
                            highlight(right);
                            break;
                        case 'Processing Fee':
                        case 'Delivery Fee':
                            untaxedFees += value;
                            highlight(right);
                            break;
                        case 'Tip':
                            console.log('%cgot tip', 'font-size:15px');
                            console.log(value);
                            tip = value;
                            highlight(right);
                            break;
                    }
                });
            }
            return Order.split({people, untaxedFees, tip, tax});
        }
    }

    class QueryStringParser {
        /**
         * Parses input from a URL query string into an Order.
         * @example
         * parse('tax=0.30&fee=1.50&tip=1.25&Gus=5.00');
         * @param {string} queryString - The URL query string
         * @returns {Order} An order parsed from the URL query string
         */
        parse(queryString) {
            if (!location.search.length) {
                return undefined;
            }
            var params = location.search.slice(1).split('&');
            console.debug('params', params);

            let people={}, untaxedFees, tax, tip;

            params.map(param=>param.split('=')).forEach(function([key,value]) {
                key = decodeURIComponent(key);
                value = Number(decodeURIComponent(value));
                switch (key) {
                    case 'fee':
                        untaxedFees = value;
                        break;
                    case 'tax':
                        tax = value;
                        break;
                    case 'tip':
                        tip = value;
                        break;
                    default:
                        people[key] = value;
                }
            });

            return Order.split({people, untaxedFees, tax, tip});
        }
    }

    class OrderUpParser {

        /**
         * Parses the confirmation summary from an OrderUp.com order
         * @param {string} orderUpText - The confirmation summary from OrderUp.com
         * @param {number} fee
         * @param {number} tax
         * @param {number} tip - The tip (either a fixed value or percentage)
         * @param {boolean} isTipPercentage - True if the tip is a percentage as opposed to a fixed value
         * @return {Order} An order parsed from the OrderUp.com confirmation summary
         */
        parse(orderUpText, fee=0, tax=0, tip=0, isTipPercentage=false) {
            let order = new Order()
                .withNonTaxedFees(fee)
                .withTax(tax)
                .withTip(tip, isTipPercentage);

            var lines = orderUpText.split('\n');

            lines.reduce((lastItemCost, line) => {
                let itemCostMatch, nameMatch;

                if(!lastItemCost) {
                    if (itemCostMatch = line.match('.*\\$([0-9.]+)')) {
                        let itemCost = Number(itemCostMatch[1]);
                        return itemCost;
                    }
                }

                if (nameMatch = line.match('.*Label for:(.*)')) {
                    let name = nameMatch[1];
                    order.withPerson(name, lastItemCost);
                    return;
                }

                return lastItemCost;
            }, null);

            return order;
        }
    }

    class CsvParser {
        parse(csv) {
            const order = new Order();

            const lines = csv.split('\n');
            for(const line of lines) {
                if(line.trim() !== '') {
                    const [name, ...priceStrings] = line.split(',');
                    const price = priceStrings.map(ps => Number(ps.trim().replace('$',''))).reduce((p,acc) => p+acc, 0);
                    if(name === 'fee') {
                        order.withNonTaxedFees(price);
                    }
                    else if(name === 'tax') {
                        order.withTax(price);
                    } 
                    else if(name === 'tip') {
                        order.withTip(price);
                    } 
                    else {
                        order.withPerson(name, price);
                    }
                }
            }

            return order;
        }
    }
    module.exports = {OrderUpParser, QueryStringParser, CsvParser, OrderUpHtmlParser};
})();

}).call(this,require("pBGvAp"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../common/parsers.js","/../common")
},{"./order.js":1,"buffer":4,"pBGvAp":6}],3:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

}).call(this,require("pBGvAp"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/base64-js/lib/b64.js","/../node_modules/base64-js/lib")
},{"buffer":4,"pBGvAp":6}],4:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

}).call(this,require("pBGvAp"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/buffer/index.js","/../node_modules/buffer")
},{"base64-js":3,"buffer":4,"ieee754":5,"pBGvAp":6}],5:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

}).call(this,require("pBGvAp"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/ieee754/index.js","/../node_modules/ieee754")
},{"buffer":4,"pBGvAp":6}],6:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

}).call(this,require("pBGvAp"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/process/browser.js","/../node_modules/process")
},{"buffer":4,"pBGvAp":6}],7:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";var _slicedToArray=function(){function sliceIterator(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"])_i["return"]();}finally{if(_d)throw _e;}}return _arr;}return function(arr,i){if(Array.isArray(arr)){return arr;}else if(Symbol.iterator in Object(arr)){return sliceIterator(arr,i);}else{throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();var _get=function get(object,property,receiver){if(object===null)object=Function.prototype;var desc=Object.getOwnPropertyDescriptor(object,property);if(desc===undefined){var parent=Object.getPrototypeOf(object);if(parent===null){return undefined;}else{return get(parent,property,receiver);}}else if("value"in desc){return desc.value;}else{var getter=desc.get;if(getter===undefined){return undefined;}return getter.call(receiver);}};var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _toConsumableArray(arr){if(Array.isArray(arr)){for(var i=0,arr2=Array(arr.length);i<arr.length;i++){arr2[i]=arr[i];}return arr2;}else{return Array.from(arr);}}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}(function(){"use strict";function loadJs(url){return new Promise(function(resolve,reject){var scriptTag=document.createElement('script');scriptTag.src=url;scriptTag.onload=resolve;window.body.appendChild(scriptTag);});}if(!("customElements"in window)){loadJs(window.location.href+"bower_components/webcomponentsjs/webcomponents-lite.js");}})();function defineCustomElement(tag,elementClass){customElements.define(tag,function(_elementClass){_inherits(_class,_elementClass);function _class(){_classCallCheck(this,_class);return _possibleConstructorReturn(this,(_class.__proto__||Object.getPrototypeOf(_class)).apply(this,arguments));}_createClass(_class,null,[{key:"is",get:function get(){return tag;}}]);return _class;}(elementClass));}var Utils={_prettifyNumber:function _prettifyNumber(n){n=Math.round(n*100)/100;// round to 2 decimal places
// pad to 2 decimal places if necessary
var s=n.toString();if(s.indexOf('.')===-1){s+='.';}while(s.length<s.indexOf('.')+3){s+='0';}return s;}};(function(){console.debug('service worker is disabled for now.');navigator.serviceWorker.getRegistrations().then(function(registrations){var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=registrations[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var registration=_step.value;console.log('uninstalling old service worker');registration.unregister();}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}});return;// no service worker until we iron bugs out of caching
var queryParams=new Map(location.search.slice(1).split('&').map(function(t){return t.split('=');}));if(location.hostname==='localhost'&&queryParams.get('sw')!=='test'){console.log('service worker disabled on localhost');return;}if(!('serviceWorker'in navigator)){console.log('service worker not supported');return;}navigator.serviceWorker.register('./sw.js').then(function(registration){// Registration was successful 😊
console.log('ServiceWorker registration successful with scope: ',registration.scope);}).catch(function(err){// registration failed :(
console.log('ServiceWorker registration failed: ',err);});})();(function(){'use strict';var userPolymer=window.Polymer;/**
   * @namespace Polymer
   * @summary Polymer is a lightweight library built on top of the web
   * standards-based Web Components API's, and makes it easy to build your
   * own custom HTML elements.
   * @param {Object} info Prototype for the custom element. It must contain
   * an `is` property to specify the element name. Other properties populate
   * the element prototype. The `properties`, `observers`, `hostAttributes`,
   * and `listeners` properties are processed to create element features.
   * @return {Object} Returns a custom element class for the given provided
   * prototype `info` object. The name of the element if given by `info.is`.
   */window.Polymer=function(info){return window.Polymer._polymerFn(info);};// support user settings on the Polymer object
if(userPolymer){Object.assign(Polymer,userPolymer);}// To be plugged by legacy implementation if loaded
/**
   * @param {Object} info Prototype for the custom element. It must contain
   * an `is` property to specify the element name. Other properties populate
   * the element prototype. The `properties`, `observers`, `hostAttributes`,
   * and `listeners` properties are processed to create element features.
   */window.Polymer._polymerFn=function(info){// eslint-disable-line no-unused-vars
throw new Error('Load polymer.html to use the Polymer() function.');};window.Polymer.version='2.0.1';/* eslint-disable no-unused-vars *//*
  When using Closure Compiler, JSCompiler_renameProperty(property, object) is replaced by the munged name for object[property]
  We cannot alias this function, so we have to use a small shim that has the same behavior when not compiling.
  */window.JSCompiler_renameProperty=function(prop,obj){return prop;};/* eslint-enable */})();(function(){'use strict';// unique global id for deduping mixins.
var dedupeId=0;/**
   * Given a mixin producing function, memoize applications of mixin to base
   * @private
   * @param {Function} mixin Mixin for which to create a caching mixin.
   * @return {Function} Returns a mixin which when applied multiple times to the
   * same base will always return the same extended class.
   */function cachingMixin(mixin){return function(base){if(!mixin.__mixinApplications){mixin.__mixinApplications=new WeakMap();}var map=mixin.__mixinApplications;var application=map.get(base);if(!application){application=mixin(base);map.set(base,application);}return application;};}/**
   * Wraps an ES6 class expression mixin such that the mixin is only applied
   * if it has not already been applied its base argument.  Also memoizes mixin
   * applications.
   *
   * @memberof Polymer
   * @param {Function} mixin ES6 class expression mixin to wrap
   * @return {Function} Wrapped mixin that deduplicates and memoizes
   *   mixin applications to base
   */Polymer.dedupingMixin=function(mixin){mixin=cachingMixin(mixin);// maintain a unique id for each mixin
mixin.__dedupeId=++dedupeId;return function(base){var baseSet=base.__mixinSet;if(baseSet&&baseSet[mixin.__dedupeId]){return base;}var extended=mixin(base);// copy inherited mixin set from the extended class, or the base class
// NOTE: we avoid use of Set here because some browser (IE11)
// cannot extend a base Set via the constructor.
extended.__mixinSet=Object.create(extended.__mixinSet||baseSet||null);extended.__mixinSet[mixin.__dedupeId]=true;return extended;};};})();(function(){'use strict';var caseMap={};var DASH_TO_CAMEL=/-[a-z]/g;var CAMEL_TO_DASH=/([A-Z])/g;/**
   * Module with utilities for converting between "dash-case" and "camelCase"
   * identifiers.
   *
   * @namespace
   * @memberof Polymer
   * @summary Module that provides utilities for converting between "dash-case"
   *   and "camelCase".
   */var CaseMap={/**
     * Converts "dash-case" identifier (e.g. `foo-bar-baz`) to "camelCase"
     * (e.g. `fooBarBaz`).
     *
     * @memberof Polymer.CaseMap
     * @param {string} dash Dash-case identifier
     * @return {string} Camel-case representation of the identifier
     */dashToCamelCase:function dashToCamelCase(dash){return caseMap[dash]||(caseMap[dash]=dash.indexOf('-')<0?dash:dash.replace(DASH_TO_CAMEL,function(m){return m[1].toUpperCase();}));},/**
     * Converts "camelCase" identifier (e.g. `fooBarBaz`) to "dash-case"
     * (e.g. `foo-bar-baz`).
     *
     * @memberof Polymer.CaseMap
     * @param {string} camel Camel-case identifier
     * @return {string} Dash-case representation of the identifier
     */camelToDashCase:function camelToDashCase(camel){return caseMap[camel]||(caseMap[camel]=camel.replace(CAMEL_TO_DASH,'-$1').toLowerCase());}};Polymer.CaseMap=CaseMap;})();(function(){'use strict';var CSS_URL_RX=/(url\()([^)]*)(\))/g;var ABS_URL=/(^\/)|(^#)|(^[\w-\d]*:)/;var workingURL=void 0;var resolveDoc=void 0;/**
     * Resolves the given URL against the provided `baseUri'.
     *
     * @memberof Polymer.ResolveUrl
     * @param {string} url Input URL to resolve
     * @param {string} baseURI Base URI to resolve the URL against
     * @return {string} resolved URL
     */function resolveUrl(url,baseURI){if(url&&ABS_URL.test(url)){return url;}// Lazy feature detection.
if(workingURL===undefined){workingURL=false;try{var u=new URL('b','http://a');u.pathname='c%20d';workingURL=u.href==='http://a/c%20d';}catch(e){// silently fail
}}if(!baseURI){baseURI=document.baseURI||window.location.href;}if(workingURL){return new URL(url,baseURI).href;}// Fallback to creating an anchor into a disconnected document.
if(!resolveDoc){resolveDoc=document.implementation.createHTMLDocument('temp');resolveDoc.base=resolveDoc.createElement('base');resolveDoc.head.appendChild(resolveDoc.base);resolveDoc.anchor=resolveDoc.createElement('a');resolveDoc.body.appendChild(resolveDoc.anchor);}resolveDoc.base.href=baseURI;resolveDoc.anchor.href=url;return resolveDoc.anchor.href||url;}/**
     * Resolves any relative URL's in the given CSS text against the provided
     * `ownerDocument`'s `baseURI`.
     *
     * @memberof Polymer.ResolveUrl
     * @param {string} cssText CSS text to process
     * @param {string} baseURI Base URI to resolve the URL against
     * @return {string} Processed CSS text with resolved URL's
     */function resolveCss(cssText,baseURI){return cssText.replace(CSS_URL_RX,function(m,pre,url,post){return pre+'\''+resolveUrl(url.replace(/["']/g,''),baseURI)+'\''+post;});}/**
     * Returns a path from a given `url`. The path includes the trailing
     * `/` from the url.
     *
     * @memberof Polymer.ResolveUrl
     * @param {string} url Input URL to transform
     * @return {string} resolved path
     */function pathFromUrl(url){return url.substring(0,url.lastIndexOf('/')+1);}/**
     * Module with utilities for resolving relative URL's.
     *
     * @namespace
     * @memberof Polymer
     * @summary Module with utilities for resolving relative URL's.
     */Polymer.ResolveUrl={resolveCss:resolveCss,resolveUrl:resolveUrl,pathFromUrl:pathFromUrl};})();(function(){'use strict';var MODULE_STYLE_LINK_SELECTOR='link[rel=import][type~=css]';var INCLUDE_ATTR='include';function importModule(moduleId){if(!Polymer.DomModule){return null;}return Polymer.DomModule.import(moduleId);}/**
   * Module with utilities for collection CSS text from `<templates>`, external
   * stylesheets, and `dom-module`s.
   *
   * @namespace
   * @memberof Polymer
   * @summary Module with utilities for collection CSS text from various sources.
   */var StyleGather={/**
     * Returns CSS text of styles in a space-separated list of `dom-module`s.
     *
     * @memberof Polymer.StyleGather
     * @param {string} moduleIds List of dom-module id's within which to
     * search for css.
     * @return {string} Concatenated CSS content from specified `dom-module`s
     */cssFromModules:function cssFromModules(moduleIds){var modules=moduleIds.trim().split(' ');var cssText='';for(var i=0;i<modules.length;i++){cssText+=this.cssFromModule(modules[i]);}return cssText;},/**
     * Returns CSS text of styles in a given `dom-module`.  CSS in a `dom-module`
     * can come either from `<style>`s within the first `<template>`, or else
     * from one or more `<link rel="import" type="css">` links outside the
     * template.
     *
     * Any `<styles>` processed are removed from their original location.
     *
     * @memberof Polymer.StyleGather
     * @param {string} moduleId dom-module id to gather styles from
     * @return {string} Concatenated CSS content from specified `dom-module`
     */cssFromModule:function cssFromModule(moduleId){var m=importModule(moduleId);if(m&&m._cssText===undefined){var cssText='';// include css from the first template in the module
var t=m.querySelector('template');if(t){cssText+=this.cssFromTemplate(t,m.assetpath);}// module imports: <link rel="import" type="css">
cssText+=this.cssFromModuleImports(moduleId);m._cssText=cssText||null;}if(!m){console.warn('Could not find style data in module named',moduleId);}return m&&m._cssText||'';},/**
     * Returns CSS text of `<styles>` within a given template.
     *
     * Any `<styles>` processed are removed from their original location.
     *
     * @memberof Polymer.StyleGather
     * @param {HTMLTemplateElement} template Template to gather styles from
     * @param {string} baseURI Base URI to resolve the URL against
     * @return {string} Concatenated CSS content from specified template
     */cssFromTemplate:function cssFromTemplate(template,baseURI){var cssText='';// if element is a template, get content from its .content
var e$=template.content.querySelectorAll('style');for(var i=0;i<e$.length;i++){var e=e$[i];// support style sharing by allowing styles to "include"
// other dom-modules that contain styling
var include=e.getAttribute(INCLUDE_ATTR);if(include){cssText+=this.cssFromModules(include);}e.parentNode.removeChild(e);cssText+=baseURI?Polymer.ResolveUrl.resolveCss(e.textContent,baseURI):e.textContent;}return cssText;},/**
     * Returns CSS text from stylsheets loaded via `<link rel="import" type="css">`
     * links within the specified `dom-module`.
     *
     * @memberof Polymer.StyleGather
     * @param {string} moduleId Id of `dom-module` to gather CSS from
     * @return {string} Concatenated CSS content from links in specified `dom-module`
     */cssFromModuleImports:function cssFromModuleImports(moduleId){var cssText='';var m=importModule(moduleId);if(!m){return cssText;}var p$=m.querySelectorAll(MODULE_STYLE_LINK_SELECTOR);for(var i=0;i<p$.length;i++){var p=p$[i];if(p.import){var importDoc=p.import;// NOTE: polyfill affordance.
// under the HTMLImports polyfill, there will be no 'body',
// but the import pseudo-doc can be used directly.
var container=importDoc.body?importDoc.body:importDoc;cssText+=Polymer.ResolveUrl.resolveCss(container.textContent,importDoc.baseURI);}}return cssText;}};Polymer.StyleGather=StyleGather;})();(function(){'use strict';var modules={};var lcModules={};function findModule(id){return modules[id]||lcModules[id.toLowerCase()];}function styleOutsideTemplateCheck(inst){if(inst.querySelector('style')){console.warn('dom-module %s has style outside template',inst.id);}}/**
   * The `dom-module` element registers the dom it contains to the name given
   * by the module's id attribute. It provides a unified database of dom
   * accessible via its static `import` API.
   *
   * A key use case of `dom-module` is for providing custom element `<template>`s
   * via HTML imports that are parsed by the native HTML parser, that can be
   * relocated during a bundling pass and still looked up by `id`.
   *
   * Example:
   *
   *     <dom-module id="foo">
   *       <img src="stuff.png">
   *     </dom-module>
   *
   * Then in code in some other location that cannot access the dom-module above
   *
   *     let img = document.createElement('dom-module').import('foo', 'img');
   *
   * @extends HTMLElement
   * @memberof Polymer
   * @summary Custom element that provides a registry of relocatable DOM content
   *   by `id` that is agnostic to bundling.
   */var DomModule=function(_HTMLElement){_inherits(DomModule,_HTMLElement);function DomModule(){_classCallCheck(this,DomModule);return _possibleConstructorReturn(this,(DomModule.__proto__||Object.getPrototypeOf(DomModule)).apply(this,arguments));}_createClass(DomModule,[{key:"attributeChangedCallback",value:function attributeChangedCallback(name,old,value){if(old!==value){this.register();}}/**
     * The absolute URL of the original location of this `dom-module`.
     *
     * This value will differ from this element's `ownerDocument` in the
     * following ways:
     * - Takes into account any `assetpath` attribute added during bundling
     *   to indicate the original location relative to the bundled location
     * - Uses the HTMLImports polyfill's `importForElement` API to ensure
     *   the path is relative to the import document's location since
     *   `ownerDocument` is not currently polyfilled
     */},{key:"register",/**
     * Registers the dom-module at a given id. This method should only be called
     * when a dom-module is imperatively created. For
     * example, `document.createElement('dom-module').register('foo')`.
     * @param {string=} id The id at which to register the dom-module.
     */value:function register(id){id=id||this.id;if(id){this.id=id;// store id separate from lowercased id so that
// in all cases mixedCase id will stored distinctly
// and lowercase version is a fallback
modules[id]=this;lcModules[id.toLowerCase()]=this;styleOutsideTemplateCheck(this);}}},{key:"assetpath",get:function get(){// Don't override existing assetpath.
if(!this.__assetpath){// note: assetpath set via an attribute must be relative to this
// element's location; accomodate polyfilled HTMLImports
var owner=window.HTMLImports&&HTMLImports.importForElement?HTMLImports.importForElement(this)||document:this.ownerDocument;var url=Polymer.ResolveUrl.resolveUrl(this.getAttribute('assetpath')||'',owner.baseURI);this.__assetpath=Polymer.ResolveUrl.pathFromUrl(url);}return this.__assetpath;}}],[{key:"import",/**
     * Retrieves the element specified by the css `selector` in the module
     * registered by `id`. For example, this.import('foo', 'img');
     * @param {string} id The id of the dom-module in which to search.
     * @param {string=} selector The css selector by which to find the element.
     * @return {Element} Returns the element which matches `selector` in the
     * module registered at the specified `id`.
     */value:function _import(id,selector){if(id){var m=findModule(id);if(m&&selector){return m.querySelector(selector);}return m;}return null;}},{key:"observedAttributes",get:function get(){return['id'];}}]);return DomModule;}(HTMLElement);DomModule.prototype['modules']=modules;customElements.define('dom-module',DomModule);// export
Polymer.DomModule=DomModule;})();(function(){'use strict';/**
   * Module with utilities for manipulating structured data path strings.
   *
   * @namespace
   * @memberof Polymer
   * @summary Module with utilities for manipulating structured data path strings.
   */var Path={/**
     * Returns true if the given string is a structured data path (has dots).
     *
     * Example:
     *
     * ```
     * Polymer.Path.isPath('foo.bar.baz') // true
     * Polymer.Path.isPath('foo')         // false
     * ```
     *
     * @memberof Polymer.Path
     * @param {string} path Path string
     * @return {boolean} True if the string contained one or more dots
     */isPath:function isPath(path){return path.indexOf('.')>=0;},/**
     * Returns the root property name for the given path.
     *
     * Example:
     *
     * ```
     * Polymer.Path.root('foo.bar.baz') // 'foo'
     * Polymer.Path.root('foo')         // 'foo'
     * ```
     *
     * @memberof Polymer.Path
     * @param {string} path Path string
     * @return {string} Root property name
     */root:function root(path){var dotIndex=path.indexOf('.');if(dotIndex===-1){return path;}return path.slice(0,dotIndex);},/**
     * Given `base` is `foo.bar`, `foo` is an ancestor, `foo.bar` is not
     * Returns true if the given path is an ancestor of the base path.
     *
     * Example:
     *
     * ```
     * Polymer.Path.isAncestor('foo.bar', 'foo')         // true
     * Polymer.Path.isAncestor('foo.bar', 'foo.bar')     // false
     * Polymer.Path.isAncestor('foo.bar', 'foo.bar.baz') // false
     * ```
     *
     * @memberof Polymer.Path
     * @param {string} base Path string to test against.
     * @param {string} path Path string to test.
     * @return {boolean} True if `path` is an ancestor of `base`.
     */isAncestor:function isAncestor(base,path){//     base.startsWith(path + '.');
return base.indexOf(path+'.')===0;},/**
     * Given `base` is `foo.bar`, `foo.bar.baz` is an descendant
     *
     * Example:
     *
     * ```
     * Polymer.Path.isDescendant('foo.bar', 'foo.bar.baz') // true
     * Polymer.Path.isDescendant('foo.bar', 'foo.bar')     // false
     * Polymer.Path.isDescendant('foo.bar', 'foo')         // false
     * ```
     *
     * @memberof Polymer.Path
     * @param {string} base Path string to test against.
     * @param {string} path Path string to test.
     * @return {boolean} True if `path` is a descendant of `base`.
     */isDescendant:function isDescendant(base,path){//     path.startsWith(base + '.');
return path.indexOf(base+'.')===0;},/**
     * Replaces a previous base path with a new base path, preserving the
     * remainder of the path.
     *
     * User must ensure `path` has a prefix of `base`.
     *
     * Example:
     *
     * ```
     * Polymer.Path.translate('foo.bar', 'zot' 'foo.bar.baz') // 'zot.baz'
     * ```
     *
     * @memberof Polymer.Path
     * @param {string} base Current base string to remove
     * @param {string} newBase New base string to replace with
     * @param {string} path Path to translate
     * @return {string} Translated string
     */translate:function translate(base,newBase,path){return newBase+path.slice(base.length);},matches:function matches(base,path){return base===path||this.isAncestor(base,path)||this.isDescendant(base,path);},/**
     * Converts array-based paths to flattened path.  String-based paths
     * are returned as-is.
     *
     * Example:
     *
     * ```
     * Polymer.Path.normalize(['foo.bar', 0, 'baz'])  // 'foo.bar.0.baz'
     * Polymer.Path.normalize('foo.bar.0.baz')        // 'foo.bar.0.baz'
     * ```
     *
     * @memberof Polymer.Path
     * @param {string | !Array<string|number>} path Input path
     * @return {string} Flattened path
     */normalize:function normalize(path){if(Array.isArray(path)){var parts=[];for(var i=0;i<path.length;i++){var args=path[i].toString().split('.');for(var j=0;j<args.length;j++){parts.push(args[j]);}}return parts.join('.');}else{return path;}},/**
     * Splits a path into an array of property names. Accepts either arrays
     * of path parts or strings.
     *
     * Example:
     *
     * ```
     * Polymer.Path.split(['foo.bar', 0, 'baz'])  // ['foo', 'bar', '0', 'baz']
     * Polymer.Path.split('foo.bar.0.baz')        // ['foo', 'bar', '0', 'baz']
     * ```
     *
     * @memberof Polymer.Path
     * @param {string | !Array<string|number>} path Input path
     * @return {!Array<string>} Array of path parts
     */split:function split(path){if(Array.isArray(path)){return this.normalize(path).split('.');}return path.toString().split('.');},/**
     * Reads a value from a path.  If any sub-property in the path is `undefined`,
     * this method returns `undefined` (will never throw.
     *
     * @memberof Polymer.Path
     * @param {Object} root Object from which to dereference path from
     * @param {string | !Array<string|number>} path Path to read
     * @param {Object=} info If an object is provided to `info`, the normalized
     *  (flattened) path will be set to `info.path`.
     * @return {*} Value at path, or `undefined` if the path could not be
     *  fully dereferenced.
     */get:function get(root,path,info){var prop=root;var parts=this.split(path);// Loop over path parts[0..n-1] and dereference
for(var i=0;i<parts.length;i++){if(!prop){return;}var part=parts[i];prop=prop[part];}if(info){info.path=parts.join('.');}return prop;},/**
     * Sets a value to a path.  If any sub-property in the path is `undefined`,
     * this method will no-op.
     *
     * @memberof Polymer.Path
     * @param {Object} root Object from which to dereference path from
     * @param {string | !Array<string|number>} path Path to set
     * @param {*} value Value to set to path
     * @return {string | undefined} The normalized version of the input path
     */set:function set(root,path,value){var prop=root;var parts=this.split(path);var last=parts[parts.length-1];if(parts.length>1){// Loop over path parts[0..n-2] and dereference
for(var i=0;i<parts.length-1;i++){var part=parts[i];prop=prop[part];if(!prop){return;}}// Set value to object at end of path
prop[last]=value;}else{// Simple property set
prop[path]=value;}return parts.join('.');}};/**
   * Returns true if the given string is a structured data path (has dots).
   *
   * This function is deprecated.  Use `Polymer.Path.isPath` instead.
   *
   * Example:
   *
   * ```
   * Polymer.Path.isDeep('foo.bar.baz') // true
   * Polymer.Path.isDeep('foo')         // false
   * ```
   *
   * @deprecated
   * @memberof Polymer.Path
   * @param {string} path Path string
   * @return {boolean} True if the string contained one or more dots
   */Path.isDeep=Path.isPath;Polymer.Path=Path;})();(function(){'use strict';/** @typedef {{run: function(function(), number=):number, cancel: function(number)}} */var AsyncInterface=void 0;// eslint-disable-line no-unused-vars
// Microtask implemented using Mutation Observer
var microtaskCurrHandle=0;var microtaskLastHandle=0;var microtaskCallbacks=[];var microtaskNodeContent=0;var microtaskNode=document.createTextNode('');new window.MutationObserver(microtaskFlush).observe(microtaskNode,{characterData:true});function microtaskFlush(){var len=microtaskCallbacks.length;for(var i=0;i<len;i++){var cb=microtaskCallbacks[i];if(cb){try{cb();}catch(e){setTimeout(function(){throw e;});}}}microtaskCallbacks.splice(0,len);microtaskLastHandle+=len;}/**
   * Module that provides a number of strategies for enqueuing asynchronous
   * tasks.  Each sub-module provides a standard `run(fn)` interface that returns a
   * handle, and a `cancel(handle)` interface for canceling async tasks before
   * they run.
   *
   * @namespace
   * @memberof Polymer
   * @summary Module that provides a number of strategies for enqueuing asynchronous
   * tasks.
   */Polymer.Async={/**
     * Async interface wrapper around `setTimeout`.
     *
     * @namespace
     * @memberof Polymer.Async
     * @summary Async interface wrapper around `setTimeout`.
     */timeOut:{/**
       * Returns a sub-module with the async interface providing the provided
       * delay.
       *
       * @memberof Polymer.Async.timeOut
       * @param {number} delay Time to wait before calling callbacks in ms
       * @return {AsyncInterface} An async timeout interface
       */after:function after(delay){return{run:function run(fn){return setTimeout(fn,delay);},cancel:window.clearTimeout.bind(window)};},/**
       * Enqueues a function called in the next task.
       *
       * @memberof Polymer.Async.timeOut
       * @param {Function} fn Callback to run
       * @return {number} Handle used for canceling task
       */run:window.setTimeout.bind(window),/**
       * Cancels a previously enqueued `timeOut` callback.
       *
       * @memberof Polymer.Async.timeOut
       * @param {number} handle Handle returned from `run` of callback to cancel
       */cancel:window.clearTimeout.bind(window)},/**
     * Async interface wrapper around `requestAnimationFrame`.
     *
     * @namespace
     * @memberof Polymer.Async
     * @summary Async interface wrapper around `requestAnimationFrame`.
     */animationFrame:{/**
       * Enqueues a function called at `requestAnimationFrame` timing.
       *
       * @memberof Polymer.Async.animationFrame
       * @param {Function} fn Callback to run
       * @return {number} Handle used for canceling task
       */run:window.requestAnimationFrame.bind(window),/**
       * Cancels a previously enqueued `animationFrame` callback.
       *
       * @memberof Polymer.Async.timeOut
       * @param {number} handle Handle returned from `run` of callback to cancel
       */cancel:window.cancelAnimationFrame.bind(window)},/**
     * Async interface wrapper around `requestIdleCallback`.  Falls back to
     * `setTimeout` on browsers that do not support `requestIdleCallback`.
     *
     * @namespace
     * @memberof Polymer.Async
     * @summary Async interface wrapper around `requestIdleCallback`.
     */idlePeriod:{/**
       * Enqueues a function called at `requestIdleCallback` timing.
       *
       * @memberof Polymer.Async.idlePeriod
       * @param {function(IdleDeadline)} fn Callback to run
       * @return {number} Handle used for canceling task
       */run:function run(fn){return window.requestIdleCallback?window.requestIdleCallback(fn):window.setTimeout(fn,16);},/**
       * Cancels a previously enqueued `idlePeriod` callback.
       *
       * @memberof Polymer.Async.idlePeriod
       * @param {number} handle Handle returned from `run` of callback to cancel
       */cancel:function cancel(handle){window.cancelIdleCallback?window.cancelIdleCallback(handle):window.clearTimeout(handle);}},/**
     * Async interface for enqueueing callbacks that run at microtask timing.
     *
     * Note that microtask timing is achieved via a single `MutationObserver`,
     * and thus callbacks enqueued with this API will all run in a single
     * batch, and not interleaved with other microtasks such as promises.
     * Promises are avoided as an implementation choice for the time being
     * due to Safari bugs that cause Promises to lack microtask guarantees.
     *
     * @namespace
     * @memberof Polymer.Async
     * @summary Async interface for enqueueing callbacks that run at microtask
     *   timing.
     */microTask:{/**
       * Enqueues a function called at microtask timing.
       *
       * @memberof Polymer.Async.microTask
       * @param {Function} callback Callback to run
       * @return {*} Handle used for canceling task
       */run:function run(callback){microtaskNode.textContent=microtaskNodeContent++;microtaskCallbacks.push(callback);return microtaskCurrHandle++;},/**
       * Cancels a previously enqueued `microTask` callback.
       *
       * @memberof Polymer.Async.microTask
       * @param {number} handle Handle returned from `run` of callback to cancel
       */cancel:function cancel(handle){var idx=handle-microtaskLastHandle;if(idx>=0){if(!microtaskCallbacks[idx]){throw new Error('invalid async handle: '+handle);}microtaskCallbacks[idx]=null;}}}};})();(function(){'use strict';var caseMap=Polymer.CaseMap;var microtask=Polymer.Async.microTask;// Save map of native properties; this forms a blacklist or properties
// that won't have their values "saved" by `saveAccessorValue`, since
// reading from an HTMLElement accessor from the context of a prototype throws
var nativeProperties={};var proto=HTMLElement.prototype;while(proto){var props=Object.getOwnPropertyNames(proto);for(var i=0;i<props.length;i++){nativeProperties[props[i]]=true;}proto=Object.getPrototypeOf(proto);}/**
   * Used to save the value of a property that will be overridden with
   * an accessor. If the `model` is a prototype, the values will be saved
   * in `__dataProto`, and it's up to the user (or downstream mixin) to
   * decide how/when to set these values back into the accessors.
   * If `model` is already an instance (it has a `__data` property), then
   * the value will be set as a pending property, meaning the user should
   * call `_invalidateProperties` or `_flushProperties` to take effect
   *
   * @param {Object} model Prototype or instance
   * @param {string} property Name of property
   * @private
   */function saveAccessorValue(model,property){// Don't read/store value for any native properties since they could throw
if(!nativeProperties[property]){var value=model[property];if(value!==undefined){if(model.__data){// Adding accessor to instance; update the property
// It is the user's responsibility to call _flushProperties
model._setPendingProperty(property,value);}else{// Adding accessor to proto; save proto's value for instance-time use
if(!model.__dataProto){model.__dataProto={};}else if(!model.hasOwnProperty(JSCompiler_renameProperty('__dataProto',model))){model.__dataProto=Object.create(model.__dataProto);}model.__dataProto[property]=value;}}}}/**
   * Element class mixin that provides basic meta-programming for creating one
   * or more property accessors (getter/setter pair) that enqueue an async
   * (batched) `_propertiesChanged` callback.
   *
   * For basic usage of this mixin, simply declare attributes to observe via
   * the standard `static get observedAttributes()`, implement `_propertiesChanged`
   * on the class, and then call `MyClass.createPropertiesForAttributes()` once
   * on the class to generate property accessors for each observed attribute
   * prior to instancing.  Last, call `this._flushProperties()` once to enable
   * the accessors.
   *
   * Any `observedAttributes` will automatically be
   * deserialized via `attributeChangedCallback` and set to the associated
   * property using `dash-case`-to-`camelCase` convention.
   *
   * @polymerMixin
   * @memberof Polymer
   * @summary Element class mixin for reacting to property changes from
   *   generated property accessors.
   */Polymer.PropertyAccessors=Polymer.dedupingMixin(function(superClass){/**
     * @polymerMixinClass
     * @implements {Polymer_PropertyAccessors}
     * @unrestricted
     */var PropertyAccessors=function(_superClass){_inherits(PropertyAccessors,_superClass);_createClass(PropertyAccessors,null,[{key:"createPropertiesForAttributes",/**
       * Generates property accessors for all attributes in the standard
       * static `observedAttributes` array.
       *
       * Attribute names are mapped to property names using the `dash-case` to
       * `camelCase` convention
       *
       */value:function createPropertiesForAttributes(){var a$=this.observedAttributes;for(var _i=0;_i<a$.length;_i++){this.prototype._createPropertyAccessor(caseMap.dashToCamelCase(a$[_i]));}}}]);function PropertyAccessors(){_classCallCheck(this,PropertyAccessors);var _this3=_possibleConstructorReturn(this,(PropertyAccessors.__proto__||Object.getPrototypeOf(PropertyAccessors)).call(this));_this3._initializeProperties();return _this3;}_createClass(PropertyAccessors,[{key:"attributeChangedCallback",value:function attributeChangedCallback(name,old,value){if(old!==value){this._attributeToProperty(name,value);}}/**
       * Initializes the local storage for property accessors.
       *
       * Provided as an override point for performing any setup work prior
       * to initializing the property accessor system.
       *
       * @protected
       */},{key:"_initializeProperties",value:function _initializeProperties(){this.__serializing=false;this.__dataCounter=0;this.__dataEnabled=false;this.__dataReady=false;this.__dataInvalid=false;// initialize data with prototype values saved when creating accessors
this.__data={};this.__dataPending=null;this.__dataOld=null;if(this.__dataProto){this._initializeProtoProperties(this.__dataProto);this.__dataProto=null;}// Capture instance properties; these will be set into accessors
// during first flush. Don't set them here, since we want
// these to overwrite defaults/constructor assignments
for(var p in this.__dataHasAccessor){if(this.hasOwnProperty(p)){this.__dataInstanceProps=this.__dataInstanceProps||{};this.__dataInstanceProps[p]=this[p];delete this[p];}}}/**
       * Called at instance time with bag of properties that were overwritten
       * by accessors on the prototype when accessors were created.
       *
       * The default implementation sets these properties back into the
       * setter at instance time.  This method is provided as an override
       * point for customizing or providing more efficient initialization.
       *
       * @param {Object} props Bag of property values that were overwritten
       *   when creating property accessors.
       * @protected
       */},{key:"_initializeProtoProperties",value:function _initializeProtoProperties(props){for(var p in props){this._setProperty(p,props[p]);}}/**
       * Called at ready time with bag of instance properties that overwrote
       * accessors when the element upgraded.
       *
       * The default implementation sets these properties back into the
       * setter at ready time.  This method is provided as an override
       * point for customizing or providing more efficient initialization.
       *
       * @param {Object} props Bag of property values that were overwritten
       *   when creating property accessors.
       * @protected
       */},{key:"_initializeInstanceProperties",value:function _initializeInstanceProperties(props){Object.assign(this,props);}/**
       * Ensures the element has the given attribute. If it does not,
       * assigns the given value to the attribute.
       *
       *
       * @param {string} attribute Name of attribute to ensure is set.
       * @param {string} value of the attribute.
       */},{key:"_ensureAttribute",value:function _ensureAttribute(attribute,value){if(!this.hasAttribute(attribute)){this._valueToNodeAttribute(this,value,attribute);}}/**
       * Deserializes an attribute to its associated property.
       *
       * This method calls the `_deserializeValue` method to convert the string to
       * a typed value.
       *
       * @param {string} attribute Name of attribute to deserialize.
       * @param {string} value of the attribute.
       * @param {*} type type to deserialize to.
       */},{key:"_attributeToProperty",value:function _attributeToProperty(attribute,value,type){// Don't deserialize back to property if currently reflecting
if(!this.__serializing){var property=caseMap.dashToCamelCase(attribute);this[property]=this._deserializeValue(value,type);}}/**
       * Serializes a property to its associated attribute.
       *
       * @param {string} property Property name to reflect.
       * @param {string=} attribute Attribute name to reflect.
       * @param {*=} value Property value to refect.
       */},{key:"_propertyToAttribute",value:function _propertyToAttribute(property,attribute,value){this.__serializing=true;value=arguments.length<3?this[property]:value;this._valueToNodeAttribute(this,value,attribute||caseMap.camelToDashCase(property));this.__serializing=false;}/**
       * Sets a typed value to an HTML attribute on a node.
       *
       * This method calls the `_serializeValue` method to convert the typed
       * value to a string.  If the `_serializeValue` method returns `undefined`,
       * the attribute will be removed (this is the default for boolean
       * type `false`).
       *
       * @param {Element} node Element to set attribute to.
       * @param {*} value Value to serialize.
       * @param {string} attribute Attribute name to serialize to.
       */},{key:"_valueToNodeAttribute",value:function _valueToNodeAttribute(node,value,attribute){var str=this._serializeValue(value);if(str===undefined){node.removeAttribute(attribute);}else{node.setAttribute(attribute,str);}}/**
       * Converts a typed JavaScript value to a string.
       *
       * This method is called by Polymer when setting JS property values to
       * HTML attributes.  Users may override this method on Polymer element
       * prototypes to provide serialization for custom types.
       *
       * @param {*} value Property value to serialize.
       * @return {string | undefined} String serialized from the provided property value.
       */},{key:"_serializeValue",value:function _serializeValue(value){/* eslint-disable no-fallthrough */switch(typeof value==="undefined"?"undefined":_typeof(value)){case'boolean':return value?'':undefined;case'object':if(value instanceof Date){return value.toString();}else if(value){try{return JSON.stringify(value);}catch(x){return'';}}default:return value!=null?value.toString():undefined;}}/**
       * Converts a string to a typed JavaScript value.
       *
       * This method is called by Polymer when reading HTML attribute values to
       * JS properties.  Users may override this method on Polymer element
       * prototypes to provide deserialization for custom `type`s.  Note,
       * the `type` argument is the value of the `type` field provided in the
       * `properties` configuration object for a given property, and is
       * by convention the constructor for the type to deserialize.
       *
       * Note: The return value of `undefined` is used as a sentinel value to
       * indicate the attribute should be removed.
       *
       * @param {string} value Attribute value to deserialize.
       * @param {*} type Type to deserialize the string to.
       * @return {*} Typed value deserialized from the provided string.
       */},{key:"_deserializeValue",value:function _deserializeValue(value,type){/**
         * @type {*}
         */var outValue=void 0;switch(type){case Number:outValue=Number(value);break;case Boolean:outValue=value!==null;break;case Object:try{outValue=JSON.parse(value);}catch(x){// allow non-JSON literals like Strings and Numbers
}break;case Array:try{outValue=JSON.parse(value);}catch(x){outValue=null;console.warn("Polymer::Attributes: couldn't decode Array as JSON: "+value);}break;case Date:outValue=new Date(value);break;case String:default:outValue=value;break;}return outValue;}/* eslint-enable no-fallthrough *//**
       * Creates a setter/getter pair for the named property with its own
       * local storage.  The getter returns the value in the local storage,
       * and the setter calls `_setProperty`, which updates the local storage
       * for the property and enqueues a `_propertiesChanged` callback.
       *
       * This method may be called on a prototype or an instance.  Calling
       * this method may overwrite a property value that already exists on
       * the prototype/instance by creating the accessor.  When calling on
       * a prototype, any overwritten values are saved in `__dataProto`,
       * and it is up to the subclasser to decide how/when to set those
       * properties back into the accessor.  When calling on an instance,
       * the overwritten value is set via `_setPendingProperty`, and the
       * user should call `_invalidateProperties` or `_flushProperties`
       * for the values to take effect.
       *
       * @param {string} property Name of the property
       * @param {boolean=} readOnly When true, no setter is created; the
       *   protected `_setProperty` function must be used to set the property
       * @protected
       */},{key:"_createPropertyAccessor",value:function _createPropertyAccessor(property,readOnly){if(!this.hasOwnProperty('__dataHasAccessor')){this.__dataHasAccessor=Object.assign({},this.__dataHasAccessor);}if(!this.__dataHasAccessor[property]){this.__dataHasAccessor[property]=true;saveAccessorValue(this,property);Object.defineProperty(this,property,{get:function get(){return this.__data[property];},set:readOnly?function(){}:function(value){this._setProperty(property,value);}});}}/**
       * Returns true if this library created an accessor for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if an accessor was created
       */},{key:"_hasAccessor",value:function _hasAccessor(property){return this.__dataHasAccessor&&this.__dataHasAccessor[property];}/**
       * Updates the local storage for a property (via `_setPendingProperty`)
       * and enqueues a `_proeprtiesChanged` callback.
       *
       * @param {string} property Name of the property
       * @param {*} value Value to set
       * @protected
       */},{key:"_setProperty",value:function _setProperty(property,value){if(this._setPendingProperty(property,value)){this._invalidateProperties();}}/**
       * Updates the local storage for a property, records the previous value,
       * and adds it to the set of "pending changes" that will be passed to the
       * `_propertiesChanged` callback.  This method does not enqueue the
       * `_propertiesChanged` callback.
       *
       * @param {string} property Name of the property
       * @param {*} value Value to set
       * @return {boolean} Returns true if the property changed
       * @protected
       */},{key:"_setPendingProperty",value:function _setPendingProperty(property,value){var old=this.__data[property];if(this._shouldPropertyChange(property,value,old)){if(!this.__dataPending){this.__dataPending={};this.__dataOld={};}// Ensure old is captured from the last turn
if(!(property in this.__dataOld)){this.__dataOld[property]=old;}this.__data[property]=value;this.__dataPending[property]=value;return true;}}/**
       * Returns true if the specified property has a pending change.
       *
       * @param {string} prop Property name
       * @return {boolean} True if property has a pending change
       * @protected
       */},{key:"_isPropertyPending",value:function _isPropertyPending(prop){return this.__dataPending&&prop in this.__dataPending;}/**
       * Marks the properties as invalid, and enqueues an async
       * `_propertiesChanged` callback.
       *
       * @protected
       */},{key:"_invalidateProperties",value:function _invalidateProperties(){var _this4=this;if(!this.__dataInvalid&&this.__dataReady){this.__dataInvalid=true;microtask.run(function(){if(_this4.__dataInvalid){_this4.__dataInvalid=false;_this4._flushProperties();}});}}/**
       * Call to enable property accessor processing. Before this method is
       * called accessor values will be set but side effects are
       * queued. When called, any pending side effects occur immediately.
       * For elements, generally `connectedCallback` is a normal spot to do so.
       * It is safe to call this method multiple times as it only turns on
       * property accessors once.
       */},{key:"_enableProperties",value:function _enableProperties(){if(!this.__dataEnabled){this.__dataEnabled=true;if(this.__dataInstanceProps){this._initializeInstanceProperties(this.__dataInstanceProps);this.__dataInstanceProps=null;}this.ready();}}/**
       * Calls the `_propertiesChanged` callback with the current set of
       * pending changes (and old values recorded when pending changes were
       * set), and resets the pending set of changes. Generally, this method
       * should not be called in user code.
       *
       *
       * @protected
       */},{key:"_flushProperties",value:function _flushProperties(){if(this.__dataPending){var changedProps=this.__dataPending;this.__dataPending=null;this.__dataCounter++;this._propertiesChanged(this.__data,changedProps,this.__dataOld);this.__dataCounter--;}}/**
       * Lifecycle callback called the first time properties are being flushed.
       * Prior to `ready`, all property sets through accessors are queued and
       * their effects are flushed after this method returns.
       *
       * Users may override this function to implement behavior that is
       * dependent on the element having its properties initialized, e.g.
       * from defaults (initialized from `constructor`, `_initializeProperties`),
       * `attributeChangedCallback`, or values propagated from host e.g. via
       * bindings.  `super.ready()` must be called to ensure the data system
       * becomes enabled.
       *
       * @public
       */},{key:"ready",value:function ready(){this.__dataReady=true;// Run normal flush
this._flushProperties();}/**
       * Callback called when any properties with accessors created via
       * `_createPropertyAccessor` have been set.
       *
       * @param {Object} currentProps Bag of all current accessor values
       * @param {Object} changedProps Bag of properties changed since the last
       *   call to `_propertiesChanged`
       * @param {Object} oldProps Bag of previous values for each property
       *   in `changedProps`
       * @protected
       */},{key:"_propertiesChanged",value:function _propertiesChanged(currentProps,changedProps,oldProps){}// eslint-disable-line no-unused-vars
/**
       * Method called to determine whether a property value should be
       * considered as a change and cause the `_propertiesChanged` callback
       * to be enqueued.
       *
       * The default implementation returns `true` for primitive types if a
       * strict equality check fails, and returns `true` for all Object/Arrays.
       * The method always returns false for `NaN`.
       *
       * Override this method to e.g. provide stricter checking for
       * Objects/Arrays when using immutable patterns.
       *
       * @param {string} property Property name
       * @param {*} value New property value
       * @param {*} old Previous property value
       * @return {boolean} Whether the property should be considered a change
       *   and enqueue a `_proeprtiesChanged` callback
       * @protected
       */},{key:"_shouldPropertyChange",value:function _shouldPropertyChange(property,value,old){return(// Strict equality check
old!==value&&(// This ensures (old==NaN, value==NaN) always returns false
old===old||value===value));}}]);return PropertyAccessors;}(superClass);return PropertyAccessors;});})();(function(){'use strict';// 1.x backwards-compatible auto-wrapper for template type extensions
// This is a clear layering violation and gives favored-nation status to
// dom-if and dom-repeat templates.  This is a conceit we're choosing to keep
// a.) to ease 1.x backwards-compatibility due to loss of `is`, and
// b.) to maintain if/repeat capability in parser-constrained elements
//     (e.g. table, select) in lieu of native CE type extensions without
//     massive new invention in this space (e.g. directive system)
var templateExtensions={'dom-if':true,'dom-repeat':true};function wrapTemplateExtension(node){var is=node.getAttribute('is');if(is&&templateExtensions[is]){var t=node;t.removeAttribute('is');node=t.ownerDocument.createElement(is);t.parentNode.replaceChild(node,t);node.appendChild(t);while(t.attributes.length){node.setAttribute(t.attributes[0].name,t.attributes[0].value);t.removeAttribute(t.attributes[0].name);}}return node;}function findTemplateNode(root,nodeInfo){// recursively ascend tree until we hit root
var parent=nodeInfo.parentInfo&&findTemplateNode(root,nodeInfo.parentInfo);// unwind the stack, returning the indexed node at each level
if(parent){// note: marginally faster than indexing via childNodes
// (http://jsperf.com/childnodes-lookup)
for(var n=parent.firstChild,i=0;n;n=n.nextSibling){if(nodeInfo.parentIndex===i++){return n;}}}else{return root;}}// construct `$` map (from id annotations)
function applyIdToMap(inst,map,node,nodeInfo){if(nodeInfo.id){map[nodeInfo.id]=node;}}// install event listeners (from event annotations)
function applyEventListener(inst,node,nodeInfo){if(nodeInfo.events&&nodeInfo.events.length){for(var j=0,e$=nodeInfo.events,e;j<e$.length&&(e=e$[j]);j++){inst._addMethodEventListenerToNode(node,e.name,e.value,inst);}}}// push configuration references at configure time
function applyTemplateContent(inst,node,nodeInfo){if(nodeInfo.templateInfo){node._templateInfo=nodeInfo.templateInfo;}}function createNodeEventHandler(context,eventName,methodName){// Instances can optionally have a _methodHost which allows redirecting where
// to find methods. Currently used by `templatize`.
context=context._methodHost||context;var handler=function handler(e){if(context[methodName]){context[methodName](e,e.detail);}else{console.warn('listener method `'+methodName+'` not defined');}};return handler;}/**
   * Element mixin that provides basic template parsing and stamping, including
   * the following template-related features for stamped templates:
   *
   * - Declarative event listeners (`on-eventname="listener"`)
   * - Map of node id's to stamped node instances (`this.$.id`)
   * - Nested template content caching/removal and re-installation (performance
   *   optimization)
   *
   * @polymerMixin
   * @memberof Polymer
   * @summary Element class mixin that provides basic template parsing and stamping
   */Polymer.TemplateStamp=Polymer.dedupingMixin(function(superClass){/**
     * @polymerMixinClass
     * @implements {Polymer_TemplateStamp}
     */var TemplateStamp=function(_superClass2){_inherits(TemplateStamp,_superClass2);function TemplateStamp(){_classCallCheck(this,TemplateStamp);return _possibleConstructorReturn(this,(TemplateStamp.__proto__||Object.getPrototypeOf(TemplateStamp)).apply(this,arguments));}_createClass(TemplateStamp,[{key:"_stampTemplate",/**
       * Clones the provided template content and returns a document fragment
       * containing the cloned dom.
       *
       * The template is parsed (once and memoized) using this library's
       * template parsing features, and provides the following value-added
       * features:
       * * Adds declarative event listeners for `on-event="handler"` attributes
       * * Generates an "id map" for all nodes with id's under `$` on returned
       *   document fragment
       * * Passes template info including `content` back to templates as
       *   `_templateInfo` (a performance optimization to avoid deep template
       *   cloning)
       *
       * Note that the memoized template parsing process is destructive to the
       * template: attributes for bindings and declarative event listeners are
       * removed after being noted in notes, and any nested `<template>.content`
       * is removed and stored in notes as well.
       *
       * @param {HTMLTemplateElement} template Template to stamp
       * @return {DocumentFragment} Cloned template content
       */value:function _stampTemplate(template){// Polyfill support: bootstrap the template if it has not already been
if(template&&!template.content&&window.HTMLTemplateElement&&HTMLTemplateElement.decorate){HTMLTemplateElement.decorate(template);}var templateInfo=this.constructor._parseTemplate(template);var nodeInfo=templateInfo.nodeInfoList;var content=templateInfo.content||template.content;var dom=document.importNode(content,true);// NOTE: ShadyDom optimization indicating there is an insertion point
dom.__noInsertionPoint=!templateInfo.hasInsertionPoint;var nodes=dom.nodeList=new Array(nodeInfo.length);dom.$={};for(var i=0,l=nodeInfo.length,info;i<l&&(info=nodeInfo[i]);i++){var node=nodes[i]=findTemplateNode(dom,info);applyIdToMap(this,dom.$,node,info);applyTemplateContent(this,node,info);applyEventListener(this,node,info);}return dom;}/**
       * Adds an event listener by method name for the event provided.
       *
       * This method generates a handler function that looks up the method
       * name at handling time.
       *
       * @param {Node} node Node to add listener on
       * @param {string} eventName Name of event
       * @param {string} methodName Name of method
       * @param {*=} context Context the method will be called on (defaults
       *   to `node`)
       * @return {Function} Generated handler function
       */},{key:"_addMethodEventListenerToNode",value:function _addMethodEventListenerToNode(node,eventName,methodName,context){context=context||node;var handler=createNodeEventHandler(context,eventName,methodName);this._addEventListenerToNode(node,eventName,handler);return handler;}/**
       * Override point for adding custom or simulated event handling.
       *
       * @param {Node} node Node to add event listener to
       * @param {string} eventName Name of event
       * @param {Function} handler Listener function to add
       */},{key:"_addEventListenerToNode",value:function _addEventListenerToNode(node,eventName,handler){node.addEventListener(eventName,handler);}/**
       * Override point for adding custom or simulated event handling.
       *
       * @param {Node} node Node to remove event listener from
       * @param {string} eventName Name of event
       * @param {Function} handler Listener function to remove
       */},{key:"_removeEventListenerFromNode",value:function _removeEventListenerFromNode(node,eventName,handler){node.removeEventListener(eventName,handler);}}],[{key:"_parseTemplate",/**
       * Scans a template to produce template metadata.
       *
       * Template-specific metadata are stored in the object returned, and node-
       * specific metadata are stored in objects in its flattened `nodeInfoList`
       * array.  Only nodes in the template that were parsed as nodes of
       * interest contain an object in `nodeInfoList`.  Each `nodeInfo` object
       * contains an `index` (`childNodes` index in parent) and optionally
       * `parent`, which points to node info of its parent (including its index).
       *
       * The template metadata object returned from this method has the following
       * structure (many fields optional):
       *
       * ```js
       *   {
       *     // Flattened list of node metadata (for nodes that generated metadata)
       *     nodeInfoList: [
       *       {
       *         // `id` attribute for any nodes with id's for generating `$` map
       *         id: {string},
       *         // `on-event="handler"` metadata
       *         events: [
       *           {
       *             name: {string},   // event name
       *             value: {string},  // handler method name
       *           }, ...
       *         ],
       *         // Notes when the template contained a `<slot>` for shady DOM
       *         // optimization purposes
       *         hasInsertionPoint: {boolean},
       *         // For nested `<template>`` nodes, nested template metadata
       *         templateInfo: {object}, // nested template metadata
       *         // Metadata to allow efficient retrieval of instanced node
       *         // corresponding to this metadata
       *         parentInfo: {number},   // reference to parent nodeInfo>
       *         parentIndex: {number},  // index in parent's `childNodes` collection
       *         infoIndex: {number},    // index of this `nodeInfo` in `templateInfo.nodeInfoList`
       *       },
       *       ...
       *     ],
       *     // When true, the template had the `strip-whitespace` attribute
       *     // or was nested in a template with that setting
       *     stripWhitespace: {boolean},
       *     // For nested templates, nested template content is moved into
       *     // a document fragment stored here; this is an optimization to
       *     // avoid the cost of nested template cloning
       *     content: {DocumentFragment}
       *   }
       * ```
       *
       * This method kicks off a recursive treewalk as follows:
       *
       * ```
       *    _parseTemplate <---------------------+
       *      _parseTemplateContent              |
       *        _parseTemplateNode  <------------|--+
       *          _parseTemplateNestedTemplate --+  |
       *          _parseTemplateChildNodes ---------+
       *          _parseTemplateNodeAttributes
       *            _parseTemplateNodeAttribute
       *
       * ```
       *
       * These methods may be overridden to add custom metadata about templates
       * to either `templateInfo` or `nodeInfo`.
       *
       * Note that this method may be destructive to the template, in that
       * e.g. event annotations may be removed after being noted in the
       * template metadata.
       *
       * @param {HTMLTemplateElement} template Template to parse
       * @param {Object=} outerTemplateInfo Template metadata from the outer
       *   template, for parsing nested templates
       * @return {Object} Parsed template metadata
       */value:function _parseTemplate(template,outerTemplateInfo){// since a template may be re-used, memo-ize metadata
if(!template._templateInfo){var templateInfo=template._templateInfo={};templateInfo.nodeInfoList=[];templateInfo.stripWhiteSpace=outerTemplateInfo&&outerTemplateInfo.stripWhiteSpace||template.hasAttribute('strip-whitespace');this._parseTemplateContent(template,templateInfo,{parent:null});}return template._templateInfo;}},{key:"_parseTemplateContent",value:function _parseTemplateContent(template,templateInfo,nodeInfo){return this._parseTemplateNode(template.content,templateInfo,nodeInfo);}/**
       * Parses template node and adds template and node metadata based on
       * the current node, and its `childNodes` and `attributes`.
       *
       * This method may be overridden to add custom node or template specific
       * metadata based on this node.
       *
       * @param {Node} node Node to parse
       * @param {Object} templateInfo Template metadata for current template
       * @param {Object} nodeInfo Node metadata for current template.
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       */},{key:"_parseTemplateNode",value:function _parseTemplateNode(node,templateInfo,nodeInfo){var noted=void 0;if(node.localName=='template'&&!node.hasAttribute('preserve-content')){noted=this._parseTemplateNestedTemplate(node,templateInfo,nodeInfo)||noted;}else if(node.localName==='slot'){// For ShadyDom optimization, indicating there is an insertion point
templateInfo.hasInsertionPoint=true;}if(node.firstChild){noted=this._parseTemplateChildNodes(node,templateInfo,nodeInfo)||noted;}if(node.hasAttributes&&node.hasAttributes()){noted=this._parseTemplateNodeAttributes(node,templateInfo,nodeInfo)||noted;}return noted;}/**
       * Parses template child nodes for the given root node.
       *
       * This method also wraps whitelisted legacy template extensions
       * (`is="dom-if"` and `is="dom-repeat"`) with their equivalent element
       * wrappers, collapses text nodes, and strips whitespace from the template
       * if the `templateInfo.stripWhitespace` setting was provided.
       *
       * @param {Node} root Root node whose `childNodes` will be parsed
       * @param {Object} templateInfo Template metadata for current template
       * @param {Object} nodeInfo Node metadata for current template.
       */},{key:"_parseTemplateChildNodes",value:function _parseTemplateChildNodes(root,templateInfo,nodeInfo){for(var node=root.firstChild,parentIndex=0,next;node;node=next){// Wrap templates
if(node.localName=='template'){node=wrapTemplateExtension(node);}// collapse adjacent textNodes: fixes an IE issue that can cause
// text nodes to be inexplicably split =(
// note that root.normalize() should work but does not so we do this
// manually.
next=node.nextSibling;if(node.nodeType===Node.TEXT_NODE){var n=next;while(n&&n.nodeType===Node.TEXT_NODE){node.textContent+=n.textContent;next=n.nextSibling;root.removeChild(n);n=next;}// optionally strip whitespace
if(templateInfo.stripWhiteSpace&&!node.textContent.trim()){root.removeChild(node);continue;}}var childInfo={parentIndex:parentIndex,parentInfo:nodeInfo};if(this._parseTemplateNode(node,templateInfo,childInfo)){childInfo.infoIndex=templateInfo.nodeInfoList.push(childInfo)-1;}// Increment if not removed
if(node.parentNode){parentIndex++;}}}/**
       * Parses template content for the given nested `<template>`.
       *
       * Nested template info is stored as `templateInfo` in the current node's
       * `nodeInfo`. `template.content` is removed and stored in `templateInfo`.
       * It will then be the responsibility of the host to set it back to the
       * template and for users stamping nested templates to use the
       * `_contentForTemplate` method to retrieve the content for this template
       * (an optimization to avoid the cost of cloning nested template content).
       *
       * @param {HTMLTemplateElement} node Node to parse (a <template>)
       * @param {Object} outerTemplateInfo Template metadata for current template
       *   that includes the template `node`
       * @param {Object} nodeInfo Node metadata for current template.
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       */},{key:"_parseTemplateNestedTemplate",value:function _parseTemplateNestedTemplate(node,outerTemplateInfo,nodeInfo){var templateInfo=this._parseTemplate(node,outerTemplateInfo);var content=templateInfo.content=node.content.ownerDocument.createDocumentFragment();content.appendChild(node.content);nodeInfo.templateInfo=templateInfo;return true;}/**
       * Parses template node attributes and adds node metadata to `nodeInfo`
       * for nodes of interest.
       *
       * @param {Node} node Node to parse
       * @param {Object} templateInfo Template metadata for current template
       * @param {Object} nodeInfo Node metadata for current template.
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       */},{key:"_parseTemplateNodeAttributes",value:function _parseTemplateNodeAttributes(node,templateInfo,nodeInfo){// Make copy of original attribute list, since the order may change
// as attributes are added and removed
var noted=void 0;var attrs=Array.from(node.attributes);for(var i=attrs.length-1,a;a=attrs[i];i--){noted=this._parseTemplateNodeAttribute(node,templateInfo,nodeInfo,a.name,a.value)||noted;}return noted;}/**
       * Parses a single template node attribute and adds node metadata to
       * `nodeInfo` for attributes of interest.
       *
       * This implementation adds metadata for `on-event="handler"` attributes
       * and `id` attributes.
       *
       * @param {Node} node Node to parse
       * @param {Object} templateInfo Template metadata for current template
       * @param {Object} nodeInfo Node metadata for current template.
       * @param {string} name Attribute name
       * @param {*} value Attribute value
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       */},{key:"_parseTemplateNodeAttribute",value:function _parseTemplateNodeAttribute(node,templateInfo,nodeInfo,name,value){// events (on-*)
if(name.slice(0,3)==='on-'){node.removeAttribute(name);nodeInfo.events=nodeInfo.events||[];nodeInfo.events.push({name:name.slice(3),value:value});return true;}// static id
else if(name==='id'){nodeInfo.id=value;return true;}}/**
       * Returns the `content` document fragment for a given template.
       *
       * For nested templates, Polymer performs an optimization to cache nested
       * template content to avoid the cost of cloning deeply nested templates.
       * This method retrieves the cached content for a given template.
       *
       * @param {HTMLTemplateElement} template Template to retrieve `content` for
       * @return {DocumentFragment} Content fragment
       */},{key:"_contentForTemplate",value:function _contentForTemplate(template){var templateInfo=template.__templateInfo;return templateInfo&&templateInfo.content||template.content;}}]);return TemplateStamp;}(superClass);return TemplateStamp;});})();(function(){'use strict';/** @const {Object} */var CaseMap=Polymer.CaseMap;// Monotonically increasing unique ID used for de-duping effects triggered
// from multiple properties in the same turn
var dedupeId=0;// Property effect types; effects are stored on the prototype using these keys
var TYPES={COMPUTE:'__computeEffects',REFLECT:'__reflectEffects',NOTIFY:'__notifyEffects',PROPAGATE:'__propagateEffects',OBSERVE:'__observeEffects',READ_ONLY:'__readOnly'/**
   * Ensures that the model has an own-property map of effects for the given type.
   * The model may be a prototype or an instance.
   *
   * Property effects are stored as arrays of effects by property in a map,
   * by named type on the model. e.g.
   *
   *   __computeEffects: {
   *     foo: [ ... ],
   *     bar: [ ... ]
   *   }
   *
   * If the model does not yet have an effect map for the type, one is created
   * and returned.  If it does, but it is not an own property (i.e. the
   * prototype had effects), the the map is deeply cloned and the copy is
   * set on the model and returned, ready for new effects to be added.
   *
   * @param {Object} model Prototype or instance
   * @param {string} type Property effect type
   * @return {Object} The own-property map of effects for the given type
   * @private
   */};function ensureOwnEffectMap(model,type){var effects=model[type];if(!effects){effects=model[type]={};}else if(!model.hasOwnProperty(type)){effects=model[type]=Object.create(model[type]);for(var p in effects){var protoFx=effects[p];var instFx=effects[p]=Array(protoFx.length);for(var i=0;i<protoFx.length;i++){instFx[i]=protoFx[i];}}}return effects;}// -- effects ----------------------------------------------
/**
   * Runs all effects of a given type for the given set of property changes
   * on an instance.
   *
   * @param {Object} inst The instance with effects to run
   * @param {Object} effects Object map of property-to-Array of effects
   * @param {Object} props Bag of current property changes
   * @param {Object=} oldProps Bag of previous values for changed properties
   * @param {boolean=} hasPaths True with `props` contains one or more paths
   * @param {*=} extraArgs Additional metadata to pass to effect function
   * @return {boolean} True if an effect ran for this property
   * @private
   */function runEffects(inst,effects,props,oldProps,hasPaths,extraArgs){if(effects){var ran=false;var id=dedupeId++;for(var prop in props){if(runEffectsForProperty(inst,effects,id,prop,props,oldProps,hasPaths,extraArgs)){ran=true;}}return ran;}return false;}/**
   * Runs a list of effects for a given property.
   *
   * @param {Object} inst The instance with effects to run
   * @param {Object} effects Object map of property-to-Array of effects
   * @param {number} dedupeId Counter used for de-duping effects
   * @param {string} prop Name of changed property
   * @param {*} props Changed properties
   * @param {*} oldProps Old properties
   * @param {boolean=} hasPaths True with `props` contains one or more paths
   * @param {*=} extraArgs Additional metadata to pass to effect function
   * @return {boolean} True if an effect ran for this property
   * @private
   */function runEffectsForProperty(inst,effects,dedupeId,prop,props,oldProps,hasPaths,extraArgs){var ran=false;var rootProperty=hasPaths?Polymer.Path.root(prop):prop;var fxs=effects[rootProperty];if(fxs){for(var i=0,l=fxs.length,fx;i<l&&(fx=fxs[i]);i++){if((!fx.info||fx.info.lastRun!==dedupeId)&&(!hasPaths||pathMatchesTrigger(prop,fx.trigger))){if(fx.info){fx.info.lastRun=dedupeId;}fx.fn(inst,prop,props,oldProps,fx.info,hasPaths,extraArgs);ran=true;}}}return ran;}/**
   * Determines whether a property/path that has changed matches the trigger
   * criteria for an effect.  A trigger is a descriptor with the following
   * structure, which matches the descriptors returned from `parseArg`.
   * e.g. for `foo.bar.*`:
   * ```
   * trigger: {
   *   name: 'a.b',
   *   structured: true,
   *   wildcard: true
   * }
   * ```
   * If no trigger is given, the path is deemed to match.
   *
   * @param {string} path Path or property that changed
   * @param {Object} trigger Descriptor
   * @return {boolean} Whether the path matched the trigger
   */function pathMatchesTrigger(path,trigger){if(trigger){var triggerPath=trigger.name;return triggerPath==path||trigger.structured&&Polymer.Path.isAncestor(triggerPath,path)||trigger.wildcard&&Polymer.Path.isDescendant(triggerPath,path);}else{return true;}}/**
   * Implements the "observer" effect.
   *
   * Calls the method with `info.methodName` on the instance, passing the
   * new and old values.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {Object} info Effect metadata
   * @private
   */function runObserverEffect(inst,property,props,oldProps,info){var fn=inst[info.methodName];var changedProp=info.property;if(fn){fn.call(inst,inst.__data[changedProp],oldProps[changedProp]);}else if(!info.dynamicFn){console.warn('observer method `'+info.methodName+'` not defined');}}/**
   * Runs "notify" effects for a set of changed properties.
   *
   * This method differs from the generic `runEffects` method in that it
   * will dispatch path notification events in the case that the property
   * changed was a path and the root property for that path didn't have a
   * "notify" effect.  This is to maintain 1.0 behavior that did not require
   * `notify: true` to ensure object sub-property notifications were
   * sent.
   *
   * @param {Element} inst The instance with effects to run
   * @param {Object} notifyProps Bag of properties to notify
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {boolean} hasPaths True with `props` contains one or more paths
   * @private
   */function runNotifyEffects(inst,notifyProps,props,oldProps,hasPaths){// Notify
var fxs=inst.__notifyEffects;var notified=void 0;var id=dedupeId++;// Try normal notify effects; if none, fall back to try path notification
for(var prop in notifyProps){if(notifyProps[prop]){if(fxs&&runEffectsForProperty(inst,fxs,id,prop,props,oldProps,hasPaths)){notified=true;}else if(hasPaths&&notifyPath(inst,prop,props)){notified=true;}}}// Flush host if we actually notified and host was batching
// And the host has already initialized clients; this prevents
// an issue with a host observing data changes before clients are ready.
var host=void 0;if(notified&&(host=inst.__dataHost)&&host._invalidateProperties){host._invalidateProperties();}}/**
   * Dispatches {property}-changed events with path information in the detail
   * object to indicate a sub-path of the property was changed.
   *
   * @param {Element} inst The element from which to fire the event
   * @param {string} path The path that was changed
   * @param {Object} props Bag of current property changes
   * @return {boolean} Returns true if the path was notified
   * @private
   */function notifyPath(inst,path,props){var rootProperty=Polymer.Path.root(path);if(rootProperty!==path){var eventName=Polymer.CaseMap.camelToDashCase(rootProperty)+'-changed';dispatchNotifyEvent(inst,eventName,props[path],path);return true;}}/**
   * Dispatches {property}-changed events to indicate a property (or path)
   * changed.
   *
   * @param {Element} inst The element from which to fire the event
   * @param {string} eventName The name of the event to send ('{property}-changed')
   * @param {*} value The value of the changed property
   * @param {string | null | undefined} path If a sub-path of this property changed, the path
   *   that changed (optional).
   * @private
   */function dispatchNotifyEvent(inst,eventName,value,path){var detail={value:value,queueProperty:true};if(path){detail.path=path;}inst.dispatchEvent(new CustomEvent(eventName,{detail:detail}));}/**
   * Implements the "notify" effect.
   *
   * Dispatches a non-bubbling event named `info.eventName` on the instance
   * with a detail object containing the new `value`.
   *
   * @param {Element} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {Object} info Effect metadata
   * @param {boolean} hasPaths True with `props` contains one or more paths
   * @private
   */function runNotifyEffect(inst,property,props,oldProps,info,hasPaths){var rootProperty=hasPaths?Polymer.Path.root(property):property;var path=rootProperty!=property?property:null;var value=path?Polymer.Path.get(inst,path):inst.__data[property];if(path&&value===undefined){value=props[property];// specifically for .splices
}dispatchNotifyEvent(inst,info.eventName,value,path);}/**
   * Handler function for 2-way notification events. Receives context
   * information captured in the `addNotifyListener` closure from the
   * `__notifyListeners` metadata.
   *
   * Sets the value of the notified property to the host property or path.  If
   * the event contained path information, translate that path to the host
   * scope's name for that path first.
   *
   * @param {Event} event Notification event (e.g. '<property>-changed')
   * @param {Object} inst Host element instance handling the notification event
   * @param {string} fromProp Child element property that was bound
   * @param {string} toPath Host property/path that was bound
   * @param {boolean} negate Whether the binding was negated
   * @private
   */function handleNotification(event,inst,fromProp,toPath,negate){var value=void 0;var detail=event.detail;var fromPath=detail&&detail.path;if(fromPath){toPath=Polymer.Path.translate(fromProp,toPath,fromPath);value=detail&&detail.value;}else{value=event.target[fromProp];}value=negate?!value:value;if(!inst.__readOnly||!inst.__readOnly[toPath]){if(inst._setPendingPropertyOrPath(toPath,value,true,Boolean(fromPath))&&(!detail||!detail.queueProperty)){inst._invalidateProperties();}}}/**
   * Implements the "reflect" effect.
   *
   * Sets the attribute named `info.attrName` to the given property value.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {Object} info Effect metadata
   * @private
   */function runReflectEffect(inst,property,props,oldProps,info){var value=inst.__data[property];if(Polymer.sanitizeDOMValue){value=Polymer.sanitizeDOMValue(value,info.attrName,'attribute',inst);}inst._propertyToAttribute(property,info.attrName,value);}/**
   * Runs "computed" effects for a set of changed properties.
   *
   * This method differs from the generic `runEffects` method in that it
   * continues to run computed effects based on the output of each pass until
   * there are no more newly computed properties.  This ensures that all
   * properties that will be computed by the initial set of changes are
   * computed before other effects (binding propagation, observers, and notify)
   * run.
   *
   * @param {Element} inst The instance the effect will be run on
   * @param {Object} changedProps Bag of changed properties
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {boolean} hasPaths True with `props` contains one or more paths
   * @private
   */function runComputedEffects(inst,changedProps,oldProps,hasPaths){var computeEffects=inst.__computeEffects;if(computeEffects){var inputProps=changedProps;while(runEffects(inst,computeEffects,inputProps,oldProps,hasPaths)){Object.assign(oldProps,inst.__dataOld);Object.assign(changedProps,inst.__dataPending);inputProps=inst.__dataPending;inst.__dataPending=null;}}}/**
   * Implements the "computed property" effect by running the method with the
   * values of the arguments specified in the `info` object and setting the
   * return value to the computed property specified.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {Object} info Effect metadata
   * @private
   */function runComputedEffect(inst,property,props,oldProps,info){var result=runMethodEffect(inst,property,props,oldProps,info);var computedProp=info.methodInfo;if(inst.__dataHasAccessor&&inst.__dataHasAccessor[computedProp]){inst._setPendingProperty(computedProp,result,true);}else{inst[computedProp]=result;}}/**
   * Computes path changes based on path links set up using the `linkPaths`
   * API.
   *
   * @param {Element} inst The instance whose props are changing
   * @param {string} path Path that has changed
   * @param {*} value Value of changed path
   * @private
   */function computeLinkedPaths(inst,path,value){var links=inst.__dataLinkedPaths;if(links){var link=void 0;for(var a in links){var b=links[a];if(Polymer.Path.isDescendant(a,path)){link=Polymer.Path.translate(a,b,path);inst._setPendingPropertyOrPath(link,value,true,true);}else if(Polymer.Path.isDescendant(b,path)){link=Polymer.Path.translate(b,a,path);inst._setPendingPropertyOrPath(link,value,true,true);}}}}// -- bindings ----------------------------------------------
/**
   * Adds binding metadata to the current `nodeInfo`, and binding effects
   * for all part dependencies to `templateInfo`.
   *
   * @param {Function} constructor Class that `_parseTemplate` is currently
   *   running on
   * @param {Object} templateInfo Template metadata for current template
   * @param {Object} nodeInfo Node metadata for current template node
   * @param {string} kind Binding kind, either 'property', 'attribute', or 'text'
   * @param {string} target Target property name
   * @param {Array<Object>} parts Array of binding part metadata
   * @param {string} literal Literal text surrounding binding parts (specified
   *   only for 'property' bindings, since these must be initialized as part
   *   of boot-up)
   * @private
   */function addBinding(constructor,templateInfo,nodeInfo,kind,target,parts,literal){// Create binding metadata and add to nodeInfo
nodeInfo.bindings=nodeInfo.bindings||[];var binding={kind:kind,target:target,parts:parts,literal:literal,isCompound:parts.length!==1};nodeInfo.bindings.push(binding);// Add listener info to binding metadata
if(shouldAddListener(binding)){var _binding$parts$=binding.parts[0],event=_binding$parts$.event,negate=_binding$parts$.negate;binding.listenerEvent=event||CaseMap.camelToDashCase(target)+'-changed';binding.listenerNegate=negate;}// Add "propagate" property effects to templateInfo
var index=templateInfo.nodeInfoList.length;for(var i=0;i<binding.parts.length;i++){var part=binding.parts[i];part.compoundIndex=i;addEffectForBindingPart(constructor,templateInfo,binding,part,index);}}/**
   * Adds property effects to the given `templateInfo` for the given binding
   * part.
   *
   * @param {Function} constructor Class that `_parseTemplate` is currently
   *   running on
   * @param {Object} templateInfo Template metadata for current template
   * @param {Object} binding Binding metadata
   * @param {Object} part Binding part metadata
   * @param {number} index Index into `nodeInfoList` for this node
   */function addEffectForBindingPart(constructor,templateInfo,binding,part,index){if(!part.literal){if(binding.kind==='attribute'&&binding.target[0]==='-'){console.warn('Cannot set attribute '+binding.target+' because "-" is not a valid attribute starting character');}else{var dependencies=part.dependencies;var info={index:index,binding:binding,part:part,evaluator:constructor};for(var j=0;j<dependencies.length;j++){var trigger=dependencies[j];if(typeof trigger=='string'){trigger=parseArg(trigger);trigger.wildcard=true;}constructor._addTemplatePropertyEffect(templateInfo,trigger.rootProperty,{fn:runBindingEffect,info:info,trigger:trigger});}}}}/**
   * Implements the "binding" (property/path binding) effect.
   *
   * Note that binding syntax is overridable via `_parseBindings` and
   * `_evaluateBinding`.  This method will call `_evaluateBinding` for any
   * non-literal parts returned from `_parseBindings`.  However,
   * there is no support for _path_ bindings via custom binding parts,
   * as this is specific to Polymer's path binding syntax.
   *
   * @param {Element} inst The instance the effect will be run on
   * @param {string} path Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {Object} info Effect metadata
   * @param {boolean} hasPaths True with `props` contains one or more paths
   * @param {Array} nodeList List of nodes associated with `nodeInfoList` template
   *   metadata
   * @private
   */function runBindingEffect(inst,path,props,oldProps,info,hasPaths,nodeList){var node=nodeList[info.index];var binding=info.binding;var part=info.part;// Subpath notification: transform path and set to client
// e.g.: foo="{{obj.sub}}", path: 'obj.sub.prop', set 'foo.prop'=obj.sub.prop
if(hasPaths&&part.source&&path.length>part.source.length&&binding.kind=='property'&&!binding.isCompound&&node.__dataHasAccessor&&node.__dataHasAccessor[binding.target]){var value=props[path];path=Polymer.Path.translate(part.source,binding.target,path);if(node._setPendingPropertyOrPath(path,value,false,true)){inst._enqueueClient(node);}}else{var _value2=info.evaluator._evaluateBinding(inst,part,path,props,oldProps,hasPaths);// Propagate value to child
applyBindingValue(inst,node,binding,part,_value2);}}/**
   * Sets the value for an "binding" (binding) effect to a node,
   * either as a property or attribute.
   *
   * @param {Object} inst The instance owning the binding effect
   * @param {Node} node Target node for binding
   * @param {Object} binding Binding metadata
   * @param {Object} part Binding part metadata
   * @param {*} value Value to set
   * @private
   */function applyBindingValue(inst,node,binding,part,value){value=computeBindingValue(node,value,binding,part);if(Polymer.sanitizeDOMValue){value=Polymer.sanitizeDOMValue(value,binding.target,binding.kind,node);}if(binding.kind=='attribute'){// Attribute binding
inst._valueToNodeAttribute(node,value,binding.target);}else{// Property binding
var prop=binding.target;if(node.__dataHasAccessor&&node.__dataHasAccessor[prop]){if(!node.__readOnly||!node.__readOnly[prop]){if(node._setPendingProperty(prop,value)){inst._enqueueClient(node);}}}else{inst._setUnmanagedPropertyToNode(node,prop,value);}}}/**
   * Transforms an "binding" effect value based on compound & negation
   * effect metadata, as well as handling for special-case properties
   *
   * @param {Node} node Node the value will be set to
   * @param {*} value Value to set
   * @param {Object} binding Binding metadata
   * @param {Object} part Binding part metadata
   * @return {*} Transformed value to set
   * @private
   */function computeBindingValue(node,value,binding,part){if(binding.isCompound){var storage=node.__dataCompoundStorage[binding.target];storage[part.compoundIndex]=value;value=storage.join('');}if(binding.kind!=='attribute'){// Some browsers serialize `undefined` to `"undefined"`
if(binding.target==='textContent'||node.localName=='input'&&binding.target=='value'){value=value==undefined?'':value;}}return value;}/**
   * Returns true if a binding's metadata meets all the requirements to allow
   * 2-way binding, and therefore a `<property>-changed` event listener should be
   * added:
   * - used curly braces
   * - is a property (not attribute) binding
   * - is not a textContent binding
   * - is not compound
   *
   * @param {Object} binding Binding metadata
   * @return {boolean} True if 2-way listener should be added
   * @private
   */function shouldAddListener(binding){return binding.target&&binding.kind!='attribute'&&binding.kind!='text'&&!binding.isCompound&&binding.parts[0].mode==='{';}/**
   * Setup compound binding storage structures, notify listeners, and dataHost
   * references onto the bound nodeList.
   *
   * @param {Object} inst Instance that bas been previously bound
   * @param {Object} templateInfo Template metadata
   * @private
   */function setupBindings(inst,templateInfo){// Setup compound storage, dataHost, and notify listeners
var nodeList=templateInfo.nodeList,nodeInfoList=templateInfo.nodeInfoList;if(nodeInfoList.length){for(var i=0;i<nodeInfoList.length;i++){var info=nodeInfoList[i];var node=nodeList[i];var bindings=info.bindings;if(bindings){for(var _i2=0;_i2<bindings.length;_i2++){var binding=bindings[_i2];setupCompoundStorage(node,binding);addNotifyListener(node,inst,binding);}}node.__dataHost=inst;}}}/**
   * Initializes `__dataCompoundStorage` local storage on a bound node with
   * initial literal data for compound bindings, and sets the joined
   * literal parts to the bound property.
   *
   * When changes to compound parts occur, they are first set into the compound
   * storage array for that property, and then the array is joined to result in
   * the final value set to the property/attribute.
   *
   * @param {Node} node Bound node to initialize
   * @param {Object} binding Binding metadata
   * @private
   */function setupCompoundStorage(node,binding){if(binding.isCompound){// Create compound storage map
var storage=node.__dataCompoundStorage||(node.__dataCompoundStorage={});var parts=binding.parts;// Copy literals from parts into storage for this binding
var literals=new Array(parts.length);for(var j=0;j<parts.length;j++){literals[j]=parts[j].literal;}var target=binding.target;storage[target]=literals;// Configure properties with their literal parts
if(binding.literal&&binding.kind=='property'){node[target]=binding.literal;}}}/**
   * Adds a 2-way binding notification event listener to the node specified
   *
   * @param {Object} node Child element to add listener to
   * @param {Object} inst Host element instance to handle notification event
   * @param {Object} binding Binding metadata
   * @private
   */function addNotifyListener(node,inst,binding){if(binding.listenerEvent){var part=binding.parts[0];node.addEventListener(binding.listenerEvent,function(e){handleNotification(e,inst,binding.target,part.source,part.negate);});}}// -- for method-based effects (complexObserver & computed) --------------
/**
   * Adds property effects for each argument in the method signature (and
   * optionally, for the method name if `dynamic` is true) that calls the
   * provided effect function.
   *
   * @param {Element | Object} model Prototype or instance
   * @param {Object} sig Method signature metadata
   * @param {string} type Type of property effect to add
   * @param {Function} effectFn Function to run when arguments change
   * @param {*=} methodInfo Effect-specific information to be included in
   *   method effect metadata
   * @param {boolean|Object=} dynamicFn Boolean or object map indicating whether
   *   method names should be included as a dependency to the effect. Note,
   *   defaults to true if the signature is static (sig.static is true).
   * @private
   */function createMethodEffect(model,sig,type,effectFn,methodInfo,dynamicFn){dynamicFn=sig.static||dynamicFn&&((typeof dynamicFn==="undefined"?"undefined":_typeof(dynamicFn))!=='object'||dynamicFn[sig.methodName]);var info={methodName:sig.methodName,args:sig.args,methodInfo:methodInfo,dynamicFn:dynamicFn};for(var i=0,arg;i<sig.args.length&&(arg=sig.args[i]);i++){if(!arg.literal){model._addPropertyEffect(arg.rootProperty,type,{fn:effectFn,info:info,trigger:arg});}}if(dynamicFn){model._addPropertyEffect(sig.methodName,type,{fn:effectFn,info:info});}}/**
   * Calls a method with arguments marshaled from properties on the instance
   * based on the method signature contained in the effect metadata.
   *
   * Multi-property observers, computed properties, and inline computing
   * functions call this function to invoke the method, then use the return
   * value accordingly.
   *
   * @param {Object} inst The instance the effect will be run on
   * @param {string} property Name of property
   * @param {Object} props Bag of current property changes
   * @param {Object} oldProps Bag of previous values for changed properties
   * @param {Object} info Effect metadata
   * @return {*} Returns the return value from the method invocation
   * @private
   */function runMethodEffect(inst,property,props,oldProps,info){// Instances can optionally have a _methodHost which allows redirecting where
// to find methods. Currently used by `templatize`.
var context=inst._methodHost||inst;var fn=context[info.methodName];if(fn){var args=marshalArgs(inst.__data,info.args,property,props);return fn.apply(context,args);}else if(!info.dynamicFn){console.warn('method `'+info.methodName+'` not defined');}}var emptyArray=[];// Regular expressions used for binding
var IDENT='(?:'+'[a-zA-Z_$][\\w.:$\\-*]*'+')';var NUMBER='(?:'+'[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?'+')';var SQUOTE_STRING='(?:'+'\'(?:[^\'\\\\]|\\\\.)*\''+')';var DQUOTE_STRING='(?:'+'"(?:[^"\\\\]|\\\\.)*"'+')';var STRING='(?:'+SQUOTE_STRING+'|'+DQUOTE_STRING+')';var ARGUMENT='(?:'+IDENT+'|'+NUMBER+'|'+STRING+'\\s*'+')';var ARGUMENTS='(?:'+ARGUMENT+'(?:,\\s*'+ARGUMENT+')*'+')';var ARGUMENT_LIST='(?:'+'\\(\\s*'+'(?:'+ARGUMENTS+'?'+')'+'\\)\\s*'+')';var BINDING='('+IDENT+'\\s*'+ARGUMENT_LIST+'?'+')';// Group 3
var OPEN_BRACKET='(\\[\\[|{{)'+'\\s*';var CLOSE_BRACKET='(?:]]|}})';var NEGATE='(?:(!)\\s*)?';// Group 2
var EXPRESSION=OPEN_BRACKET+NEGATE+BINDING+CLOSE_BRACKET;var bindingRegex=new RegExp(EXPRESSION,"g");function literalFromParts(parts){var s='';for(var i=0;i<parts.length;i++){var literal=parts[i].literal;s+=literal||'';}return s;}/**
   * Parses an expression string for a method signature, and returns a metadata
   * describing the method in terms of `methodName`, `static` (whether all the
   * arguments are literals), and an array of `args`
   *
   * @param {string} expression The expression to parse
   * @return {?Object} The method metadata object if a method expression was
   *   found, otherwise `undefined`
   * @private
   */function parseMethod(expression){// tries to match valid javascript property names
var m=expression.match(/([^\s]+?)\(([\s\S]*)\)/);if(m){var methodName=m[1];var sig={methodName:methodName,static:true};if(m[2].trim()){// replace escaped commas with comma entity, split on un-escaped commas
var args=m[2].replace(/\\,/g,'&comma;').split(',');return parseArgs(args,sig);}else{sig.args=emptyArray;return sig;}}return null;}/**
   * Parses an array of arguments and sets the `args` property of the supplied
   * signature metadata object. Sets the `static` property to false if any
   * argument is a non-literal.
   *
   * @param {Array<string>} argList Array of argument names
   * @param {Object} sig Method signature metadata object
   * @return {Object} The updated signature metadata object
   * @private
   */function parseArgs(argList,sig){sig.args=argList.map(function(rawArg){var arg=parseArg(rawArg);if(!arg.literal){sig.static=false;}return arg;},this);return sig;}/**
   * Parses an individual argument, and returns an argument metadata object
   * with the following fields:
   *
   *   {
   *     value: 'prop',        // property/path or literal value
   *     literal: false,       // whether argument is a literal
   *     structured: false,    // whether the property is a path
   *     rootProperty: 'prop', // the root property of the path
   *     wildcard: false       // whether the argument was a wildcard '.*' path
   *   }
   *
   * @param {string} rawArg The string value of the argument
   * @return {Object} Argument metadata object
   * @private
   */function parseArg(rawArg){// clean up whitespace
var arg=rawArg.trim()// replace comma entity with comma
.replace(/&comma;/g,',')// repair extra escape sequences; note only commas strictly need
// escaping, but we allow any other char to be escaped since its
// likely users will do this
.replace(/\\(.)/g,'\$1');// basic argument descriptor
var a={name:arg};// detect literal value (must be String or Number)
var fc=arg[0];if(fc==='-'){fc=arg[1];}if(fc>='0'&&fc<='9'){fc='#';}switch(fc){case"'":case'"':a.value=arg.slice(1,-1);a.literal=true;break;case'#':a.value=Number(arg);a.literal=true;break;}// if not literal, look for structured path
if(!a.literal){a.rootProperty=Polymer.Path.root(arg);// detect structured path (has dots)
a.structured=Polymer.Path.isPath(arg);if(a.structured){a.wildcard=arg.slice(-2)=='.*';if(a.wildcard){a.name=arg.slice(0,-2);}}}return a;}/**
   * Gather the argument values for a method specified in the provided array
   * of argument metadata.
   *
   * The `path` and `value` arguments are used to fill in wildcard descriptor
   * when the method is being called as a result of a path notification.
   *
   * @param {Object} data Instance data storage object to read properties from
   * @param {Array<Object>} args Array of argument metadata
   * @param {string} path Property/path name that triggered the method effect
   * @param {Object} props Bag of current property changes
   * @return {Array<*>} Array of argument values
   * @private
   */function marshalArgs(data,args,path,props){var values=[];for(var i=0,l=args.length;i<l;i++){var arg=args[i];var name=arg.name;var v=void 0;if(arg.literal){v=arg.value;}else{if(arg.structured){v=Polymer.Path.get(data,name);// when data is not stored e.g. `splices`
if(v===undefined){v=props[name];}}else{v=data[name];}}if(arg.wildcard){// Only send the actual path changed info if the change that
// caused the observer to run matched the wildcard
var baseChanged=name.indexOf(path+'.')===0;var matches=path.indexOf(name)===0&&!baseChanged;values[i]={path:matches?path:name,value:matches?props[path]:v,base:v};}else{values[i]=v;}}return values;}// data api
/**
   * Sends array splice notifications (`.splices` and `.length`)
   *
   * Note: this implementation only accepts normalized paths
   *
   * @param {Element} inst Instance to send notifications to
   * @param {Array} array The array the mutations occurred on
   * @param {string} path The path to the array that was mutated
   * @param {Array} splices Array of splice records
   * @private
   */function _notifySplices(inst,array,path,splices){var splicesPath=path+'.splices';inst.notifyPath(splicesPath,{indexSplices:splices});inst.notifyPath(path+'.length',array.length);// Null here to allow potentially large splice records to be GC'ed.
inst.__data[splicesPath]={indexSplices:null};}/**
   * Creates a splice record and sends an array splice notification for
   * the described mutation
   *
   * Note: this implementation only accepts normalized paths
   *
   * @param {Element} inst Instance to send notifications to
   * @param {Array} array The array the mutations occurred on
   * @param {string} path The path to the array that was mutated
   * @param {number} index Index at which the array mutation occurred
   * @param {number} addedCount Number of added items
   * @param {Array} removed Array of removed items
   * @private
   */function notifySplice(inst,array,path,index,addedCount,removed){_notifySplices(inst,array,path,[{index:index,addedCount:addedCount,removed:removed,object:array,type:'splice'}]);}/**
   * Returns an upper-cased version of the string.
   *
   * @param {string} name String to uppercase
   * @return {string} Uppercased string
   * @private
   */function upper(name){return name[0].toUpperCase()+name.substring(1);}/**
   * Element class mixin that provides meta-programming for Polymer's template
   * binding and data observation (collectively, "property effects") system.
   *
   * This mixin uses provides the following key static methods for adding
   * property effects to an element class:
   * - `addPropertyEffect`
   * - `createPropertyObserver`
   * - `createMethodObserver`
   * - `createNotifyingProperty`
   * - `createReadOnlyProperty`
   * - `createReflectedProperty`
   * - `createComputedProperty`
   * - `bindTemplate`
   *
   * Each method creates one or more property accessors, along with metadata
   * used by this mixin's implementation of `_propertiesChanged` to perform
   * the property effects.
   *
   * Underscored versions of the above methods also exist on the element
   * prototype for adding property effects on instances at runtime.
   *
   * Note that this mixin overrides several `PropertyAccessors` methods, in
   * many cases to maintain guarantees provided by the Polymer 1.x features;
   * notably it changes property accessors to be synchronous by default
   * whereas the default when using `PropertyAccessors` standalone is to be
   * async by default.
   *
   * @polymerMixin
   * @mixes Polymer.TemplateStamp
   * @mixes Polymer.PropertyAccessors
   * @memberof Polymer
   * @summary Element class mixin that provides meta-programming for Polymer's
   * template binding and data observation system.
   */Polymer.PropertyEffects=Polymer.dedupingMixin(function(superClass){/**
     * @constructor
     * @extends {superClass}
     * @implements {Polymer_PropertyAccessors}
     * @implements {Polymer_TemplateStamp}
     */var propertyEffectsBase=Polymer.TemplateStamp(Polymer.PropertyAccessors(superClass));/**
     * @polymerMixinClass
     * @unrestricted
     * @implements {Polymer_PropertyEffects}
     */var PropertyEffects=function(_propertyEffectsBase){_inherits(PropertyEffects,_propertyEffectsBase);function PropertyEffects(){_classCallCheck(this,PropertyEffects);return _possibleConstructorReturn(this,(PropertyEffects.__proto__||Object.getPrototypeOf(PropertyEffects)).apply(this,arguments));}_createClass(PropertyEffects,[{key:"_initializeProperties",/**
       * Overrides `Polymer.PropertyAccessors` implementation to initialize
       * additional property-effect related properties.
       *
       * @override
       */value:function _initializeProperties(){_get(PropertyEffects.prototype.__proto__||Object.getPrototypeOf(PropertyEffects.prototype),"_initializeProperties",this).call(this);hostStack.registerHost(this);this.__dataClientsReady=false;this.__dataPendingClients=null;this.__dataToNotify=null;this.__dataLinkedPaths=null;this.__dataHasPaths=false;// May be set on instance prior to upgrade
this.__dataCompoundStorage=this.__dataCompoundStorage||null;this.__dataHost=this.__dataHost||null;this.__dataTemp={};}/**
       * Overrides `Polymer.PropertyAccessors` implementation to provide a
       * more efficient implementation of initializing properties from
       * the prototype on the instance.
       *
       * @override
       */},{key:"_initializeProtoProperties",value:function _initializeProtoProperties(props){this.__data=Object.create(props);this.__dataPending=Object.create(props);this.__dataOld={};}/**
       * Overrides `Polymer.PropertyAccessors` implementation to avoid setting
       * `_setProperty`'s `shouldNotify: true`.
       *
       * @override
       */},{key:"_initializeInstanceProperties",value:function _initializeInstanceProperties(props){var readOnly=this.__readOnly;for(var prop in props){if(!readOnly||!readOnly[prop]){this.__dataPending=this.__dataPending||{};this.__dataOld=this.__dataOld||{};this.__data[prop]=this.__dataPending[prop]=props[prop];}}}// Prototype setup ----------------------------------------
/**
       * Equivalent to static `addPropertyEffect` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Property that should trigger the effect
       * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
       * @param {Object=} effect Effect metadata object
       * @protected
       */},{key:"_addPropertyEffect",value:function _addPropertyEffect(property,type,effect){this._createPropertyAccessor(property,type==TYPES.READ_ONLY);// effects are accumulated into arrays per property based on type
var effects=ensureOwnEffectMap(this,type)[property];if(!effects){effects=this[type][property]=[];}effects.push(effect);}/**
       * Removes the given property effect.
       *
       * @param {string} property Property the effect was associated with
       * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
       * @param {Object=} effect Effect metadata object to remove
       */},{key:"_removePropertyEffect",value:function _removePropertyEffect(property,type,effect){var effects=ensureOwnEffectMap(this,type)[property];var idx=effects.indexOf(effect);if(idx>=0){effects.splice(idx,1);}}/**
       * Returns whether the current prototype/instance has a property effect
       * of a certain type.
       *
       * @param {string} property Property name
       * @param {string=} type Effect type, from this.PROPERTY_EFFECT_TYPES
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */},{key:"_hasPropertyEffect",value:function _hasPropertyEffect(property,type){var effects=this[type];return Boolean(effects&&effects[property]);}/**
       * Returns whether the current prototype/instance has a "read only"
       * accessor for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */},{key:"_hasReadOnlyEffect",value:function _hasReadOnlyEffect(property){return this._hasPropertyEffect(property,TYPES.READ_ONLY);}/**
       * Returns whether the current prototype/instance has a "notify"
       * property effect for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */},{key:"_hasNotifyEffect",value:function _hasNotifyEffect(property){return this._hasPropertyEffect(property,TYPES.NOTIFY);}/**
       * Returns whether the current prototype/instance has a "reflect to attribute"
       * property effect for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */},{key:"_hasReflectEffect",value:function _hasReflectEffect(property){return this._hasPropertyEffect(property,TYPES.REFLECT);}/**
       * Returns whether the current prototype/instance has a "computed"
       * property effect for the given property.
       *
       * @param {string} property Property name
       * @return {boolean} True if the prototype/instance has an effect of this type
       * @protected
       */},{key:"_hasComputedEffect",value:function _hasComputedEffect(property){return this._hasPropertyEffect(property,TYPES.COMPUTE);}// Runtime ----------------------------------------
/**
       * Sets a pending property or path.  If the root property of the path in
       * question had no accessor, the path is set, otherwise it is enqueued
       * via `_setPendingProperty`.
       *
       * This function isolates relatively expensive functionality necessary
       * for the public API (`set`, `setProperties`, `notifyPath`, and property
       * change listeners via {{...}} bindings), such that it is only done
       * when paths enter the system, and not at every propagation step.  It
       * also sets a `__dataHasPaths` flag on the instance which is used to
       * fast-path slower path-matching code in the property effects host paths.
       *
       * `path` can be a path string or array of path parts as accepted by the
       * public API.
       *
       * @param {string | !Array<number|string>} path Path to set
       * @param {*} value Value to set
       * @param {boolean=} shouldNotify Set to true if this change should
       *  cause a property notification event dispatch
       * @param {boolean=} isPathNotification If the path being set is a path
       *   notification of an already changed value, as opposed to a request
       *   to set and notify the change.  In the latter `false` case, a dirty
       *   check is performed and then the value is set to the path before
       *   enqueuing the pending property change.
       * @return {boolean} Returns true if the property/path was enqueued in
       *   the pending changes bag.
       * @protected
       */},{key:"_setPendingPropertyOrPath",value:function _setPendingPropertyOrPath(path,value,shouldNotify,isPathNotification){if(isPathNotification||Polymer.Path.root(Array.isArray(path)?path[0]:path)!==path){// Dirty check changes being set to a path against the actual object,
// since this is the entry point for paths into the system; from here
// the only dirty checks are against the `__dataTemp` cache to prevent
// duplicate work in the same turn only. Note, if this was a notification
// of a change already set to a path (isPathNotification: true),
// we always let the change through and skip the `set` since it was
// already dirty checked at the point of entry and the underlying
// object has already been updated
if(!isPathNotification){var old=Polymer.Path.get(this,path);path=/** @type {string} */Polymer.Path.set(this,path,value);// Use property-accessor's simpler dirty check
if(!path||!_get(PropertyEffects.prototype.__proto__||Object.getPrototypeOf(PropertyEffects.prototype),"_shouldPropertyChange",this).call(this,path,value,old)){return false;}}this.__dataHasPaths=true;if(this._setPendingProperty(path,value,shouldNotify)){computeLinkedPaths(this,path,value);return true;}}else{if(this.__dataHasAccessor&&this.__dataHasAccessor[path]){return this._setPendingProperty(path,value,shouldNotify);}else{this[path]=value;}}return false;}/**
       * Applies a value to a non-Polymer element/node's property.
       *
       * The implementation makes a best-effort at binding interop:
       * Some native element properties have side-effects when
       * re-setting the same value (e.g. setting `<input>.value` resets the
       * cursor position), so we do a dirty-check before setting the value.
       * However, for better interop with non-Polymer custom elements that
       * accept objects, we explicitly re-set object changes coming from the
       * Polymer world (which may include deep object changes without the
       * top reference changing), erring on the side of providing more
       * information.
       *
       * Users may override this method to provide alternate approaches.
       *
       * @param {Node} node The node to set a property on
       * @param {string} prop The property to set
       * @param {*} value The value to set
       * @protected
       */},{key:"_setUnmanagedPropertyToNode",value:function _setUnmanagedPropertyToNode(node,prop,value){// It is a judgment call that resetting primitives is
// "bad" and resettings objects is also "good"; alternatively we could
// implement a whitelist of tag & property values that should never
// be reset (e.g. <input>.value && <select>.value)
if(value!==node[prop]||(typeof value==="undefined"?"undefined":_typeof(value))=='object'){node[prop]=value;}}/**
       * Overrides the `PropertyAccessors` implementation to introduce special
       * dirty check logic depending on the property & value being set:
       *
       * 1. Any value set to a path (e.g. 'obj.prop': 42 or 'obj.prop': {...})
       *    Stored in `__dataTemp`, dirty checked against `__dataTemp`
       * 2. Object set to simple property (e.g. 'prop': {...})
       *    Stored in `__dataTemp` and `__data`, dirty checked against
       *    `__dataTemp` by default implementation of `_shouldPropertyChange`
       * 3. Primitive value set to simple property (e.g. 'prop': 42)
       *    Stored in `__data`, dirty checked against `__data`
       *
       * The dirty-check is important to prevent cycles due to two-way
       * notification, but paths and objects are only dirty checked against any
       * previous value set during this turn via a "temporary cache" that is
       * cleared when the last `_propertiesChaged` exits. This is so:
       * a. any cached array paths (e.g. 'array.3.prop') may be invalidated
       *    due to array mutations like shift/unshift/splice; this is fine
       *    since path changes are dirty-checked at user entry points like `set`
       * b. dirty-checking for objects only lasts one turn to allow the user
       *    to mutate the object in-place and re-set it with the same identity
       *    and have all sub-properties re-propagated in a subsequent turn.
       *
       * The temp cache is not necessarily sufficient to prevent invalid array
       * paths, since a splice can happen during the same turn (with pathological
       * user code); we could introduce a "fixup" for temporarily cached array
       * paths if needed: https://github.com/Polymer/polymer/issues/4227
       *
       * @override
       */},{key:"_setPendingProperty",value:function _setPendingProperty(property,value,shouldNotify){var isPath=this.__dataHasPaths&&Polymer.Path.isPath(property);var prevProps=isPath?this.__dataTemp:this.__data;if(this._shouldPropertyChange(property,value,prevProps[property])){if(!this.__dataPending){this.__dataPending={};this.__dataOld={};}// Ensure old is captured from the last turn
if(!(property in this.__dataOld)){this.__dataOld[property]=this.__data[property];}// Paths are stored in temporary cache (cleared at end of turn),
// which is used for dirty-checking, all others stored in __data
if(isPath){this.__dataTemp[property]=value;}else{this.__data[property]=value;}// All changes go into pending property bag, passed to _propertiesChanged
this.__dataPending[property]=value;// Track properties that should notify separately
if(isPath||this.__notifyEffects&&this.__notifyEffects[property]){this.__dataToNotify=this.__dataToNotify||{};this.__dataToNotify[property]=shouldNotify;}return true;}}/**
       * Overrides base implementation to ensure all accessors set `shouldNotify`
       * to true, for per-property notification tracking.
       *
       * @override
       */},{key:"_setProperty",value:function _setProperty(property,value){if(this._setPendingProperty(property,value,true)){this._invalidateProperties();}}/**
       * Overrides `PropertyAccessor`'s default async queuing of
       * `_propertiesChanged`: if `__dataReady` is false (has not yet been
       * manually flushed), the function no-ops; otherwise flushes
       * `_propertiesChanged` synchronously.
       *
       * @override
       */},{key:"_invalidateProperties",value:function _invalidateProperties(){if(this.__dataReady){this._flushProperties();}}/**
       * Enqueues the given client on a list of pending clients, whose
       * pending property changes can later be flushed via a call to
       * `_flushClients`.
       *
       * @param {Object} client PropertyEffects client to enqueue
       * @protected
       */},{key:"_enqueueClient",value:function _enqueueClient(client){this.__dataPendingClients=this.__dataPendingClients||[];if(client!==this){this.__dataPendingClients.push(client);}}/**
       * Flushes any clients previously enqueued via `_enqueueClient`, causing
       * their `_flushProperties` method to run.
       *
       * @protected
       */},{key:"_flushClients",value:function _flushClients(){if(!this.__dataClientsReady){this.__dataClientsReady=true;this._readyClients();// Override point where accessors are turned on; importantly,
// this is after clients have fully readied, providing a guarantee
// that any property effects occur only after all clients are ready.
this.__dataReady=true;}else{this.__enableOrFlushClients();}}// NOTE: We ensure clients either enable or flush as appropriate. This
// handles two corner cases:
// (1) clients flush properly when connected/enabled before the host
// enables; e.g.
//   (a) Templatize stamps with no properties and does not flush and
//   (b) the instance is inserted into dom and
//   (c) then the instance flushes.
// (2) clients enable properly when not connected/enabled when the host
// flushes; e.g.
//   (a) a template is runtime stamped and not yet connected/enabled
//   (b) a host sets a property, causing stamped dom to flush
//   (c) the stamped dom enables.
},{key:"__enableOrFlushClients",value:function __enableOrFlushClients(){var clients=this.__dataPendingClients;if(clients){this.__dataPendingClients=null;for(var i=0;i<clients.length;i++){var client=clients[i];if(!client.__dataEnabled){client._enableProperties();}else if(client.__dataPending){client._flushProperties();}}}}/**
       * Perform any initial setup on client dom. Called before the first
       * `_flushProperties` call on client dom and before any element
       * observers are called.
       *
       * @protected
       */},{key:"_readyClients",value:function _readyClients(){this.__enableOrFlushClients();}/**
       * Sets a bag of property changes to this instance, and
       * synchronously processes all effects of the properties as a batch.
       *
       * Property names must be simple properties, not paths.  Batched
       * path propagation is not supported.
       *
       * @param {Object} props Bag of one or more key-value pairs whose key is
       *   a property and value is the new value to set for that property.
       * @param {boolean=} setReadOnly When true, any private values set in
       *   `props` will be set. By default, `setProperties` will not set
       *   `readOnly: true` root properties.
       * @public
       */},{key:"setProperties",value:function setProperties(props,setReadOnly){for(var path in props){if(setReadOnly||!this.__readOnly||!this.__readOnly[path]){//TODO(kschaaf): explicitly disallow paths in setProperty?
// wildcard observers currently only pass the first changed path
// in the `info` object, and you could do some odd things batching
// paths, e.g. {'foo.bar': {...}, 'foo': null}
this._setPendingPropertyOrPath(path,props[path],true);}}this._invalidateProperties();}/**
       * Overrides `PropertyAccessors` so that property accessor
       * side effects are not enabled until after client dom is fully ready.
       * Also calls `_flushClients` callback to ensure client dom is enabled
       * that was not enabled as a result of flushing properties.
       *
       * @override
       */},{key:"ready",value:function ready(){// It is important that `super.ready()` is not called here as it
// immediately turns on accessors. Instead, we wait until `readyClients`
// to enable accessors to provide a guarantee that clients are ready
// before processing any accessors side effects.
this._flushProperties();// If no data was pending, `_flushProperties` will not `flushClients`
// so ensure this is done.
if(!this.__dataClientsReady){this._flushClients();}// Before ready, client notifications do not trigger _flushProperties.
// Therefore a flush is necessary here if data has been set.
if(this.__dataPending){this._flushProperties();}}/**
       * Implements `PropertyAccessors`'s properties changed callback.
       *
       * Runs each class of effects for the batch of changed properties in
       * a specific order (compute, propagate, reflect, observe, notify).
       *
       * @override
       */},{key:"_propertiesChanged",value:function _propertiesChanged(currentProps,changedProps,oldProps){// ----------------------------
// let c = Object.getOwnPropertyNames(changedProps || {});
// window.debug && console.group(this.localName + '#' + this.id + ': ' + c);
// if (window.debug) { debugger; }
// ----------------------------
var hasPaths=this.__dataHasPaths;this.__dataHasPaths=false;// Compute properties
runComputedEffects(this,changedProps,oldProps,hasPaths);// Clear notify properties prior to possible reentry (propagate, observe),
// but after computing effects have a chance to add to them
var notifyProps=this.__dataToNotify;this.__dataToNotify=null;// Propagate properties to clients
this._propagatePropertyChanges(changedProps,oldProps,hasPaths);// Flush clients
this._flushClients();// Reflect properties
runEffects(this,this.__reflectEffects,changedProps,oldProps,hasPaths);// Observe properties
runEffects(this,this.__observeEffects,changedProps,oldProps,hasPaths);// Notify properties to host
if(notifyProps){runNotifyEffects(this,notifyProps,changedProps,oldProps,hasPaths);}// Clear temporary cache at end of turn
if(this.__dataCounter==1){this.__dataTemp={};}// ----------------------------
// window.debug && console.groupEnd(this.localName + '#' + this.id + ': ' + c);
// ----------------------------
}/**
       * Called to propagate any property changes to stamped template nodes
       * managed by this element.
       *
       * @param {Object} changedProps Bag of changed properties
       * @param {Object} oldProps Bag of previous values for changed properties
       * @param {boolean} hasPaths True with `props` contains one or more paths
       * @protected
       */},{key:"_propagatePropertyChanges",value:function _propagatePropertyChanges(changedProps,oldProps,hasPaths){if(this.__propagateEffects){runEffects(this,this.__propagateEffects,changedProps,oldProps,hasPaths);}var templateInfo=this.__templateInfo;while(templateInfo){runEffects(this,templateInfo.propertyEffects,changedProps,oldProps,hasPaths,templateInfo.nodeList);templateInfo=templateInfo.nextTemplateInfo;}}/**
       * Aliases one data path as another, such that path notifications from one
       * are routed to the other.
       *
       * @param {string | !Array<string|number>} to Target path to link.
       * @param {string | !Array<string|number>} from Source path to link.
       * @public
       */},{key:"linkPaths",value:function linkPaths(to,from){to=Polymer.Path.normalize(to);from=Polymer.Path.normalize(from);this.__dataLinkedPaths=this.__dataLinkedPaths||{};this.__dataLinkedPaths[to]=from;}/**
       * Removes a data path alias previously established with `_linkPaths`.
       *
       * Note, the path to unlink should be the target (`to`) used when
       * linking the paths.
       *
       * @param {string | !Array<string|number>} path Target path to unlink.
       * @public
       */},{key:"unlinkPaths",value:function unlinkPaths(path){path=Polymer.Path.normalize(path);if(this.__dataLinkedPaths){delete this.__dataLinkedPaths[path];}}/**
       * Notify that an array has changed.
       *
       * Example:
       *
       *     this.items = [ {name: 'Jim'}, {name: 'Todd'}, {name: 'Bill'} ];
       *     ...
       *     this.items.splice(1, 1, {name: 'Sam'});
       *     this.items.push({name: 'Bob'});
       *     this.notifySplices('items', [
       *       { index: 1, removed: [{name: 'Todd'}], addedCount: 1, obect: this.items, type: 'splice' },
       *       { index: 3, removed: [], addedCount: 1, object: this.items, type: 'splice'}
       *     ]);
       *
       * @param {string} path Path that should be notified.
       * @param {Array} splices Array of splice records indicating ordered
       *   changes that occurred to the array. Each record should have the
       *   following fields:
       *    * index: index at which the change occurred
       *    * removed: array of items that were removed from this index
       *    * addedCount: number of new items added at this index
       *    * object: a reference to the array in question
       *    * type: the string literal 'splice'
       *
       *   Note that splice records _must_ be normalized such that they are
       *   reported in index order (raw results from `Object.observe` are not
       *   ordered and must be normalized/merged before notifying).
       * @public
      */},{key:"notifySplices",value:function notifySplices(path,splices){var info={};var array=/** @type {Array} */Polymer.Path.get(this,path,info);_notifySplices(this,array,info.path,splices);}/**
       * Convenience method for reading a value from a path.
       *
       * Note, if any part in the path is undefined, this method returns
       * `undefined` (this method does not throw when dereferencing undefined
       * paths).
       *
       * @param {(string|!Array<(string|number)>)} path Path to the value
       *   to read.  The path may be specified as a string (e.g. `foo.bar.baz`)
       *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
       *   bracketed expressions are not supported; string-based path parts
       *   *must* be separated by dots.  Note that when dereferencing array
       *   indices, the index may be used as a dotted part directly
       *   (e.g. `users.12.name` or `['users', 12, 'name']`).
       * @param {Object=} root Root object from which the path is evaluated.
       * @return {*} Value at the path, or `undefined` if any part of the path
       *   is undefined.
       * @public
       */},{key:"get",value:function get(path,root){return Polymer.Path.get(root||this,path);}/**
       * Convenience method for setting a value to a path and notifying any
       * elements bound to the same path.
       *
       * Note, if any part in the path except for the last is undefined,
       * this method does nothing (this method does not throw when
       * dereferencing undefined paths).
       *
       * @param {(string|!Array<(string|number)>)} path Path to the value
       *   to write.  The path may be specified as a string (e.g. `'foo.bar.baz'`)
       *   or an array of path parts (e.g. `['foo.bar', 'baz']`).  Note that
       *   bracketed expressions are not supported; string-based path parts
       *   *must* be separated by dots.  Note that when dereferencing array
       *   indices, the index may be used as a dotted part directly
       *   (e.g. `'users.12.name'` or `['users', 12, 'name']`).
       * @param {*} value Value to set at the specified path.
       * @param {Object=} root Root object from which the path is evaluated.
       *   When specified, no notification will occur.
       * @public
      */},{key:"set",value:function set(path,value,root){if(root){Polymer.Path.set(root,path,value);}else{if(!this.__readOnly||!this.__readOnly[/** @type {string} */path]){if(this._setPendingPropertyOrPath(path,value,true)){this._invalidateProperties();}}}}/**
       * Adds items onto the end of the array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.push`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @param {string} path Path to array.
       * @param {...*} items Items to push onto array
       * @return {number} New length of the array.
       * @public
       */},{key:"push",value:function push(path){var info={};var array=/** @type {Array}*/Polymer.Path.get(this,path,info);var len=array.length;for(var _len=arguments.length,items=Array(_len>1?_len-1:0),_key=1;_key<_len;_key++){items[_key-1]=arguments[_key];}var ret=array.push.apply(array,items);if(items.length){notifySplice(this,array,info.path,len,items.length,[]);}return ret;}/**
       * Removes an item from the end of array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.pop`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @param {string} path Path to array.
       * @return {*} Item that was removed.
       * @public
       */},{key:"pop",value:function pop(path){var info={};var array=/** @type {Array} */Polymer.Path.get(this,path,info);var hadLength=Boolean(array.length);var ret=array.pop();if(hadLength){notifySplice(this,array,info.path,array.length,0,[ret]);}return ret;}/**
       * Starting from the start index specified, removes 0 or more items
       * from the array and inserts 0 or more new items in their place.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.splice`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @param {string} path Path to array.
       * @param {number} start Index from which to start removing/inserting.
       * @param {number} deleteCount Number of items to remove.
       * @param {...*} items Items to insert into array.
       * @return {Array} Array of removed items.
       * @public
       */},{key:"splice",value:function splice(path,start,deleteCount){var info={};var array=/** @type {Array} */Polymer.Path.get(this,path,info);// Normalize fancy native splice handling of crazy start values
if(start<0){start=array.length-Math.floor(-start);}else{start=Math.floor(start);}if(!start){start=0;}for(var _len2=arguments.length,items=Array(_len2>3?_len2-3:0),_key2=3;_key2<_len2;_key2++){items[_key2-3]=arguments[_key2];}var ret=array.splice.apply(array,[start,deleteCount].concat(items));if(items.length||ret.length){notifySplice(this,array,info.path,start,items.length,ret);}return ret;}/**
       * Removes an item from the beginning of array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.pop`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @param {string} path Path to array.
       * @return {*} Item that was removed.
       * @public
       */},{key:"shift",value:function shift(path){var info={};var array=/** @type {Array} */Polymer.Path.get(this,path,info);var hadLength=Boolean(array.length);var ret=array.shift();if(hadLength){notifySplice(this,array,info.path,0,0,[ret]);}return ret;}/**
       * Adds items onto the beginning of the array at the path specified.
       *
       * The arguments after `path` and return value match that of
       * `Array.prototype.push`.
       *
       * This method notifies other paths to the same array that a
       * splice occurred to the array.
       *
       * @param {string} path Path to array.
       * @param {...*} items Items to insert info array
       * @return {number} New length of the array.
       * @public
       */},{key:"unshift",value:function unshift(path){var info={};var array=/** @type {Array} */Polymer.Path.get(this,path,info);for(var _len3=arguments.length,items=Array(_len3>1?_len3-1:0),_key3=1;_key3<_len3;_key3++){items[_key3-1]=arguments[_key3];}var ret=array.unshift.apply(array,items);if(items.length){notifySplice(this,array,info.path,0,items.length,[]);}return ret;}/**
       * Notify that a path has changed.
       *
       * Example:
       *
       *     this.item.user.name = 'Bob';
       *     this.notifyPath('item.user.name');
       *
       * @param {string} path Path that should be notified.
       * @param {*=} value Value at the path (optional).
       * @public
      */},{key:"notifyPath",value:function notifyPath(path,value){/** @type {string} */var propPath=void 0;if(arguments.length==1){// Get value if not supplied
var info={};value=Polymer.Path.get(this,path,info);propPath=info.path;}else if(Array.isArray(path)){// Normalize path if needed
propPath=Polymer.Path.normalize(path);}else{propPath=/** @type{string} */path;}if(this._setPendingPropertyOrPath(propPath,value,true,true)){this._invalidateProperties();}}/**
       * Equivalent to static `createReadOnlyProperty` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Property name
       * @param {boolean=} protectedSetter Creates a custom protected setter
       *   when `true`.
       * @protected
       */},{key:"_createReadOnlyProperty",value:function _createReadOnlyProperty(property,protectedSetter){this._addPropertyEffect(property,TYPES.READ_ONLY);if(protectedSetter){this['_set'+upper(property)]=function(value){this._setProperty(property,value);};}}/**
       * Equivalent to static `createPropertyObserver` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Property name
       * @param {string} methodName Name of observer method to call
       * @param {boolean=} dynamicFn Whether the method name should be included as
       *   a dependency to the effect.
       * @protected
       */},{key:"_createPropertyObserver",value:function _createPropertyObserver(property,methodName,dynamicFn){var info={property:property,methodName:methodName,dynamicFn:dynamicFn};this._addPropertyEffect(property,TYPES.OBSERVE,{fn:runObserverEffect,info:info,trigger:{name:property}});if(dynamicFn){this._addPropertyEffect(methodName,TYPES.OBSERVE,{fn:runObserverEffect,info:info,trigger:{name:methodName}});}}/**
       * Equivalent to static `createMethodObserver` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} expression Method expression
       * @param {boolean|Object=} dynamicFn Boolean or object map indicating
       *   whether method names should be included as a dependency to the effect.
       * @protected
       */},{key:"_createMethodObserver",value:function _createMethodObserver(expression,dynamicFn){var sig=parseMethod(expression);if(!sig){throw new Error("Malformed observer expression '"+expression+"'");}createMethodEffect(this,sig,TYPES.OBSERVE,runMethodEffect,null,dynamicFn);}/**
       * Equivalent to static `createNotifyingProperty` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Property name
       * @protected
       */},{key:"_createNotifyingProperty",value:function _createNotifyingProperty(property){this._addPropertyEffect(property,TYPES.NOTIFY,{fn:runNotifyEffect,info:{eventName:CaseMap.camelToDashCase(property)+'-changed',property:property}});}/**
       * Equivalent to static `createReflectedProperty` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Property name
       * @protected
       */},{key:"_createReflectedProperty",value:function _createReflectedProperty(property){var attr=CaseMap.camelToDashCase(property);if(attr[0]==='-'){console.warn('Property '+property+' cannot be reflected to attribute '+attr+' because "-" is not a valid starting attribute name. Use a lowercase first letter for the property thisead.');}else{this._addPropertyEffect(property,TYPES.REFLECT,{fn:runReflectEffect,info:{attrName:attr}});}}/**
       * Equivalent to static `createComputedProperty` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * @param {string} property Name of computed property to set
       * @param {string} expression Method expression
       * @param {boolean|Object=} dynamicFn Boolean or object map indicating
       *   whether method names should be included as a dependency to the effect.
       * @protected
       */},{key:"_createComputedProperty",value:function _createComputedProperty(property,expression,dynamicFn){var sig=parseMethod(expression);if(!sig){throw new Error("Malformed computed expression '"+expression+"'");}createMethodEffect(this,sig,TYPES.COMPUTE,runComputedEffect,property,dynamicFn);}// -- static class methods ------------
/**
       * Ensures an accessor exists for the specified property, and adds
       * to a list of "property effects" that will run when the accessor for
       * the specified property is set.  Effects are grouped by "type", which
       * roughly corresponds to a phase in effect processing.  The effect
       * metadata should be in the following form:
       *
       *   {
       *     fn: effectFunction, // Reference to function to call to perform effect
       *     info: { ... }       // Effect metadata passed to function
       *     trigger: {          // Optional triggering metadata; if not provided
       *       name: string      // the property is treated as a wildcard
       *       structured: boolean
       *       wildcard: boolean
       *     }
       *   }
       *
       * Effects are called from `_propertiesChanged` in the following order by
       * type:
       *
       * 1. COMPUTE
       * 2. PROPAGATE
       * 3. REFLECT
       * 4. OBSERVE
       * 5. NOTIFY
       *
       * Effect functions are called with the following signature:
       *
       *   effectFunction(inst, path, props, oldProps, info, hasPaths)
       *
       * @param {string} property Property that should trigger the effect
       * @param {string} type Effect type, from this.PROPERTY_EFFECT_TYPES
       * @param {Object=} effect Effect metadata object
       * @protected
       */},{key:"_bindTemplate",// -- binding ----------------------------------------------
/**
       * Equivalent to static `bindTemplate` API but can be called on
       * an instance to add effects at runtime.  See that method for
       * full API docs.
       *
       * This method may be called on the prototype (for prototypical template
       * binding, to avoid creating accessors every instance) once per prototype,
       * and will be called with `runtimeBinding: true` by `_stampTemplate` to
       * create and link an instance of the template metadata associated with a
       * particular stamping.
       *
       * @param {HTMLTemplateElement} template Template containing binding
       *   bindings
       * @param {boolean=} instanceBinding When false (default), performs
       *   "prototypical" binding of the template and overwrites any previously
       *   bound template for the class. When true (as passed from
       *   `_stampTemplate`), the template info is instanced and linked into
       *   the list of bound templates.
       * @return {Object} Template metadata object; for `runtimeBinding`,
       *   this is an instance of the prototypical template info
       * @protected
       */value:function _bindTemplate(template,instanceBinding){var templateInfo=this.constructor._parseTemplate(template);var wasPreBound=this.__templateInfo==templateInfo;// Optimization: since this is called twice for proto-bound templates,
// don't attempt to recreate accessors if this template was pre-bound
if(!wasPreBound){for(var prop in templateInfo.propertyEffects){this._createPropertyAccessor(prop);}}if(instanceBinding){// For instance-time binding, create instance of template metadata
// and link into list of templates if necessary
templateInfo=Object.create(templateInfo);templateInfo.wasPreBound=wasPreBound;if(!wasPreBound&&this.__templateInfo){var last=this.__templateInfoLast||this.__templateInfo;this.__templateInfoLast=last.nextTemplateInfo=templateInfo;templateInfo.previousTemplateInfo=last;return templateInfo;}}return this.__templateInfo=templateInfo;}/**
       * Adds a property effect to the given template metadata, which is run
       * at the "propagate" stage of `_propertiesChanged` when the template
       * has been bound to the element via `_bindTemplate`.
       *
       * The `effect` object should match the format in `_addPropertyEffect`.
       *
       * @param {Object} templateInfo Template metadata to add effect to
       * @param {string} prop Property that should trigger the effect
       * @param {Object=} effect Effect metadata object
       * @protected
       */},{key:"_stampTemplate",/**
       * Stamps the provided template and performs instance-time setup for
       * Polymer template features, including data bindings, declarative event
       * listeners, and the `this.$` map of `id`'s to nodes.  A document fragment
       * is returned containing the stamped DOM, ready for insertion into the
       * DOM.
       *
       * This method may be called more than once; however note that due to
       * `shadycss` polyfill limitations, only styles from templates prepared
       * using `ShadyCSS.prepareTemplate` will be correctly polyfilled (scoped
       * to the shadow root and support CSS custom properties), and note that
       * `ShadyCSS.prepareTemplate` may only be called once per element. As such,
       * any styles required by in runtime-stamped templates must be included
       * in the main element template.
       *
       * @param {HTMLTemplateElement} template Template to stamp
       * @return {DocumentFragment} Cloned template content
       * @protected
       */value:function _stampTemplate(template){// Ensures that created dom is `_enqueueClient`'d to this element so
// that it can be flushed on next call to `_flushProperties`
hostStack.beginHosting(this);var dom=_get(PropertyEffects.prototype.__proto__||Object.getPrototypeOf(PropertyEffects.prototype),"_stampTemplate",this).call(this,template);hostStack.endHosting(this);var templateInfo=this._bindTemplate(template,true);// Add template-instance-specific data to instanced templateInfo
templateInfo.nodeList=dom.nodeList;// Capture child nodes to allow unstamping of non-prototypical templates
if(!templateInfo.wasPreBound){var nodes=templateInfo.childNodes=[];for(var n=dom.firstChild;n;n=n.nextSibling){nodes.push(n);}}dom.templateInfo=templateInfo;// Setup compound storage, 2-way listeners, and dataHost for bindings
setupBindings(this,templateInfo);// Flush properties into template nodes if already booted
if(this.__dataReady){runEffects(this,templateInfo.propertyEffects,this.__data,null,false,templateInfo.nodeList);}return dom;}/**
       * Removes and unbinds the nodes previously contained in the provided
       * DocumentFragment returned from `_stampTemplate`.
       *
       * @param {DocumentFragment} dom DocumentFragment previously returned
       *   from `_stampTemplate` associated with the nodes to be removed
       * @protected
       */},{key:"_removeBoundDom",value:function _removeBoundDom(dom){// Unlink template info
var templateInfo=dom.templateInfo;if(templateInfo.previousTemplateInfo){templateInfo.previousTemplateInfo.nextTemplateInfo=templateInfo.nextTemplateInfo;}if(templateInfo.nextTemplateInfo){templateInfo.nextTemplateInfo.previousTemplateInfo=templateInfo.previousTemplateInfo;}if(this.__templateInfoLast==templateInfo){this.__templateInfoLast=templateInfo.previousTemplateInfo;}templateInfo.previousTemplateInfo=templateInfo.nextTemplateInfo=null;// Remove stamped nodes
var nodes=templateInfo.childNodes;for(var i=0;i<nodes.length;i++){var node=nodes[i];node.parentNode.removeChild(node);}}/**
       * Overrides default `TemplateStamp` implementation to add support for
       * parsing bindings from `TextNode`'s' `textContent`.  A `bindings`
       * array is added to `nodeInfo` and populated with binding metadata
       * with information capturing the binding target, and a `parts` array
       * with one or more metadata objects capturing the source(s) of the
       * binding.
       *
       * @override
       * @param {Node} node Node to parse
       * @param {Object} templateInfo Template metadata for current template
       * @param {Object} nodeInfo Node metadata for current template node
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       * @protected
       */},{key:"PROPERTY_EFFECT_TYPES",get:function get(){return TYPES;}}],[{key:"addPropertyEffect",value:function addPropertyEffect(property,type,effect){this.prototype._addPropertyEffect(property,type,effect);}/**
       * Creates a single-property observer for the given property.
       *
       * @param {string} property Property name
       * @param {string} methodName Name of observer method to call
       * @param {boolean=} dynamicFn Whether the method name should be included as
       *   a dependency to the effect.
       * @protected
       */},{key:"createPropertyObserver",value:function createPropertyObserver(property,methodName,dynamicFn){this.prototype._createPropertyObserver(property,methodName,dynamicFn);}/**
       * Creates a multi-property "method observer" based on the provided
       * expression, which should be a string in the form of a normal Javascript
       * function signature: `'methodName(arg1, [..., argn])'`.  Each argument
       * should correspond to a property or path in the context of this
       * prototype (or instance), or may be a literal string or number.
       *
       * @param {string} expression Method expression
       * @param {boolean|Object=} dynamicFn Boolean or object map indicating
       *   whether method names should be included as a dependency to the effect.
       * @protected
       */},{key:"createMethodObserver",value:function createMethodObserver(expression,dynamicFn){this.prototype._createMethodObserver(expression,dynamicFn);}/**
       * Causes the setter for the given property to dispatch `<property>-changed`
       * events to notify of changes to the property.
       *
       * @param {string} property Property name
       * @protected
       */},{key:"createNotifyingProperty",value:function createNotifyingProperty(property){this.prototype._createNotifyingProperty(property);}/**
       * Creates a read-only accessor for the given property.
       *
       * To set the property, use the protected `_setProperty` API.
       * To create a custom protected setter (e.g. `_setMyProp()` for
       * property `myProp`), pass `true` for `protectedSetter`.
       *
       * Note, if the property will have other property effects, this method
       * should be called first, before adding other effects.
       *
       * @param {string} property Property name
       * @param {boolean=} protectedSetter Creates a custom protected setter
       *   when `true`.
       * @protected
       */},{key:"createReadOnlyProperty",value:function createReadOnlyProperty(property,protectedSetter){this.prototype._createReadOnlyProperty(property,protectedSetter);}/**
       * Causes the setter for the given property to reflect the property value
       * to a (dash-cased) attribute of the same name.
       *
       * @param {string} property Property name
       * @protected
       */},{key:"createReflectedProperty",value:function createReflectedProperty(property){this.prototype._createReflectedProperty(property);}/**
       * Creates a computed property whose value is set to the result of the
       * method described by the given `expression` each time one or more
       * arguments to the method changes.  The expression should be a string
       * in the form of a normal Javascript function signature:
       * `'methodName(arg1, [..., argn])'`
       *
       * @param {string} property Name of computed property to set
       * @param {string} expression Method expression
       * @param {boolean|Object=} dynamicFn Boolean or object map indicating whether
       *   method names should be included as a dependency to the effect.
       * @protected
       */},{key:"createComputedProperty",value:function createComputedProperty(property,expression,dynamicFn){this.prototype._createComputedProperty(property,expression,dynamicFn);}/**
       * Parses the provided template to ensure binding effects are created
       * for them, and then ensures property accessors are created for any
       * dependent properties in the template.  Binding effects for bound
       * templates are stored in a linked list on the instance so that
       * templates can be efficiently stamped and unstamped.
       *
       * @param {HTMLTemplateElement} template Template containing binding
       *   bindings
       * @return {Object} Template metadata object
       * @protected
       */},{key:"bindTemplate",value:function bindTemplate(template){return this.prototype._bindTemplate(template);}},{key:"_addTemplatePropertyEffect",value:function _addTemplatePropertyEffect(templateInfo,prop,effect){var hostProps=templateInfo.hostProps=templateInfo.hostProps||{};hostProps[prop]=true;var effects=templateInfo.propertyEffects=templateInfo.propertyEffects||{};var propEffects=effects[prop]=effects[prop]||[];propEffects.push(effect);}},{key:"_parseTemplateNode",value:function _parseTemplateNode(node,templateInfo,nodeInfo){var noted=_get(PropertyEffects.__proto__||Object.getPrototypeOf(PropertyEffects),"_parseTemplateNode",this).call(this,node,templateInfo,nodeInfo);if(node.nodeType===Node.TEXT_NODE){var parts=this._parseBindings(node.textContent,templateInfo);if(parts){// Initialize the textContent with any literal parts
// NOTE: default to a space here so the textNode remains; some browsers
// (IE) evacipate an empty textNode following cloneNode/importNode.
node.textContent=literalFromParts(parts)||' ';addBinding(this,templateInfo,nodeInfo,'text','textContent',parts);noted=true;}}return noted;}/**
       * Overrides default `TemplateStamp` implementation to add support for
       * parsing bindings from attributes.  A `bindings`
       * array is added to `nodeInfo` and populated with binding metadata
       * with information capturing the binding target, and a `parts` array
       * with one or more metadata objects capturing the source(s) of the
       * binding.
       *
       * @override
       * @param {Node} node Node to parse
       * @param {Object} templateInfo Template metadata for current template
       * @param {Object} nodeInfo Node metadata for current template node
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       * @protected
       */},{key:"_parseTemplateNodeAttribute",value:function _parseTemplateNodeAttribute(node,templateInfo,nodeInfo,name,value){var parts=this._parseBindings(value,templateInfo);if(parts){// Attribute or property
var origName=name;var kind='property';if(name[name.length-1]=='$'){name=name.slice(0,-1);kind='attribute';}// Initialize attribute bindings with any literal parts
var literal=literalFromParts(parts);if(literal&&kind=='attribute'){node.setAttribute(name,literal);}// Clear attribute before removing, since IE won't allow removing
// `value` attribute if it previously had a value (can't
// unconditionally set '' before removing since attributes with `$`
// can't be set using setAttribute)
if(node.localName==='input'&&origName==='value'){node.setAttribute(origName,'');}// Remove annotation
node.removeAttribute(origName);// Case hackery: attributes are lower-case, but bind targets
// (properties) are case sensitive. Gambit is to map dash-case to
// camel-case: `foo-bar` becomes `fooBar`.
// Attribute bindings are excepted.
if(kind==='property'){name=Polymer.CaseMap.dashToCamelCase(name);}addBinding(this,templateInfo,nodeInfo,kind,name,parts,literal);return true;}else{return _get(PropertyEffects.__proto__||Object.getPrototypeOf(PropertyEffects),"_parseTemplateNodeAttribute",this).call(this,node,templateInfo,nodeInfo,name,value);}}/**
       * Overrides default `TemplateStamp` implementation to add support for
       * binding the properties that a nested template depends on to the template
       * as `_host_<property>`.
       *
       * @override
       * @param {Node} node Node to parse
       * @param {Object} templateInfo Template metadata for current template
       * @param {Object} nodeInfo Node metadata for current template node
       * @return {boolean} `true` if the visited node added node-specific
       *   metadata to `nodeInfo`
       * @protected
       */},{key:"_parseTemplateNestedTemplate",value:function _parseTemplateNestedTemplate(node,templateInfo,nodeInfo){var noted=_get(PropertyEffects.__proto__||Object.getPrototypeOf(PropertyEffects),"_parseTemplateNestedTemplate",this).call(this,node,templateInfo,nodeInfo);// Merge host props into outer template and add bindings
var hostProps=nodeInfo.templateInfo.hostProps;var mode='{';for(var source in hostProps){var parts=[{mode:mode,source:source,dependencies:[source]}];addBinding(this,templateInfo,nodeInfo,'property','_host_'+source,parts);}return noted;}/**
       * Called to parse text in a template (either attribute values or
       * textContent) into binding metadata.
       *
       * Any overrides of this method should return an array of binding part
       * metadata  representing one or more bindings found in the provided text
       * and any "literal" text in between.  Any non-literal parts will be passed
       * to `_evaluateBinding` when any dependencies change.  The only required
       * fields of each "part" in the returned array are as follows:
       *
       * - `dependencies` - Array containing trigger metadata for each property
       *   that should trigger the binding to update
       * - `literal` - String containing text if the part represents a literal;
       *   in this case no `dependencies` are needed
       *
       * Additional metadata for use by `_evaluateBinding` may be provided in
       * each part object as needed.
       *
       * The default implementation handles the following types of bindings
       * (one or more may be intermixed with literal strings):
       * - Property binding: `[[prop]]`
       * - Path binding: `[[object.prop]]`
       * - Negated property or path bindings: `[[!prop]]` or `[[!object.prop]]`
       * - Two-way property or path bindings (supports negation):
       *   `{{prop}}`, `{{object.prop}}`, `{{!prop}}` or `{{!object.prop}}`
       * - Inline computed method (supports negation):
       *   `[[compute(a, 'literal', b)]]`, `[[!compute(a, 'literal', b)]]`
       *
       * @param {string} text Text to parse from attribute or textContent
       * @param {Object} templateInfo Current template metadata
       * @return {Array<Object>} Array of binding part metadata
       * @protected
       */},{key:"_parseBindings",value:function _parseBindings(text,templateInfo){var parts=[];var lastIndex=0;var m=void 0;// Example: "literal1{{prop}}literal2[[!compute(foo,bar)]]final"
// Regex matches:
//        Iteration 1:  Iteration 2:
// m[1]: '{{'          '[['
// m[2]: ''            '!'
// m[3]: 'prop'        'compute(foo,bar)'
while((m=bindingRegex.exec(text))!==null){// Add literal part
if(m.index>lastIndex){parts.push({literal:text.slice(lastIndex,m.index)});}// Add binding part
var mode=m[1][0];var negate=Boolean(m[2]);var source=m[3].trim();var customEvent=void 0,notifyEvent=void 0,colon=void 0;if(mode=='{'&&(colon=source.indexOf('::'))>0){notifyEvent=source.substring(colon+2);source=source.substring(0,colon);customEvent=true;}var signature=parseMethod(source);var dependencies=[];if(signature){// Inline computed function
var args=signature.args,methodName=signature.methodName;for(var i=0;i<args.length;i++){var arg=args[i];if(!arg.literal){dependencies.push(arg);}}var dynamicFns=templateInfo.dynamicFns;if(dynamicFns&&dynamicFns[methodName]||signature.static){dependencies.push(methodName);signature.dynamicFn=true;}}else{// Property or path
dependencies.push(source);}parts.push({source:source,mode:mode,negate:negate,customEvent:customEvent,signature:signature,dependencies:dependencies,event:notifyEvent});lastIndex=bindingRegex.lastIndex;}// Add a final literal part
if(lastIndex&&lastIndex<text.length){var literal=text.substring(lastIndex);if(literal){parts.push({literal:literal});}}if(parts.length){return parts;}}/**
       * Called to evaluate a previously parsed binding part based on a set of
       * one or more changed dependencies.
       *
       * @param {HTMLElement} inst Element that should be used as scope for
       *   binding dependencies
       * @param {Object} part Binding part metadata
       * @param {string} path Property/path that triggered this effect
       * @param {Object} props Bag of current property changes
       * @param {Object} oldProps Bag of previous values for changed properties
       * @param {boolean} hasPaths True with `props` contains one or more paths
       * @return {*} Value the binding part evaluated to
       * @protected
       */},{key:"_evaluateBinding",value:function _evaluateBinding(inst,part,path,props,oldProps,hasPaths){var value=void 0;if(part.signature){value=runMethodEffect(inst,path,props,oldProps,part.signature);}else if(path!=part.source){value=Polymer.Path.get(inst,part.source);}else{if(hasPaths&&Polymer.Path.isPath(path)){value=Polymer.Path.get(inst,path);}else{value=inst.__data[path];}}if(part.negate){value=!value;}return value;}}]);return PropertyEffects;}(propertyEffectsBase);return PropertyEffects;});/**
   * Helper api for enqueing client dom created by a host element.
   *
   * By default elements are flushed via `_flushProperties` when
   * `connectedCallback` is called. Elements attach their client dom to
   * themselves at `ready` time which results from this first flush.
   * This provides an ordering guarantee that the client dom an element
   * creates is flushed before the element itself (i.e. client `ready`
   * fires before host `ready`).
   *
   * However, if `_flushProperties` is called *before* an element is connected,
   * as for example `Templatize` does, this ordering guarantee cannot be
   * satisfied because no elements are connected. (Note: Bound elements that
   * receive data do become enqueued clients and are properly ordered but
   * unbound elements are not.)
   *
   * To maintain the desired "client before host" ordering guarantee for this
   * case we rely on the "host stack. Client nodes registers themselves with
   * the creating host element when created. This ensures that all client dom
   * is readied in the proper order, maintaining the desired guarantee.
   *
   * @private
   */var hostStack={stack:[],registerHost:function registerHost(inst){if(this.stack.length){var host=this.stack[this.stack.length-1];host._enqueueClient(inst);}},beginHosting:function beginHosting(inst){this.stack.push(inst);},endHosting:function endHosting(inst){var stackLen=this.stack.length;if(stackLen&&this.stack[stackLen-1]==inst){this.stack.pop();}}};})();(function(){'use strict';/**
   * @typedef Object<string, {
   *   value: *,
   *   type: (Function | undefined),
   *   readOnly: (boolean | undefined),
   *   computed: (string | undefined),
   *   reflectToAttribute: (boolean | undefined),
   *   notify: (boolean | undefined),
   *   observer: (string | undefined)
   * }>)
   */var PolymerElementProperties=void 0;// eslint-disable-line no-unused-vars
/** @record */var PolymerElementConstructor=function PolymerElementConstructor(){};// eslint-disable-line no-unused-vars
/** @type {(string | undefined)} */PolymerElementConstructor.is;/** @type {(string | undefined)} */PolymerElementConstructor.extends;/** @type {(!PolymerElementProperties | undefined)} */PolymerElementConstructor.properties;/** @type {(!Array<string> | undefined)} */PolymerElementConstructor.observers;/** @type {(!HTMLTemplateElement | string | undefined)} */PolymerElementConstructor.template;/**
   * Element class mixin that provides the core API for Polymer's meta-programming
   * features including template stamping, data-binding, attribute deserialization,
   * and property change observation.
   *
   * Subclassers may provide the following static getters to return metadata
   * used to configure Polymer's features for the class:
   *
   * - `static get is()`: When the template is provided via a `dom-module`,
   *   users should return the `dom-module` id from a static `is` getter.  If
   *   no template is needed or the template is provided directly via the
   *   `template` getter, there is no need to define `is` for the element.
   *
   * - `static get template()`: Users may provide the template directly (as
   *   opposed to via `dom-module`) by implementing a static `template` getter.
   *   The getter may return an `HTMLTemplateElement` or a string, which will
   *   automatically be parsed into a template.
   *
   * - `static get properties()`: Should return an object describing
   *   property-related metadata used by Polymer features (key: property name
   *   value: object containing property metadata). Valid keys in per-property
   *   metadata include:
   *   - `type` (String|Number|Object|Array|...): Used by
   *     `attributeChangedCallback` to determine how string-based attributes
   *     are deserialized to JavaScript property values.
   *   - `notify` (boolean): Causes a change in the property to fire a
   *     non-bubbling event called `<property>-changed`. Elements that have
   *     enabled two-way binding to the property use this event to observe changes.
   *   - `readOnly` (boolean): Creates a getter for the property, but no setter.
   *     To set a read-only property, use the private setter method
   *     `_setProperty(property, value)`.
   *   - `observer` (string): Observer method name that will be called when
   *     the property changes. The arguments of the method are
   *     `(value, previousValue)`.
   *   - `computed` (string): String describing method and dependent properties
   *     for computing the value of this property (e.g. `'computeFoo(bar, zot)'`).
   *     Computed properties are read-only by default and can only be changed
   *     via the return value of the computing method.
   *
   * - `static get observers()`: Array of strings describing multi-property
   *   observer methods and their dependent properties (e.g.
   *   `'observeABC(a, b, c)'`).
   *
   * The base class provides default implementations for the following standard
   * custom element lifecycle callbacks; users may override these, but should
   * call the super method to ensure
   * - `constructor`: Run when the element is created or upgraded
   * - `connectedCallback`: Run each time the element is connected to the
   *   document
   * - `disconnectedCallback`: Run each time the element is disconnected from
   *   the document
   * - `attributeChangedCallback`: Run each time an attribute in
   *   `observedAttributes` is set or removed (note: this element's default
   *   `observedAttributes` implementation will automatically return an array
   *   of dash-cased attributes based on `properties`)
   *
   * @polymerMixin
   * @mixes Polymer.PropertyEffects
   * @memberof Polymer
   * @property rootPath {string} Set to the value of `Polymer.rootPath`,
   *   which defaults to the main document path
   * @property importPath {string} Set to the value of the class's static
   *   `importPath` property, which defaults to the path of this element's
   *   `dom-module` (when `is` is used), but can be overridden for other
   *   import strategies.
   * @summary Element class mixin that provides the core API for Polymer's
   * meta-programming features.
   */Polymer.ElementMixin=Polymer.dedupingMixin(function(base){/**
     * @constructor
     * @extends {base}
     * @implements {Polymer_PropertyEffects}
     */var polymerElementBase=Polymer.PropertyEffects(base);var caseMap=Polymer.CaseMap;/**
     * Returns the `properties` object specifically on `klass`. Use for:
     * (1) super chain mixes togther to make `propertiesForClass` which is
     * then used to make `observedAttributes`.
     * (2) properties effects and observers are created from it at `finalize` time.
     *
     * @param {HTMLElement} klass Element class
     * @return {Object} Object containing own properties for this class
     * @private
     */function ownPropertiesForClass(klass){if(!klass.hasOwnProperty(JSCompiler_renameProperty('__ownProperties',klass))){klass.__ownProperties=klass.hasOwnProperty(JSCompiler_renameProperty('properties',klass))?klass.properties:{};}return klass.__ownProperties;}/**
     * Returns the `observers` array specifically on `klass`. Use for
     * setting up observers.
     *
     * @param {HTMLElement} klass Element class
     * @return {Array} Array containing own observers for this class
     * @private
     */function ownObserversForClass(klass){if(!klass.hasOwnProperty(JSCompiler_renameProperty('__ownObservers',klass))){klass.__ownObservers=klass.hasOwnProperty(JSCompiler_renameProperty('observers',klass))?klass.observers:[];}return klass.__ownObservers;}/**
     * Mixes `props` into `flattenedProps` but upgrades shorthand type
     * syntax to { type: Type}.
     *
     * @param {Object} flattenedProps Bag to collect flattened properties into
     * @param {Object} props Bag of properties to add to `flattenedProps`
     * @return {Objecg} The input `flattenedProps` bag
     * @private
     */function flattenProperties(flattenedProps,props){for(var p in props){var o=props[p];if(typeof o=='function'){o={type:o};}flattenedProps[p]=o;}return flattenedProps;}/**
     * Returns a flattened list of properties mixed together from the chain of all
     * constructor's `config.properties`. This list is used to create
     * (1) observedAttributes,
     * (2) class property default values
     *
     * @param {HTMLElement} klass Element class
     * @return {PolymerElementProperties} Flattened properties for this class
     * @private
     */function propertiesForClass(klass){if(!klass.hasOwnProperty(JSCompiler_renameProperty('__classProperties',klass))){klass.__classProperties=flattenProperties({},ownPropertiesForClass(klass));var superCtor=Object.getPrototypeOf(klass.prototype).constructor;if(superCtor.prototype instanceof PolymerElement){klass.__classProperties=Object.assign(Object.create(propertiesForClass(superCtor)),klass.__classProperties);}}return klass.__classProperties;}/**
     * Returns a list of properties with default values.
     * This list is created as an optimization since it is a subset of
     * the list returned from `propertiesForClass`.
     * This list is used in `_initializeProperties` to set property defaults.
     *
     * @param {HTMLElement} klass Element class
     * @return {PolymerElementProperties} Flattened properties for this class
     *   that have default values
     * @private
     */function propertyDefaultsForClass(klass){if(!klass.hasOwnProperty(JSCompiler_renameProperty('__classPropertyDefaults',klass))){klass.__classPropertyDefaults=null;var props=propertiesForClass(klass);for(var p in props){var info=props[p];if('value'in info){klass.__classPropertyDefaults=klass.__classPropertyDefaults||{};klass.__classPropertyDefaults[p]=info;}}}return klass.__classPropertyDefaults;}/**
     * Returns true if a `klass` has finalized. Called in `ElementClass.finalize()`
     * @param {HTMLElement} klass Element class
     * @return {boolean} True if all metaprogramming for this class has been
     *   completed
     * @private
     */function hasClassFinalized(klass){return klass.hasOwnProperty(JSCompiler_renameProperty('__finalized',klass));}/**
     * Called by `ElementClass.finalize()`. Ensures this `klass` and
     * *all superclasses* are finalized by traversing the prototype chain
     * and calling `klass.finalize()`.
     *
     * @param {HTMLElement} klass Element class
     * @private
     */function finalizeClassAndSuper(klass){var proto=klass.prototype;var superCtor=Object.getPrototypeOf(proto).constructor;if(superCtor.prototype instanceof PolymerElement){superCtor.finalize();}finalizeClass(klass);}/**
     * Configures a `klass` based on a staic `klass.config` object and
     * a `template`. This includes creating accessors and effects
     * for properties in `config` and the `template` as well as preparing the
     * `template` for stamping.
     *
     * @param {HTMLElement} klass Element class
     * @private
     */function finalizeClass(klass){klass.__finalized=true;var proto=klass.prototype;if(klass.hasOwnProperty(JSCompiler_renameProperty('is',klass))&&klass.is){Polymer.telemetry.register(proto);}var props=ownPropertiesForClass(klass);if(props){finalizeProperties(proto,props);}var observers=ownObserversForClass(klass);if(observers){finalizeObservers(proto,observers,props);}// note: create "working" template that is finalized at instance time
var template=klass.template;if(template){if(typeof template==='string'){var t=document.createElement('template');t.innerHTML=template;template=t;}else{template=template.cloneNode(true);}proto._template=template;}}/**
     * Configures a `proto` based on a `properties` object.
     * Leverages `PropertyEffects` to create property accessors and effects
     * supporting, observers, reflecting to attributes, change notification,
     * computed properties, and read only properties.
     * @param {HTMLElement} proto Element class prototype to add accessors
     *    and effects to
     * @param {Object} properties Flattened bag of property descriptors for
     *    this class
     * @private
     */function finalizeProperties(proto,properties){for(var p in properties){createPropertyFromConfig(proto,p,properties[p],properties);}}/**
     * Configures a `proto` based on a `observers` array.
     * Leverages `PropertyEffects` to create observers.
     * @param {HTMLElement} proto Element class prototype to add accessors
     *   and effects to
     * @param {Object} observers Flattened array of observer descriptors for
     *   this class
     * @param {Object} dynamicFns Object containing keys for any properties
     *   that are functions and should trigger the effect when the function
     *   reference is changed
     * @private
     */function finalizeObservers(proto,observers,dynamicFns){for(var i=0;i<observers.length;i++){proto._createMethodObserver(observers[i],dynamicFns);}}/**
     * Creates effects for a property.
     *
     * Note, once a property has been set to
     * `readOnly`, `computed`, `reflectToAttribute`, or `notify`
     * these values may not be changed. For example, a subclass cannot
     * alter these settings. However, additional `observers` may be added
     * by subclasses.
     *
     * The info object should may contain property metadata as follows:
     *
     * * `type`: {function} type to which an attribute matching the property
     * is deserialized. Note the property is camel-cased from a dash-cased
     * attribute. For example, 'foo-bar' attribute is dersialized to a
     * property named 'fooBar'.
     *
     * * `readOnly`: {boolean} creates a readOnly property and
     * makes a private setter for the private of the form '_setFoo' for a
     * property 'foo',
     *
     * * `computed`: {string} creates a computed property. A computed property
     * also automatically is set to `readOnly: true`. The value is calculated
     * by running a method and arguments parsed from the given string. For
     * example 'compute(foo)' will compute a given property when the
     * 'foo' property changes by executing the 'compute' method. This method
     * must return the computed value.
     *
     * * `reflectToAttriute`: {boolean} If true, the property value is reflected
     * to an attribute of the same name. Note, the attribute is dash-cased
     * so a property named 'fooBar' is reflected as 'foo-bar'.
     *
     * * `notify`: {boolean} sends a non-bubbling notification event when
     * the property changes. For example, a property named 'foo' sends an
     * event named 'foo-changed' with `event.detail` set to the value of
     * the property.
     *
     * * observer: {string} name of a method that runs when the property
     * changes. The arguments of the method are (value, previousValue).
     *
     * Note: Users may want control over modifying property
     * effects via subclassing. For example, a user might want to make a
     * reflectToAttribute property not do so in a subclass. We've chosen to
     * disable this because it leads to additional complication.
     * For example, a readOnly effect generates a special setter. If a subclass
     * disables the effect, the setter would fail unexpectedly.
     * Based on feedback, we may want to try to make effects more malleable
     * and/or provide an advanced api for manipulating them.
     * Also consider adding warnings when an effect cannot be changed.
     *
     * @param {HTMLElement} proto Element class prototype to add accessors
     *   and effects to
     * @param {string} name Name of the property.
     * @param {Object} info Info object from which to create property effects.
     * Supported keys:
     * @param {Object} allProps Flattened map of all properties defined in this
     *   element (including inherited properties)
     * @private
     */function createPropertyFromConfig(proto,name,info,allProps){// computed forces readOnly...
if(info.computed){info.readOnly=true;}// Note, since all computed properties are readOnly, this prevents
// adding additional computed property effects (which leads to a confusing
// setup where multiple triggers for setting a property)
// While we do have `hasComputedEffect` this is set on the property's
// dependencies rather than itself.
if(info.computed&&!proto._hasReadOnlyEffect(name)){proto._createComputedProperty(name,info.computed,allProps);}if(info.readOnly&&!proto._hasReadOnlyEffect(name)){proto._createReadOnlyProperty(name,!info.computed);}if(info.reflectToAttribute&&!proto._hasReflectEffect(name)){proto._createReflectedProperty(name);}if(info.notify&&!proto._hasNotifyEffect(name)){proto._createNotifyingProperty(name);}// always add observer
if(info.observer){proto._createPropertyObserver(name,info.observer,allProps[info.observer]);}}/**
     * Configures an element `proto` to function with a given `template`.
     * The element name `is` and extends `ext` must be specified for ShadyCSS
     * style scoping.
     *
     * @param {HTMLElement} proto Element class prototype to add accessors
     *   and effects to
     * @param {HTMLTemplateElement} template Template to process and bind
     * @param {string} baseURI URL against which to resolve urls in
     *   style element cssText
     * @param {string} is Tag name (or type extension name) for this element
     * @param {string=} ext For type extensions, the tag name that was extended
     * @private
     */function finalizeTemplate(proto,template,baseURI,is,ext){// support `include="module-name"`
var cssText=Polymer.StyleGather.cssFromTemplate(template,baseURI)+Polymer.StyleGather.cssFromModuleImports(is);if(cssText){var style=document.createElement('style');style.textContent=cssText;template.content.insertBefore(style,template.content.firstChild);}if(window.ShadyCSS){window.ShadyCSS.prepareTemplate(template,is,ext);}proto._bindTemplate(template);}/**
     * @polymerMixinClass
     * @unrestricted
     * @implements {Polymer_ElementMixin}
     */var PolymerElement=function(_polymerElementBase){_inherits(PolymerElement,_polymerElementBase);function PolymerElement(){_classCallCheck(this,PolymerElement);return _possibleConstructorReturn(this,(PolymerElement.__proto__||Object.getPrototypeOf(PolymerElement)).apply(this,arguments));}_createClass(PolymerElement,[{key:"_initializeProperties",/**
       * Overrides the default `Polymer.PropertyAccessors` to ensure class
       * metaprogramming related to property accessors and effects has
       * completed (calls `finalize`).
       *
       * It also initializes any property defaults provided via `value` in
       * `properties` metadata.
       *
       * @override
       */value:function _initializeProperties(){Polymer.telemetry.instanceCount++;this.constructor.finalize();var importPath=this.constructor.importPath;// note: finalize template when we have access to `localName` to
// avoid dependence on `is` for polyfilling styling.
if(this._template&&!this._template.__polymerFinalized){this._template.__polymerFinalized=true;var baseURI=importPath?Polymer.ResolveUrl.resolveUrl(importPath):'';finalizeTemplate(this.__proto__,this._template,baseURI,this.localName);}_get(PolymerElement.prototype.__proto__||Object.getPrototypeOf(PolymerElement.prototype),"_initializeProperties",this).call(this);// set path defaults
this.rootPath=Polymer.rootPath;this.importPath=importPath;// apply property defaults...
var p$=propertyDefaultsForClass(this.constructor);if(!p$){return;}for(var p in p$){var info=p$[p];// Don't set default value if there is already an own property, which
// happens when a `properties` property with default but no effects had
// a property set (e.g. bound) by its host before upgrade
if(!this.hasOwnProperty(p)){var value=typeof info.value=='function'?info.value.call(this):info.value;// Set via `_setProperty` if there is an accessor, to enable
// initializing readOnly property defaults
if(this._hasAccessor(p)){this._setPendingProperty(p,value,true);}else{this[p]=value;}}}}/**
       * Provides a default implementation of the standard Custom Elements
       * `connectedCallback`.
       *
       * The default implementation enables the property effects system and
       * flushes any pending properties, and updates shimmed CSS properties
       * when using the ShadyCSS scoping/custom properties polyfill.
       *
       * @override
       */},{key:"connectedCallback",value:function connectedCallback(){if(window.ShadyCSS&&this._template){window.ShadyCSS.styleElement(this);}this._enableProperties();}/**
       * Provides a default implementation of the standard Custom Elements
       * `disconnectedCallback`.
       *
       * @override
       */},{key:"disconnectedCallback",value:function disconnectedCallback(){}/**
       * Stamps the element template.
       *
       * @override
       */},{key:"ready",value:function ready(){if(this._template){this.root=this._stampTemplate(this._template);this.$=this.root.$;}_get(PolymerElement.prototype.__proto__||Object.getPrototypeOf(PolymerElement.prototype),"ready",this).call(this);}/**
       * Implements `PropertyEffects`'s `_readyClients` call. Attaches
       * element dom by calling `_attachDom` with the dom stamped from the
       * element's template via `_stampTemplate`. Note that this allows
       * client dom to be attached to the element prior to any observers
       * running.
       *
       * @override
       */},{key:"_readyClients",value:function _readyClients(){if(this._template){this.root=this._attachDom(this.root);}// The super._readyClients here sets the clients initialized flag.
// We must wait to do this until after client dom is created/attached
// so that this flag can be checked to prevent notifications fired
// during this process from being handled before clients are ready.
_get(PolymerElement.prototype.__proto__||Object.getPrototypeOf(PolymerElement.prototype),"_readyClients",this).call(this);}/**
       * Attaches an element's stamped dom to itself. By default,
       * this method creates a `shadowRoot` and adds the dom to it.
       * However, this method may be overridden to allow an element
       * to put its dom in another location.
       *
       * @throws {Error}
       * @suppress {missingReturn}
       * @param {NodeList} dom to attach to the element.
       * @return {Node} node to which the dom has been attached.
       */},{key:"_attachDom",value:function _attachDom(dom){if(this.attachShadow){if(dom){if(!this.shadowRoot){this.attachShadow({mode:'open'});}this.shadowRoot.appendChild(dom);return this.shadowRoot;}}else{throw new Error('ShadowDOM not available. '+// TODO(sorvell): move to compile-time conditional when supported
'Polymer.Element can create dom as children instead of in '+'ShadowDOM by setting `this.root = this;\` before \`ready\`.');}}/**
       * Provides a default implementation of the standard Custom Elements
       * `attributeChangedCallback`.
       *
       * By default, attributes declared in `properties` metadata are
       * deserialized using their `type` information to properties of the
       * same name.  "Dash-cased" attributes are deserialzed to "camelCase"
       * properties.
       *
       * @override
       */},{key:"attributeChangedCallback",value:function attributeChangedCallback(name,old,value){if(old!==value){var property=caseMap.dashToCamelCase(name);var type=propertiesForClass(this.constructor)[property].type;if(!this._hasReadOnlyEffect(property)){this._attributeToProperty(name,value,type);}}}/**
       * When using the ShadyCSS scoping and custom property shim, causes all
       * shimmed styles in this element (and its subtree) to be updated
       * based on current custom property values.
       *
       * The optional parameter overrides inline custom property styles with an
       * object of properties where the keys are CSS properties, and the values
       * are strings.
       *
       * Example: `this.updateStyles({'--color': 'blue'})`
       *
       * These properties are retained unless a value of `null` is set.
       *
       * @param {Object=} properties Bag of custom property key/values to
       *   apply to this element.
       */},{key:"updateStyles",value:function updateStyles(properties){if(window.ShadyCSS){window.ShadyCSS.styleSubtree(this,properties);}}/**
       * Rewrites a given URL relative to a base URL. The base URL defaults to
       * the original location of the document containing the `dom-module` for
       * this element. This method will return the same URL before and after
       * bundling.
       *
       * @param {string} url URL to resolve.
       * @param {string=} base Optional base URL to resolve against, defaults
       * to the element's `importPath`
       * @return {string} Rewritten URL relative to base
       */},{key:"resolveUrl",value:function resolveUrl(url,base){if(!base&&this.importPath){base=Polymer.ResolveUrl.resolveUrl(this.importPath);}return Polymer.ResolveUrl.resolveUrl(url,base);}/**
       * Overrides `PropertyAccessors` to add map of dynamic functions on
       * template info, for consumption by `PropertyEffects` template binding
       * code. This map determines which method templates should have accessors
       * created for them.
       *
       * @override
       */}],[{key:"finalize",/**
       * Called automatically when the first element instance is created to
       * ensure that class finalization work has been completed.
       * May be called by users to eagerly perform class finalization work
       * prior to the creation of the first element instance.
       *
       * Class finalization work generally includes meta-programming such as
       * creating property accessors and any property effect metadata needed for
       * the features used.
       *
       * @public
       */value:function finalize(){if(!hasClassFinalized(this)){finalizeClassAndSuper(this);}}/**
       * Returns the template that will be stamped into this element's shadow root.
       *
       * If a `static get is()` getter is defined, the default implementation
       * will return the first `<template>` in a `dom-module` whose `id`
       * matches this element's `is`.
       *
       * Users may override this getter to return an arbitrary template
       * (in which case the `is` getter is unnecessary). The template returned
       * may be either an `HTMLTemplateElement` or a string that will be
       * automatically parsed into a template.
       *
       * Note that when subclassing, if the super class overrode the default
       * implementation and the subclass would like to provide an alternate
       * template via a `dom-module`, it should override this getter and
       * return `Polymer.DomModule.import(this.is, 'template')`.
       *
       * If a subclass would like to modify the super class template, it should
       * clone it rather than modify it in place.  If the getter does expensive
       * work such as cloning/modifying a template, it should memoize the
       * template for maximum performance:
       *
       *   let memoizedTemplate;
       *   class MySubClass extends MySuperClass {
       *     static get template() {
       *       if (!memoizedTemplate) {
       *         memoizedTemplate = super.template.cloneNode(true);
       *         let subContent = document.createElement('div');
       *         subContent.textContent = 'This came from MySubClass';
       *         memoizedTemplate.content.appendChild(subContent);
       *       }
       *       return memoizedTemplate;
       *     }
       *   }
       *
       * @return {HTMLTemplateElement|string} Template to be stamped
       */},{key:"_parseTemplateContent",value:function _parseTemplateContent(template,templateInfo,nodeInfo){templateInfo.dynamicFns=templateInfo.dynamicFns||propertiesForClass(this);return _get(PolymerElement.__proto__||Object.getPrototypeOf(PolymerElement),"_parseTemplateContent",this).call(this,template,templateInfo,nodeInfo);}},{key:"observedAttributes",/**
       * Standard Custom Elements V1 API.  The default implementation returns
       * a list of dash-cased attributes based on a flattening of all properties
       * declared in `static get properties()` for this element and any
       * superclasses.
       *
       * @return {Array} Observed attribute list
       */get:function get(){if(!this.hasOwnProperty(JSCompiler_renameProperty('__observedAttributes',this))){var list=[];var properties=propertiesForClass(this);for(var prop in properties){list.push(Polymer.CaseMap.camelToDashCase(prop));}this.__observedAttributes=list;}return this.__observedAttributes;}},{key:"template",get:function get(){if(!this.hasOwnProperty(JSCompiler_renameProperty('_template',this))){this._template=Polymer.DomModule.import(this.is,'template')||// note: implemented so a subclass can retrieve the super
// template; call the super impl this way so that `this` points
// to the superclass.
Object.getPrototypeOf(this.prototype).constructor.template;}return this._template;}/**
       * Path matching the url from which the element was imported.
       * This path is used to resolve url's in template style cssText.
       * The `importPath` property is also set on element instances and can be
       * used to create bindings relative to the import path.
       * Defaults to the path matching the url containing a `dom-module` element
       * matching this element's static `is` property.
       * Note, this path should contain a trailing `/`.
       *
       * @return {string} The import path for this element class
       */},{key:"importPath",get:function get(){if(!this.hasOwnProperty(JSCompiler_renameProperty('_importPath',this))){var module=Polymer.DomModule.import(this.is);this._importPath=module?module.assetpath:''||Object.getPrototypeOf(this.prototype).constructor.importPath;}return this._importPath;}}]);return PolymerElement;}(polymerElementBase);return PolymerElement;});/**
   * Provides basic tracking of element definitions (registrations) and
   * instance counts.
   *
   * @namespace
   * @summary Provides basic tracking of element definitions (registrations) and
   * instance counts.
   */Polymer.telemetry={/**
     * Total number of Polymer element instances created.
     * @type {number}
     */instanceCount:0,/**
     * Array of Polymer element classes that have been finalized.
     * @type {Array<Polymer.Element>}
     */registrations:[],/**
     * @param {HTMLElement} prototype Element prototype to log
     * @private
     */_regLog:function _regLog(prototype){console.log('['+prototype.is+']: registered');},/**
     * Registers a class prototype for telemetry purposes.
     * @param {HTMLElement} prototype Element prototype to register
     * @protected
     */register:function register(prototype){this.registrations.push(prototype);Polymer.log&&this._regLog(prototype);},/**
     * Logs all elements registered with an `is` to the console.
     * @public
     */dumpRegistrations:function dumpRegistrations(){this.registrations.forEach(this._regLog);}};/**
   * When using the ShadyCSS scoping and custom property shim, causes all
   * shimmed `styles` (via `custom-style`) in the document (and its subtree)
   * to be updated based on current custom property values.
   *
   * The optional parameter overrides inline custom property styles with an
   * object of properties where the keys are CSS properties, and the values
   * are strings.
   *
   * Example: `Polymer.updateStyles({'--color': 'blue'})`
   *
   * These properties are retained unless a value of `null` is set.
   *
   * @param {Object=} props Bag of custom property key/values to
   *   apply to the document.
   */Polymer.updateStyles=function(props){if(window.ShadyCSS){window.ShadyCSS.styleDocument(props);}};/**
   * Globally settable property that is automatically assigned to
   * `Polymer.ElementMixin` instances, useful for binding in templates to
   * make URL's relative to an application's root.  Defaults to the main
   * document URL, but can be overridden by users.  It may be useful to set
   * `Polymer.rootPath` to provide a stable application mount path when
   * using client side routing.
   *
   * @memberof Polymer
   */Polymer.rootPath=Polymer.rootPath||Polymer.ResolveUrl.pathFromUrl(document.baseURI||window.location.href);})();(function(){'use strict';/**
   * Base class that provides the core API for Polymer's meta-programming
   * features including template stamping, data-binding, attribute deserialization,
   * and property change observation.
   *
   * @polymerElement
   * @memberof Polymer
   * @constructor
   * @implements {Polymer_ElementMixin}
   * @extends HTMLElement
   * @mixes Polymer.ElementMixin
   * @summary Custom element base class that provides the core API for Polymer's
   *   key meta-programming features including template stamping, data-binding,
   *   attribute deserialization, and property change observation
   */var Element=Polymer.ElementMixin(HTMLElement);Polymer.Element=Element;})();(function(){'use strict';// Common implementation for mixin & behavior
function mutablePropertyChange(inst,property,value,old,mutableData){var isObject=void 0;if(mutableData){isObject=(typeof value==="undefined"?"undefined":_typeof(value))==='object'&&value!==null;// Pull `old` for Objects from temp cache, but treat `null` as a primitive
if(isObject){old=inst.__dataTemp[property];}}// Strict equality check, but return false for NaN===NaN
var shouldChange=old!==value&&(old===old||value===value);// Objects are stored in temporary cache (cleared at end of
// turn), which is used for dirty-checking
if(isObject&&shouldChange){inst.__dataTemp[property]=value;}return shouldChange;}/**
   * Element class mixin to skip strict dirty-checking for objects and arrays
   * (always consider them to be "dirty"), for use on elements utilizing
   * `Polymer.PropertyEffects`
   *
   * By default, `Polymer.PropertyEffects` performs strict dirty checking on
   * objects, which means that any deep modifications to an object or array will
   * not be propagated unless "immutable" data patterns are used (i.e. all object
   * references from the root to the mutation were changed).
   *
   * Polymer also provides a proprietary data mutation and path notification API
   * (e.g. `notifyPath`, `set`, and array mutation API's) that allow efficient
   * mutation and notification of deep changes in an object graph to all elements
   * bound to the same object graph.
   *
   * In cases where neither immutable patterns nor the data mutation API can be
   * used, applying this mixin will cause Polymer to skip dirty checking for
   * objects and arrays (always consider them to be "dirty").  This allows a
   * user to make a deep modification to a bound object graph, and then either
   * simply re-set the object (e.g. `this.items = this.items`) or call `notifyPath`
   * (e.g. `this.notifyPath('items')`) to update the tree.  Note that all
   * elements that wish to be updated based on deep mutations must apply this
   * mixin or otherwise skip strict dirty checking for objects/arrays.
   *
   * In order to make the dirty check strategy configurable, see
   * `Polymer.OptionalMutableData`.
   *
   * Note, the performance characteristics of propagating large object graphs
   * will be worse as opposed to using strict dirty checking with immutable
   * patterns or Polymer's path notification API.
   *
   * @polymerMixin
   * @memberof Polymer
   * @summary Element class mixin to skip strict dirty-checking for objects
   *   and arrays
   */Polymer.MutableData=Polymer.dedupingMixin(function(superClass){/**
     * @polymerMixinClass
     * @implements {Polymer_MutableData}
     */var MutableData=function(_superClass3){_inherits(MutableData,_superClass3);function MutableData(){_classCallCheck(this,MutableData);return _possibleConstructorReturn(this,(MutableData.__proto__||Object.getPrototypeOf(MutableData)).apply(this,arguments));}_createClass(MutableData,[{key:"_shouldPropertyChange",/**
       * Overrides `Polymer.PropertyEffects` to provide option for skipping
       * strict equality checking for Objects and Arrays.
       *
       * This method pulls the value to dirty check against from the `__dataTemp`
       * cache (rather than the normal `__data` cache) for Objects.  Since the temp
       * cache is cleared at the end of a turn, this implementation allows
       * side-effects of deep object changes to be processed by re-setting the
       * same object (using the temp cache as an in-turn backstop to prevent
       * cycles due to 2-way notification).
       *
       * @param {string} property Property name
       * @param {*} value New property value
       * @param {*} old Previous property value
       * @return {boolean} Whether the property should be considered a change
       * @protected
       */value:function _shouldPropertyChange(property,value,old){return mutablePropertyChange(this,property,value,old,true);}}]);return MutableData;}(superClass);return MutableData;});/**
   * Element class mixin to add the optional ability to skip strict
   * dirty-checking for objects and arrays (always consider them to be
   * "dirty") by setting a `mutable-data` attribute on an element instance.
   *
   * By default, `Polymer.PropertyEffects` performs strict dirty checking on
   * objects, which means that any deep modifications to an object or array will
   * not be propagated unless "immutable" data patterns are used (i.e. all object
   * references from the root to the mutation were changed).
   *
   * Polymer also provides a proprietary data mutation and path notification API
   * (e.g. `notifyPath`, `set`, and array mutation API's) that allow efficient
   * mutation and notification of deep changes in an object graph to all elements
   * bound to the same object graph.
   *
   * In cases where neither immutable patterns nor the data mutation API can be
   * used, applying this mixin will allow Polymer to skip dirty checking for
   * objects and arrays (always consider them to be "dirty").  This allows a
   * user to make a deep modification to a bound object graph, and then either
   * simply re-set the object (e.g. `this.items = this.items`) or call `notifyPath`
   * (e.g. `this.notifyPath('items')`) to update the tree.  Note that all
   * elements that wish to be updated based on deep mutations must apply this
   * mixin or otherwise skip strict dirty checking for objects/arrays.
   *
   * While this mixin adds the ability to forgo Object/Array dirty checking,
   * the `mutableData` flag defaults to false and must be set on the instance.
   *
   * Note, the performance characteristics of propagating large object graphs
   * will be worse by relying on `mutableData: true` as opposed to using
   * strict dirty checking with immutable patterns or Polymer's path notification
   * API.
   *
   * @polymerMixin
   * @memberof Polymer
   * @summary Element class mixin to optionally skip strict dirty-checking
   *   for objects and arrays
   */Polymer.OptionalMutableData=Polymer.dedupingMixin(function(superClass){/**
     * @polymerMixinClass
     * @implements {Polymer_OptionalMutableData}
     */var OptionalMutableData=function(_superClass4){_inherits(OptionalMutableData,_superClass4);function OptionalMutableData(){_classCallCheck(this,OptionalMutableData);return _possibleConstructorReturn(this,(OptionalMutableData.__proto__||Object.getPrototypeOf(OptionalMutableData)).apply(this,arguments));}_createClass(OptionalMutableData,[{key:"_shouldPropertyChange",/**
       * Overrides `Polymer.PropertyEffects` to provide option for skipping
       * strict equality checking for Objects and Arrays.
       *
       * When `this.mutableData` is true on this instance, this method
       * pulls the value to dirty check against from the `__dataTemp` cache
       * (rather than the normal `__data` cache) for Objects.  Since the temp
       * cache is cleared at the end of a turn, this implementation allows
       * side-effects of deep object changes to be processed by re-setting the
       * same object (using the temp cache as an in-turn backstop to prevent
       * cycles due to 2-way notification).
       *
       * @param {string} property Property name
       * @param {*} value New property value
       * @param {*} old Previous property value
       * @return {boolean} Whether the property should be considered a change
       * @protected
       */value:function _shouldPropertyChange(property,value,old){return mutablePropertyChange(this,property,value,old,this.mutableData);}}],[{key:"properties",get:function get(){return{/**
           * Instance-level flag for configuring the dirty-checking strategy
           * for this element.  When true, Objects and Arrays will skip dirty
           * checking, otherwise strict equality checking will be used.
           */mutableData:Boolean};}}]);return OptionalMutableData;}(superClass);return OptionalMutableData;});// Export for use by legacy behavior
Polymer.MutableData._mutablePropertyChange=mutablePropertyChange;})();(function(){'use strict';// Base class for HTMLTemplateElement extension that has property effects
// machinery for propagating host properties to children. This is an ES5
// class only because Babel (incorrectly) requires super() in the class
// constructor even though no `this` is used and it returns an instance.
var newInstance=null;function HTMLTemplateElementExtension(){return newInstance;}HTMLTemplateElementExtension.prototype=Object.create(HTMLTemplateElement.prototype,{constructor:{value:HTMLTemplateElementExtension,writable:true}});var DataTemplate=Polymer.PropertyEffects(HTMLTemplateElementExtension);var MutableDataTemplate=Polymer.MutableData(DataTemplate);// Applies a DataTemplate subclass to a <template> instance
function upgradeTemplate(template,constructor){newInstance=template;Object.setPrototypeOf(template,constructor.prototype);new constructor();newInstance=null;}// Base class for TemplateInstance's
/**
     * @constructor
     * @implements {Polymer_PropertyEffects}
     */var base=Polymer.PropertyEffects(function(){function _class2(){_classCallCheck(this,_class2);}return _class2;}());var TemplateInstanceBase=function(_base){_inherits(TemplateInstanceBase,_base);function TemplateInstanceBase(props){_classCallCheck(this,TemplateInstanceBase);var _this10=_possibleConstructorReturn(this,(TemplateInstanceBase.__proto__||Object.getPrototypeOf(TemplateInstanceBase)).call(this));_this10._configureProperties(props);_this10.root=_this10._stampTemplate(_this10.__dataHost);// Save list of stamped children
var children=_this10.children=[];for(var n=_this10.root.firstChild;n;n=n.nextSibling){children.push(n);n.__templatizeInstance=_this10;}if(_this10.__templatizeOwner.__hideTemplateChildren__){_this10._showHideChildren(true);}// Flush props only when props are passed if instance props exist
// or when there isn't instance props.
var options=_this10.__templatizeOptions;if(props&&options.instanceProps||!options.instanceProps){_this10._enableProperties();}return _this10;}/**
       * Configure the given `props` by calling `_setPendingProperty`. Also
       * sets any properties stored in `__hostProps`.
       * @private
       * @param {Object} props Object of property name-value pairs to set.
       */_createClass(TemplateInstanceBase,[{key:"_configureProperties",value:function _configureProperties(props){var options=this.__templatizeOptions;if(props){for(var iprop in options.instanceProps){if(iprop in props){this._setPendingProperty(iprop,props[iprop]);}}}for(var hprop in this.__hostProps){this._setPendingProperty(hprop,this.__dataHost['_host_'+hprop]);}}/**
       * Forwards a host property to this instance.  This method should be
       * called on instances from the `options.forwardHostProp` callback
       * to propagate changes of host properties to each instance.
       *
       * Note this method enqueues the change, which are flushed as a batch.
       *
       * @param {string} prop Property or path name
       * @param {*} value Value of the property to forward
       */},{key:"forwardHostProp",value:function forwardHostProp(prop,value){if(this._setPendingPropertyOrPath(prop,value,false,true)){this.__dataHost._enqueueClient(this);}}/**
       * @override
       */},{key:"_addEventListenerToNode",value:function _addEventListenerToNode(node,eventName,handler){var _this11=this;if(this._methodHost&&this.__templatizeOptions.parentModel){// If this instance should be considered a parent model, decorate
// events this template instance as `model`
this._methodHost._addEventListenerToNode(node,eventName,function(e){e.model=_this11;handler(e);});}else{// Otherwise delegate to the template's host (which could be)
// another template instance
var templateHost=this.__dataHost.__dataHost;if(templateHost){templateHost._addEventListenerToNode(node,eventName,handler);}}}/**
       * Shows or hides the template instance top level child elements. For
       * text nodes, `textContent` is removed while "hidden" and replaced when
       * "shown."
       * @param {boolean} hide Set to true to hide the children;
       * set to false to show them.
       * @protected
       */},{key:"_showHideChildren",value:function _showHideChildren(hide){var c=this.children;for(var i=0;i<c.length;i++){var n=c[i];// Ignore non-changes
if(Boolean(hide)!=Boolean(n.__hideTemplateChildren__)){if(n.nodeType===Node.TEXT_NODE){if(hide){n.__polymerTextContent__=n.textContent;n.textContent='';}else{n.textContent=n.__polymerTextContent__;}}else if(n.style){if(hide){n.__polymerDisplay__=n.style.display;n.style.display='none';}else{n.style.display=n.__polymerDisplay__;}}}n.__hideTemplateChildren__=hide;if(n._showHideChildren){n._showHideChildren(hide);}}}/**
       * Overrides default property-effects implementation to intercept
       * textContent bindings while children are "hidden" and cache in
       * private storage for later retrieval.
       *
       * @override
       */},{key:"_setUnmanagedPropertyToNode",value:function _setUnmanagedPropertyToNode(node,prop,value){if(node.__hideTemplateChildren__&&node.nodeType==Node.TEXT_NODE&&prop=='textContent'){node.__polymerTextContent__=value;}else{_get(TemplateInstanceBase.prototype.__proto__||Object.getPrototypeOf(TemplateInstanceBase.prototype),"_setUnmanagedPropertyToNode",this).call(this,node,prop,value);}}/**
       * Find the parent model of this template instance.  The parent model
       * is either another templatize instance that had option `parentModel: true`,
       * or else the host element.
       *
       * @return {Polymer.PropertyEffectsInterface} The parent model of this instance
       */},{key:"parentModel",get:function get(){var model=this.__parentModel;if(!model){var options=void 0;model=this;do{// A template instance's `__dataHost` is a <template>
// `model.__dataHost.__dataHost` is the template's host
model=model.__dataHost.__dataHost;}while((options=model.__templatizeOptions)&&!options.parentModel);this.__parentModel=model;}return model;}}]);return TemplateInstanceBase;}(base);var MutableTemplateInstanceBase=Polymer.MutableData(TemplateInstanceBase);function findMethodHost(template){// Technically this should be the owner of the outermost template.
// In shadow dom, this is always getRootNode().host, but we can
// approximate this via cooperation with our dataHost always setting
// `_methodHost` as long as there were bindings (or id's) on this
// instance causing it to get a dataHost.
var templateHost=template.__dataHost;return templateHost&&templateHost._methodHost||templateHost;}function createTemplatizerClass(template,templateInfo,options){// Anonymous class created by the templatize
/**
       * @unrestricted
       */var base=options.mutableData?MutableTemplateInstanceBase:TemplateInstanceBase;var klass=function(_base2){_inherits(klass,_base2);function klass(){_classCallCheck(this,klass);return _possibleConstructorReturn(this,(klass.__proto__||Object.getPrototypeOf(klass)).apply(this,arguments));}return klass;}(base);klass.prototype.__templatizeOptions=options;klass.prototype._bindTemplate(template);addNotifyEffects(klass,template,templateInfo,options);return klass;}function addPropagateEffects(template,templateInfo,options){var userForwardHostProp=options.forwardHostProp;if(userForwardHostProp){// Provide data API and property effects on memoized template class
var klass=templateInfo.templatizeTemplateClass;if(!klass){var _base3=options.mutableData?MutableDataTemplate:DataTemplate;klass=templateInfo.templatizeTemplateClass=function(_base4){_inherits(TemplatizedTemplate,_base4);function TemplatizedTemplate(){_classCallCheck(this,TemplatizedTemplate);return _possibleConstructorReturn(this,(TemplatizedTemplate.__proto__||Object.getPrototypeOf(TemplatizedTemplate)).apply(this,arguments));}return TemplatizedTemplate;}(_base3);// Add template - >instances effects
// and host <- template effects
var hostProps=templateInfo.hostProps;for(var prop in hostProps){klass.prototype._addPropertyEffect('_host_'+prop,klass.prototype.PROPERTY_EFFECT_TYPES.PROPAGATE,{fn:createForwardHostPropEffect(prop,userForwardHostProp)});klass.prototype._createNotifyingProperty('_host_'+prop);}}upgradeTemplate(template,klass);// Mix any pre-bound data into __data; no need to flush this to
// instances since they pull from the template at instance-time
if(template.__dataProto){// Note, generally `__dataProto` could be chained, but it's guaranteed
// to not be since this is a vanilla template we just added effects to
Object.assign(template.__data,template.__dataProto);}// Clear any pending data for performance
template.__dataTemp={};template.__dataPending=null;template.__dataOld=null;template._enableProperties();}}function createForwardHostPropEffect(hostProp,userForwardHostProp){return function forwardHostProp(template,prop,props){userForwardHostProp.call(template.__templatizeOwner,prop.substring('_host_'.length),props[prop]);};}function addNotifyEffects(klass,template,templateInfo,options){var hostProps=templateInfo.hostProps||{};for(var iprop in options.instanceProps){delete hostProps[iprop];var userNotifyInstanceProp=options.notifyInstanceProp;if(userNotifyInstanceProp){klass.prototype._addPropertyEffect(iprop,klass.prototype.PROPERTY_EFFECT_TYPES.NOTIFY,{fn:createNotifyInstancePropEffect(iprop,userNotifyInstanceProp)});}}if(options.forwardHostProp&&template.__dataHost){for(var hprop in hostProps){klass.prototype._addPropertyEffect(hprop,klass.prototype.PROPERTY_EFFECT_TYPES.NOTIFY,{fn:createNotifyHostPropEffect()});}}}function createNotifyInstancePropEffect(instProp,userNotifyInstanceProp){return function notifyInstanceProp(inst,prop,props){userNotifyInstanceProp.call(inst.__templatizeOwner,inst,prop,props[prop]);};}function createNotifyHostPropEffect(){return function notifyHostProp(inst,prop,props){inst.__dataHost._setPendingPropertyOrPath('_host_'+prop,props[prop],true,true);};}/**
     * Module for preparing and stamping instances of templates that utilize
     * Polymer's data-binding and declarative event listener features.
     *
     * Example:
     *
     *     // Get a template from somewhere, e.g. light DOM
     *     let template = this.querySelector('template');
     *     // Prepare the template
     *     let TemplateClass = Polymer.Templatize.templatize(template);
     *     // Instance the template with an initial data model
     *     let instance = new TemplateClass({myProp: 'initial'});
     *     // Insert the instance's DOM somewhere, e.g. element's shadow DOM
     *     this.shadowRoot.appendChild(instance.root);
     *     // Changing a property on the instance will propagate to bindings
     *     // in the template
     *     instance.myProp = 'new value';
     *
     * The `options` dictionary passed to `templatize` allows for customizing
     * features of the generated template class, including how outer-scope host
     * properties should be forwarded into template instances, how any instance
     * properties added into the template's scope should be notified out to
     * the host, and whether the instance should be decorated as a "parent model"
     * of any event handlers.
     *
     *     // Customze property forwarding and event model decoration
     *     let TemplateClass = Polymer.Tempaltize.templatize(template, this, {
     *       parentModel: true,
     *       instanceProps: {...},
     *       forwardHostProp(property, value) {...},
     *       notifyInstanceProp(instance, property, value) {...},
     *     });
     *
     *
     * @namespace
     * @memberof Polymer
     * @summary Module for preparing and stamping instances of templates
     *   utilizing Polymer templating features.
     */var Templatize={/**
       * Returns an anonymous `Polymer.PropertyEffects` class bound to the
       * `<template>` provided.  Instancing the class will result in the
       * template being stamped into document fragment stored as the instance's
       * `root` property, after which it can be appended to the DOM.
       *
       * Templates may utilize all Polymer data-binding features as well as
       * declarative event listeners.  Event listeners and inline computing
       * functions in the template will be called on the host of the template.
       *
       * The constructor returned takes a single argument dictionary of initial
       * property values to propagate into template bindings.  Additionally
       * host properties can be forwarded in, and instance properties can be
       * notified out by providing optional callbacks in the `options` dictionary.
       *
       * Valid configuration in `options` are as follows:
       *
       * - `forwardHostProp(property, value)`: Called when a property referenced
       *   in the template changed on the template's host. As this library does
       *   not retain references to templates instanced by the user, it is the
       *   templatize owner's responsibility to forward host property changes into
       *   user-stamped instances.  The `instance.forwardHostProp(property, value)`
       *    method on the generated class should be called to forward host
       *   properties into the template to prevent unnecessary property-changed
       *   notifications. Any properties referenced in the template that are not
       *   defined in `instanceProps` will be notified up to the template's host
       *   automatically.
       * - `instanceProps`: Dictionary of property names that will be added
       *   to the instance by the templatize owner.  These properties shadow any
       *   host properties, and changes within the template to these properties
       *   will result in `notifyInstanceProp` being called.
       * - `mutableData`: When `true`, the generated class will skip strict
       *   dirty-checking for objects and arrays (always consider them to be
       *   "dirty").
       * - `notifyInstanceProp(instance, property, value)`: Called when
       *   an instance property changes.  Users may choose to call `notifyPath`
       *   on e.g. the owner to notify the change.
       * - `parentModel`: When `true`, events handled by declarative event listeners
       *   (`on-event="handler"`) will be decorated with a `model` property pointing
       *   to the template instance that stamped it.  It will also be returned
       *   from `instance.parentModel` in cases where template instance nesting
       *   causes an inner model to shadow an outer model.
       *
       * Note that the class returned from `templatize` is generated only once
       * for a given `<template>` using `options` from the first call for that
       * template, and the cached class is returned for all subsequent calls to
       * `templatize` for that template.  As such, `options` callbacks should not
       * close over owner-specific properties since only the first `options` is
       * used; rather, callbacks are called bound to the `owner`, and so context
       * needed from the callbacks (such as references to `instances` stamped)
       * should be stored on the `owner` such that they can be retrieved via `this`.
       *
       * @memberof Polymer.Templatize
       * @param {HTMLTemplateElement} template Template to templatize
       * @param {*} owner Owner of the template instances; any optional callbacks
       *   will be bound to this owner.
       * @param {*=} options Options dictionary (see summary for details)
       * @return {TemplateInstanceBase} Generated class bound to the template
       *   provided
       */templatize:function templatize(template,owner,options){options=options||{};if(template.__templatizeOwner){throw new Error('A <template> can only be templatized once');}template.__templatizeOwner=owner;var templateInfo=owner.constructor._parseTemplate(template);// Get memoized base class for the prototypical template, which
// includes property effects for binding template & forwarding
var baseClass=templateInfo.templatizeInstanceClass;if(!baseClass){baseClass=createTemplatizerClass(template,templateInfo,options);templateInfo.templatizeInstanceClass=baseClass;}// Host property forwarding must be installed onto template instance
addPropagateEffects(template,templateInfo,options);// Subclass base class and add reference for this specific template
var klass=function(_baseClass){_inherits(TemplateInstance,_baseClass);function TemplateInstance(){_classCallCheck(this,TemplateInstance);return _possibleConstructorReturn(this,(TemplateInstance.__proto__||Object.getPrototypeOf(TemplateInstance)).apply(this,arguments));}return TemplateInstance;}(baseClass);klass.prototype._methodHost=findMethodHost(template);klass.prototype.__dataHost=template;klass.prototype.__templatizeOwner=owner;klass.prototype.__hostProps=templateInfo.hostProps;return klass;},/**
       * Returns the template "model" associated with a given element, which
       * serves as the binding scope for the template instance the element is
       * contained in. A template model is an instance of
       * `TemplateInstanceBase`, and should be used to manipulate data
       * associated with this template instance.
       *
       * Example:
       *
       *   let model = modelForElement(el);
       *   if (model.index < 10) {
       *     model.set('item.checked', true);
       *   }
       *
       * @memberof Polymer.Templatize
       * @param {HTMLTemplateElement} template The model will be returned for
       *   elements stamped from this template
       * @param {HTMLElement} el Element for which to return a template model.
       * @return {TemplateInstanceBase} Template instance representing the
       *   binding scope for the element
       */modelForElement:function modelForElement(template,el){var model=void 0;while(el){// An element with a __templatizeInstance marks the top boundary
// of a scope; walk up until we find one, and then ensure that
// its __dataHost matches `this`, meaning this dom-repeat stamped it
if(model=el.__templatizeInstance){// Found an element stamped by another template; keep walking up
// from its __dataHost
if(model.__dataHost!=template){el=model.__dataHost;}else{return model;}}else{// Still in a template scope, keep going up until
// a __templatizeInstance is found
el=el.parentNode;}}return null;}};Polymer.Templatize=Templatize;})();(function(){'use strict';/** @typedef {{run: function(function(), number=):number, cancel: function(number)}} */var AsyncModule=void 0;// eslint-disable-line no-unused-vars
var Debouncer=function(){function Debouncer(){_classCallCheck(this,Debouncer);this._asyncModule=null;this._callback=null;this._timer=null;}/**
     * Sets the scheduler; that is, a module with the Async interface,
     * a callback and optional arguments to be passed to the run function
     * from the async module.
     *
     * @param {!AsyncModule} asyncModule Object with Async interface.
     * @param {function()} callback Callback to run.
     */_createClass(Debouncer,[{key:"setConfig",value:function setConfig(asyncModule,callback){var _this15=this;this._asyncModule=asyncModule;this._callback=callback;this._timer=this._asyncModule.run(function(){_this15._timer=null;_this15._callback();});}/**
     * Cancels an active debouncer and returns a reference to itself.
     */},{key:"cancel",value:function cancel(){if(this.isActive()){this._asyncModule.cancel(this._timer);this._timer=null;}}/**
     * Flushes an active debouncer and returns a reference to itself.
     */},{key:"flush",value:function flush(){if(this.isActive()){this.cancel();this._callback();}}/**
     * Returns true if the debouncer is active.
     *
     * @return {boolean} True if active.
     */},{key:"isActive",value:function isActive(){return this._timer!=null;}/**
   * Creates a debouncer if no debouncer is passed as a parameter
   * or it cancels an active debouncer otherwise. The following
   * example shows how a debouncer can be called multiple times within a
   * microtask and "debounced" such that the provided callback function is
   * called once. Add this method to a custom element:
   *
   * _debounceWork() {
   *   this._debounceJob = Polymer.Debouncer.debounce(this._debounceJob,
   *       Polymer.Async.microTask, () => {
   *     this._doWork();
   *   });
   * }
   *
   * If the `_debounceWork` method is called multiple times within the same
   * microtask, the `_doWork` function will be called only once at the next
   * microtask checkpoint.
   *
   * Note: In testing it is often convenient to avoid asynchrony. To accomplish
   * this with a debouncer, you can use `Polymer.enqueueDebouncer` and
   * `Polymer.flush`. For example, extend the above example by adding
   * `Polymer.enqueueDebouncer(this._debounceJob)` at the end of the
   * `_debounceWork` method. Then in a test, call `Polymer.flush` to ensure
   * the debouncer has completed.
   *
   * @param {Polymer.Debouncer?} debouncer Debouncer object.
   * @param {!AsyncModule} asyncModule Object with Async interface
   * @param {function()} callback Callback to run.
   * @return {!Debouncer} Returns a debouncer object.
   */}],[{key:"debounce",value:function debounce(debouncer,asyncModule,callback){if(debouncer instanceof Debouncer){debouncer.cancel();}else{debouncer=new Debouncer();}debouncer.setConfig(asyncModule,callback);return debouncer;}}]);return Debouncer;}();/**
   * @memberof Polymer
   */Polymer.Debouncer=Debouncer;})();(function(){'use strict';var debouncerQueue=[];/**
   * Adds a `Polymer.Debouncer` to a list of globally flushable tasks.
   *
   * @memberof Polymer
   * @param {Polymer.Debouncer} debouncer Debouncer to enqueue
   */Polymer.enqueueDebouncer=function(debouncer){debouncerQueue.push(debouncer);};function flushDebouncers(){var didFlush=Boolean(debouncerQueue.length);while(debouncerQueue.length){try{debouncerQueue.shift().flush();}catch(e){setTimeout(function(){throw e;});}}return didFlush;}/**
   * Forces several classes of asynchronously queued tasks to flush:
   * - Debouncers added via `enqueueDebouncer`
   * - ShadyDOM distribution
   *
   * @memberof Polymer
   */Polymer.flush=function(){var shadyDOM=void 0,debouncers=void 0;do{shadyDOM=window.ShadyDOM&&ShadyDOM.flush();if(window.ShadyCSS&&window.ShadyCSS.ScopingShim){window.ShadyCSS.ScopingShim.flush();}debouncers=flushDebouncers();}while(shadyDOM||debouncers);};})();(function(){'use strict';/**
   * @constructor
   * @implements {Polymer_OptionalMutableData}
   * @extends {Polymer.Element}
   */var domRepeatBase=Polymer.OptionalMutableData(Polymer.Element);/**
   * The `<dom-repeat>` element will automatically stamp and binds one instance
   * of template content to each object in a user-provided array.
   * `dom-repeat` accepts an `items` property, and one instance of the template
   * is stamped for each item into the DOM at the location of the `dom-repeat`
   * element.  The `item` property will be set on each instance's binding
   * scope, thus templates should bind to sub-properties of `item`.
   *
   * Example:
   *
   * ```html
   * <dom-module id="employee-list">
   *
   *   <template>
   *
   *     <div> Employee list: </div>
   *     <template is="dom-repeat" items="{{employees}}">
   *         <div>First name: <span>{{item.first}}</span></div>
   *         <div>Last name: <span>{{item.last}}</span></div>
   *     </template>
   *
   *   </template>
   *
   *   <script>
   *     Polymer({
   *       is: 'employee-list',
   *       ready: function() {
   *         this.employees = [
   *             {first: 'Bob', last: 'Smith'},
   *             {first: 'Sally', last: 'Johnson'},
   *             ...
   *         ];
   *       }
   *     });
   *   < /script>
   *
   * </dom-module>
   * ```
   *
   * Notifications for changes to items sub-properties will be forwarded to template
   * instances, which will update via the normal structured data notification system.
   *
   * Mutations to the `items` array itself should me made using the Array
   * mutation API's on `Polymer.Base` (`push`, `pop`, `splice`, `shift`,
   * `unshift`), and template instances will be kept in sync with the data in the
   * array.
   *
   * Events caught by event handlers within the `dom-repeat` template will be
   * decorated with a `model` property, which represents the binding scope for
   * each template instance.  The model is an instance of Polymer.Base, and should
   * be used to manipulate data on the instance, for example
   * `event.model.set('item.checked', true);`.
   *
   * Alternatively, the model for a template instance for an element stamped by
   * a `dom-repeat` can be obtained using the `modelForElement` API on the
   * `dom-repeat` that stamped it, for example
   * `this.$.domRepeat.modelForElement(event.target).set('item.checked', true);`.
   * This may be useful for manipulating instance data of event targets obtained
   * by event handlers on parents of the `dom-repeat` (event delegation).
   *
   * A view-specific filter/sort may be applied to each `dom-repeat` by supplying a
   * `filter` and/or `sort` property.  This may be a string that names a function on
   * the host, or a function may be assigned to the property directly.  The functions
   * should implemented following the standard `Array` filter/sort API.
   *
   * In order to re-run the filter or sort functions based on changes to sub-fields
   * of `items`, the `observe` property may be set as a space-separated list of
   * `item` sub-fields that should cause a re-filter/sort when modified.  If
   * the filter or sort function depends on properties not contained in `items`,
   * the user should observe changes to those properties and call `render` to update
   * the view based on the dependency change.
   *
   * For example, for an `dom-repeat` with a filter of the following:
   *
   * ```js
   * isEngineer: function(item) {
   *     return item.type == 'engineer' || item.manager.type == 'engineer';
   * }
   * ```
   *
   * Then the `observe` property should be configured as follows:
   *
   * ```html
   * <template is="dom-repeat" items="{{employees}}"
   *           filter="isEngineer" observe="type manager.type">
   * ```
   *
   * @polymerElement
   * @memberof Polymer
   * @extends Polymer.Element
   * @mixes Polymer.MutableData
   * @summary Custom element for stamping instance of a template bound to
   *   items in an array.
   */var DomRepeat=function(_domRepeatBase){_inherits(DomRepeat,_domRepeatBase);_createClass(DomRepeat,null,[{key:"is",// Not needed to find template; can be removed once the analyzer
// can find the tag name from customElements.define call
get:function get(){return'dom-repeat';}},{key:"template",get:function get(){return null;}},{key:"properties",get:function get(){/**
       * Fired whenever DOM is added or removed by this template (by
       * default, rendering occurs lazily).  To force immediate rendering, call
       * `render`.
       *
       * @event dom-change
       */return{/**
         * An array containing items determining how many instances of the template
         * to stamp and that that each template instance should bind to.
         */items:{type:Array},/**
         * The name of the variable to add to the binding scope for the array
         * element associated with a given template instance.
         */as:{type:String,value:'item'},/**
         * The name of the variable to add to the binding scope with the index
         * of the instance in the sorted and filtered list of rendered items.
         * Note, for the index in the `this.items` array, use the value of the
         * `itemsIndexAs` property.
         */indexAs:{type:String,value:'index'},/**
         * The name of the variable to add to the binding scope with the index
         * of the instance in the `this.items` array. Note, for the index of
         * this instance in the sorted and filtered list of rendered items,
         * use the value of the `indexAs` property.
         */itemsIndexAs:{type:String,value:'itemsIndex'},/**
         * A function that should determine the sort order of the items.  This
         * property should either be provided as a string, indicating a method
         * name on the element's host, or else be an actual function.  The
         * function should match the sort function passed to `Array.sort`.
         * Using a sort function has no effect on the underlying `items` array.
         */sort:{type:Function,observer:'__sortChanged'},/**
         * A function that can be used to filter items out of the view.  This
         * property should either be provided as a string, indicating a method
         * name on the element's host, or else be an actual function.  The
         * function should match the sort function passed to `Array.filter`.
         * Using a filter function has no effect on the underlying `items` array.
         */filter:{type:Function,observer:'__filterChanged'},/**
         * When using a `filter` or `sort` function, the `observe` property
         * should be set to a space-separated list of the names of item
         * sub-fields that should trigger a re-sort or re-filter when changed.
         * These should generally be fields of `item` that the sort or filter
         * function depends on.
         */observe:{type:String,observer:'__observeChanged'},/**
         * When using a `filter` or `sort` function, the `delay` property
         * determines a debounce time after a change to observed item
         * properties that must pass before the filter or sort is re-run.
         * This is useful in rate-limiting shuffing of the view when
         * item changes may be frequent.
         */delay:Number,/**
         * Count of currently rendered items after `filter` (if any) has been applied.
         * If "chunking mode" is enabled, `renderedItemCount` is updated each time a
         * set of template instances is rendered.
         *
         */renderedItemCount:{type:Number,notify:true,readOnly:true},/**
         * Defines an initial count of template instances to render after setting
         * the `items` array, before the next paint, and puts the `dom-repeat`
         * into "chunking mode".  The remaining items will be created and rendered
         * incrementally at each animation frame therof until all instances have
         * been rendered.
         */initialCount:{type:Number,observer:'__initializeChunking'},/**
         * When `initialCount` is used, this property defines a frame rate to
         * target by throttling the number of instances rendered each frame to
         * not exceed the budget for the target frame rate.  Setting this to a
         * higher number will allow lower latency and higher throughput for
         * things like event handlers, but will result in a longer time for the
         * remaining items to complete rendering.
         */targetFramerate:{type:Number,value:20},_targetFrameTime:{type:Number,computed:'__computeFrameTime(targetFramerate)'}};}},{key:"observers",get:function get(){return['__itemsChanged(items.*)'];}}]);function DomRepeat(){_classCallCheck(this,DomRepeat);var _this16=_possibleConstructorReturn(this,(DomRepeat.__proto__||Object.getPrototypeOf(DomRepeat)).call(this));_this16.__instances=[];_this16.__limit=Infinity;_this16.__pool=[];_this16.__renderDebouncer=null;_this16.__itemsIdxToInstIdx={};_this16.__chunkCount=null;_this16.__lastChunkTime=null;_this16.__needFullRefresh=false;_this16.__sortFn=null;_this16.__filterFn=null;_this16.__observePaths=null;_this16.__ctor=null;return _this16;}_createClass(DomRepeat,[{key:"disconnectedCallback",value:function disconnectedCallback(){_get(DomRepeat.prototype.__proto__||Object.getPrototypeOf(DomRepeat.prototype),"disconnectedCallback",this).call(this);this.__isDetached=true;for(var i=0;i<this.__instances.length;i++){this.__detachInstance(i);}}},{key:"connectedCallback",value:function connectedCallback(){_get(DomRepeat.prototype.__proto__||Object.getPrototypeOf(DomRepeat.prototype),"connectedCallback",this).call(this);// only perform attachment if the element was previously detached.
if(this.__isDetached){this.__isDetached=false;var parent=this.parentNode;for(var i=0;i<this.__instances.length;i++){this.__attachInstance(i,parent);}}}},{key:"__ensureTemplatized",value:function __ensureTemplatized(){var _this17=this;// Templatizing (generating the instance constructor) needs to wait
// until ready, since won't have its template content handed back to
// it until then
if(!this.__ctor){var template=this.template=this.querySelector('template');if(!template){// // Wait until childList changes and template should be there by then
var observer=new MutationObserver(function(){if(_this17.querySelector('template')){observer.disconnect();_this17.__render();}else{throw new Error('dom-repeat requires a <template> child');}});observer.observe(this,{childList:true});return false;}// Template instance props that should be excluded from forwarding
var instanceProps={};instanceProps[this.as]=true;instanceProps[this.indexAs]=true;instanceProps[this.itemsIndexAs]=true;this.__ctor=Polymer.Templatize.templatize(template,this,{mutableData:this.mutableData,parentModel:true,instanceProps:instanceProps,forwardHostProp:function forwardHostProp(prop,value){var i$=this.__instances;for(var i=0,inst;i<i$.length&&(inst=i$[i]);i++){inst.forwardHostProp(prop,value);}},notifyInstanceProp:function notifyInstanceProp(inst,prop,value){if(Polymer.Path.matches(this.as,prop)){var idx=inst[this.itemsIndexAs];if(prop==this.as){this.items[idx]=value;}var path=Polymer.Path.translate(this.as,'items.'+idx,prop);this.notifyPath(path,value);}}});}return true;}},{key:"__getMethodHost",value:function __getMethodHost(){// Technically this should be the owner of the outermost template.
// In shadow dom, this is always getRootNode().host, but we can
// approximate this via cooperation with our dataHost always setting
// `_methodHost` as long as there were bindings (or id's) on this
// instance causing it to get a dataHost.
return this.__dataHost._methodHost||this.__dataHost;}},{key:"__sortChanged",value:function __sortChanged(sort){var methodHost=this.__getMethodHost();this.__sortFn=sort&&(typeof sort=='function'?sort:function(){return methodHost[sort].apply(methodHost,arguments);});this.__needFullRefresh=true;if(this.items){this.__debounceRender(this.__render);}}},{key:"__filterChanged",value:function __filterChanged(filter){var methodHost=this.__getMethodHost();this.__filterFn=filter&&(typeof filter=='function'?filter:function(){return methodHost[filter].apply(methodHost,arguments);});this.__needFullRefresh=true;if(this.items){this.__debounceRender(this.__render);}}},{key:"__computeFrameTime",value:function __computeFrameTime(rate){return Math.ceil(1000/rate);}},{key:"__initializeChunking",value:function __initializeChunking(){if(this.initialCount){this.__limit=this.initialCount;this.__chunkCount=this.initialCount;this.__lastChunkTime=performance.now();}}},{key:"__tryRenderChunk",value:function __tryRenderChunk(){// Debounced so that multiple calls through `_render` between animation
// frames only queue one new rAF (e.g. array mutation & chunked render)
if(this.items&&this.__limit<this.items.length){this.__debounceRender(this.__requestRenderChunk);}}},{key:"__requestRenderChunk",value:function __requestRenderChunk(){var _this18=this;requestAnimationFrame(function(){return _this18.__renderChunk();});}},{key:"__renderChunk",value:function __renderChunk(){// Simple auto chunkSize throttling algorithm based on feedback loop:
// measure actual time between frames and scale chunk count by ratio
// of target/actual frame time
var currChunkTime=performance.now();var ratio=this._targetFrameTime/(currChunkTime-this.__lastChunkTime);this.__chunkCount=Math.round(this.__chunkCount*ratio)||1;this.__limit+=this.__chunkCount;this.__lastChunkTime=currChunkTime;this.__debounceRender(this.__render);}},{key:"__observeChanged",value:function __observeChanged(){this.__observePaths=this.observe&&this.observe.replace('.*','.').split(' ');}},{key:"__itemsChanged",value:function __itemsChanged(change){if(this.items&&!Array.isArray(this.items)){console.warn('dom-repeat expected array for `items`, found',this.items);}// If path was to an item (e.g. 'items.3' or 'items.3.foo'), forward the
// path to that instance synchronously (retuns false for non-item paths)
if(!this.__handleItemPath(change.path,change.value)){// Otherwise, the array was reset ('items') or spliced ('items.splices'),
// so queue a full refresh
this.__needFullRefresh=true;this.__initializeChunking();this.__debounceRender(this.__render);}}},{key:"__handleObservedPaths",value:function __handleObservedPaths(path){if(this.__observePaths){path=path.substring(path.indexOf('.')+1);var paths=this.__observePaths;for(var i=0;i<paths.length;i++){if(path.indexOf(paths[i])===0){this.__needFullRefresh=true;this.__debounceRender(this.__render,this.delay);return true;}}}}/**
     * @param {function()} fn Function to debounce.
     * @param {number=} delay Delay in ms to debounce by.
     */},{key:"__debounceRender",value:function __debounceRender(fn,delay){this.__renderDebouncer=Polymer.Debouncer.debounce(this.__renderDebouncer,delay>0?Polymer.Async.timeOut.after(delay):Polymer.Async.microTask,fn.bind(this));Polymer.enqueueDebouncer(this.__renderDebouncer);}/**
     * Forces the element to render its content. Normally rendering is
     * asynchronous to a provoking change. This is done for efficiency so
     * that multiple changes trigger only a single render. The render method
     * should be called if, for example, template rendering is required to
     * validate application state.
     */},{key:"render",value:function render(){// Queue this repeater, then flush all in order
this.__needFullRefresh=true;this.__debounceRender(this.__render);Polymer.flush();}},{key:"__render",value:function __render(){if(!this.__ensureTemplatized()){// No template found yet
return;}this.__applyFullRefresh();// Reset the pool
// TODO(kschaaf): Reuse pool across turns and nested templates
// Now that objects/arrays are re-evaluated when set, we can safely
// reuse pooled instances across turns, however we still need to decide
// semantics regarding how long to hold, how many to hold, etc.
this.__pool.length=0;// Set rendered item count
this._setRenderedItemCount(this.__instances.length);// Notify users
this.dispatchEvent(new CustomEvent('dom-change',{bubbles:true,composed:true}));// Check to see if we need to render more items
this.__tryRenderChunk();}},{key:"__applyFullRefresh",value:function __applyFullRefresh(){var _this19=this;var items=this.items||[];var isntIdxToItemsIdx=new Array(items.length);for(var i=0;i<items.length;i++){isntIdxToItemsIdx[i]=i;}// Apply user filter
if(this.__filterFn){isntIdxToItemsIdx=isntIdxToItemsIdx.filter(function(i,idx,array){return _this19.__filterFn(items[i],idx,array);});}// Apply user sort
if(this.__sortFn){isntIdxToItemsIdx.sort(function(a,b){return _this19.__sortFn(items[a],items[b]);});}// items->inst map kept for item path forwarding
var itemsIdxToInstIdx=this.__itemsIdxToInstIdx={};var instIdx=0;// Generate instances and assign items
var limit=Math.min(isntIdxToItemsIdx.length,this.__limit);for(;instIdx<limit;instIdx++){var inst=this.__instances[instIdx];var itemIdx=isntIdxToItemsIdx[instIdx];var item=items[itemIdx];itemsIdxToInstIdx[itemIdx]=instIdx;if(inst&&instIdx<this.__limit){inst._setPendingProperty(this.as,item);inst._setPendingProperty(this.indexAs,instIdx);inst._setPendingProperty(this.itemsIndexAs,itemIdx);inst._flushProperties();}else{this.__insertInstance(item,instIdx,itemIdx);}}// Remove any extra instances from previous state
for(var _i3=this.__instances.length-1;_i3>=instIdx;_i3--){this.__detachAndRemoveInstance(_i3);}}},{key:"__detachInstance",value:function __detachInstance(idx){var inst=this.__instances[idx];for(var i=0;i<inst.children.length;i++){var el=inst.children[i];inst.root.appendChild(el);}return inst;}},{key:"__attachInstance",value:function __attachInstance(idx,parent){var inst=this.__instances[idx];parent.insertBefore(inst.root,this);}},{key:"__detachAndRemoveInstance",value:function __detachAndRemoveInstance(idx){var inst=this.__detachInstance(idx);if(inst){this.__pool.push(inst);}this.__instances.splice(idx,1);}},{key:"__stampInstance",value:function __stampInstance(item,instIdx,itemIdx){var model={};model[this.as]=item;model[this.indexAs]=instIdx;model[this.itemsIndexAs]=itemIdx;return new this.__ctor(model);}},{key:"__insertInstance",value:function __insertInstance(item,instIdx,itemIdx){var inst=this.__pool.pop();if(inst){// TODO(kschaaf): If the pool is shared across turns, hostProps
// need to be re-set to reused instances in addition to item
inst._setPendingProperty(this.as,item);inst._setPendingProperty(this.indexAs,instIdx);inst._setPendingProperty(this.itemsIndexAs,itemIdx);inst._flushProperties();}else{inst=this.__stampInstance(item,instIdx,itemIdx);}var beforeRow=this.__instances[instIdx+1];var beforeNode=beforeRow?beforeRow.children[0]:this;this.parentNode.insertBefore(inst.root,beforeNode);this.__instances[instIdx]=inst;return inst;}// Implements extension point from Templatize mixin
},{key:"_showHideChildren",value:function _showHideChildren(hidden){for(var i=0;i<this.__instances.length;i++){this.__instances[i]._showHideChildren(hidden);}}// Called as a side effect of a host items.<key>.<path> path change,
// responsible for notifying item.<path> changes to inst for key
},{key:"__handleItemPath",value:function __handleItemPath(path,value){var itemsPath=path.slice(6);// 'items.'.length == 6
var dot=itemsPath.indexOf('.');var itemsIdx=dot<0?itemsPath:itemsPath.substring(0,dot);// If path was index into array...
if(itemsIdx==parseInt(itemsIdx,10)){var itemSubPath=dot<0?'':itemsPath.substring(dot+1);// See if the item subpath should trigger a full refresh...
if(!this.__handleObservedPaths(itemSubPath)){// If not, forward to the instance for that index
var instIdx=this.__itemsIdxToInstIdx[itemsIdx];var inst=this.__instances[instIdx];if(inst){var itemPath=this.as+(itemSubPath?'.'+itemSubPath:'');// This is effectively `notifyPath`, but avoids some of the overhead
// of the public API
inst._setPendingPropertyOrPath(itemPath,value,false,true);inst._flushProperties();}}return true;}}/**
     * Returns the item associated with a given element stamped by
     * this `dom-repeat`.
     *
     * Note, to modify sub-properties of the item,
     * `modelForElement(el).set('item.<sub-prop>', value)`
     * should be used.
     *
     * @param {HTMLElement} el Element for which to return the item.
     * @return {*} Item associated with the element.
     */},{key:"itemForElement",value:function itemForElement(el){var instance=this.modelForElement(el);return instance&&instance[this.as];}/**
     * Returns the inst index for a given element stamped by this `dom-repeat`.
     * If `sort` is provided, the index will reflect the sorted order (rather
     * than the original array order).
     *
     * @param {HTMLElement} el Element for which to return the index.
     * @return {*} Row index associated with the element (note this may
     *   not correspond to the array index if a user `sort` is applied).
     */},{key:"indexForElement",value:function indexForElement(el){var instance=this.modelForElement(el);return instance&&instance[this.indexAs];}/**
     * Returns the template "model" associated with a given element, which
     * serves as the binding scope for the template instance the element is
     * contained in. A template model is an instance of `Polymer.Base`, and
     * should be used to manipulate data associated with this template instance.
     *
     * Example:
     *
     *   let model = modelForElement(el);
     *   if (model.index < 10) {
     *     model.set('item.checked', true);
     *   }
     *
     * @param {HTMLElement} el Element for which to return a template model.
     * @return {TemplateInstanceBase} Model representing the binding scope for
     *   the element.
     */},{key:"modelForElement",value:function modelForElement(el){return Polymer.Templatize.modelForElement(this.template,el);}}]);return DomRepeat;}(domRepeatBase);customElements.define(DomRepeat.is,DomRepeat);Polymer.DomRepeat=DomRepeat;})();(function(){/*

Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/'use strict';var k={};function n(){this.end=this.start=0;this.rules=this.parent=this.previous=null;this.cssText=this.parsedCssText="";this.atRule=!1;this.type=0;this.parsedSelector=this.selector=this.keyframesName="";}function p(a){a=a.replace(aa,"").replace(ba,"");var b=q,c=a,d=new n();d.start=0;d.end=c.length;for(var e=d,f=0,h=c.length;f<h;f++){if("{"===c[f]){e.rules||(e.rules=[]);var g=e,m=g.rules[g.rules.length-1]||null,e=new n();e.start=f+1;e.parent=g;e.previous=m;g.rules.push(e);}else"}"===c[f]&&(e.end=f+1,e=e.parent||d);}return b(d,a);}function q(a,b){var c=b.substring(a.start,a.end-1);a.parsedCssText=a.cssText=c.trim();a.parent&&((c=b.substring(a.previous?a.previous.end:a.parent.start,a.start-1),c=ca(c),c=c.replace(r," "),c=c.substring(c.lastIndexOf(";")+1),c=a.parsedSelector=a.selector=c.trim(),a.atRule=!c.indexOf("@"),a.atRule)?c.indexOf("@media")?c.match(da)&&(a.type=u,a.keyframesName=a.selector.split(r).pop()):a.type=t:a.type=c.indexOf("--")?v:x);if(c=a.rules)for(var d=0,e=c.length,f;d<e&&(f=c[d]);d++){q(f,b);}return a;}function ca(a){return a.replace(/\\([0-9a-f]{1,6})\s/gi,function(a,c){a=c;for(c=6-a.length;c--;){a="0"+a;}return"\\"+a;});}function y(a,b,c){c=void 0===c?"":c;var d="";if(a.cssText||a.rules){var e=a.rules,f;if(f=e)f=e[0],f=!(f&&f.selector&&0===f.selector.indexOf("--"));if(f){f=0;for(var h=e.length,g;f<h&&(g=e[f]);f++){d=y(g,b,d);}}else b?b=a.cssText:(b=a.cssText,b=b.replace(ea,"").replace(fa,""),b=b.replace(ga,"").replace(ha,"")),(d=b.trim())&&(d="  "+d+"\n");}d&&(a.selector&&(c+=a.selector+" {\n"),c+=d,a.selector&&(c+="}\n\n"));return c;}var v=1,u=7,t=4,x=1E3,aa=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim,ba=/@import[^;]*;/gim,ea=/(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim,fa=/(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim,ga=/@apply\s*\(?[^);]*\)?\s*(?:[;\n]|$)?/gim,ha=/[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim,da=/^@[^\s]*keyframes/,r=/\s+/g;var ia=Promise.resolve();function ja(a){if(a=k[a])a._applyShimCurrentVersion=a._applyShimCurrentVersion||0,a._applyShimValidatingVersion=a._applyShimValidatingVersion||0,a._applyShimNextVersion=(a._applyShimNextVersion||0)+1;}function z(a){return a._applyShimCurrentVersion===a._applyShimNextVersion;}function ka(a){a._applyShimValidatingVersion=a._applyShimNextVersion;a.a||(a.a=!0,ia.then(function(){a._applyShimCurrentVersion=a._applyShimNextVersion;a.a=!1;}));};var A=/(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};{])+)|\{([^\}]*)\}(?:(?=[;\s}])|$))/gi,B=/(?:^|\W+)@apply\s*\(?([^);\n]*)\)?/gi,la=/@media[^(]*(\([^)]*\))/;var C=!(window.ShadyDOM&&window.ShadyDOM.inUse),E;function F(a){E=a&&a.shimcssproperties?!1:C||!(navigator.userAgent.match("AppleWebKit/601")||!window.CSS||!CSS.supports||!CSS.supports("box-shadow","0 0 0 var(--foo)"));}window.ShadyCSS&&void 0!==window.ShadyCSS.nativeCss?E=window.ShadyCSS.nativeCss:window.ShadyCSS?(F(window.ShadyCSS),window.ShadyCSS=void 0):F(window.WebComponents&&window.WebComponents.flags);var G=E;function H(a){if(!a)return"";"string"===typeof a&&(a=p(a));return y(a,G);}function I(a){!a.__cssRules&&a.textContent&&(a.__cssRules=p(a.textContent));return a.__cssRules||null;}function J(a,b,c,d){if(a){var e=!1,f=a.type;if(d&&f===t){var h=a.selector.match(la);h&&(window.matchMedia(h[1]).matches||(e=!0));}f===v?b(a):c&&f===u?c(a):f===x&&(e=!0);if((a=a.rules)&&!e)for(var e=0,f=a.length,g;e<f&&(g=a[e]);e++){J(g,b,c,d);}}}function K(a,b){var c=a.indexOf("var(");if(-1===c)return b(a,"","","");a:{var d=0;var e=c+3;for(var f=a.length;e<f;e++){if("("===a[e])d++;else if(")"===a[e]&&! --d)break a;}e=-1;}d=a.substring(c+4,e);c=a.substring(0,c);a=K(a.substring(e+1),b);e=d.indexOf(",");return-1===e?b(c,d.trim(),"",a):b(c,d.substring(0,e).trim(),d.substring(e+1).trim(),a);};var ma=/;\s*/m,na=/^\s*(initial)|(inherit)\s*$/;function L(){this.a={};}L.prototype.set=function(a,b){a=a.trim();this.a[a]={h:b,i:{}};};L.prototype.get=function(a){a=a.trim();return this.a[a]||null;};var M=null;function N(){this.b=this.c=null;this.a=new L();}N.prototype.o=function(a){a=B.test(a)||A.test(a);B.lastIndex=0;A.lastIndex=0;return a;};N.prototype.m=function(a,b){a=a.content.querySelector("style");var c=null;a&&(c=this.j(a,b));return c;};N.prototype.j=function(a,b){b=void 0===b?"":b;var c=I(a);this.l(c,b);a.textContent=H(c);return c;};N.prototype.f=function(a){var b=this,c=I(a);J(c,function(a){":root"===a.selector&&(a.selector="html");b.g(a);});a.textContent=H(c);return c;};N.prototype.l=function(a,b){var c=this;this.c=b;J(a,function(a){c.g(a);});this.c=null;};N.prototype.g=function(a){a.cssText=oa(this,a.parsedCssText);":root"===a.selector&&(a.selector=":host > *");};function oa(a,b){b=b.replace(A,function(b,d,e,f){return pa(a,b,d,e,f);});return O(a,b);}function O(a,b){for(var c;c=B.exec(b);){var d=c[0],e=c[1];c=c.index;var f=b.slice(0,c+d.indexOf("@apply"));b=b.slice(c+d.length);var h=P(a,f),d=void 0;var g=a;var e=e.replace(ma,""),m=[];var l=g.a.get(e);l||(g.a.set(e,{}),l=g.a.get(e));if(l)for(d in g.c&&(l.i[g.c]=!0),l.h){g=h&&h[d],l=[d,": var(",e,"_-_",d],g&&l.push(",",g),l.push(")"),m.push(l.join(""));}d=m.join("; ");b=""+f+d+b;B.lastIndex=c+d.length;}return b;}function P(a,b){b=b.split(";");for(var c,d,e={},f=0,h;f<b.length;f++){if(c=b[f])if(h=c.split(":"),1<h.length){c=h[0].trim();var g=a;d=c;h=h.slice(1).join(":");var m=na.exec(h);m&&(m[1]?(g.b||(g.b=document.createElement("meta"),g.b.setAttribute("apply-shim-measure",""),g.b.style.all="initial",document.head.appendChild(g.b)),d=window.getComputedStyle(g.b).getPropertyValue(d)):d="apply-shim-inherit",h=d);d=h;e[c]=d;}}return e;}function qa(a,b){if(M)for(var c in b.i){c!==a.c&&M(c);}}function pa(a,b,c,d,e){d&&K(d,function(b,c){c&&a.a.get(c)&&(e="@apply "+c+";");});if(!e)return b;var f=O(a,e),h=b.slice(0,b.indexOf("--")),g=f=P(a,f),m=a.a.get(c),l=m&&m.h;l?g=Object.assign(Object.create(l),f):a.a.set(c,g);var X=[],w,Y=!1;for(w in g){var D=f[w];void 0===D&&(D="initial");!l||w in l||(Y=!0);X.push(""+c+"_-_"+w+": "+D);}Y&&qa(a,m);m&&(m.h=g);d&&(h=b+";"+h);return""+h+X.join("; ")+";";}N.prototype.detectMixin=N.prototype.o;N.prototype.transformStyle=N.prototype.j;N.prototype.transformCustomStyle=N.prototype.f;N.prototype.transformRules=N.prototype.l;N.prototype.transformRule=N.prototype.g;N.prototype.transformTemplate=N.prototype.m;N.prototype._separator="_-_";Object.defineProperty(N.prototype,"invalidCallback",{get:function get(){return M;},set:function set(a){M=a;}});var Q=null,R=window.HTMLImports&&window.HTMLImports.whenReady||null,S;function ra(a){requestAnimationFrame(function(){R?R(a):(Q||(Q=new Promise(function(a){S=a;}),"complete"===document.readyState?S():document.addEventListener("readystatechange",function(){"complete"===document.readyState&&S();})),Q.then(function(){a&&a();}));});};var T=new N();function U(){var a=this;this.a=null;ra(function(){V(a);});T.invalidCallback=ja;}function V(a){a.a||(a.a=window.ShadyCSS.CustomStyleInterface,a.a&&(a.a.transformCallback=function(a){T.f(a);},a.a.validateCallback=function(){requestAnimationFrame(function(){a.a.enqueued&&W(a);});}));}U.prototype.prepareTemplate=function(a,b){V(this);k[b]=a;b=T.m(a,b);a._styleAst=b;};function W(a){V(a);if(a.a){var b=a.a.processStyles();if(a.a.enqueued){for(var c=0;c<b.length;c++){var d=a.a.getStyleForCustomStyle(b[c]);d&&T.f(d);}a.a.enqueued=!1;}}}U.prototype.styleSubtree=function(a,b){V(this);if(b)for(var c in b){null===c?a.style.removeProperty(c):a.style.setProperty(c,b[c]);}if(a.shadowRoot)for(this.styleElement(a),a=a.shadowRoot.children||a.shadowRoot.childNodes,b=0;b<a.length;b++){this.styleSubtree(a[b]);}else for(a=a.children||a.childNodes,b=0;b<a.length;b++){this.styleSubtree(a[b]);}};U.prototype.styleElement=function(a){V(this);var b=a.localName,c;b?-1<b.indexOf("-")?c=b:c=a.getAttribute&&a.getAttribute("is")||"":c=a.is;if((b=k[c])&&!z(b)){if(z(b)||b._applyShimValidatingVersion!==b._applyShimNextVersion)this.prepareTemplate(b,c),ka(b);if(a=a.shadowRoot)if(a=a.querySelector("style"))a.__cssRules=b._styleAst,a.textContent=H(b._styleAst);}};U.prototype.styleDocument=function(a){V(this);this.styleSubtree(document.body,a);};if(!window.ShadyCSS||!window.ShadyCSS.ScopingShim){var Z=new U(),sa=window.ShadyCSS&&window.ShadyCSS.CustomStyleInterface;window.ShadyCSS={prepareTemplate:function prepareTemplate(a,b){W(Z);Z.prepareTemplate(a,b);},styleSubtree:function styleSubtree(a,b){W(Z);Z.styleSubtree(a,b);},styleElement:function styleElement(a){W(Z);Z.styleElement(a);},styleDocument:function styleDocument(a){W(Z);Z.styleDocument(a);},getComputedStyleValue:function getComputedStyleValue(a,b){return(a=window.getComputedStyle(a).getPropertyValue(b))?a.trim():"";},nativeCss:G,nativeShadow:C};sa&&(window.ShadyCSS.CustomStyleInterface=sa);}window.ShadyCSS.ApplyShim=T;}).call(undefined);//# sourceMappingURL=apply-shim.min.js.map
(function(){'use strict';// detect native touch action support
var HAS_NATIVE_TA=typeof document.head.style.touchAction==='string';var GESTURE_KEY='__polymerGestures';var HANDLED_OBJ='__polymerGesturesHandled';var TOUCH_ACTION='__polymerGesturesTouchAction';// radius for tap and track
var TAP_DISTANCE=25;var TRACK_DISTANCE=5;// number of last N track positions to keep
var TRACK_LENGTH=2;// Disabling "mouse" handlers for 2500ms is enough
var MOUSE_TIMEOUT=2500;var MOUSE_EVENTS=['mousedown','mousemove','mouseup','click'];// an array of bitmask values for mapping MouseEvent.which to MouseEvent.buttons
var MOUSE_WHICH_TO_BUTTONS=[0,1,4,2];var MOUSE_HAS_BUTTONS=function(){try{return new MouseEvent('test',{buttons:1}).buttons===1;}catch(e){return false;}}();/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */// check for passive event listeners
var SUPPORTS_PASSIVE=false;(function(){try{var opts=Object.defineProperty({},'passive',{get:function get(){SUPPORTS_PASSIVE=true;}});window.addEventListener('test',null,opts);window.removeEventListener('test',null,opts);}catch(e){}})();// Check for touch-only devices
var IS_TOUCH_ONLY=navigator.userAgent.match(/iP(?:[oa]d|hone)|Android/);// touch will make synthetic mouse events
// `preventDefault` on touchend will cancel them,
// but this breaks `<input>` focus and link clicks
// disable mouse handlers for MOUSE_TIMEOUT ms after
// a touchend to ignore synthetic mouse events
var mouseCanceller=function mouseCanceller(mouseEvent){// Check for sourceCapabilities, used to distinguish synthetic events
// if mouseEvent did not come from a device that fires touch events,
// it was made by a real mouse and should be counted
// http://wicg.github.io/InputDeviceCapabilities/#dom-inputdevicecapabilities-firestouchevents
var sc=mouseEvent.sourceCapabilities;if(sc&&!sc.firesTouchEvents){return;}// skip synthetic mouse events
mouseEvent[HANDLED_OBJ]={skip:true};// disable "ghost clicks"
if(mouseEvent.type==='click'){var path=mouseEvent.composedPath&&mouseEvent.composedPath();if(path){for(var i=0;i<path.length;i++){if(path[i]===POINTERSTATE.mouse.target){return;}}}mouseEvent.preventDefault();mouseEvent.stopPropagation();}};/**
   * @param {boolean=} setup True to add, false to remove.
   */function setupTeardownMouseCanceller(setup){var events=IS_TOUCH_ONLY?['click']:MOUSE_EVENTS;for(var i=0,en;i<events.length;i++){en=events[i];if(setup){document.addEventListener(en,mouseCanceller,true);}else{document.removeEventListener(en,mouseCanceller,true);}}}function ignoreMouse(e){if(!POINTERSTATE.mouse.mouseIgnoreJob){setupTeardownMouseCanceller(true);}var unset=function unset(){setupTeardownMouseCanceller();POINTERSTATE.mouse.target=null;POINTERSTATE.mouse.mouseIgnoreJob=null;};POINTERSTATE.mouse.target=e.composedPath()[0];POINTERSTATE.mouse.mouseIgnoreJob=Polymer.Debouncer.debounce(POINTERSTATE.mouse.mouseIgnoreJob,Polymer.Async.timeOut.after(MOUSE_TIMEOUT),unset);}function hasLeftMouseButton(ev){var type=ev.type;// exit early if the event is not a mouse event
if(MOUSE_EVENTS.indexOf(type)===-1){return false;}// ev.button is not reliable for mousemove (0 is overloaded as both left button and no buttons)
// instead we use ev.buttons (bitmask of buttons) or fall back to ev.which (deprecated, 0 for no buttons, 1 for left button)
if(type==='mousemove'){// allow undefined for testing events
var buttons=ev.buttons===undefined?1:ev.buttons;if(ev instanceof window.MouseEvent&&!MOUSE_HAS_BUTTONS){buttons=MOUSE_WHICH_TO_BUTTONS[ev.which]||0;}// buttons is a bitmask, check that the left button bit is set (1)
return Boolean(buttons&1);}else{// allow undefined for testing events
var button=ev.button===undefined?0:ev.button;// ev.button is 0 in mousedown/mouseup/click for left button activation
return button===0;}}function isSyntheticClick(ev){if(ev.type==='click'){// ev.detail is 0 for HTMLElement.click in most browsers
if(ev.detail===0){return true;}// in the worst case, check that the x/y position of the click is within
// the bounding box of the target of the event
// Thanks IE 10 >:(
var t=Gestures._findOriginalTarget(ev);// make sure the target of the event is an element so we can use getBoundingClientRect,
// if not, just assume it is a synthetic click
if(t.nodeType!==Node.ELEMENT_NODE){return true;}var bcr=t.getBoundingClientRect();// use page x/y to account for scrolling
var x=ev.pageX,y=ev.pageY;// ev is a synthetic click if the position is outside the bounding box of the target
return!(x>=bcr.left&&x<=bcr.right&&y>=bcr.top&&y<=bcr.bottom);}return false;}var POINTERSTATE={mouse:{target:null,mouseIgnoreJob:null},touch:{x:0,y:0,id:-1,scrollDecided:false}};function firstTouchAction(ev){var ta='auto';var path=ev.composedPath&&ev.composedPath();if(path){for(var i=0,n;i<path.length;i++){n=path[i];if(n[TOUCH_ACTION]){ta=n[TOUCH_ACTION];break;}}}return ta;}function trackDocument(stateObj,movefn,upfn){stateObj.movefn=movefn;stateObj.upfn=upfn;document.addEventListener('mousemove',movefn);document.addEventListener('mouseup',upfn);}function untrackDocument(stateObj){document.removeEventListener('mousemove',stateObj.movefn);document.removeEventListener('mouseup',stateObj.upfn);stateObj.movefn=null;stateObj.upfn=null;}// use a document-wide touchend listener to start the ghost-click prevention mechanism
// Use passive event listeners, if supported, to not affect scrolling performance
document.addEventListener('touchend',ignoreMouse,SUPPORTS_PASSIVE?{passive:true}:false);/**
   * Module for adding listeners to a node for the following normalized
   * cross-platform "gesture" events:
   * - `down` - mouse or touch went down
   * - `up` - mouse or touch went up
   * - `tap` - mouse click or finger tap
   * - `track` - mouse drag or touch move
   *
   * @namespace
   * @memberof Polymer
   * @summary Module for adding cross-platform gesture event listeners.
   */var Gestures={gestures:{},recognizers:[],/**
     * Finds the element rendered on the screen at the provided coordinates.
     *
     * Similar to `document.elementFromPoint`, but pierces through
     * shadow roots.
     *
     * @memberof Polymer.Gestures
     * @param {number} x Horizontal pixel coordinate
     * @param {number} y Vertical pixel coordinate
     * @return {HTMLElement} Returns the deepest shadowRoot inclusive element
     * found at the screen position given.
     */deepTargetFind:function deepTargetFind(x,y){var node=document.elementFromPoint(x,y);var next=node;// this code path is only taken when native ShadowDOM is used
// if there is a shadowroot, it may have a node at x/y
// if there is not a shadowroot, exit the loop
while(next&&next.shadowRoot&&!window.ShadyDOM){// if there is a node at x/y in the shadowroot, look deeper
var oldNext=next;next=next.shadowRoot.elementFromPoint(x,y);// on Safari, elementFromPoint may return the shadowRoot host
if(oldNext===next){break;}if(next){node=next;}}return node;},/**
     * a cheaper check than ev.composedPath()[0];
     *
     * @private
     * @param {Event} ev Event.
     * @return {HTMLElement} Returns the event target.
     */_findOriginalTarget:function _findOriginalTarget(ev){// shadowdom
if(ev.composedPath){return ev.composedPath()[0];}// shadydom
return ev.target;},/**
     * @private
     * @param {Event} ev Event.
     */_handleNative:function _handleNative(ev){var handled=void 0;var type=ev.type;var node=ev.currentTarget;var gobj=node[GESTURE_KEY];if(!gobj){return;}var gs=gobj[type];if(!gs){return;}if(!ev[HANDLED_OBJ]){ev[HANDLED_OBJ]={};if(type.slice(0,5)==='touch'){var t=ev.changedTouches[0];if(type==='touchstart'){// only handle the first finger
if(ev.touches.length===1){POINTERSTATE.touch.id=t.identifier;}}if(POINTERSTATE.touch.id!==t.identifier){return;}if(!HAS_NATIVE_TA){if(type==='touchstart'||type==='touchmove'){Gestures._handleTouchAction(ev);}}}}handled=ev[HANDLED_OBJ];// used to ignore synthetic mouse events
if(handled.skip){return;}var recognizers=Gestures.recognizers;// reset recognizer state
for(var i=0,r;i<recognizers.length;i++){r=recognizers[i];if(gs[r.name]&&!handled[r.name]){if(r.flow&&r.flow.start.indexOf(ev.type)>-1&&r.reset){r.reset();}}}// enforce gesture recognizer order
for(var _i4=0,_r;_i4<recognizers.length;_i4++){_r=recognizers[_i4];if(gs[_r.name]&&!handled[_r.name]){handled[_r.name]=true;_r[type](ev);}}},/**
     * @private
     * @param {Event} ev Event.
     */_handleTouchAction:function _handleTouchAction(ev){var t=ev.changedTouches[0];var type=ev.type;if(type==='touchstart'){POINTERSTATE.touch.x=t.clientX;POINTERSTATE.touch.y=t.clientY;POINTERSTATE.touch.scrollDecided=false;}else if(type==='touchmove'){if(POINTERSTATE.touch.scrollDecided){return;}POINTERSTATE.touch.scrollDecided=true;var ta=firstTouchAction(ev);var prevent=false;var dx=Math.abs(POINTERSTATE.touch.x-t.clientX);var dy=Math.abs(POINTERSTATE.touch.y-t.clientY);if(!ev.cancelable){// scrolling is happening
}else if(ta==='none'){prevent=true;}else if(ta==='pan-x'){prevent=dy>dx;}else if(ta==='pan-y'){prevent=dx>dy;}if(prevent){ev.preventDefault();}else{Gestures.prevent('track');}}},/**
     * Adds an event listener to a node for the given gesture type.
     *
     * @memberof Polymer.Gestures
     * @param {Node} node Node to add listener on
     * @param {string} evType Gesture type: `down`, `up`, `track`, or `tap`
     * @param {Function} handler Event listener function to call
     * @return {boolean} Returns true if a gesture event listener was added.
     */addListener:function addListener(node,evType,handler){if(this.gestures[evType]){this._add(node,evType,handler);return true;}},/**
     * Removes an event listener from a node for the given gesture type.
     *
     * @memberof Polymer.Gestures
     * @param {Node} node Node to remove listener from
     * @param {string} evType Gesture type: `down`, `up`, `track`, or `tap`
     * @param {Function} handler Event listener function previously passed to
     *  `addListener`.
     * @return {boolean} Returns true if a gesture event listener was removed.
     */removeListener:function removeListener(node,evType,handler){if(this.gestures[evType]){this._remove(node,evType,handler);return true;}},/**
     * automate the event listeners for the native events
     *
     * @private
     * @param {HTMLElement} node Node on which to add the event.
     * @param {string} evType Event type to add.
     * @param {function} handler Event handler function.
     */_add:function _add(node,evType,handler){var recognizer=this.gestures[evType];var deps=recognizer.deps;var name=recognizer.name;var gobj=node[GESTURE_KEY];if(!gobj){node[GESTURE_KEY]=gobj={};}for(var i=0,dep,gd;i<deps.length;i++){dep=deps[i];// don't add mouse handlers on iOS because they cause gray selection overlays
if(IS_TOUCH_ONLY&&MOUSE_EVENTS.indexOf(dep)>-1&&dep!=='click'){continue;}gd=gobj[dep];if(!gd){gobj[dep]=gd={_count:0};}if(gd._count===0){node.addEventListener(dep,this._handleNative);}gd[name]=(gd[name]||0)+1;gd._count=(gd._count||0)+1;}node.addEventListener(evType,handler);if(recognizer.touchAction){this.setTouchAction(node,recognizer.touchAction);}},/**
     * automate event listener removal for native events
     *
     * @private
     * @param {HTMLElement} node Node on which to remove the event.
     * @param {string} evType Event type to remove.
     * @param {function} handler Event handler function.
     */_remove:function _remove(node,evType,handler){var recognizer=this.gestures[evType];var deps=recognizer.deps;var name=recognizer.name;var gobj=node[GESTURE_KEY];if(gobj){for(var i=0,dep,gd;i<deps.length;i++){dep=deps[i];gd=gobj[dep];if(gd&&gd[name]){gd[name]=(gd[name]||1)-1;gd._count=(gd._count||1)-1;if(gd._count===0){node.removeEventListener(dep,this._handleNative);}}}}node.removeEventListener(evType,handler);},/**
     * Registers a new gesture event recognizer for adding new custom
     * gesture event types.
     *
     * @memberof Polymer.Gestures
     * @param {Object} recog Gesture recognizer descriptor
     */register:function register(recog){this.recognizers.push(recog);for(var i=0;i<recog.emits.length;i++){this.gestures[recog.emits[i]]=recog;}},/**
     * @private
     * @param {string} evName Event name.
     * @return {Object} Returns the gesture for the given event name.
     */_findRecognizerByEvent:function _findRecognizerByEvent(evName){for(var i=0,r;i<this.recognizers.length;i++){r=this.recognizers[i];for(var j=0,n;j<r.emits.length;j++){n=r.emits[j];if(n===evName){return r;}}}return null;},/**
     * Sets scrolling direction on node.
     *
     * This value is checked on first move, thus it should be called prior to
     * adding event listeners.
     *
     * @memberof Polymer.Gestures
     * @param {Node} node Node to set touch action setting on
     * @param {string} value Touch action value
     */setTouchAction:function setTouchAction(node,value){if(HAS_NATIVE_TA){node.style.touchAction=value;}node[TOUCH_ACTION]=value;},/**
     * Dispatches an event on the `target` element of `type` with the given
     * `detail`.
     * @private
     * @param {HTMLElement} target The element on which to fire an event.
     * @param {string} type The type of event to fire.
     * @param {Object=} detail The detail object to populate on the event.
     */_fire:function _fire(target,type,detail){var ev=new Event(type,{bubbles:true,cancelable:true,composed:true});ev.detail=detail;target.dispatchEvent(ev);// forward `preventDefault` in a clean way
if(ev.defaultPrevented){var preventer=detail.preventer||detail.sourceEvent;if(preventer&&preventer.preventDefault){preventer.preventDefault();}}},/**
     * Prevents the dispatch and default action of the given event name.
     *
     * @memberof Polymer.Gestures
     * @param {string} evName Event name.
     */prevent:function prevent(evName){var recognizer=this._findRecognizerByEvent(evName);if(recognizer.info){recognizer.info.prevent=true;}},/**
     * Reset the 2500ms timeout on processing mouse input after detecting touch input.
     *
     * Touch inputs create synthesized mouse inputs anywhere from 0 to 2000ms after the touch.
     * This method should only be called during testing with simulated touch inputs.
     * Calling this method in production may cause duplicate taps or other Gestures.
     *
     * @memberof Polymer.Gestures
     */resetMouseCanceller:function resetMouseCanceller(){if(POINTERSTATE.mouse.mouseIgnoreJob){POINTERSTATE.mouse.mouseIgnoreJob.flush();}}};Gestures.register({name:'downup',deps:['mousedown','touchstart','touchend'],flow:{start:['mousedown','touchstart'],end:['mouseup','touchend']},emits:['down','up'],info:{movefn:null,upfn:null},reset:function reset(){untrackDocument(this.info);},mousedown:function mousedown(e){if(!hasLeftMouseButton(e)){return;}var t=Gestures._findOriginalTarget(e);var self=this;var movefn=function movefn(e){if(!hasLeftMouseButton(e)){self._fire('up',t,e);untrackDocument(self.info);}};var upfn=function upfn(e){if(hasLeftMouseButton(e)){self._fire('up',t,e);}untrackDocument(self.info);};trackDocument(this.info,movefn,upfn);this._fire('down',t,e);},touchstart:function touchstart(e){this._fire('down',Gestures._findOriginalTarget(e),e.changedTouches[0],e);},touchend:function touchend(e){this._fire('up',Gestures._findOriginalTarget(e),e.changedTouches[0],e);},_fire:function _fire(type,target,event,preventer){Gestures._fire(target,type,{x:event.clientX,y:event.clientY,sourceEvent:event,preventer:preventer,prevent:function prevent(e){return Gestures.prevent(e);}});}});Gestures.register({name:'track',touchAction:'none',deps:['mousedown','touchstart','touchmove','touchend'],flow:{start:['mousedown','touchstart'],end:['mouseup','touchend']},emits:['track'],info:{x:0,y:0,state:'start',started:false,moves:[],addMove:function addMove(move){if(this.moves.length>TRACK_LENGTH){this.moves.shift();}this.moves.push(move);},movefn:null,upfn:null,prevent:false},reset:function reset(){this.info.state='start';this.info.started=false;this.info.moves=[];this.info.x=0;this.info.y=0;this.info.prevent=false;untrackDocument(this.info);},hasMovedEnough:function hasMovedEnough(x,y){if(this.info.prevent){return false;}if(this.info.started){return true;}var dx=Math.abs(this.info.x-x);var dy=Math.abs(this.info.y-y);return dx>=TRACK_DISTANCE||dy>=TRACK_DISTANCE;},mousedown:function mousedown(e){if(!hasLeftMouseButton(e)){return;}var t=Gestures._findOriginalTarget(e);var self=this;var movefn=function movefn(e){var x=e.clientX,y=e.clientY;if(self.hasMovedEnough(x,y)){// first move is 'start', subsequent moves are 'move', mouseup is 'end'
self.info.state=self.info.started?e.type==='mouseup'?'end':'track':'start';if(self.info.state==='start'){// if and only if tracking, always prevent tap
Gestures.prevent('tap');}self.info.addMove({x:x,y:y});if(!hasLeftMouseButton(e)){// always _fire "end"
self.info.state='end';untrackDocument(self.info);}self._fire(t,e);self.info.started=true;}};var upfn=function upfn(e){if(self.info.started){movefn(e);}// remove the temporary listeners
untrackDocument(self.info);};// add temporary document listeners as mouse retargets
trackDocument(this.info,movefn,upfn);this.info.x=e.clientX;this.info.y=e.clientY;},touchstart:function touchstart(e){var ct=e.changedTouches[0];this.info.x=ct.clientX;this.info.y=ct.clientY;},touchmove:function touchmove(e){var t=Gestures._findOriginalTarget(e);var ct=e.changedTouches[0];var x=ct.clientX,y=ct.clientY;if(this.hasMovedEnough(x,y)){if(this.info.state==='start'){// if and only if tracking, always prevent tap
Gestures.prevent('tap');}this.info.addMove({x:x,y:y});this._fire(t,ct);this.info.state='track';this.info.started=true;}},touchend:function touchend(e){var t=Gestures._findOriginalTarget(e);var ct=e.changedTouches[0];// only trackend if track was started and not aborted
if(this.info.started){// reset started state on up
this.info.state='end';this.info.addMove({x:ct.clientX,y:ct.clientY});this._fire(t,ct,e);}},_fire:function _fire(target,touch){var secondlast=this.info.moves[this.info.moves.length-2];var lastmove=this.info.moves[this.info.moves.length-1];var dx=lastmove.x-this.info.x;var dy=lastmove.y-this.info.y;var ddx=void 0,ddy=0;if(secondlast){ddx=lastmove.x-secondlast.x;ddy=lastmove.y-secondlast.y;}return Gestures._fire(target,'track',{state:this.info.state,x:touch.clientX,y:touch.clientY,dx:dx,dy:dy,ddx:ddx,ddy:ddy,sourceEvent:touch,hover:function hover(){return Gestures.deepTargetFind(touch.clientX,touch.clientY);}});}});Gestures.register({name:'tap',deps:['mousedown','click','touchstart','touchend'],flow:{start:['mousedown','touchstart'],end:['click','touchend']},emits:['tap'],info:{x:NaN,y:NaN,prevent:false},reset:function reset(){this.info.x=NaN;this.info.y=NaN;this.info.prevent=false;},save:function save(e){this.info.x=e.clientX;this.info.y=e.clientY;},mousedown:function mousedown(e){if(hasLeftMouseButton(e)){this.save(e);}},click:function click(e){if(hasLeftMouseButton(e)){this.forward(e);}},touchstart:function touchstart(e){this.save(e.changedTouches[0],e);},touchend:function touchend(e){this.forward(e.changedTouches[0],e);},forward:function forward(e,preventer){var dx=Math.abs(e.clientX-this.info.x);var dy=Math.abs(e.clientY-this.info.y);var t=Gestures._findOriginalTarget(e);// dx,dy can be NaN if `click` has been simulated and there was no `down` for `start`
if(isNaN(dx)||isNaN(dy)||dx<=TAP_DISTANCE&&dy<=TAP_DISTANCE||isSyntheticClick(e)){// prevent taps from being generated if an event has canceled them
if(!this.info.prevent){Gestures._fire(t,'tap',{x:e.clientX,y:e.clientY,sourceEvent:e,preventer:preventer});}}}});/** @deprecated */Gestures.findOriginalTarget=Gestures._findOriginalTarget;/** @deprecated */Gestures.add=Gestures.addListener;/** @deprecated */Gestures.remove=Gestures.removeListener;Polymer.Gestures=Gestures;})();(function(){'use strict';var gestures=Polymer.Gestures;/**
   * Element class mixin that provides API for adding Polymer's cross-platform
   * gesture events to nodes.
   *
   * The API is designed to be compatible with override points implemented
   * in `Polymer.TemplateStamp` such that declarative event listeners in
   * templates will support gesture events when this mixin is applied along with
   * `Polymer.TemplateStamp`.
   *
   * @polymerMixin
   * @memberof Polymer
   * @summary Element class mixin that provides API for adding Polymer's cross-platform
   * gesture events to nodes
   */Polymer.GestureEventListeners=Polymer.dedupingMixin(function(superClass){/**
     * @polymerMixinClass
     * @implements {Polymer_GestureEventListeners}
     */var GestureEventListeners=function(_superClass5){_inherits(GestureEventListeners,_superClass5);function GestureEventListeners(){_classCallCheck(this,GestureEventListeners);return _possibleConstructorReturn(this,(GestureEventListeners.__proto__||Object.getPrototypeOf(GestureEventListeners)).apply(this,arguments));}_createClass(GestureEventListeners,[{key:"_addEventListenerToNode",value:function _addEventListenerToNode(node,eventName,handler){if(!gestures.addListener(node,eventName,handler)){_get(GestureEventListeners.prototype.__proto__||Object.getPrototypeOf(GestureEventListeners.prototype),"_addEventListenerToNode",this).call(this,node,eventName,handler);}}},{key:"_removeEventListenerFromNode",value:function _removeEventListenerFromNode(node,eventName,handler){if(!gestures.removeListener(node,eventName,handler)){_get(GestureEventListeners.prototype.__proto__||Object.getPrototypeOf(GestureEventListeners.prototype),"_removeEventListenerFromNode",this).call(this,node,eventName,handler);}}}]);return GestureEventListeners;}(superClass);return GestureEventListeners;});})();(function(){'use strict';// run a callback when HTMLImports are ready or immediately if
// this api is not available.
function whenImportsReady(cb){if(window.HTMLImports){HTMLImports.whenReady(cb);}else{cb();}}/**
   * Convenience method for importing an HTML document imperatively.
   *
   * This method creates a new `<link rel="import">` element with
   * the provided URL and appends it to the document to start loading.
   * In the `onload` callback, the `import` property of the `link`
   * element will contain the imported document contents.
   *
   * @memberof Polymer
   * @param {string} href URL to document to load.
   * @param {Function=} onload Callback to notify when an import successfully
   *   loaded.
   * @param {Function=} onerror Callback to notify when an import
   *   unsuccessfully loaded.
   * @param {boolean=} optAsync True if the import should be loaded `async`.
   *   Defaults to `false`.
   * @return {HTMLLinkElement} The link element for the URL to be loaded.
   */Polymer.importHref=function(href,onload,onerror,optAsync){var link=document.head.querySelector('link[href="'+href+'"][import-href]');if(!link){link=document.createElement('link');link.rel='import';link.href=href;link.setAttribute('import-href','');}// always ensure link has `async` attribute if user specified one,
// even if it was previously not async. This is considered less confusing.
if(optAsync){link.setAttribute('async','');}// NOTE: the link may now be in 3 states: (1) pending insertion,
// (2) inflight, (3) already laoded. In each case, we need to add
// event listeners to process callbacks.
var cleanup=function cleanup(){link.removeEventListener('load',loadListener);link.removeEventListener('error',errorListener);};var loadListener=function loadListener(event){cleanup();// In case of a successful load, cache the load event on the link so
// that it can be used to short-circuit this method in the future when
// it is called with the same href param.
link.__dynamicImportLoaded=true;if(onload){whenImportsReady(function(){onload(event);});}};var errorListener=function errorListener(event){cleanup();// In case of an error, remove the link from the document so that it
// will be automatically created again the next time `importHref` is
// called.
if(link.parentNode){link.parentNode.removeChild(link);}if(onerror){whenImportsReady(function(){onerror(event);});}};link.addEventListener('load',loadListener);link.addEventListener('error',errorListener);if(link.parentNode==null){document.head.appendChild(link);// if the link already loaded, dispatch a fake load event
// so that listeners are called and get a proper event argument.
}else if(link.__dynamicImportLoaded){link.dispatchEvent(new Event('load'));}return link;};})();(function(){'use strict';var scheduled=false;var beforeRenderQueue=[];var afterRenderQueue=[];function schedule(){scheduled=true;// before next render
requestAnimationFrame(function(){scheduled=false;flushQueue(beforeRenderQueue);// after the render
setTimeout(function(){runQueue(afterRenderQueue);});});}function flushQueue(queue){while(queue.length){callMethod(queue.shift());}}function runQueue(queue){for(var i=0,l=queue.length;i<l;i++){callMethod(queue.shift());}}function callMethod(info){var context=info[0];var callback=info[1];var args=info[2];try{callback.apply(context,args);}catch(e){setTimeout(function(){throw e;});}}function flush(){while(beforeRenderQueue.length||afterRenderQueue.length){flushQueue(beforeRenderQueue);flushQueue(afterRenderQueue);}scheduled=false;}/**
   * Module for scheduling flushable pre-render and post-render tasks.
   *
   * @namespace
   * @memberof Polymer
   * @summary Module for scheduling flushable pre-render and post-render tasks.
   */Polymer.RenderStatus={/**
     * Enqueues a callback which will be run before the next render, at
     * `requestAnimationFrame` timing.
     *
     * This method is useful for enqueuing work that requires DOM measurement,
     * since measurement may not be reliable in custom element callbacks before
     * the first render, as well as for batching measurement tasks in general.
     *
     * Tasks in this queue may be flushed by calling `Polymer.RenderStatus.flush()`.
     *
     * @memberof Polymer.RenderStatus
     * @param {*} context Context object the callback function will be bound to
     * @param {function()} callback Callback function
     * @param {Array} args An array of arguments to call the callback function with
     */beforeNextRender:function beforeNextRender(context,callback,args){if(!scheduled){schedule();}beforeRenderQueue.push([context,callback,args]);},/**
     * Enqueues a callback which will be run after the next render, equivalent
     * to one task (`setTimeout`) after the next `requestAnimationFrame`.
     *
     * This method is useful for tuning the first-render performance of an
     * element or application by deferring non-critical work until after the
     * first paint.  Typical non-render-critical work may include adding UI
     * event listeners and aria attributes.
     *
     * @memberof Polymer.RenderStatus
     * @param {*} context Context object the callback function will be bound to
     * @param {function()} callback Callback function
     * @param {Array} args An array of arguments to call the callback function with
     */afterNextRender:function afterNextRender(context,callback,args){if(!scheduled){schedule();}afterRenderQueue.push([context,callback,args]);},/**
     * Flushes all `beforeNextRender` tasks, followed by all `afterNextRender`
     * tasks.
     *
     * @memberof Polymer.RenderStatus
     */flush:flush};})();(function(){'use strict';// unresolved
function resolve(){document.body.removeAttribute('unresolved');}if(window.WebComponents){window.addEventListener('WebComponentsReady',resolve);}else{if(document.readyState==='interactive'||document.readyState==='complete'){resolve();}else{window.addEventListener('DOMContentLoaded',resolve);}}})();(function(){'use strict';function newSplice(index,removed,addedCount){return{index:index,removed:removed,addedCount:addedCount};}var EDIT_LEAVE=0;var EDIT_UPDATE=1;var EDIT_ADD=2;var EDIT_DELETE=3;var ArraySplice={// Note: This function is *based* on the computation of the Levenshtein
// "edit" distance. The one change is that "updates" are treated as two
// edits - not one. With Array splices, an update is really a delete
// followed by an add. By retaining this, we optimize for "keeping" the
// maximum array items in the original array. For example:
//
//   'xxxx123' -> '123yyyy'
//
// With 1-edit updates, the shortest path would be just to update all seven
// characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
// leaves the substring '123' intact.
calcEditDistances:function calcEditDistances(current,currentStart,currentEnd,old,oldStart,oldEnd){// "Deletion" columns
var rowCount=oldEnd-oldStart+1;var columnCount=currentEnd-currentStart+1;var distances=new Array(rowCount);// "Addition" rows. Initialize null column.
for(var i=0;i<rowCount;i++){distances[i]=new Array(columnCount);distances[i][0]=i;}// Initialize null row
for(var j=0;j<columnCount;j++){distances[0][j]=j;}for(var _i5=1;_i5<rowCount;_i5++){for(var _j=1;_j<columnCount;_j++){if(this.equals(current[currentStart+_j-1],old[oldStart+_i5-1]))distances[_i5][_j]=distances[_i5-1][_j-1];else{var north=distances[_i5-1][_j]+1;var west=distances[_i5][_j-1]+1;distances[_i5][_j]=north<west?north:west;}}}return distances;},// This starts at the final weight, and walks "backward" by finding
// the minimum previous weight recursively until the origin of the weight
// matrix.
spliceOperationsFromEditDistances:function spliceOperationsFromEditDistances(distances){var i=distances.length-1;var j=distances[0].length-1;var current=distances[i][j];var edits=[];while(i>0||j>0){if(i==0){edits.push(EDIT_ADD);j--;continue;}if(j==0){edits.push(EDIT_DELETE);i--;continue;}var northWest=distances[i-1][j-1];var west=distances[i-1][j];var north=distances[i][j-1];var min=void 0;if(west<north)min=west<northWest?west:northWest;else min=north<northWest?north:northWest;if(min==northWest){if(northWest==current){edits.push(EDIT_LEAVE);}else{edits.push(EDIT_UPDATE);current=northWest;}i--;j--;}else if(min==west){edits.push(EDIT_DELETE);i--;current=west;}else{edits.push(EDIT_ADD);j--;current=north;}}edits.reverse();return edits;},/**
     * Splice Projection functions:
     *
     * A splice map is a representation of how a previous array of items
     * was transformed into a new array of items. Conceptually it is a list of
     * tuples of
     *
     *   <index, removed, addedCount>
     *
     * which are kept in ascending index order of. The tuple represents that at
     * the |index|, |removed| sequence of items were removed, and counting forward
     * from |index|, |addedCount| items were added.
     *//**
     * Lacking individual splice mutation information, the minimal set of
     * splices can be synthesized given the previous state and final state of an
     * array. The basic approach is to calculate the edit distance matrix and
     * choose the shortest path through it.
     *
     * Complexity: O(l * p)
     *   l: The length of the current array
     *   p: The length of the old array
     *
     * @param {Array} current The current "changed" array for which to
     * calculate splices.
     * @param {number} currentStart Starting index in the `current` array for
     * which splices are calculated.
     * @param {number} currentEnd Ending index in the `current` array for
     * which splices are calculated.
     * @param {Array} old The original "unchanged" array to compare `current`
     * against to determine splices.
     * @param {number} oldStart Starting index in the `old` array for
     * which splices are calculated.
     * @param {number} oldEnd Ending index in the `old` array for
     * which splices are calculated.
     * @return {Array} Returns an array of splice record objects. Each of these
     * contains: `index` the location where the splice occurred; `removed`
     * the array of removed items from this location; `addedCount` the number
     * of items added at this location.
     */calcSplices:function calcSplices(current,currentStart,currentEnd,old,oldStart,oldEnd){var prefixCount=0;var suffixCount=0;var splice=void 0;var minLength=Math.min(currentEnd-currentStart,oldEnd-oldStart);if(currentStart==0&&oldStart==0)prefixCount=this.sharedPrefix(current,old,minLength);if(currentEnd==current.length&&oldEnd==old.length)suffixCount=this.sharedSuffix(current,old,minLength-prefixCount);currentStart+=prefixCount;oldStart+=prefixCount;currentEnd-=suffixCount;oldEnd-=suffixCount;if(currentEnd-currentStart==0&&oldEnd-oldStart==0)return[];if(currentStart==currentEnd){splice=newSplice(currentStart,[],0);while(oldStart<oldEnd){splice.removed.push(old[oldStart++]);}return[splice];}else if(oldStart==oldEnd)return[newSplice(currentStart,[],currentEnd-currentStart)];var ops=this.spliceOperationsFromEditDistances(this.calcEditDistances(current,currentStart,currentEnd,old,oldStart,oldEnd));splice=undefined;var splices=[];var index=currentStart;var oldIndex=oldStart;for(var i=0;i<ops.length;i++){switch(ops[i]){case EDIT_LEAVE:if(splice){splices.push(splice);splice=undefined;}index++;oldIndex++;break;case EDIT_UPDATE:if(!splice)splice=newSplice(index,[],0);splice.addedCount++;index++;splice.removed.push(old[oldIndex]);oldIndex++;break;case EDIT_ADD:if(!splice)splice=newSplice(index,[],0);splice.addedCount++;index++;break;case EDIT_DELETE:if(!splice)splice=newSplice(index,[],0);splice.removed.push(old[oldIndex]);oldIndex++;break;}}if(splice){splices.push(splice);}return splices;},sharedPrefix:function sharedPrefix(current,old,searchLength){for(var i=0;i<searchLength;i++){if(!this.equals(current[i],old[i]))return i;}return searchLength;},sharedSuffix:function sharedSuffix(current,old,searchLength){var index1=current.length;var index2=old.length;var count=0;while(count<searchLength&&this.equals(current[--index1],old[--index2])){count++;}return count;},calculateSplices:function calculateSplices(current,previous){return this.calcSplices(current,0,current.length,previous,0,previous.length);},equals:function equals(currentValue,previousValue){return currentValue===previousValue;}};/**
   * @namespace
   * @memberof Polymer
   * @summary Module that provides utilities for diffing arrays.
   */Polymer.ArraySplice={/**
     * Returns an array of splice records indicating the minimum edits required
     * to transform the `previous` array into the `current` array.
     *
     * Splice records are ordered by index and contain the following fields:
     * - `index`: index where edit started
     * - `removed`: array of removed items from this index
     * - `addedCount`: number of items added at this index
     *
     * This function is based on the Levenshtein "minimum edit distance"
     * algorithm. Note that updates are treated as removal followed by addition.
     *
     * The worst-case time complexity of this algorithm is `O(l * p)`
     *   l: The length of the current array
     *   p: The length of the previous array
     *
     * However, the worst-case complexity is reduced by an `O(n)` optimization
     * to detect any shared prefix & suffix between the two arrays and only
     * perform the more expensive minimum edit distance calculation over the
     * non-shared portions of the arrays.
     *
     * @memberof Polymer.ArraySplice
     * @param {Array} current The "changed" array for which splices will be
     * calculated.
     * @param {Array} previous The "unchanged" original array to compare
     * `current` against to determine the splices.
     * @return {Array} Returns an array of splice record objects. Each of these
     * contains: `index` the location where the splice occurred; `removed`
     * the array of removed items from this location; `addedCount` the number
     * of items added at this location.
     */calculateSplices:function calculateSplices(current,previous){return ArraySplice.calculateSplices(current,previous);}};})();(function(){'use strict';function isSlot(node){return node.localName==='slot';}/**
   * Class that listens for changes (additions or removals) to
   * "flattened nodes" on a given `node`. The list of flattened nodes consists
   * of a node's children and, for any children that are `<slot>` elements,
   * the expanded flattened list of `assignedNodes`.
   * For example, if the observed node has children `<a></a><slot></slot><b></b>`
   * and the `<slot>` has one `<div>` assigned to it, then the flattened
   * nodes list is `<a></a><div></div><b></b>`. If the `<slot>` has other
   * `<slot>` elements assigned to it, these are flattened as well.
   *
   * The provided `callback` is called whenever any change to this list
   * of flattened nodes occurs, where an addition or removal of a node is
   * considered a change. The `callback` is called with one argument, an object
   * containing an array of any `addedNodes` and `removedNodes`.
   *
   * Note: the callback is called asynchronous to any changes
   * at a microtask checkpoint. This is because observation is performed using
   * `MutationObserver` and the `<slot>` element's `slotchange` event which
   * are asynchronous.
   *
   * @memberof Polymer
   * @param {Node} target Node on which to listen for changes.
   * @param {Function} callback Function called when there are additions
   * or removals from the target's list of flattened nodes.
   * @summary Class that listens for changes (additions or removals) to
   * "flattened nodes" on a given `node`.
   */var FlattenedNodesObserver=function(){_createClass(FlattenedNodesObserver,null,[{key:"getFlattenedNodes",/**
     * Returns the list of flattened nodes for the given `node`.
     * This list consists of a node's children and, for any children
     * that are `<slot>` elements, the expanded flattened list of `assignedNodes`.
     * For example, if the observed node has children `<a></a><slot></slot><b></b>`
     * and the `<slot>` has one `<div>` assigned to it, then the flattened
     * nodes list is `<a></a><div></div><b></b>`. If the `<slot>` has other
     * `<slot>` elements assigned to it, these are flattened as well.
     *
     * @param {Node} node The node for which to return the list of flattened nodes.
     * @return {Array} The list of flattened nodes for the given `node`.
    */value:function getFlattenedNodes(node){if(isSlot(node)){return node.assignedNodes({flatten:true});}else{return Array.from(node.childNodes).map(function(node){if(isSlot(node)){return node.assignedNodes({flatten:true});}else{return[node];}}).reduce(function(a,b){return a.concat(b);},[]);}}}]);function FlattenedNodesObserver(target,callback){var _this21=this;_classCallCheck(this,FlattenedNodesObserver);/** @type {MutationObserver} */this._shadyChildrenObserver=null;/** @type {MutationObserver} */this._nativeChildrenObserver=null;this._connected=false;this._target=target;this.callback=callback;this._effectiveNodes=[];this._observer=null;this._scheduled=false;this._boundSchedule=function(){_this21._schedule();};this.connect();this._schedule();}/**
     * Activates an observer. This method is automatically called when
     * a `FlattenedNodesObserver` is created. It should only be called to
     * re-activate an observer that has been deactivated via the `disconnect` method.
     */_createClass(FlattenedNodesObserver,[{key:"connect",value:function connect(){var _this22=this;if(isSlot(this._target)){this._listenSlots([this._target]);}else{this._listenSlots(this._target.children);if(window.ShadyDOM){this._shadyChildrenObserver=ShadyDOM.observeChildren(this._target,function(mutations){_this22._processMutations(mutations);});}else{this._nativeChildrenObserver=new MutationObserver(function(mutations){_this22._processMutations(mutations);});this._nativeChildrenObserver.observe(this._target,{childList:true});}}this._connected=true;}/**
     * Deactivates the flattened nodes observer. After calling this method
     * the observer callback will not be called when changes to flattened nodes
     * occur. The `connect` method may be subsequently called to reactivate
     * the observer.
     */},{key:"disconnect",value:function disconnect(){if(isSlot(this._target)){this._unlistenSlots([this._target]);}else{this._unlistenSlots(this._target.children);if(window.ShadyDOM&&this._shadyChildrenObserver){ShadyDOM.unobserveChildren(this._shadyChildrenObserver);this._shadyChildrenObserver=null;}else if(this._nativeChildrenObserver){this._nativeChildrenObserver.disconnect();this._nativeChildrenObserver=null;}}this._connected=false;}},{key:"_schedule",value:function _schedule(){var _this23=this;if(!this._scheduled){this._scheduled=true;Polymer.Async.microTask.run(function(){return _this23.flush();});}}},{key:"_processMutations",value:function _processMutations(mutations){this._processSlotMutations(mutations);this.flush();}},{key:"_processSlotMutations",value:function _processSlotMutations(mutations){if(mutations){for(var i=0;i<mutations.length;i++){var mutation=mutations[i];if(mutation.addedNodes){this._listenSlots(mutation.addedNodes);}if(mutation.removedNodes){this._unlistenSlots(mutation.removedNodes);}}}}/**
     * Flushes the observer causing any pending changes to be immediately
     * delivered the observer callback. By default these changes are delivered
     * asynchronously at the next microtask checkpoint.
     *
     * @return {boolean} Returns true if any pending changes caused the observer
     * callback to run.
     */},{key:"flush",value:function flush(){if(!this._connected){return;}if(window.ShadyDOM){ShadyDOM.flush();}if(this._nativeChildrenObserver){this._processSlotMutations(this._nativeChildrenObserver.takeRecords());}else if(this.shadyChildrenObserver){this._processSlotMutations(this._shadyChildrenObserver.takeRecords());}this._scheduled=false;var info={target:this._target,addedNodes:[],removedNodes:[]};var newNodes=this.constructor.getFlattenedNodes(this._target);var splices=Polymer.ArraySplice.calculateSplices(newNodes,this._effectiveNodes);// process removals
for(var i=0,s;i<splices.length&&(s=splices[i]);i++){for(var j=0,n;j<s.removed.length&&(n=s.removed[j]);j++){info.removedNodes.push(n);}}// process adds
for(var _i6=0,_s;_i6<splices.length&&(_s=splices[_i6]);_i6++){for(var _j2=_s.index;_j2<_s.index+_s.addedCount;_j2++){info.addedNodes.push(newNodes[_j2]);}}// update cache
this._effectiveNodes=newNodes;var didFlush=false;if(info.addedNodes.length||info.removedNodes.length){didFlush=true;this.callback.call(this._target,info);}return didFlush;}},{key:"_listenSlots",value:function _listenSlots(nodeList){for(var i=0;i<nodeList.length;i++){var n=nodeList[i];if(isSlot(n)){n.addEventListener('slotchange',this._boundSchedule);}}}},{key:"_unlistenSlots",value:function _unlistenSlots(nodeList){for(var i=0;i<nodeList.length;i++){var n=nodeList[i];if(isSlot(n)){n.removeEventListener('slotchange',this._boundSchedule);}}}}]);return FlattenedNodesObserver;}();Polymer.FlattenedNodesObserver=FlattenedNodesObserver;})();(function(){'use strict';var p=Element.prototype;var normalizedMatchesSelector=p.matches||p.matchesSelector||p.mozMatchesSelector||p.msMatchesSelector||p.oMatchesSelector||p.webkitMatchesSelector;/**
   * Cross-platform `element.matches` shim.
   *
   * @function matchesSelector
   * @memberof Polymer.dom
   * @param {Node} node Node to check selector against
   * @param {string} selector Selector to match
   * @return {boolean} True if node matched selector
   */var matchesSelector=function matchesSelector(node,selector){return normalizedMatchesSelector.call(node,selector);};/**
   * Node API wrapper class returned from `Polymer.dom.(target)` when
   * `target` is a `Node`.
   */var DomApi=function(){function DomApi(node){_classCallCheck(this,DomApi);this.node=node;}/**
     * Returns an instance of `Polymer.FlattenedNodesObserver` that
     * listens for node changes on this element.
     *
     * @param {Function} callback Called when direct or distributed children
     *   of this element changes
     * @return {Polymer.FlattenedNodesObserver} Observer instance
     */_createClass(DomApi,[{key:"observeNodes",value:function observeNodes(callback){return new Polymer.FlattenedNodesObserver(this.node,callback);}/**
     * Disconnects an observer previously created via `observeNodes`
     *
     * @param {Polymer.FlattenedNodesObserver} observerHandle Observer instance
     *   to disconnect.
     */},{key:"unobserveNodes",value:function unobserveNodes(observerHandle){observerHandle.disconnect();}/**
     * Provided as a backwards-compatible API only.  This method does nothing.
     */},{key:"notifyObserver",value:function notifyObserver(){}/**
     * Returns true if the provided node is contained with this element's
     * light-DOM children or shadow root, including any nested shadow roots
     * of children therein.
     *
     * @param {Node} node Node to test
     * @return {boolean} Returns true if the given `node` is contained within
     *   this element's light or shadow DOM.
     */},{key:"deepContains",value:function deepContains(node){if(this.node.contains(node)){return true;}var n=node;var doc=node.ownerDocument;// walk from node to `this` or `document`
while(n&&n!==doc&&n!==this.node){// use logical parentnode, or native ShadowRoot host
n=n.parentNode||n.host;}return n===this.node;}/**
     * Returns the root node of this node.  Equivalent to `getRoodNode()`.
     *
     * @return {Node} Top most element in the dom tree in which the node
     * exists. If the node is connected to a document this is either a
     * shadowRoot or the document; otherwise, it may be the node
     * itself or a node or document fragment containing it.
     */},{key:"getOwnerRoot",value:function getOwnerRoot(){return this.node.getRootNode();}/**
     * For slot elements, returns the nodes assigned to the slot; otherwise
     * an empty array. It is equivalent to `<slot>.addignedNodes({flatten:true})`.
     *
     * @return {Array<Node>} Array of assigned nodes
     */},{key:"getDistributedNodes",value:function getDistributedNodes(){return this.node.localName==='slot'?this.node.assignedNodes({flatten:true}):[];}/**
     * Returns an array of all slots this element was distributed to.
     *
     * @return {Array<HTMLSlotElement>} Description
     */},{key:"getDestinationInsertionPoints",value:function getDestinationInsertionPoints(){var ip$=[];var n=this.node.assignedSlot;while(n){ip$.push(n);n=n.assignedSlot;}return ip$;}/**
     * Calls `importNode` on the `ownerDocument` for this node.
     *
     * @param {Node} node Node to import
     * @param {boolean} deep True if the node should be cloned deeply during
     *   import
     * @return {Node} Clone of given node imported to this owner document
     */},{key:"importNode",value:function importNode(node,deep){var doc=this.node instanceof Document?this.node:this.node.ownerDocument;return doc.importNode(node,deep);}/**
     * Returns a flattened list of all child nodes and nodes distributed
     * to child slots.
     *
     * @return {type} Description
     */},{key:"getEffectiveChildNodes",value:function getEffectiveChildNodes(){return Polymer.FlattenedNodesObserver.getFlattenedNodes(this.node);}/**
     * Returns a filtered list of flattened child elements for this element based
     * on the given selector.
     *
     * @param {string} selector Selector to filter nodes against
     * @return {Array<HTMLElement>} List of flattened child elements
     */},{key:"queryDistributedElements",value:function queryDistributedElements(selector){var c$=this.getEffectiveChildNodes();var list=[];for(var i=0,l=c$.length,c;i<l&&(c=c$[i]);i++){if(c.nodeType===Node.ELEMENT_NODE&&matchesSelector(c,selector)){list.push(c);}}return list;}/**
     * For shadow roots, returns the currently focused element within this
     * shadow root.
     *
     * @return {Node|undefined} Currently focused element
     */},{key:"activeElement",get:function get(){var node=this.node;return node._activeElement!==undefined?node._activeElement:node.activeElement;}}]);return DomApi;}();function forwardMethods(proto,methods){var _loop=function _loop(i){var method=methods[i];proto[method]=function(){return this.node[method].apply(this.node,arguments);};};for(var i=0;i<methods.length;i++){_loop(i);}}function forwardReadOnlyProperties(proto,properties){var _loop2=function _loop2(i){var name=properties[i];Object.defineProperty(proto,name,{get:function get(){return this.node[name];},configurable:true});};for(var i=0;i<properties.length;i++){_loop2(i);}}function forwardProperties(proto,properties){var _loop3=function _loop3(i){var name=properties[i];Object.defineProperty(proto,name,{get:function get(){return this.node[name];},set:function set(value){this.node[name]=value;},configurable:true});};for(var i=0;i<properties.length;i++){_loop3(i);}}forwardMethods(DomApi.prototype,['cloneNode','appendChild','insertBefore','removeChild','replaceChild','setAttribute','removeAttribute','querySelector','querySelectorAll']);forwardReadOnlyProperties(DomApi.prototype,['parentNode','firstChild','lastChild','nextSibling','previousSibling','firstElementChild','lastElementChild','nextElementSibling','previousElementSibling','childNodes','children','classList']);forwardProperties(DomApi.prototype,['textContent','innerHTML']);/**
   * Event API wrapper class returned from `Polymer.dom.(target)` when
   * `target` is an `Event`.
   */var EventApi=function(){function EventApi(event){_classCallCheck(this,EventApi);this.event=event;}/**
     * Returns the first node on the `composedPath` of this event.
     *
     * @return {Node} The node this event was dispatched to
     */_createClass(EventApi,[{key:"rootTarget",get:function get(){return this.event.composedPath()[0];}/**
     * Returns the local (re-targeted) target for this event.
     *
     * @return {Node} The local (re-targeted) target for this event.
     */},{key:"localTarget",get:function get(){return this.event.target;}/**
     * Returns the `composedPath` for this event.
     */},{key:"path",get:function get(){return this.event.composedPath();}}]);return EventApi;}();/**
   * Legacy DOM and Event manipulation API wrapper factory used to abstract
   * differences between native Shadow DOM and "Shady DOM" when polyfilling on
   * older browsers.
   *
   * Note that in Polymer 2.x use of `Polymer.dom` is no longer required and
   * in the majority of cases simply facades directly to the standard native
   * API.
   *
   * @namespace
   * @summary Legacy DOM and Event manipulation API wrapper factory used to
   * abstract differences between native Shadow DOM and "Shady DOM."
   * @memberof Polymer
   * @param {Node|Event} obj Node or event to operate on
   * @return {DomApi|EventApi} Wrapper providing either node API or event API
   */Polymer.dom=function(obj){obj=obj||document;var ctor=obj instanceof Event?EventApi:DomApi;if(!obj.__domApi){obj.__domApi=new ctor(obj);}return obj.__domApi;};Polymer.dom.matchesSelector=matchesSelector;/**
   * Forces several classes of asynchronously queued tasks to flush:
   * - Debouncers added via `Polymer.enqueueDebouncer`
   * - ShadyDOM distribution
   *
   * This method facades to `Polymer.flush`.
   *
   * @memberof Polymer.dom
   */Polymer.dom.flush=Polymer.flush;/**
   * Adds a `Polymer.Debouncer` to a list of globally flushable tasks.
   *
   * This method facades to `Polymer.enqueueDebouncer`.
   *
   * @memberof Polymer.dom
   * @param {Polymer.Debouncer} debouncer Debouncer to enqueue
   */Polymer.dom.addDebouncer=Polymer.enqueueDebouncer;// expose BC settings.
var settings=Polymer.Settings||{};settings.useShadow=!window.ShadyDOM;settings.useNativeCSSProperties=Boolean(!window.ShadyCSS||window.ShadyCSS.nativeCss);settings.useNativeCustomElements=!window.customElements.polyfillWrapFlushCallback;Polymer.Settings=settings;})();(function(){'use strict';var styleInterface=window.ShadyCSS;/**
   * Element class mixin that provides Polymer's "legacy" API intended to be
   * backward-compatible to the greatest extent possible with the API
   * found on the Polymer 1.x `Polymer.Base` prototype applied to all elements
   * defined using the `Polymer({...})` function.
   *
   * @polymerMixin
   * @mixes Polymer.ElementMixin
   * @mixes Polymer.GestureEventListeners
   * @property isAttached {boolean} Set to `true` in this element's
   *   `connectedCallback` and `false` in `disconnectedCallback`
   * @memberof Polymer
   * @summary Element class mixin that provides Polymer's "legacy" API
   */Polymer.LegacyElementMixin=Polymer.dedupingMixin(function(base){/**
     * @constructor
     * @extends {base}
     * @implements {Polymer_ElementMixin}
     * @implements {Polymer_GestureEventListeners}
     */var legacyElementBase=Polymer.GestureEventListeners(Polymer.ElementMixin(base));/**
     * Map of simple names to touch action names
     * @dict
     */var DIRECTION_MAP={'x':'pan-x','y':'pan-y','none':'none','all':'auto'};/**
     * @polymerMixinClass
     * @implements {Polymer_LegacyElement}
     */var LegacyElement=function(_legacyElementBase){_inherits(LegacyElement,_legacyElementBase);function LegacyElement(){_classCallCheck(this,LegacyElement);var _this24=_possibleConstructorReturn(this,(LegacyElement.__proto__||Object.getPrototypeOf(LegacyElement)).call(this));_this24.root=_this24;_this24.created();return _this24;}/**
       * Legacy callback called during the `constructor`, for overriding
       * by the user.
       */_createClass(LegacyElement,[{key:"created",value:function created(){}},{key:"connectedCallback",value:function connectedCallback(){_get(LegacyElement.prototype.__proto__||Object.getPrototypeOf(LegacyElement.prototype),"connectedCallback",this).call(this);this.isAttached=true;this.attached();}/**
       * Legacy callback called during `connectedCallback`, for overriding
       * by the user.
       */},{key:"attached",value:function attached(){}},{key:"disconnectedCallback",value:function disconnectedCallback(){_get(LegacyElement.prototype.__proto__||Object.getPrototypeOf(LegacyElement.prototype),"disconnectedCallback",this).call(this);this.isAttached=false;this.detached();}/**
       * Legacy callback called during `disconnectedCallback`, for overriding
       * by the user.
       */},{key:"detached",value:function detached(){}},{key:"attributeChangedCallback",value:function attributeChangedCallback(name,old,value){if(old!==value){_get(LegacyElement.prototype.__proto__||Object.getPrototypeOf(LegacyElement.prototype),"attributeChangedCallback",this).call(this,name,old,value);this.attributeChanged(name,old,value);}}/**
       * Legacy callback called during `attributeChangedChallback`, for overriding
       * by the user.
       */},{key:"attributeChanged",value:function attributeChanged(){}/**
       * Overrides the default `Polymer.PropertyEffects` implementation to
       * add support for class initialization via the `_registered` callback.
       * This is called only when the first instance of the element is created.
       *
       * @override
       */},{key:"_initializeProperties",value:function _initializeProperties(){var proto=Object.getPrototypeOf(this);if(!proto.hasOwnProperty('__hasRegisterFinished')){proto.__hasRegisterFinished=true;this._registered();}_get(LegacyElement.prototype.__proto__||Object.getPrototypeOf(LegacyElement.prototype),"_initializeProperties",this).call(this);}/**
       * Called automatically when an element is initializing.
       * Users may override this method to perform class registration time
       * work. The implementation should ensure the work is performed
       * only once for the class.
       * @protected
       */},{key:"_registered",value:function _registered(){}/**
       * Overrides the default `Polymer.PropertyEffects` implementation to
       * add support for installing `hostAttributes` and `listeners`.
       *
       * @override
       */},{key:"ready",value:function ready(){this._ensureAttributes();this._applyListeners();_get(LegacyElement.prototype.__proto__||Object.getPrototypeOf(LegacyElement.prototype),"ready",this).call(this);}/**
       * Ensures an element has required attributes. Called when the element
       * is being readied via `ready`. Users should override to set the
       * element's required attributes. The implementation should be sure
       * to check and not override existing attributes added by
       * the user of the element. Typically, setting attributes should be left
       * to the element user and not done here; reasonable exceptions include
       * setting aria roles and focusability.
       * @protected
       */},{key:"_ensureAttributes",value:function _ensureAttributes(){}/**
       * Adds element event listeners. Called when the element
       * is being readied via `ready`. Users should override to
       * add any required element event listeners.
       * In performance critical elements, the work done here should be kept
       * to a minimum since it is done before the element is rendered. In
       * these elements, consider adding listeners asychronously so as not to
       * block render.
       * @protected
       */},{key:"_applyListeners",value:function _applyListeners(){}/**
       * Converts a typed JavaScript value to a string.
       *
       * Note this method is provided as backward-compatible legacy API
       * only.  It is not directly called by any Polymer features. To customize
       * how properties are serialized to attributes for attribute bindings and
       * `reflectToAttribute: true` properties as well as this method, override
       * the `_serializeValue` method provided by `Polymer.PropertyAccessors`.
       *
       * @param {*} value Value to deserialize
       * @return {string} Serialized value
       */},{key:"serialize",value:function serialize(value){return this._serializeValue(value);}/**
       * Converts a string to a typed JavaScript value.
       *
       * Note this method is provided as backward-compatible legacy API
       * only.  It is not directly called by any Polymer features.  To customize
       * how attributes are deserialized to properties for in
       * `attributeChangedCallback`, override `_deserializeValue` method
       * provided by `Polymer.PropertyAccessors`.
       *
       * @param {string} value String to deserialize
       * @param {*} type Type to deserialize the string to
       * @return {*} Returns the deserialized value in the `type` given.
       */},{key:"deserialize",value:function deserialize(value,type){return this._deserializeValue(value,type);}/**
       * Serializes a property to its associated attribute.
       *
       * Note this method is provided as backward-compatible legacy API
       * only.  It is not directly called by any Polymer features.
       *
       * @param {string} property Property name to reflect.
       * @param {string=} attribute Attribute name to reflect.
       * @param {*=} value Property value to refect.
       */},{key:"reflectPropertyToAttribute",value:function reflectPropertyToAttribute(property,attribute,value){this._propertyToAttribute(property,attribute,value);}/**
       * Sets a typed value to an HTML attribute on a node.
       *
       * Note this method is provided as backward-compatible legacy API
       * only.  It is not directly called by any Polymer features.
       *
       * @param {*} value Value to serialize.
       * @param {string} attribute Attribute name to serialize to.
       * @param {Element} node Element to set attribute to.
       */},{key:"serializeValueToAttribute",value:function serializeValueToAttribute(value,attribute,node){this._valueToNodeAttribute(node||this,value,attribute);}/**
       * Copies own properties (including accessor descriptors) from a source
       * object to a target object.
       *
       * @param {Object} prototype Target object to copy properties to.
       * @param {Object} api Source object to copy properties from.
       * @return {Object} prototype object that was passed as first argument.
       */},{key:"extend",value:function extend(prototype,api){if(!(prototype&&api)){return prototype||api;}var n$=Object.getOwnPropertyNames(api);for(var i=0,n;i<n$.length&&(n=n$[i]);i++){var pd=Object.getOwnPropertyDescriptor(api,n);if(pd){Object.defineProperty(prototype,n,pd);}}return prototype;}/**
       * Copies props from a source object to a target object.
       *
       * Note, this method uses a simple `for...in` strategy for enumerating
       * properties.  To ensure only `ownProperties` are copied from source
       * to target and that accessor implementations are copied, use `extend`.
       *
       * @param {Object} target Target object to copy properties to.
       * @param {Object} source Source object to copy properties from.
       * @return {Object} Target object that was passed as first argument.
       */},{key:"mixin",value:function mixin(target,source){for(var i in source){target[i]=source[i];}return target;}/**
       * Sets the prototype of an object.
       *
       * Note this method is provided as backward-compatible legacy API
       * only.  It is not directly called by any Polymer features.
       * @param {Object} object The object on which to set the prototype.
       * @param {Object} prototype The prototype that will be set on the given
       * `object`.
       * @return {Object} Returns the given `object` with its prototype set
       * to the given `prototype` object.
       */},{key:"chainObject",value:function chainObject(object,prototype){if(object&&prototype&&object!==prototype){object.__proto__=prototype;}return object;}/* **** Begin Template **** *//**
       * Calls `importNode` on the `content` of the `template` specified and
       * returns a document fragment containing the imported content.
       *
       * @param {HTMLTemplateElement} template HTML template element to instance.
       * @return {DocumentFragment} Document fragment containing the imported
       *   template content.
      */},{key:"instanceTemplate",value:function instanceTemplate(template){var content=this.constructor._contentForTemplate(template);var dom=/** @type {DocumentFragment} */document.importNode(content,true);return dom;}/* **** Begin Events **** *//**
       * Dispatches a custom event with an optional detail value.
       *
       * @param {string} type Name of event type.
       * @param {*=} detail Detail value containing event-specific
       *   payload.
       * @param {Object=} options Object specifying options.  These may include:
       *  `bubbles` (boolean, defaults to `true`),
       *  `cancelable` (boolean, defaults to false), and
       *  `node` on which to fire the event (HTMLElement, defaults to `this`).
       * @return {Event} The new event that was fired.
       */},{key:"fire",value:function fire(type,detail,options){options=options||{};detail=detail===null||detail===undefined?{}:detail;var event=new Event(type,{bubbles:options.bubbles===undefined?true:options.bubbles,cancelable:Boolean(options.cancelable),composed:options.composed===undefined?true:options.composed});event.detail=detail;var node=options.node||this;node.dispatchEvent(event);return event;}/**
       * Convenience method to add an event listener on a given element,
       * late bound to a named method on this element.
       *
       * @param {Element} node Element to add event listener to.
       * @param {string} eventName Name of event to listen for.
       * @param {string} methodName Name of handler method on `this` to call.
       */},{key:"listen",value:function listen(node,eventName,methodName){node=node||this;var hbl=this.__boundListeners||(this.__boundListeners=new WeakMap());var bl=hbl.get(node);if(!bl){bl={};hbl.set(node,bl);}var key=eventName+methodName;if(!bl[key]){bl[key]=this._addMethodEventListenerToNode(node,eventName,methodName,this);}}/**
       * Convenience method to remove an event listener from a given element,
       * late bound to a named method on this element.
       *
       * @param {Element} node Element to remove event listener from.
       * @param {string} eventName Name of event to stop listening to.
       * @param {string} methodName Name of handler method on `this` to not call
       anymore.
       */},{key:"unlisten",value:function unlisten(node,eventName,methodName){node=node||this;var bl=this.__boundListeners&&this.__boundListeners.get(node);var key=eventName+methodName;var handler=bl&&bl[key];if(handler){this._removeEventListenerFromNode(node,eventName,handler);bl[key]=null;}}/**
       * Override scrolling behavior to all direction, one direction, or none.
       *
       * Valid scroll directions:
       *   - 'all': scroll in any direction
       *   - 'x': scroll only in the 'x' direction
       *   - 'y': scroll only in the 'y' direction
       *   - 'none': disable scrolling for this node
       *
       * @param {string=} direction Direction to allow scrolling
       * Defaults to `all`.
       * @param {HTMLElement=} node Element to apply scroll direction setting.
       * Defaults to `this`.
       */},{key:"setScrollDirection",value:function setScrollDirection(direction,node){Polymer.Gestures.setTouchAction(node||this,DIRECTION_MAP[direction]||'auto');}/* **** End Events **** *//**
       * Convenience method to run `querySelector` on this local DOM scope.
       *
       * This function calls `Polymer.dom(this.root).querySelector(slctr)`.
       *
       * @param {string} slctr Selector to run on this local DOM scope
       * @return {Element} Element found by the selector, or null if not found.
       */},{key:"$$",value:function $$(slctr){return this.root.querySelector(slctr);}/**
       * Return the element whose local dom within which this element
       * is contained. This is a shorthand for
       * `this.getRootNode().host`.
       */},{key:"distributeContent",/**
       * Force this element to distribute its children to its local dom.
       * This is necessary only when ShadyDOM is used and only in cases that
       * are not automatically handled. For example,
       * a user should call `distributeContent` if distribution has been
       * invalidated due to an element being added or removed from the shadowRoot
       * that contains an insertion point (`<slot>`) inside its subtree.
       */value:function distributeContent(){if(window.ShadyDOM&&this.shadowRoot){this.shadowRoot.forceRender();}}/**
       * Returns a list of nodes that are the effective childNodes. The effective
       * childNodes list is the same as the element's childNodes except that
       * any `<content>` elements are replaced with the list of nodes distributed
       * to the `<content>`, the result of its `getDistributedNodes` method.
       *
       * @return {Array<Node>} List of effctive child nodes.
       */},{key:"getEffectiveChildNodes",value:function getEffectiveChildNodes(){return Polymer.dom(this).getEffectiveChildNodes();}/**
       * Returns a list of nodes distributed within this element that match
       * `selector`. These can be dom children or elements distributed to
       * children that are insertion points.
       * @param {string} selector Selector to run.
       * @return {Array<Node>} List of distributed elements that match selector.
       */},{key:"queryDistributedElements",value:function queryDistributedElements(selector){return Polymer.dom(this).queryDistributedElements(selector);}/**
       * Returns a list of elements that are the effective children. The effective
       * children list is the same as the element's children except that
       * any `<content>` elements are replaced with the list of elements
       * distributed to the `<content>`.
       *
       * @return {Array<Node>} List of effctive children.
       */},{key:"getEffectiveChildren",value:function getEffectiveChildren(){var list=this.getEffectiveChildNodes();return list.filter(function(n){return n.nodeType===Node.ELEMENT_NODE;});}/**
       * Returns a string of text content that is the concatenation of the
       * text content's of the element's effective childNodes (the elements
       * returned by <a href="#getEffectiveChildNodes>getEffectiveChildNodes</a>.
       *
       * @return {string} List of effctive children.
       */},{key:"getEffectiveTextContent",value:function getEffectiveTextContent(){var cn=this.getEffectiveChildNodes();var tc=[];for(var i=0,c;c=cn[i];i++){if(c.nodeType!==Node.COMMENT_NODE){tc.push(c.textContent);}}return tc.join('');}/**
       * Returns the first effective childNode within this element that
       * match `selector`. These can be dom child nodes or elements distributed
       * to children that are insertion points.
       * @param {string} selector Selector to run.
       * @return {Object<Node>} First effective child node that matches selector.
       */},{key:"queryEffectiveChildren",value:function queryEffectiveChildren(selector){var e$=this.queryDistributedElements(selector);return e$&&e$[0];}/**
       * Returns a list of effective childNodes within this element that
       * match `selector`. These can be dom child nodes or elements distributed
       * to children that are insertion points.
       * @param {string} selector Selector to run.
       * @return {Array<Node>} List of effective child nodes that match selector.
       */},{key:"queryAllEffectiveChildren",value:function queryAllEffectiveChildren(selector){return this.queryDistributedElements(selector);}/**
       * Returns a list of nodes distributed to this element's `<slot>`.
       *
       * If this element contains more than one `<slot>` in its local DOM,
       * an optional selector may be passed to choose the desired content.
       *
       * @param {string=} slctr CSS selector to choose the desired
       *   `<slot>`.  Defaults to `content`.
       * @return {Array<Node>} List of distributed nodes for the `<slot>`.
       */},{key:"getContentChildNodes",value:function getContentChildNodes(slctr){var content=this.root.querySelector(slctr||'slot');return content?Polymer.dom(content).getDistributedNodes():[];}/**
       * Returns a list of element children distributed to this element's
       * `<slot>`.
       *
       * If this element contains more than one `<slot>` in its
       * local DOM, an optional selector may be passed to choose the desired
       * content.  This method differs from `getContentChildNodes` in that only
       * elements are returned.
       *
       * @param {string=} slctr CSS selector to choose the desired
       *   `<content>`.  Defaults to `content`.
       * @return {Array<HTMLElement>} List of distributed nodes for the
       *   `<slot>`.
       */},{key:"getContentChildren",value:function getContentChildren(slctr){return this.getContentChildNodes(slctr).filter(function(n){return n.nodeType===Node.ELEMENT_NODE;});}/**
       * Checks whether an element is in this element's light DOM tree.
       *
       * @param {?Node} node The element to be checked.
       * @return {boolean} true if node is in this element's light DOM tree.
       */},{key:"isLightDescendant",value:function isLightDescendant(node){return this!==node&&this.contains(node)&&this.getRootNode()===node.getRootNode();}/**
       * Checks whether an element is in this element's local DOM tree.
       *
       * @param {HTMLElement=} node The element to be checked.
       * @return {boolean} true if node is in this element's local DOM tree.
       */},{key:"isLocalDescendant",value:function isLocalDescendant(node){return this.root===node.getRootNode();}// NOTE: should now be handled by ShadyCss library.
},{key:"scopeSubtree",value:function scopeSubtree(container,shouldObserve){}// eslint-disable-line no-unused-vars
/**
       * Returns the computed style value for the given property.
       * @param {string} property The css property name.
       * @return {string} Returns the computed css property value for the given
       * `property`.
       */},{key:"getComputedStyleValue",value:function getComputedStyleValue(property){return styleInterface.getComputedStyleValue(this,property);}// debounce
/**
       * Call `debounce` to collapse multiple requests for a named task into
       * one invocation which is made after the wait time has elapsed with
       * no new request.  If no wait time is given, the callback will be called
       * at microtask timing (guaranteed before paint).
       *
       *     debouncedClickAction(e) {
       *       // will not call `processClick` more than once per 100ms
       *       this.debounce('click', function() {
       *        this.processClick();
       *       } 100);
       *     }
       *
       * @param {string} jobName String to indentify the debounce job.
       * @param {function()} callback Function that is called (with `this`
       *   context) when the wait time elapses.
       * @param {number} wait Optional wait time in milliseconds (ms) after the
       *   last signal that must elapse before invoking `callback`
       * @return {Object} Returns a debouncer object on which exists the
       * following methods: `isActive()` returns true if the debouncer is
       * active; `cancel()` cancels the debouncer if it is active;
       * `flush()` immediately invokes the debounced callback if the debouncer
       * is active.
       */},{key:"debounce",value:function debounce(jobName,callback,wait){this._debouncers=this._debouncers||{};return this._debouncers[jobName]=Polymer.Debouncer.debounce(this._debouncers[jobName],wait>0?Polymer.Async.timeOut.after(wait):Polymer.Async.microTask,callback.bind(this));}/**
       * Returns whether a named debouncer is active.
       *
       * @param {string} jobName The name of the debouncer started with `debounce`
       * @return {boolean} Whether the debouncer is active (has not yet fired).
       */},{key:"isDebouncerActive",value:function isDebouncerActive(jobName){this._debouncers=this._debouncers||{};var debouncer=this._debouncers[jobName];return!!(debouncer&&debouncer.isActive());}/**
       * Immediately calls the debouncer `callback` and inactivates it.
       *
       * @param {string} jobName The name of the debouncer started with `debounce`
       */},{key:"flushDebouncer",value:function flushDebouncer(jobName){this._debouncers=this._debouncers||{};var debouncer=this._debouncers[jobName];if(debouncer){debouncer.flush();}}/**
       * Cancels an active debouncer.  The `callback` will not be called.
       *
       * @param {string} jobName The name of the debouncer started with `debounce`
       */},{key:"cancelDebouncer",value:function cancelDebouncer(jobName){this._debouncers=this._debouncers||{};var debouncer=this._debouncers[jobName];if(debouncer){debouncer.cancel();}}/**
       * Runs a callback function asyncronously.
       *
       * By default (if no waitTime is specified), async callbacks are run at
       * microtask timing, which will occur before paint.
       *
       * @param {Function} callback The callback function to run, bound to `this`.
       * @param {number=} waitTime Time to wait before calling the
       *   `callback`.  If unspecified or 0, the callback will be run at microtask
       *   timing (before paint).
       * @return {number} Handle that may be used to cancel the async job.
       */},{key:"async",value:function async(callback,waitTime){return waitTime>0?Polymer.Async.timeOut.run(callback.bind(this),waitTime):~Polymer.Async.microTask.run(callback.bind(this));}/**
       * Cancels an async operation started with `async`.
       *
       * @param {number} handle Handle returned from original `async` call to
       *   cancel.
       */},{key:"cancelAsync",value:function cancelAsync(handle){handle<0?Polymer.Async.microTask.cancel(~handle):Polymer.Async.timeOut.cancel(handle);}// other
/**
       * Convenience method for creating an element and configuring it.
       *
       * @param {string} tag HTML element tag to create.
       * @param {Object} props Object of properties to configure on the
       *    instance.
       * @return {Element} Newly created and configured element.
       */},{key:"create",value:function create(tag,props){var elt=document.createElement(tag);if(props){if(elt.setProperties){elt.setProperties(props);}else{for(var n in props){elt[n]=props[n];}}}return elt;}/**
       * Convenience method for importing an HTML document imperatively.
       *
       * This method creates a new `<link rel="import">` element with
       * the provided URL and appends it to the document to start loading.
       * In the `onload` callback, the `import` property of the `link`
       * element will contain the imported document contents.
       *
       * @param {string} href URL to document to load.
       * @param {Function} onload Callback to notify when an import successfully
       *   loaded.
       * @param {Function} onerror Callback to notify when an import
       *   unsuccessfully loaded.
       * @param {boolean} optAsync True if the import should be loaded `async`.
       *   Defaults to `false`.
       * @return {HTMLLinkElement} The link element for the URL to be loaded.
       */},{key:"importHref",value:function importHref(href,onload,onerror,optAsync){// eslint-disable-line no-unused-vars
var loadFn=onload?onload.bind(this):null;var errorFn=onerror?onerror.bind(this):null;return Polymer.importHref(href,loadFn,errorFn,optAsync);}/**
       * Polyfill for Element.prototype.matches, which is sometimes still
       * prefixed.
       *
       * @param {string} selector Selector to test.
       * @param {Element=} node Element to test the selector against.
       * @return {boolean} Whether the element matches the selector.
       */},{key:"elementMatches",value:function elementMatches(selector,node){return Polymer.dom.matchesSelector(node||this,selector);}/**
       * Toggles an HTML attribute on or off.
       *
       * @param {string} name HTML attribute name
       * @param {boolean=} bool Boolean to force the attribute on or off.
       *    When unspecified, the state of the attribute will be reversed.
       * @param {HTMLElement=} node Node to target.  Defaults to `this`.
       */},{key:"toggleAttribute",value:function toggleAttribute(name,bool,node){node=node||this;if(arguments.length==1){bool=!node.hasAttribute(name);}if(bool){node.setAttribute(name,'');}else{node.removeAttribute(name);}}/**
       * Toggles a CSS class on or off.
       *
       * @param {string} name CSS class name
       * @param {boolean=} bool Boolean to force the class on or off.
       *    When unspecified, the state of the class will be reversed.
       * @param {HTMLElement=} node Node to target.  Defaults to `this`.
       */},{key:"toggleClass",value:function toggleClass(name,bool,node){node=node||this;if(arguments.length==1){bool=!node.classList.contains(name);}if(bool){node.classList.add(name);}else{node.classList.remove(name);}}/**
       * Cross-platform helper for setting an element's CSS `transform` property.
       *
       * @param {string} transformText Transform setting.
       * @param {HTMLElement=} node Element to apply the transform to.
       * Defaults to `this`
       */},{key:"transform",value:function transform(transformText,node){node=node||this;node.style.webkitTransform=transformText;node.style.transform=transformText;}/**
       * Cross-platform helper for setting an element's CSS `translate3d`
       * property.
       *
       * @param {number} x X offset.
       * @param {number} y Y offset.
       * @param {number} z Z offset.
       * @param {HTMLElement=} node Element to apply the transform to.
       * Defaults to `this`.
       */},{key:"translate3d",value:function translate3d(x,y,z,node){node=node||this;this.transform('translate3d('+x+','+y+','+z+')',node);}/**
       * Removes an item from an array, if it exists.
       *
       * If the array is specified by path, a change notification is
       * generated, so that observers, data bindings and computed
       * properties watching that path can update.
       *
       * If the array is passed directly, **no change
       * notification is generated**.
       *
       * @param {string | !Array<number|string>} arrayOrPath Path to array from which to remove the item
       *   (or the array itself).
       * @param {*} item Item to remove.
       * @return {Array} Array containing item removed.
       */},{key:"arrayDelete",value:function arrayDelete(arrayOrPath,item){var index=void 0;if(Array.isArray(arrayOrPath)){index=arrayOrPath.indexOf(item);if(index>=0){return arrayOrPath.splice(index,1);}}else{var arr=Polymer.Path.get(this,arrayOrPath);index=arr.indexOf(item);if(index>=0){return this.splice(arrayOrPath,index,1);}}return null;}// logging
/**
       * Facades `console.log`/`warn`/`error` as override point.
       *
       * @param {string} level One of 'log', 'warn', 'error'
       * @param {Array} args Array of strings or objects to log
       */},{key:"_logger",value:function _logger(level,args){var _console;// accept ['foo', 'bar'] and [['foo', 'bar']]
if(Array.isArray(args)&&args.length===1){args=args[0];}switch(level){case'log':case'warn':case'error':(_console=console)[level].apply(_console,_toConsumableArray(args));}}/**
       * Facades `console.log` as an override point.
       *
       * @param {...*} var_args Array of strings or objects to log
       */},{key:"_log",value:function _log(){for(var _len4=arguments.length,args=Array(_len4),_key4=0;_key4<_len4;_key4++){args[_key4]=arguments[_key4];}this._logger('log',args);}/**
       * Facades `console.warn` as an override point.
       *
       * @param {...*} var_args Array of strings or objects to log
       */},{key:"_warn",value:function _warn(){for(var _len5=arguments.length,args=Array(_len5),_key5=0;_key5<_len5;_key5++){args[_key5]=arguments[_key5];}this._logger('warn',args);}/**
       * Facades `console.error` as an override point.
       *
       * @param {...*} var_args Array of strings or objects to log
       */},{key:"_error",value:function _error(){for(var _len6=arguments.length,args=Array(_len6),_key6=0;_key6<_len6;_key6++){args[_key6]=arguments[_key6];}this._logger('error',args);}/**
       * Formats a message using the element type an a method name.
       *
       * @param {string} methodName Method name to associate with message
       * @param {...*} var_args Array of strings or objects to log
       * @return {string} String with formatting information for `console`
       *   logging.
       */},{key:"_logf",value:function _logf(){for(var _len7=arguments.length,args=Array(_len7),_key7=0;_key7<_len7;_key7++){args[_key7]=arguments[_key7];}return['[%s::%s]',this.is].concat(args);}},{key:"domHost",get:function get(){var root=this.getRootNode();return root instanceof DocumentFragment?root.host:root;}}]);return LegacyElement;}(legacyElementBase);return LegacyElement;});})();(function(){'use strict';var LegacyElementMixin=Polymer.LegacyElementMixin;var metaProps={attached:true,detached:true,ready:true,created:true,beforeRegister:true,registered:true,attributeChanged:true,// meta objects
behaviors:true/**
     * Applies a "legacy" behavior or array of behaviors to the provided class.
     *
     * Note: this method will automatically also apply the `Polymer.LegacyElementMixin`
     * to ensure that any legacy behaviors can rely on legacy Polymer API on
     * the underlying element.
     *
     * @param {Object|Array} behaviors Behavior object or array of behaviors.
     * @param {HTMLElement} klass Element class.
     * @return {HTMLElement} Returns a new Element class extended by the
     * passed in `behaviors` and also by `Polymer.LegacyElementMixin`.
     * @memberof Polymer
     */};function mixinBehaviors(behaviors,klass){if(!behaviors){return klass;}// NOTE: ensure the bahevior is extending a class with
// legacy element api. This is necessary since behaviors expect to be able
// to access 1.x legacy api.
klass=LegacyElementMixin(klass);if(!Array.isArray(behaviors)){behaviors=[behaviors];}var superBehaviors=klass.prototype.behaviors;// get flattened, deduped list of behaviors *not* already on super class
behaviors=flattenBehaviors(behaviors,null,superBehaviors);// mixin new behaviors
klass=_mixinBehaviors(behaviors,klass);if(superBehaviors){behaviors=superBehaviors.concat(behaviors);}// Set behaviors on prototype for BC...
klass.prototype.behaviors=behaviors;return klass;}// NOTE:
// 1.x
// Behaviors were mixed in *in reverse order* and de-duped on the fly.
// The rule was that behavior properties were copied onto the element
// prototype if and only if the property did not already exist.
// Given: Polymer{ behaviors: [A, B, C, A, B]}, property copy order was:
// (1), B, (2), A, (3) C. This means prototype properties win over
// B properties win over A win over C. This mirrors what would happen
// with inheritance if element extended B extended A extended C.
//
// Again given, Polymer{ behaviors: [A, B, C, A, B]}, the resulting
// `behaviors` array was [C, A, B].
// Behavior lifecycle methods were called in behavior array order
// followed by the element, e.g. (1) C.created, (2) A.created,
// (3) B.created, (4) element.created. There was no support for
// super, and "super-behavior" methods were callable only by name).
//
// 2.x
// Behaviors are made into proper mixins which live in the
// element's prototype chain. Behaviors are placed in the element prototype
// eldest to youngest and de-duped youngest to oldest:
// So, first [A, B, C, A, B] becomes [C, A, B] then,
// the element prototype becomes (oldest) (1) Polymer.Element, (2) class(C),
// (3) class(A), (4) class(B), (5) class(Polymer({...})).
// Result:
// This means element properties win over B properties win over A win
// over C. (same as 1.x)
// If lifecycle is called (super then me), order is
// (1) C.created, (2) A.created, (3) B.created, (4) element.created
// (again same as 1.x)
function _mixinBehaviors(behaviors,klass){for(var i=0;i<behaviors.length;i++){var b=behaviors[i];if(b){klass=Array.isArray(b)?_mixinBehaviors(b,klass):GenerateClassFromInfo(b,klass);}}return klass;}/**
     * @param {Array} behaviors List of behaviors to flatten.
     * @param {Array=} list Target list to flatten behaviors into.
     * @param {Array=} exclude List of behaviors to exclude from the list.
     * @return {Array} Returns the list of flattened behaviors.
     */function flattenBehaviors(behaviors,list,exclude){list=list||[];for(var i=behaviors.length-1;i>=0;i--){var b=behaviors[i];if(b){if(Array.isArray(b)){flattenBehaviors(b,list);}else{// dedup
if(list.indexOf(b)<0&&(!exclude||exclude.indexOf(b)<0)){list.unshift(b);}}}else{console.warn('behavior is null, check for missing or 404 import');}}return list;}function GenerateClassFromInfo(info,Base){var PolymerGenerated=function(_Base){_inherits(PolymerGenerated,_Base);function PolymerGenerated(){_classCallCheck(this,PolymerGenerated);return _possibleConstructorReturn(this,(PolymerGenerated.__proto__||Object.getPrototypeOf(PolymerGenerated)).apply(this,arguments));}_createClass(PolymerGenerated,[{key:"created",value:function created(){_get(PolymerGenerated.prototype.__proto__||Object.getPrototypeOf(PolymerGenerated.prototype),"created",this).call(this);if(info.created){info.created.call(this);}}},{key:"_registered",value:function _registered(){_get(PolymerGenerated.prototype.__proto__||Object.getPrototypeOf(PolymerGenerated.prototype),"_registered",this).call(this);/* NOTE: `beforeRegister` is called here for bc, but the behavior
           is different than in 1.x. In 1.0, the method was called *after*
           mixing prototypes together but *before* processing of meta-objects.
           However, dynamic effects can still be set here and can be done either
           in `beforeRegister` or `registered`. It is no longer possible to set
           `is` in `beforeRegister` as you could in 1.x.
          */if(info.beforeRegister){info.beforeRegister.call(Object.getPrototypeOf(this));}if(info.registered){info.registered.call(Object.getPrototypeOf(this));}}},{key:"_applyListeners",value:function _applyListeners(){_get(PolymerGenerated.prototype.__proto__||Object.getPrototypeOf(PolymerGenerated.prototype),"_applyListeners",this).call(this);if(info.listeners){for(var l in info.listeners){this._addMethodEventListenerToNode(this,l,info.listeners[l]);}}}// note: exception to "super then me" rule;
// do work before calling super so that super attributes
// only apply if not already set.
},{key:"_ensureAttributes",value:function _ensureAttributes(){if(info.hostAttributes){for(var a in info.hostAttributes){this._ensureAttribute(a,info.hostAttributes[a]);}}_get(PolymerGenerated.prototype.__proto__||Object.getPrototypeOf(PolymerGenerated.prototype),"_ensureAttributes",this).call(this);}},{key:"ready",value:function ready(){_get(PolymerGenerated.prototype.__proto__||Object.getPrototypeOf(PolymerGenerated.prototype),"ready",this).call(this);if(info.ready){info.ready.call(this);}}},{key:"attached",value:function attached(){_get(PolymerGenerated.prototype.__proto__||Object.getPrototypeOf(PolymerGenerated.prototype),"attached",this).call(this);if(info.attached){info.attached.call(this);}}},{key:"detached",value:function detached(){_get(PolymerGenerated.prototype.__proto__||Object.getPrototypeOf(PolymerGenerated.prototype),"detached",this).call(this);if(info.detached){info.detached.call(this);}}},{key:"attributeChanged",value:function attributeChanged(name,old,value){_get(PolymerGenerated.prototype.__proto__||Object.getPrototypeOf(PolymerGenerated.prototype),"attributeChanged",this).call(this,name,old,value);if(info.attributeChanged){info.attributeChanged.call(this,name,old,value);}}}],[{key:"properties",get:function get(){return info.properties;}},{key:"observers",get:function get(){return info.observers;}},{key:"template",get:function get(){// get template first from any imperative set in `info._template`
return info._template||// next look in dom-module associated with this element's is.
Polymer.DomModule.import(this.is,'template')||// next look for superclass template (note: use superclass symbol
// to ensure correct `this.is`)
Base.template||// finally fall back to `_template` in element's protoype.
this.prototype._template;}}]);return PolymerGenerated;}(Base);PolymerGenerated.generatedFrom=info;for(var p in info){// NOTE: cannot copy `metaProps` methods onto prototype at least because
// `super.ready` must be called and is not included in the user fn.
if(!(p in metaProps)){var pd=Object.getOwnPropertyDescriptor(info,p);if(pd){Object.defineProperty(PolymerGenerated.prototype,p,pd);}}}return PolymerGenerated;}/**
     * Generates a class that extends `Polymer.LegacyElement` based on the
     * provided info object.  Metadata objects on the `info` object
     * (`properties`, `observers`, `listeners`, `behaviors`, `is`) are used
     * for Polymer's meta-programming systems, and any functions are copied
     * to the generated class.
     *
     * Valid "metadata" values are as follows:
     *
     * `is`: String providing the tag name to register the element under. In
     * addition, if a `dom-module` with the same id exists, the first template
     * in that `dom-module` will be stamped into the shadow root of this element,
     * with support for declarative event listeners (`on-...`), Polymer data
     * bindings (`[[...]]` and `{{...}}`), and id-based node finding into
     * `this.$`.
     *
     * `properties`: Object describing property-related metadata used by Polymer
     * features (key: property names, value: object containing property metadata).
     * Valid keys in per-property metadata include:
     * - `type` (String|Number|Object|Array|...): Used by
     *   `attributeChangedCallback` to determine how string-based attributes
     *   are deserialized to JavaScript property values.
     * - `notify` (boolean): Causes a change in the property to fire a
     *   non-bubbling event called `<property>-changed`. Elements that have
     *   enabled two-way binding to the property use this event to observe changes.
     * - `readOnly` (boolean): Creates a getter for the property, but no setter.
     *   To set a read-only property, use the private setter method
     *   `_setProperty(property, value)`.
     * - `observer` (string): Observer method name that will be called when
     *   the property changes. The arguments of the method are
     *   `(value, previousValue)`.
     * - `computed` (string): String describing method and dependent properties
     *   for computing the value of this property (e.g. `'computeFoo(bar, zot)'`).
     *   Computed properties are read-only by default and can only be changed
     *   via the return value of the computing method.
     *
     * `observers`: Array of strings describing multi-property observer methods
     *  and their dependent properties (e.g. `'observeABC(a, b, c)'`).
     *
     * `listeners`: Object describing event listeners to be added to each
     *  instance of this element (key: event name, value: method name).
     *
     * `behaviors`: Array of additional `info` objects containing metadata
     * and callbacks in the same format as the `info` object here which are
     * merged into this element.
     *
     * `hostAttributes`: Object listing attributes to be applied to the host
     *  once created (key: attribute name, value: attribute value).  Values
     *  are serialized based on the type of the value.  Host attributes should
     *  generally be limited to attributes such as `tabIndex` and `aria-...`.
     *  Attributes in `hostAttributes` are only applied if a user-supplied
     *  attribute is not already present (attributes in markup override
     *  `hostAttributes`).
     *
     * In addition, the following Polymer-specific callbacks may be provided:
     * - `registered`: called after first instance of this element,
     * - `created`: called during `constructor`
     * - `attached`: called during `connectedCallback`
     * - `detached`: called during `disconnectedCallback`
     * - `ready`: called before first `attached`, after all properties of
     *   this element have been propagated to its template and all observers
     *   have run
     *
     * @param {Object} info Object containing Polymer metadata and functions
     *   to become class methods.
     * @return {Polymer.LegacyElement} Generated class
     * @memberof Polymer
     */Polymer.Class=function(info){if(!info){console.warn('Polymer.Class requires `info` argument');}var klass=GenerateClassFromInfo(info,info.behaviors?// note: mixinBehaviors ensures `LegacyElementMixin`.
mixinBehaviors(info.behaviors,HTMLElement):LegacyElementMixin(HTMLElement));// decorate klass with registration info
klass.is=info.is;return klass;};Polymer.mixinBehaviors=mixinBehaviors;})();(function(){'use strict';/**
     * Legacy class factory and registration helper for defining Polymer
     * elements.
     *
     * This method is equivalent to
     * `customElements.define(info.is, Polymer.Class(info));`
     *
     * See `Polymer.Class` for details on valid legacy metadata format for `info`.
     *
     * @override
     * @function Polymer
     * @param {Object} info Object containing Polymer metadata and functions
     *   to become class methods.
     * @return {Polymer.LegacyElement} Generated class
     */window.Polymer._polymerFn=function(info){// if input is a `class` (aka a function with a prototype), use the prototype
// remember that the `constructor` will never be called
var klass=void 0;if(typeof info==='function'){klass=info;}else{klass=Polymer.Class(info);}customElements.define(klass.is,klass);return klass;};})();(function(){'use strict';/**
     * The `Polymer.Templatizer` behavior adds methods to generate instances of
     * templates that are each managed by an anonymous `Polymer.PropertyEffects`
     * instance where data-bindings in the stamped template content are bound to
     * accessors on itself.
     *
     * This behavior is provided in Polymer 2.x as a hybrid-element convenience
     * only.  For non-hybrid usage, the `Polymer.Templatize` library
     * should be used instead.
     *
     * Example:
     *
     *     // Get a template from somewhere, e.g. light DOM
     *     let template = this.querySelector('template');
     *     // Prepare the template
     *     this.templatize(template);
     *     // Instance the template with an initial data model
     *     let instance = this.stamp({myProp: 'initial'});
     *     // Insert the instance's DOM somewhere, e.g. light DOM
     *     Polymer.dom(this).appendChild(instance.root);
     *     // Changing a property on the instance will propagate to bindings
     *     // in the template
     *     instance.myProp = 'new value';
     *
     * Users of `Templatizer` may need to implement the following abstract
     * API's to determine how properties and paths from the host should be
     * forwarded into to instances:
     *
     *     _forwardHostPropV2: function(prop, value)
     *
     * Likewise, users may implement these additional abstract API's to determine
     * how instance-specific properties that change on the instance should be
     * forwarded out to the host, if necessary.
     *
     *     _notifyInstancePropV2: function(inst, prop, value)
     *
     * In order to determine which properties are instance-specific and require
     * custom notification via `_notifyInstanceProp`, define an `_instanceProps`
     * object containing keys for each instance prop, for example:
     *
     *     _instanceProps: {
     *       item: true,
     *       index: true
     *     }
     *
     * Any properties used in the template that are not defined in _instanceProp
     * will be forwarded out to the Templatize `owner` automatically.
     *
     * Users may also implement the following abstract function to show or
     * hide any DOM generated using `stamp`:
     *
     *     _showHideChildren: function(shouldHide)
     *
     * Note that some callbacks are suffixed with `V2` in the Polymer 2.x behavior
     * as the implementations will need to differ from the callbacks required
     * by the 1.x Templatizer API due to changes in the `TemplateInstance` API
     * between versions 1.x and 2.x.
     *
     * @polymerBehavior
     * @memberof Polymer
     */var Templatizer={/**
       * Generates an anonymous `TemplateInstance` class (stored as `this.ctor`)
       * for the provided template.  This method should be called once per
       * template to prepare an element for stamping the template, followed
       * by `stamp` to create new instances of the template.
       *
       * @param {HTMLTemplateElement} template Template to prepare
       * @param {boolean=} mutableData When `true`, the generated class will skip
       *   strict dirty-checking for objects and arrays (always consider them to
       *   be "dirty"). Defaults to false.
       */templatize:function templatize(template,mutableData){this._templatizerTemplate=template;this.ctor=Polymer.Templatize.templatize(template,this,{mutableData:Boolean(mutableData),parentModel:this._parentModel,instanceProps:this._instanceProps,forwardHostProp:this._forwardHostPropV2,notifyInstanceProp:this._notifyInstancePropV2});},/**
       * Creates an instance of the template prepared by `templatize`.  The object
       * returned is an instance of the anonymous class generated by `templatize`
       * whose `root` property is a document fragment containing newly cloned
       * template content, and which has property accessors corresponding to
       * properties referenced in template bindings.
       *
       * @param {Object=} model Object containing initial property values to
       *   populate into the template bindings.
       * @return {TemplateInstanceBase} Returns the created instance of
       * the template prepared by `templatize`.
       */stamp:function stamp(model){return new this.ctor(model);},/**
       * Returns the template "model" (`TemplateInstance`) associated with
       * a given element, which serves as the binding scope for the template
       * instance the element is contained in.  A template model should be used
       * to manipulate data associated with this template instance.
       *
       * @param {HTMLElement} el Element for which to return a template model.
       * @return {TemplateInstanceBase} Model representing the binding scope for
       *   the element.
       */modelForElement:function modelForElement(el){return Polymer.Templatize.modelForElement(this._templatizerTemplate,el);}};Polymer.Templatizer=Templatizer;})();(function(){'use strict';/**
     * @constructor
     * @implements {Polymer_PropertyEffects}
     * @implements {Polymer_OptionalMutableData}
     * @implements {Polymer_GestureEventListener}
     * @extends {HTMLElement}
     */var domBindBase=Polymer.GestureEventListeners(Polymer.OptionalMutableData(Polymer.PropertyEffects(HTMLElement)));/**
     * Custom element to allow using Polymer's template features (data binding,
     * declarative event listeners, etc.) in the main document without defining
     * a new custom element.
     *
     * `<template>` tags utilizing bindings may be wrapped with the `<dom-bind>`
     * element, which will immediately stamp the wrapped template into the main
     * document and bind elements to the `dom-bind` element itself as the
     * binding scope.
     *
     * @extends HTMLElement
     * @mixes Polymer.PropertyEffects
     * @memberof Polymer
     * @summary Custom element to allow using Polymer's template features (data
     *   binding, declarative event listeners, etc.) in the main document.
     */var DomBind=function(_domBindBase){_inherits(DomBind,_domBindBase);function DomBind(){_classCallCheck(this,DomBind);return _possibleConstructorReturn(this,(DomBind.__proto__||Object.getPrototypeOf(DomBind)).apply(this,arguments));}_createClass(DomBind,[{key:"attributeChangedCallback",// assumes only one observed attribute
value:function attributeChangedCallback(){this.mutableData=true;}},{key:"connectedCallback",value:function connectedCallback(){this.render();}},{key:"disconnectedCallback",value:function disconnectedCallback(){this.__removeChildren();}},{key:"__insertChildren",value:function __insertChildren(){this.parentNode.insertBefore(this.root,this);}},{key:"__removeChildren",value:function __removeChildren(){if(this.__children){for(var i=0;i<this.__children.length;i++){this.root.appendChild(this.__children[i]);}}}/**
       * Forces the element to render its content. This is typically only
       * necessary to call if HTMLImports with the async attribute are used.
       */},{key:"render",value:function render(){var _this27=this;var template=void 0;if(!this.__children){template=template||this.querySelector('template');if(!template){// Wait until childList changes and template should be there by then
var observer=new MutationObserver(function(){template=_this27.querySelector('template');if(template){observer.disconnect();_this27.render(template);}else{throw new Error('dom-bind requires a <template> child');}});observer.observe(this,{childList:true});return;}this.root=this._stampTemplate(template);this.$=this.root.$;this.__children=[];for(var n=this.root.firstChild;n;n=n.nextSibling){this.__children[this.__children.length]=n;}this._enableProperties();}this.__insertChildren();this.dispatchEvent(new CustomEvent('dom-change',{bubbles:true,composed:true}));}}],[{key:"observedAttributes",get:function get(){return['mutable-data'];}}]);return DomBind;}(domBindBase);customElements.define('dom-bind',DomBind);})();(function(){'use strict';/**
   * The `<dom-if>` element will stamp a light-dom `<template>` child when
   * the `if` property becomes truthy, and the template can use Polymer
   * data-binding and declarative event features when used in the context of
   * a Polymer element's template.
   *
   * When `if` becomes falsey, the stamped content is hidden but not
   * removed from dom. When `if` subsequently becomes truthy again, the content
   * is simply re-shown. This approach is used due to its favorable performance
   * characteristics: the expense of creating template content is paid only
   * once and lazily.
   *
   * Set the `restamp` property to true to force the stamped content to be
   * created / destroyed when the `if` condition changes.
   *
   * @polymerElement
   * @extends Polymer.Element
   * @memberof Polymer
   * @summary Custom element that conditionally stamps and hides or removes
   *   template content based on a boolean flag.
   */var DomIf=function(_Polymer$Element){_inherits(DomIf,_Polymer$Element);_createClass(DomIf,null,[{key:"is",// Not needed to find template; can be removed once the analyzer
// can find the tag name from customElements.define call
get:function get(){return'dom-if';}},{key:"template",get:function get(){return null;}},{key:"properties",get:function get(){return{/**
         * Fired whenever DOM is added or removed/hidden by this template (by
         * default, rendering occurs lazily).  To force immediate rendering, call
         * `render`.
         *
         * @event dom-change
         *//**
         * A boolean indicating whether this template should stamp.
         */if:{type:Boolean,observer:'__debounceRender'},/**
         * When true, elements will be removed from DOM and discarded when `if`
         * becomes false and re-created and added back to the DOM when `if`
         * becomes true.  By default, stamped elements will be hidden but left
         * in the DOM when `if` becomes false, which is generally results
         * in better performance.
         */restamp:{type:Boolean,observer:'__debounceRender'}};}}]);function DomIf(){_classCallCheck(this,DomIf);var _this28=_possibleConstructorReturn(this,(DomIf.__proto__||Object.getPrototypeOf(DomIf)).call(this));_this28.__renderDebouncer=null;_this28.__invalidProps=null;_this28.__instance=null;return _this28;}_createClass(DomIf,[{key:"__debounceRender",value:function __debounceRender(){var _this29=this;// Render is async for 2 reasons:
// 1. To eliminate dom creation trashing if user code thrashes `if` in the
//    same turn. This was more common in 1.x where a compound computed
//    property could result in the result changing multiple times, but is
//    mitigated to a large extent by batched property processing in 2.x.
// 2. To avoid double object propagation when a bag including values bound
//    to the `if` property as well as one or more hostProps could enqueue
//    the <dom-if> to flush before the <template>'s host property
//    forwarding. In that scenario creating an instance would result in
//    the host props being set once, and then the enqueued changes on the
//    template would set properties a second time, potentially causing an
//    object to be set to an instance more than once.  Creating the
//    instance async from flushing data ensures this doesn't happen. If
//    we wanted a sync option in the future, simply having <dom-if> flush
//    (or clear) its template's pending host properties before creating
//    the instance would also avoid the problem.
this.__renderDebouncer=Polymer.Debouncer.debounce(this.__renderDebouncer,Polymer.Async.microTask,function(){return _this29.__render();});Polymer.enqueueDebouncer(this.__renderDebouncer);}},{key:"disconnectedCallback",value:function disconnectedCallback(){_get(DomIf.prototype.__proto__||Object.getPrototypeOf(DomIf.prototype),"disconnectedCallback",this).call(this);if(!this.parentNode||this.parentNode.nodeType==Node.DOCUMENT_FRAGMENT_NODE&&!this.parentNode.host){this.__teardownInstance();}}},{key:"connectedCallback",value:function connectedCallback(){_get(DomIf.prototype.__proto__||Object.getPrototypeOf(DomIf.prototype),"connectedCallback",this).call(this);if(this.if){this.__debounceRender();}}/**
     * Forces the element to render its content. Normally rendering is
     * asynchronous to a provoking change. This is done for efficiency so
     * that multiple changes trigger only a single render. The render method
     * should be called if, for example, template rendering is required to
     * validate application state.
     */},{key:"render",value:function render(){Polymer.flush();}},{key:"__render",value:function __render(){if(this.if){if(!this.__ensureInstance()){// No template found yet
return;}this._showHideChildren();}else if(this.restamp){this.__teardownInstance();}if(!this.restamp&&this.__instance){this._showHideChildren();}if(this.if!=this._lastIf){this.dispatchEvent(new CustomEvent('dom-change',{bubbles:true,composed:true}));this._lastIf=this.if;}}},{key:"__ensureInstance",value:function __ensureInstance(){var _this30=this;var parentNode=this.parentNode;// Guard against element being detached while render was queued
if(parentNode){if(!this.__ctor){var template=this.querySelector('template');if(!template){// Wait until childList changes and template should be there by then
var observer=new MutationObserver(function(){if(_this30.querySelector('template')){observer.disconnect();_this30.__render();}else{throw new Error('dom-if requires a <template> child');}});observer.observe(this,{childList:true});return false;}this.__ctor=Polymer.Templatize.templatize(template,this,{// dom-if templatizer instances require `mutable: true`, as
// `__syncHostProperties` relies on that behavior to sync objects
mutableData:true,forwardHostProp:function forwardHostProp(prop,value){if(this.__instance){if(this.if){this.__instance.forwardHostProp(prop,value);}else{// If we have an instance but are squelching host property
// forwarding due to if being false, note the invalidated
// properties so `__syncHostProperties` can sync them the next
// time `if` becomes true
this.__invalidProps=this.__invalidProps||Object.create(null);this.__invalidProps[Polymer.Path.root(prop)]=true;}}}});}if(!this.__instance){this.__instance=new this.__ctor();parentNode.insertBefore(this.__instance.root,this);}else{this.__syncHostProperties();var c$=this.__instance.children;if(c$&&c$.length){// Detect case where dom-if was re-attached in new position
var lastChild=this.previousSibling;if(lastChild!==c$[c$.length-1]){for(var i=0,n;i<c$.length&&(n=c$[i]);i++){parentNode.insertBefore(n,this);}}}}}return true;}},{key:"__syncHostProperties",value:function __syncHostProperties(){var props=this.__invalidProps;if(props){for(var prop in props){this.__instance._setPendingProperty(prop,this.__dataHost[prop]);}this.__invalidProps=null;this.__instance._flushProperties();}}},{key:"__teardownInstance",value:function __teardownInstance(){if(this.__instance){var c$=this.__instance.children;if(c$&&c$.length){// use first child parent, for case when dom-if may have been detached
var parent=c$[0].parentNode;for(var i=0,n;i<c$.length&&(n=c$[i]);i++){parent.removeChild(n);}}this.__instance=null;this.__invalidProps=null;}}},{key:"_showHideChildren",value:function _showHideChildren(){var hidden=this.__hideTemplateChildren__||!this.if;if(this.__instance){this.__instance._showHideChildren(hidden);}}}]);return DomIf;}(Polymer.Element);customElements.define(DomIf.is,DomIf);Polymer.DomIf=DomIf;})();(function(){'use strict';/**
   * Element mixin for recording  dynamic associations between item paths in a
   * master `items` array and a `selected` array such that path changes to the
   * master array (at the host) element or elsewhere via data-binding) are
   * correctly propagated to items in the selected array and vice-versa.
   *
   * The `items` property accepts an array of user data, and via the
   * `select(item)` and `deselect(item)` API, updates the `selected` property
   * which may be bound to other parts of the application, and any changes to
   * sub-fields of `selected` item(s) will be kept in sync with items in the
   * `items` array.  When `multi` is false, `selected` is a property
   * representing the last selected item.  When `multi` is true, `selected`
   * is an array of multiply selected items.
   *
   * @polymerMixin
   * @memberof Polymer
   */var ArraySelectorMixin=Polymer.dedupingMixin(function(superClass){/**
     * @polymerMixinClass
     * @implements {Polymer_ArraySelectorMixin}
     */var ArraySelectorMixin=function(_superClass6){_inherits(ArraySelectorMixin,_superClass6);_createClass(ArraySelectorMixin,null,[{key:"properties",get:function get(){return{/**
           * An array containing items from which selection will be made.
           */items:{type:Array},/**
           * When `true`, multiple items may be selected at once (in this case,
           * `selected` is an array of currently selected items).  When `false`,
           * only one item may be selected at a time.
           */multi:{type:Boolean,value:false},/**
           * When `multi` is true, this is an array that contains any selected.
           * When `multi` is false, this is the currently selected item, or `null`
           * if no item is selected.
           */selected:{type:Object,notify:true},/**
           * When `multi` is false, this is the currently selected item, or `null`
           * if no item is selected.
           */selectedItem:{type:Object,notify:true},/**
           * When `true`, calling `select` on an item that is already selected
           * will deselect the item.
           */toggle:{type:Boolean,value:false}};}},{key:"observers",get:function get(){return['__updateSelection(multi, items.*)'];}}]);function ArraySelectorMixin(){_classCallCheck(this,ArraySelectorMixin);var _this31=_possibleConstructorReturn(this,(ArraySelectorMixin.__proto__||Object.getPrototypeOf(ArraySelectorMixin)).call(this));_this31.__lastItems=null;_this31.__lastMulti=null;_this31.__selectedMap=null;return _this31;}_createClass(ArraySelectorMixin,[{key:"__updateSelection",value:function __updateSelection(multi,itemsInfo){var path=itemsInfo.path;if(path=='items'){// Case 1 - items array changed, so diff against previous array and
// deselect any removed items and adjust selected indices
var newItems=itemsInfo.base||[];var lastItems=this.__lastItems;var lastMulti=this.__lastMulti;if(multi!==lastMulti){this.clearSelection();}if(lastItems){var splices=Polymer.ArraySplice.calculateSplices(newItems,lastItems);this.__applySplices(splices);}this.__lastItems=newItems;this.__lastMulti=multi;}else if(itemsInfo.path=='items.splices'){// Case 2 - got specific splice information describing the array mutation:
// deselect any removed items and adjust selected indices
this.__applySplices(itemsInfo.value.indexSplices);}else{// Case 3 - an array element was changed, so deselect the previous
// item for that index if it was previously selected
var part=path.slice('items.'.length);var idx=parseInt(part,10);if(part.indexOf('.')<0&&part==idx){this.__deselectChangedIdx(idx);}}}},{key:"__applySplices",value:function __applySplices(splices){var _this32=this;var selected=this.__selectedMap;// Adjust selected indices and mark removals
var _loop4=function _loop4(i){var s=splices[i];selected.forEach(function(idx,item){if(idx<s.index){// no change
}else if(idx>=s.index+s.removed.length){// adjust index
selected.set(item,idx+s.addedCount-s.removed.length);}else{// remove index
selected.set(item,-1);}});for(var j=0;j<s.addedCount;j++){var idx=s.index+j;if(selected.has(_this32.items[idx])){selected.set(_this32.items[idx],idx);}}};for(var i=0;i<splices.length;i++){_loop4(i);}// Update linked paths
this.__updateLinks();// Remove selected items that were removed from the items array
var sidx=0;selected.forEach(function(idx,item){if(idx<0){if(_this32.multi){_this32.splice('selected',sidx,1);}else{_this32.selected=_this32.selectedItem=null;}selected.delete(item);}else{sidx++;}});}},{key:"__updateLinks",value:function __updateLinks(){var _this33=this;this.__dataLinkedPaths={};if(this.multi){var sidx=0;this.__selectedMap.forEach(function(idx){if(idx>=0){_this33.linkPaths('items.'+idx,'selected.'+sidx++);}});}else{this.__selectedMap.forEach(function(idx){_this33.linkPaths('selected','items.'+idx);_this33.linkPaths('selectedItem','items.'+idx);});}}/**
       * Clears the selection state.
       *
       */},{key:"clearSelection",value:function clearSelection(){// Unbind previous selection
this.__dataLinkedPaths={};// The selected map stores 3 pieces of information:
// key: items array object
// value: items array index
// order: selected array index
this.__selectedMap=new Map();// Initialize selection
this.selected=this.multi?[]:null;this.selectedItem=null;}/**
       * Returns whether the item is currently selected.
       *
       * @param {*} item Item from `items` array to test
       * @return {boolean} Whether the item is selected
       */},{key:"isSelected",value:function isSelected(item){return this.__selectedMap.has(item);}/**
       * Returns whether the item is currently selected.
       *
       * @param {*} idx Index from `items` array to test
       * @return {boolean} Whether the item is selected
       */},{key:"isIndexSelected",value:function isIndexSelected(idx){return this.isSelected(this.items[idx]);}},{key:"__deselectChangedIdx",value:function __deselectChangedIdx(idx){var _this34=this;var sidx=this.__selectedIndexForItemIndex(idx);if(sidx>=0){var i=0;this.__selectedMap.forEach(function(idx,item){if(sidx==i++){_this34.deselect(item);}});}}},{key:"__selectedIndexForItemIndex",value:function __selectedIndexForItemIndex(idx){var selected=this.__dataLinkedPaths['items.'+idx];if(selected){return parseInt(selected.slice('selected.'.length),10);}}/**
       * Deselects the given item if it is already selected.
       *
       * @param {*} item Item from `items` array to deselect
       */},{key:"deselect",value:function deselect(item){var idx=this.__selectedMap.get(item);if(idx>=0){this.__selectedMap.delete(item);var sidx=void 0;if(this.multi){sidx=this.__selectedIndexForItemIndex(idx);}this.__updateLinks();if(this.multi){this.splice('selected',sidx,1);}else{this.selected=this.selectedItem=null;}}}/**
       * Deselects the given index if it is already selected.
       *
       * @param {number} idx Index from `items` array to deselect
       */},{key:"deselectIndex",value:function deselectIndex(idx){this.deselect(this.items[idx]);}/**
       * Selects the given item.  When `toggle` is true, this will automatically
       * deselect the item if already selected.
       *
       * @param {*} item Item from `items` array to select
       */},{key:"select",value:function select(item){this.selectIndex(this.items.indexOf(item));}/**
       * Selects the given index.  When `toggle` is true, this will automatically
       * deselect the item if already selected.
       *
       * @param {number} idx Index from `items` array to select
       */},{key:"selectIndex",value:function selectIndex(idx){var item=this.items[idx];if(!this.isSelected(item)){if(!this.multi){this.__selectedMap.clear();}this.__selectedMap.set(item,idx);this.__updateLinks();if(this.multi){this.push('selected',item);}else{this.selected=this.selectedItem=item;}}else if(this.toggle){this.deselectIndex(idx);}}}]);return ArraySelectorMixin;}(superClass);return ArraySelectorMixin;});// export mixin
Polymer.ArraySelectorMixin=ArraySelectorMixin;/**
   * @constructor
   * @extends {Polymer.Element}
   * @implements {Polymer_ArraySelectorMixin}
   */var baseArraySelector=ArraySelectorMixin(Polymer.Element);/**
   * Element implementing the `Polymer.ArraySelector` mixin, which records
   * dynamic associations between item paths in a master `items` array and a
   * `selected` array such that path changes to the master array (at the host)
   * element or elsewhere via data-binding) are correctly propagated to items
   * in the selected array and vice-versa.
   *
   * The `items` property accepts an array of user data, and via the
   * `select(item)` and `deselect(item)` API, updates the `selected` property
   * which may be bound to other parts of the application, and any changes to
   * sub-fields of `selected` item(s) will be kept in sync with items in the
   * `items` array.  When `multi` is false, `selected` is a property
   * representing the last selected item.  When `multi` is true, `selected`
   * is an array of multiply selected items.
   *
   * Example:
   *
   * ```html
   * <dom-module id="employee-list">
   *
   *   <template>
   *
   *     <div> Employee list: </div>
   *     <template is="dom-repeat" id="employeeList" items="{{employees}}">
   *         <div>First name: <span>{{item.first}}</span></div>
   *         <div>Last name: <span>{{item.last}}</span></div>
   *         <button on-click="toggleSelection">Select</button>
   *     </template>
   *
   *     <array-selector id="selector" items="{{employees}}" selected="{{selected}}" multi toggle></array-selector>
   *
   *     <div> Selected employees: </div>
   *     <template is="dom-repeat" items="{{selected}}">
   *         <div>First name: <span>{{item.first}}</span></div>
   *         <div>Last name: <span>{{item.last}}</span></div>
   *     </template>
   *
   *   </template>
   *
   * </dom-module>
   * ```
   *
   * ```js
   * Polymer({
   *   is: 'employee-list',
   *   ready() {
   *     this.employees = [
   *         {first: 'Bob', last: 'Smith'},
   *         {first: 'Sally', last: 'Johnson'},
   *         ...
   *     ];
   *   },
   *   toggleSelection(e) {
   *     let item = this.$.employeeList.itemForElement(e.target);
   *     this.$.selector.select(item);
   *   }
   * });
   * ```
   *
   * @polymerElement
   * @extends Polymer.Element
   * @mixes Polymer.ArraySelectorMixin
   * @memberof Polymer
   * @summary Custom element that links paths between an input `items` array and
   *   an output `selected` item or array based on calls to its selection API.
   */var ArraySelector=function(_baseArraySelector){_inherits(ArraySelector,_baseArraySelector);function ArraySelector(){_classCallCheck(this,ArraySelector);return _possibleConstructorReturn(this,(ArraySelector.__proto__||Object.getPrototypeOf(ArraySelector)).apply(this,arguments));}_createClass(ArraySelector,null,[{key:"is",// Not needed to find template; can be removed once the analyzer
// can find the tag name from customElements.define call
get:function get(){return'array-selector';}}]);return ArraySelector;}(baseArraySelector);customElements.define(ArraySelector.is,ArraySelector);Polymer.ArraySelector=ArraySelector;})();(function(){/*

Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/'use strict';var c=!(window.ShadyDOM&&window.ShadyDOM.inUse),f;function g(a){f=a&&a.shimcssproperties?!1:c||!(navigator.userAgent.match("AppleWebKit/601")||!window.CSS||!CSS.supports||!CSS.supports("box-shadow","0 0 0 var(--foo)"));}window.ShadyCSS&&void 0!==window.ShadyCSS.nativeCss?f=window.ShadyCSS.nativeCss:window.ShadyCSS?(g(window.ShadyCSS),window.ShadyCSS=void 0):g(window.WebComponents&&window.WebComponents.flags);var h=f;function k(a,b){for(var d in b){null===d?a.style.removeProperty(d):a.style.setProperty(d,b[d]);}};var l=null,m=window.HTMLImports&&window.HTMLImports.whenReady||null,q;function r(){var a=t;requestAnimationFrame(function(){m?m(a):(l||(l=new Promise(function(a){q=a;}),"complete"===document.readyState?q():document.addEventListener("readystatechange",function(){"complete"===document.readyState&&q();})),l.then(function(){a&&a();}));});};var u=null,t=null;function v(){this.customStyles=[];this.enqueued=!1;}function x(a){!a.enqueued&&t&&(a.enqueued=!0,r());}v.prototype.c=function(a){a.__seenByShadyCSS||(a.__seenByShadyCSS=!0,this.customStyles.push(a),x(this));};v.prototype.b=function(a){if(a.__shadyCSSCachedStyle)return a.__shadyCSSCachedStyle;var b;a.getStyle?b=a.getStyle():b=a;return b;};v.prototype.a=function(){for(var a=this.customStyles,b=0;b<a.length;b++){var d=a[b];if(!d.__shadyCSSCachedStyle){var e=this.b(d);if(e){var n=e.__appliedElement;if(n)for(var p=0;p<e.attributes.length;p++){var w=e.attributes[p];n.setAttribute(w.name,w.value);}e=n||e;u&&u(e);d.__shadyCSSCachedStyle=e;}}}return a;};v.prototype.addCustomStyle=v.prototype.c;v.prototype.getStyleForCustomStyle=v.prototype.b;v.prototype.processStyles=v.prototype.a;Object.defineProperties(v.prototype,{transformCallback:{get:function get(){return u;},set:function set(a){u=a;}},validateCallback:{get:function get(){return t;},set:function set(a){var b=!1;t||(b=!0);t=a;b&&x(this);}}});var y=new v();window.ShadyCSS||(window.ShadyCSS={prepareTemplate:function prepareTemplate(){},styleSubtree:function styleSubtree(a,b){y.a();k(a,b);},styleElement:function styleElement(){y.a();},styleDocument:function styleDocument(a){y.a();k(document.body,a);},getComputedStyleValue:function getComputedStyleValue(a,b){return(a=window.getComputedStyle(a).getPropertyValue(b))?a.trim():"";},nativeCss:h,nativeShadow:c});window.ShadyCSS.CustomStyleInterface=y;}).call(undefined);//# sourceMappingURL=custom-style-interface.min.js.map
(function(){'use strict';var attr='include';var CustomStyleInterface=window.ShadyCSS.CustomStyleInterface;/**
   * Custom element for defining styles in the main document that can take
   * advantage of several special features of Polymer's styling system:
   *
   * - Document styles defined in a custom-style are shimmed to ensure they
   *   do not leak into local DOM when running on browsers without native
   *   Shadow DOM.
   * - Custom properties used by Polymer's shim for cross-scope styling may
   *   be defined in an custom-style. Use the :root selector to define custom
   *   properties that apply to all custom elements.
   *
   * To use, simply wrap an inline `<style>` tag in the main document whose
   * CSS uses these features with a `<custom-style>` element.
   *
   * @extends HTMLElement
   * @memberof Polymer
   * @summary Custom element for defining styles in the main document that can
   *   take advantage of Polymer's style scoping and custom properties shims.
   */var CustomStyle=function(_HTMLElement2){_inherits(CustomStyle,_HTMLElement2);function CustomStyle(){_classCallCheck(this,CustomStyle);var _this36=_possibleConstructorReturn(this,(CustomStyle.__proto__||Object.getPrototypeOf(CustomStyle)).call(this));_this36._style=null;CustomStyleInterface.addCustomStyle(_this36);return _this36;}/**
     * Returns the light-DOM `<style>` child this element wraps.  Upon first
     * call any style modules referenced via the `include` attribute will be
     * concatenated to this element's `<style>`.
     *
     * @return {HTMLStyleElement} This element's light-DOM `<style>`
     */_createClass(CustomStyle,[{key:"getStyle",value:function getStyle(){if(this._style){return this._style;}var style=this.querySelector('style');if(!style){return;}this._style=style;var include=style.getAttribute(attr);if(include){style.removeAttribute(attr);style.textContent=Polymer.StyleGather.cssFromModules(include)+style.textContent;}return this._style;}}]);return CustomStyle;}(HTMLElement);window.customElements.define('custom-style',CustomStyle);Polymer.CustomStyle=CustomStyle;})();(function(){'use strict';var mutablePropertyChange=Polymer.MutableData._mutablePropertyChange;/**
   * Legacy element behavior to skip strict dirty-checking for objects and arrays,
   * (always consider them to be "dirty") for use on legacy API Polymer elements.
   *
   * By default, `Polymer.PropertyEffects` performs strict dirty checking on
   * objects, which means that any deep modifications to an object or array will
   * not be propagated unless "immutable" data patterns are used (i.e. all object
   * references from the root to the mutation were changed).
   *
   * Polymer also provides a proprietary data mutation and path notification API
   * (e.g. `notifyPath`, `set`, and array mutation API's) that allow efficient
   * mutation and notification of deep changes in an object graph to all elements
   * bound to the same object graph.
   *
   * In cases where neither immutable patterns nor the data mutation API can be
   * used, applying this mixin will cause Polymer to skip dirty checking for
   * objects and arrays (always consider them to be "dirty").  This allows a
   * user to make a deep modification to a bound object graph, and then either
   * simply re-set the object (e.g. `this.items = this.items`) or call `notifyPath`
   * (e.g. `this.notifyPath('items')`) to update the tree.  Note that all
   * elements that wish to be updated based on deep mutations must apply this
   * mixin or otherwise skip strict dirty checking for objects/arrays.
   *
   * In order to make the dirty check strategy configurable, see
   * `Polymer.OptionalMutableDataBehavior`.
   *
   * Note, the performance characteristics of propagating large object graphs
   * will be worse as opposed to using strict dirty checking with immutable
   * patterns or Polymer's path notification API.
   *
   * @polymerBehavior
   * @memberof Polymer
   * @summary Behavior to skip strict dirty-checking for objects and
   *   arrays
   */Polymer.MutableDataBehavior={/**
     * Overrides `Polymer.PropertyEffects` to provide option for skipping
     * strict equality checking for Objects and Arrays.
     *
     * This method pulls the value to dirty check against from the `__dataTemp`
     * cache (rather than the normal `__data` cache) for Objects.  Since the temp
     * cache is cleared at the end of a turn, this implementation allows
     * side-effects of deep object changes to be processed by re-setting the
     * same object (using the temp cache as an in-turn backstop to prevent
     * cycles due to 2-way notification).
     *
     * @param {string} property Property name
     * @param {*} value New property value
     * @param {*} old Previous property value
     * @return {boolean} Whether the property should be considered a change
     * @protected
     */_shouldPropertyChange:function _shouldPropertyChange(property,value,old){return mutablePropertyChange(this,property,value,old,true);}};/**
   * Legacy element behavior to add the optional ability to skip strict
   * dirty-checking for objects and arrays (always consider them to be
   * "dirty") by setting a `mutable-data` attribute on an element instance.
   *
   * By default, `Polymer.PropertyEffects` performs strict dirty checking on
   * objects, which means that any deep modifications to an object or array will
   * not be propagated unless "immutable" data patterns are used (i.e. all object
   * references from the root to the mutation were changed).
   *
   * Polymer also provides a proprietary data mutation and path notification API
   * (e.g. `notifyPath`, `set`, and array mutation API's) that allow efficient
   * mutation and notification of deep changes in an object graph to all elements
   * bound to the same object graph.
   *
   * In cases where neither immutable patterns nor the data mutation API can be
   * used, applying this mixin will allow Polymer to skip dirty checking for
   * objects and arrays (always consider them to be "dirty").  This allows a
   * user to make a deep modification to a bound object graph, and then either
   * simply re-set the object (e.g. `this.items = this.items`) or call `notifyPath`
   * (e.g. `this.notifyPath('items')`) to update the tree.  Note that all
   * elements that wish to be updated based on deep mutations must apply this
   * mixin or otherwise skip strict dirty checking for objects/arrays.
   *
   * While this behavior adds the ability to forgo Object/Array dirty checking,
   * the `mutableData` flag defaults to false and must be set on the instance.
   *
   * Note, the performance characteristics of propagating large object graphs
   * will be worse by relying on `mutableData: true` as opposed to using
   * strict dirty checking with immutable patterns or Polymer's path notification
   * API.
   *
   * @polymerBehavior
   * @memberof Polymer
   * @summary Behavior to optionally skip strict dirty-checking for objects and
   *   arrays
   */Polymer.OptionalMutableDataBehavior={properties:{/**
       * Instance-level flag for configuring the dirty-checking strategy
       * for this element.  When true, Objects and Arrays will skip dirty
       * checking, otherwise strict equality checking will be used.
       */mutableData:Boolean},/**
     * Overrides `Polymer.PropertyEffects` to skip strict equality checking
     * for Objects and Arrays.
     *
     * Pulls the value to dirty check against from the `__dataTemp` cache
     * (rather than the normal `__data` cache) for Objects.  Since the temp
     * cache is cleared at the end of a turn, this implementation allows
     * side-effects of deep object changes to be processed by re-setting the
     * same object (using the temp cache as an in-turn backstop to prevent
     * cycles due to 2-way notification).
     *
     * @param {string} property Property name
     * @param {*} value New property value
     * @param {*} old Previous property value
     * @return {boolean} Whether the property should be considered a change
     * @protected
     */_shouldPropertyChange:function _shouldPropertyChange(property,value,old){return mutablePropertyChange(this,property,value,old,this.mutableData);}};})();// bc
Polymer.Base=Polymer.LegacyElementMixin(HTMLElement).prototype;(function(){'use strict';/**
     * Chrome uses an older version of DOM Level 3 Keyboard Events
     *
     * Most keys are labeled as text, but some are Unicode codepoints.
     * Values taken from: http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html#KeySet-Set
     */var KEY_IDENTIFIER={'U+0008':'backspace','U+0009':'tab','U+001B':'esc','U+0020':'space','U+007F':'del'};/**
     * Special table for KeyboardEvent.keyCode.
     * KeyboardEvent.keyIdentifier is better, and KeyBoardEvent.key is even better
     * than that.
     *
     * Values from: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.keyCode#Value_of_keyCode
     */var KEY_CODE={8:'backspace',9:'tab',13:'enter',27:'esc',33:'pageup',34:'pagedown',35:'end',36:'home',32:'space',37:'left',38:'up',39:'right',40:'down',46:'del',106:'*'};/**
     * MODIFIER_KEYS maps the short name for modifier keys used in a key
     * combo string to the property name that references those same keys
     * in a KeyboardEvent instance.
     */var MODIFIER_KEYS={'shift':'shiftKey','ctrl':'ctrlKey','alt':'altKey','meta':'metaKey'};/**
     * KeyboardEvent.key is mostly represented by printable character made by
     * the keyboard, with unprintable keys labeled nicely.
     *
     * However, on OS X, Alt+char can make a Unicode character that follows an
     * Apple-specific mapping. In this case, we fall back to .keyCode.
     */var KEY_CHAR=/[a-z0-9*]/;/**
     * Matches a keyIdentifier string.
     */var IDENT_CHAR=/U\+/;/**
     * Matches arrow keys in Gecko 27.0+
     */var ARROW_KEY=/^arrow/;/**
     * Matches space keys everywhere (notably including IE10's exceptional name
     * `spacebar`).
     */var SPACE_KEY=/^space(bar)?/;/**
     * Matches ESC key.
     *
     * Value from: http://w3c.github.io/uievents-key/#key-Escape
     */var ESC_KEY=/^escape$/;/**
     * Transforms the key.
     * @param {string} key The KeyBoardEvent.key
     * @param {Boolean} [noSpecialChars] Limits the transformation to
     * alpha-numeric characters.
     */function transformKey(key,noSpecialChars){var validKey='';if(key){var lKey=key.toLowerCase();if(lKey===' '||SPACE_KEY.test(lKey)){validKey='space';}else if(ESC_KEY.test(lKey)){validKey='esc';}else if(lKey.length==1){if(!noSpecialChars||KEY_CHAR.test(lKey)){validKey=lKey;}}else if(ARROW_KEY.test(lKey)){validKey=lKey.replace('arrow','');}else if(lKey=='multiply'){// numpad '*' can map to Multiply on IE/Windows
validKey='*';}else{validKey=lKey;}}return validKey;}function transformKeyIdentifier(keyIdent){var validKey='';if(keyIdent){if(keyIdent in KEY_IDENTIFIER){validKey=KEY_IDENTIFIER[keyIdent];}else if(IDENT_CHAR.test(keyIdent)){keyIdent=parseInt(keyIdent.replace('U+','0x'),16);validKey=String.fromCharCode(keyIdent).toLowerCase();}else{validKey=keyIdent.toLowerCase();}}return validKey;}function transformKeyCode(keyCode){var validKey='';if(Number(keyCode)){if(keyCode>=65&&keyCode<=90){// ascii a-z
// lowercase is 32 offset from uppercase
validKey=String.fromCharCode(32+keyCode);}else if(keyCode>=112&&keyCode<=123){// function keys f1-f12
validKey='f'+(keyCode-112);}else if(keyCode>=48&&keyCode<=57){// top 0-9 keys
validKey=String(keyCode-48);}else if(keyCode>=96&&keyCode<=105){// num pad 0-9
validKey=String(keyCode-96);}else{validKey=KEY_CODE[keyCode];}}return validKey;}/**
      * Calculates the normalized key for a KeyboardEvent.
      * @param {KeyboardEvent} keyEvent
      * @param {Boolean} [noSpecialChars] Set to true to limit keyEvent.key
      * transformation to alpha-numeric chars. This is useful with key
      * combinations like shift + 2, which on FF for MacOS produces
      * keyEvent.key = @
      * To get 2 returned, set noSpecialChars = true
      * To get @ returned, set noSpecialChars = false
     */function normalizedKeyForEvent(keyEvent,noSpecialChars){// Fall back from .key, to .detail.key for artifical keyboard events,
// and then to deprecated .keyIdentifier and .keyCode.
if(keyEvent.key){return transformKey(keyEvent.key,noSpecialChars);}if(keyEvent.detail&&keyEvent.detail.key){return transformKey(keyEvent.detail.key,noSpecialChars);}return transformKeyIdentifier(keyEvent.keyIdentifier)||transformKeyCode(keyEvent.keyCode)||'';}function keyComboMatchesEvent(keyCombo,event){// For combos with modifiers we support only alpha-numeric keys
var keyEvent=normalizedKeyForEvent(event,keyCombo.hasModifiers);return keyEvent===keyCombo.key&&(!keyCombo.hasModifiers||!!event.shiftKey===!!keyCombo.shiftKey&&!!event.ctrlKey===!!keyCombo.ctrlKey&&!!event.altKey===!!keyCombo.altKey&&!!event.metaKey===!!keyCombo.metaKey);}function parseKeyComboString(keyComboString){if(keyComboString.length===1){return{combo:keyComboString,key:keyComboString,event:'keydown'};}return keyComboString.split('+').reduce(function(parsedKeyCombo,keyComboPart){var eventParts=keyComboPart.split(':');var keyName=eventParts[0];var event=eventParts[1];if(keyName in MODIFIER_KEYS){parsedKeyCombo[MODIFIER_KEYS[keyName]]=true;parsedKeyCombo.hasModifiers=true;}else{parsedKeyCombo.key=keyName;parsedKeyCombo.event=event||'keydown';}return parsedKeyCombo;},{combo:keyComboString.split(':').shift()});}function parseEventString(eventString){return eventString.trim().split(' ').map(function(keyComboString){return parseKeyComboString(keyComboString);});}/**
     * `Polymer.IronA11yKeysBehavior` provides a normalized interface for processing
     * keyboard commands that pertain to [WAI-ARIA best practices](http://www.w3.org/TR/wai-aria-practices/#kbd_general_binding).
     * The element takes care of browser differences with respect to Keyboard events
     * and uses an expressive syntax to filter key presses.
     *
     * Use the `keyBindings` prototype property to express what combination of keys
     * will trigger the callback. A key binding has the format
     * `"KEY+MODIFIER:EVENT": "callback"` (`"KEY": "callback"` or
     * `"KEY:EVENT": "callback"` are valid as well). Some examples:
     *
     *      keyBindings: {
     *        'space': '_onKeydown', // same as 'space:keydown'
     *        'shift+tab': '_onKeydown',
     *        'enter:keypress': '_onKeypress',
     *        'esc:keyup': '_onKeyup'
     *      }
     *
     * The callback will receive with an event containing the following information in `event.detail`:
     *
     *      _onKeydown: function(event) {
     *        console.log(event.detail.combo); // KEY+MODIFIER, e.g. "shift+tab"
     *        console.log(event.detail.key); // KEY only, e.g. "tab"
     *        console.log(event.detail.event); // EVENT, e.g. "keydown"
     *        console.log(event.detail.keyboardEvent); // the original KeyboardEvent
     *      }
     *
     * Use the `keyEventTarget` attribute to set up event handlers on a specific
     * node.
     *
     * See the [demo source code](https://github.com/PolymerElements/iron-a11y-keys-behavior/blob/master/demo/x-key-aware.html)
     * for an example.
     *
     * @demo demo/index.html
     * @polymerBehavior
     */Polymer.IronA11yKeysBehavior={properties:{/**
         * The EventTarget that will be firing relevant KeyboardEvents. Set it to
         * `null` to disable the listeners.
         * @type {?EventTarget}
         */keyEventTarget:{type:Object,value:function value(){return this;}},/**
         * If true, this property will cause the implementing element to
         * automatically stop propagation on any handled KeyboardEvents.
         */stopKeyboardEventPropagation:{type:Boolean,value:false},_boundKeyHandlers:{type:Array,value:function value(){return[];}},// We use this due to a limitation in IE10 where instances will have
// own properties of everything on the "prototype".
_imperativeKeyBindings:{type:Object,value:function value(){return{};}}},observers:['_resetKeyEventListeners(keyEventTarget, _boundKeyHandlers)'],/**
       * To be used to express what combination of keys  will trigger the relative
       * callback. e.g. `keyBindings: { 'esc': '_onEscPressed'}`
       * @type {!Object}
       */keyBindings:{},registered:function registered(){this._prepKeyBindings();},attached:function attached(){this._listenKeyEventListeners();},detached:function detached(){this._unlistenKeyEventListeners();},/**
       * Can be used to imperatively add a key binding to the implementing
       * element. This is the imperative equivalent of declaring a keybinding
       * in the `keyBindings` prototype property.
       */addOwnKeyBinding:function addOwnKeyBinding(eventString,handlerName){this._imperativeKeyBindings[eventString]=handlerName;this._prepKeyBindings();this._resetKeyEventListeners();},/**
       * When called, will remove all imperatively-added key bindings.
       */removeOwnKeyBindings:function removeOwnKeyBindings(){this._imperativeKeyBindings={};this._prepKeyBindings();this._resetKeyEventListeners();},/**
       * Returns true if a keyboard event matches `eventString`.
       *
       * @param {KeyboardEvent} event
       * @param {string} eventString
       * @return {boolean}
       */keyboardEventMatchesKeys:function keyboardEventMatchesKeys(event,eventString){var keyCombos=parseEventString(eventString);for(var i=0;i<keyCombos.length;++i){if(keyComboMatchesEvent(keyCombos[i],event)){return true;}}return false;},_collectKeyBindings:function _collectKeyBindings(){var keyBindings=this.behaviors.map(function(behavior){return behavior.keyBindings;});if(keyBindings.indexOf(this.keyBindings)===-1){keyBindings.push(this.keyBindings);}return keyBindings;},_prepKeyBindings:function _prepKeyBindings(){this._keyBindings={};this._collectKeyBindings().forEach(function(keyBindings){for(var eventString in keyBindings){this._addKeyBinding(eventString,keyBindings[eventString]);}},this);for(var eventString in this._imperativeKeyBindings){this._addKeyBinding(eventString,this._imperativeKeyBindings[eventString]);}// Give precedence to combos with modifiers to be checked first.
for(var eventName in this._keyBindings){this._keyBindings[eventName].sort(function(kb1,kb2){var b1=kb1[0].hasModifiers;var b2=kb2[0].hasModifiers;return b1===b2?0:b1?-1:1;});}},_addKeyBinding:function _addKeyBinding(eventString,handlerName){parseEventString(eventString).forEach(function(keyCombo){this._keyBindings[keyCombo.event]=this._keyBindings[keyCombo.event]||[];this._keyBindings[keyCombo.event].push([keyCombo,handlerName]);},this);},_resetKeyEventListeners:function _resetKeyEventListeners(){this._unlistenKeyEventListeners();if(this.isAttached){this._listenKeyEventListeners();}},_listenKeyEventListeners:function _listenKeyEventListeners(){if(!this.keyEventTarget){return;}Object.keys(this._keyBindings).forEach(function(eventName){var keyBindings=this._keyBindings[eventName];var boundKeyHandler=this._onKeyBindingEvent.bind(this,keyBindings);this._boundKeyHandlers.push([this.keyEventTarget,eventName,boundKeyHandler]);this.keyEventTarget.addEventListener(eventName,boundKeyHandler);},this);},_unlistenKeyEventListeners:function _unlistenKeyEventListeners(){var keyHandlerTuple;var keyEventTarget;var eventName;var boundKeyHandler;while(this._boundKeyHandlers.length){// My kingdom for block-scope binding and destructuring assignment..
keyHandlerTuple=this._boundKeyHandlers.pop();keyEventTarget=keyHandlerTuple[0];eventName=keyHandlerTuple[1];boundKeyHandler=keyHandlerTuple[2];keyEventTarget.removeEventListener(eventName,boundKeyHandler);}},_onKeyBindingEvent:function _onKeyBindingEvent(keyBindings,event){if(this.stopKeyboardEventPropagation){event.stopPropagation();}// if event has been already prevented, don't do anything
if(event.defaultPrevented){return;}for(var i=0;i<keyBindings.length;i++){var keyCombo=keyBindings[i][0];var handlerName=keyBindings[i][1];if(keyComboMatchesEvent(keyCombo,event)){this._triggerKeyHandler(keyCombo,handlerName,event);// exit the loop if eventDefault was prevented
if(event.defaultPrevented){return;}}}},_triggerKeyHandler:function _triggerKeyHandler(keyCombo,handlerName,keyboardEvent){var detail=Object.create(keyCombo);detail.keyboardEvent=keyboardEvent;var event=new CustomEvent(keyCombo.event,{detail:detail,cancelable:true});this[handlerName].call(this,event);if(event.defaultPrevented){keyboardEvent.preventDefault();}}};})();/**
   * @demo demo/index.html
   * @polymerBehavior
   */Polymer.IronControlState={properties:{/**
       * If true, the element currently has focus.
       */focused:{type:Boolean,value:false,notify:true,readOnly:true,reflectToAttribute:true},/**
       * If true, the user cannot interact with this element.
       */disabled:{type:Boolean,value:false,notify:true,observer:'_disabledChanged',reflectToAttribute:true},_oldTabIndex:{type:Number},_boundFocusBlurHandler:{type:Function,value:function value(){return this._focusBlurHandler.bind(this);}},__handleEventRetargeting:{type:Boolean,value:function value(){return!this.shadowRoot&&!Polymer.Element;}}},observers:['_changedControlState(focused, disabled)'],ready:function ready(){this.addEventListener('focus',this._boundFocusBlurHandler,true);this.addEventListener('blur',this._boundFocusBlurHandler,true);},_focusBlurHandler:function _focusBlurHandler(event){// In Polymer 2.0, the library takes care of retargeting events.
if(Polymer.Element){this._setFocused(event.type==='focus');return;}// NOTE(cdata):  if we are in ShadowDOM land, `event.target` will
// eventually become `this` due to retargeting; if we are not in
// ShadowDOM land, `event.target` will eventually become `this` due
// to the second conditional which fires a synthetic event (that is also
// handled). In either case, we can disregard `event.path`.
if(event.target===this){this._setFocused(event.type==='focus');}else if(this.__handleEventRetargeting){var target=/** @type {Node} */Polymer.dom(event).localTarget;if(!this.isLightDescendant(target)){this.fire(event.type,{sourceEvent:event},{node:this,bubbles:event.bubbles,cancelable:event.cancelable});}}},_disabledChanged:function _disabledChanged(disabled,old){this.setAttribute('aria-disabled',disabled?'true':'false');this.style.pointerEvents=disabled?'none':'';if(disabled){this._oldTabIndex=this.tabIndex;this._setFocused(false);this.tabIndex=-1;this.blur();}else if(this._oldTabIndex!==undefined){this.tabIndex=this._oldTabIndex;}},_changedControlState:function _changedControlState(){// _controlStateChanged is abstract, follow-on behaviors may implement it
if(this._controlStateChanged){this._controlStateChanged();}}};/**
   * @demo demo/index.html
   * @polymerBehavior Polymer.IronButtonState
   */Polymer.IronButtonStateImpl={properties:{/**
       * If true, the user is currently holding down the button.
       */pressed:{type:Boolean,readOnly:true,value:false,reflectToAttribute:true,observer:'_pressedChanged'},/**
       * If true, the button toggles the active state with each tap or press
       * of the spacebar.
       */toggles:{type:Boolean,value:false,reflectToAttribute:true},/**
       * If true, the button is a toggle and is currently in the active state.
       */active:{type:Boolean,value:false,notify:true,reflectToAttribute:true},/**
       * True if the element is currently being pressed by a "pointer," which
       * is loosely defined as mouse or touch input (but specifically excluding
       * keyboard input).
       */pointerDown:{type:Boolean,readOnly:true,value:false},/**
       * True if the input device that caused the element to receive focus
       * was a keyboard.
       */receivedFocusFromKeyboard:{type:Boolean,readOnly:true},/**
       * The aria attribute to be set if the button is a toggle and in the
       * active state.
       */ariaActiveAttribute:{type:String,value:'aria-pressed',observer:'_ariaActiveAttributeChanged'}},listeners:{down:'_downHandler',up:'_upHandler',tap:'_tapHandler'},observers:['_focusChanged(focused)','_activeChanged(active, ariaActiveAttribute)'],keyBindings:{'enter:keydown':'_asyncClick','space:keydown':'_spaceKeyDownHandler','space:keyup':'_spaceKeyUpHandler'},_mouseEventRe:/^mouse/,_tapHandler:function _tapHandler(){if(this.toggles){// a tap is needed to toggle the active state
this._userActivate(!this.active);}else{this.active=false;}},_focusChanged:function _focusChanged(focused){this._detectKeyboardFocus(focused);if(!focused){this._setPressed(false);}},_detectKeyboardFocus:function _detectKeyboardFocus(focused){this._setReceivedFocusFromKeyboard(!this.pointerDown&&focused);},// to emulate native checkbox, (de-)activations from a user interaction fire
// 'change' events
_userActivate:function _userActivate(active){if(this.active!==active){this.active=active;this.fire('change');}},_downHandler:function _downHandler(event){this._setPointerDown(true);this._setPressed(true);this._setReceivedFocusFromKeyboard(false);},_upHandler:function _upHandler(){this._setPointerDown(false);this._setPressed(false);},/**
     * @param {!KeyboardEvent} event .
     */_spaceKeyDownHandler:function _spaceKeyDownHandler(event){var keyboardEvent=event.detail.keyboardEvent;var target=Polymer.dom(keyboardEvent).localTarget;// Ignore the event if this is coming from a focused light child, since that
// element will deal with it.
if(this.isLightDescendant(/** @type {Node} */target))return;keyboardEvent.preventDefault();keyboardEvent.stopImmediatePropagation();this._setPressed(true);},/**
     * @param {!KeyboardEvent} event .
     */_spaceKeyUpHandler:function _spaceKeyUpHandler(event){var keyboardEvent=event.detail.keyboardEvent;var target=Polymer.dom(keyboardEvent).localTarget;// Ignore the event if this is coming from a focused light child, since that
// element will deal with it.
if(this.isLightDescendant(/** @type {Node} */target))return;if(this.pressed){this._asyncClick();}this._setPressed(false);},// trigger click asynchronously, the asynchrony is useful to allow one
// event handler to unwind before triggering another event
_asyncClick:function _asyncClick(){this.async(function(){this.click();},1);},// any of these changes are considered a change to button state
_pressedChanged:function _pressedChanged(pressed){this._changedButtonState();},_ariaActiveAttributeChanged:function _ariaActiveAttributeChanged(value,oldValue){if(oldValue&&oldValue!=value&&this.hasAttribute(oldValue)){this.removeAttribute(oldValue);}},_activeChanged:function _activeChanged(active,ariaActiveAttribute){if(this.toggles){this.setAttribute(this.ariaActiveAttribute,active?'true':'false');}else{this.removeAttribute(this.ariaActiveAttribute);}this._changedButtonState();},_controlStateChanged:function _controlStateChanged(){if(this.disabled){this._setPressed(false);}else{this._changedButtonState();}},// provide hook for follow-on behaviors to react to button-state
_changedButtonState:function _changedButtonState(){if(this._buttonStateChanged){this._buttonStateChanged();// abstract
}}};/** @polymerBehavior */Polymer.IronButtonState=[Polymer.IronA11yKeysBehavior,Polymer.IronButtonStateImpl];/** @polymerBehavior Polymer.PaperItemBehavior */Polymer.PaperItemBehaviorImpl={hostAttributes:{role:'option',tabindex:'0'}};/** @polymerBehavior */Polymer.PaperItemBehavior=[Polymer.IronButtonState,Polymer.IronControlState,Polymer.PaperItemBehaviorImpl];Polymer({is:'paper-item',behaviors:[Polymer.PaperItemBehavior]});var ExampleOrder=function(_Polymer$Element2){_inherits(ExampleOrder,_Polymer$Element2);function ExampleOrder(){_classCallCheck(this,ExampleOrder);return _possibleConstructorReturn(this,(ExampleOrder.__proto__||Object.getPrototypeOf(ExampleOrder)).apply(this,arguments));}_createClass(ExampleOrder,[{key:"_selectItem",value:function _selectItem(e){this.$.selector.selectIndex(e.model.index);}},{key:"getData",value:function getData(){var _this38=this;var root=window.location.origin;root+=window.location.pathname.replace("index.html","");fetch(root+"data/exampleOrders.json").then(function(stream){return stream.body.getReader().read();}).then(function(_ref){var value=_ref.value,done=_ref.done;return _this38.parse(value);}).then(function(orders){_this38.orderTypes=Array.from(orders.keys());_this38.orders=Array.from(orders.values());_this38.selectedOrder=_this38.orders[0];});}},{key:"parse",value:function parse(value){var string=value.reduce(function(acc,code){return acc+=String.fromCharCode(code);},"");var json=JSON.parse(string);var ret=new Map();for(var orderType in json){var order=json[orderType];ret.set(orderType,order);}return ret;}},{key:"ready",value:function ready(){_get(ExampleOrder.prototype.__proto__||Object.getPrototypeOf(ExampleOrder.prototype),"ready",this).call(this);this.getData();}}],[{key:"is",get:function get(){return"example-order";}},{key:"properties",get:function get(){return{orders:Array,selectedOrder:Array,orderTypes:Array};}}]);return ExampleOrder;}(Polymer.Element);window.customElements.define(ExampleOrder.is,ExampleOrder);(function(){'use strict';var Utility={distance:function distance(x1,y1,x2,y2){var xDelta=x1-x2;var yDelta=y1-y2;return Math.sqrt(xDelta*xDelta+yDelta*yDelta);},now:window.performance&&window.performance.now?window.performance.now.bind(window.performance):Date.now};/**
     * @param {HTMLElement} element
     * @constructor
     */function ElementMetrics(element){this.element=element;this.width=this.boundingRect.width;this.height=this.boundingRect.height;this.size=Math.max(this.width,this.height);}ElementMetrics.prototype={get boundingRect(){return this.element.getBoundingClientRect();},furthestCornerDistanceFrom:function furthestCornerDistanceFrom(x,y){var topLeft=Utility.distance(x,y,0,0);var topRight=Utility.distance(x,y,this.width,0);var bottomLeft=Utility.distance(x,y,0,this.height);var bottomRight=Utility.distance(x,y,this.width,this.height);return Math.max(topLeft,topRight,bottomLeft,bottomRight);}};/**
     * @param {HTMLElement} element
     * @constructor
     */function Ripple(element){this.element=element;this.color=window.getComputedStyle(element).color;this.wave=document.createElement('div');this.waveContainer=document.createElement('div');this.wave.style.backgroundColor=this.color;this.wave.classList.add('wave');this.waveContainer.classList.add('wave-container');Polymer.dom(this.waveContainer).appendChild(this.wave);this.resetInteractionState();}Ripple.MAX_RADIUS=300;Ripple.prototype={get recenters(){return this.element.recenters;},get center(){return this.element.center;},get mouseDownElapsed(){var elapsed;if(!this.mouseDownStart){return 0;}elapsed=Utility.now()-this.mouseDownStart;if(this.mouseUpStart){elapsed-=this.mouseUpElapsed;}return elapsed;},get mouseUpElapsed(){return this.mouseUpStart?Utility.now()-this.mouseUpStart:0;},get mouseDownElapsedSeconds(){return this.mouseDownElapsed/1000;},get mouseUpElapsedSeconds(){return this.mouseUpElapsed/1000;},get mouseInteractionSeconds(){return this.mouseDownElapsedSeconds+this.mouseUpElapsedSeconds;},get initialOpacity(){return this.element.initialOpacity;},get opacityDecayVelocity(){return this.element.opacityDecayVelocity;},get radius(){var width2=this.containerMetrics.width*this.containerMetrics.width;var height2=this.containerMetrics.height*this.containerMetrics.height;var waveRadius=Math.min(Math.sqrt(width2+height2),Ripple.MAX_RADIUS)*1.1+5;var duration=1.1-0.2*(waveRadius/Ripple.MAX_RADIUS);var timeNow=this.mouseInteractionSeconds/duration;var size=waveRadius*(1-Math.pow(80,-timeNow));return Math.abs(size);},get opacity(){if(!this.mouseUpStart){return this.initialOpacity;}return Math.max(0,this.initialOpacity-this.mouseUpElapsedSeconds*this.opacityDecayVelocity);},get outerOpacity(){// Linear increase in background opacity, capped at the opacity
// of the wavefront (waveOpacity).
var outerOpacity=this.mouseUpElapsedSeconds*0.3;var waveOpacity=this.opacity;return Math.max(0,Math.min(outerOpacity,waveOpacity));},get isOpacityFullyDecayed(){return this.opacity<0.01&&this.radius>=Math.min(this.maxRadius,Ripple.MAX_RADIUS);},get isRestingAtMaxRadius(){return this.opacity>=this.initialOpacity&&this.radius>=Math.min(this.maxRadius,Ripple.MAX_RADIUS);},get isAnimationComplete(){return this.mouseUpStart?this.isOpacityFullyDecayed:this.isRestingAtMaxRadius;},get translationFraction(){return Math.min(1,this.radius/this.containerMetrics.size*2/Math.sqrt(2));},get xNow(){if(this.xEnd){return this.xStart+this.translationFraction*(this.xEnd-this.xStart);}return this.xStart;},get yNow(){if(this.yEnd){return this.yStart+this.translationFraction*(this.yEnd-this.yStart);}return this.yStart;},get isMouseDown(){return this.mouseDownStart&&!this.mouseUpStart;},resetInteractionState:function resetInteractionState(){this.maxRadius=0;this.mouseDownStart=0;this.mouseUpStart=0;this.xStart=0;this.yStart=0;this.xEnd=0;this.yEnd=0;this.slideDistance=0;this.containerMetrics=new ElementMetrics(this.element);},draw:function draw(){var scale;var translateString;var dx;var dy;this.wave.style.opacity=this.opacity;scale=this.radius/(this.containerMetrics.size/2);dx=this.xNow-this.containerMetrics.width/2;dy=this.yNow-this.containerMetrics.height/2;// 2d transform for safari because of border-radius and overflow:hidden clipping bug.
// https://bugs.webkit.org/show_bug.cgi?id=98538
this.waveContainer.style.webkitTransform='translate('+dx+'px, '+dy+'px)';this.waveContainer.style.transform='translate3d('+dx+'px, '+dy+'px, 0)';this.wave.style.webkitTransform='scale('+scale+','+scale+')';this.wave.style.transform='scale3d('+scale+','+scale+',1)';},/** @param {Event=} event */downAction:function downAction(event){var xCenter=this.containerMetrics.width/2;var yCenter=this.containerMetrics.height/2;this.resetInteractionState();this.mouseDownStart=Utility.now();if(this.center){this.xStart=xCenter;this.yStart=yCenter;this.slideDistance=Utility.distance(this.xStart,this.yStart,this.xEnd,this.yEnd);}else{this.xStart=event?event.detail.x-this.containerMetrics.boundingRect.left:this.containerMetrics.width/2;this.yStart=event?event.detail.y-this.containerMetrics.boundingRect.top:this.containerMetrics.height/2;}if(this.recenters){this.xEnd=xCenter;this.yEnd=yCenter;this.slideDistance=Utility.distance(this.xStart,this.yStart,this.xEnd,this.yEnd);}this.maxRadius=this.containerMetrics.furthestCornerDistanceFrom(this.xStart,this.yStart);this.waveContainer.style.top=(this.containerMetrics.height-this.containerMetrics.size)/2+'px';this.waveContainer.style.left=(this.containerMetrics.width-this.containerMetrics.size)/2+'px';this.waveContainer.style.width=this.containerMetrics.size+'px';this.waveContainer.style.height=this.containerMetrics.size+'px';},/** @param {Event=} event */upAction:function upAction(event){if(!this.isMouseDown){return;}this.mouseUpStart=Utility.now();},remove:function remove(){Polymer.dom(this.waveContainer.parentNode).removeChild(this.waveContainer);}};Polymer({is:'paper-ripple',behaviors:[Polymer.IronA11yKeysBehavior],properties:{/**
         * The initial opacity set on the wave.
         *
         * @attribute initialOpacity
         * @type number
         * @default 0.25
         */initialOpacity:{type:Number,value:0.25},/**
         * How fast (opacity per second) the wave fades out.
         *
         * @attribute opacityDecayVelocity
         * @type number
         * @default 0.8
         */opacityDecayVelocity:{type:Number,value:0.8},/**
         * If true, ripples will exhibit a gravitational pull towards
         * the center of their container as they fade away.
         *
         * @attribute recenters
         * @type boolean
         * @default false
         */recenters:{type:Boolean,value:false},/**
         * If true, ripples will center inside its container
         *
         * @attribute recenters
         * @type boolean
         * @default false
         */center:{type:Boolean,value:false},/**
         * A list of the visual ripples.
         *
         * @attribute ripples
         * @type Array
         * @default []
         */ripples:{type:Array,value:function value(){return[];}},/**
         * True when there are visible ripples animating within the
         * element.
         */animating:{type:Boolean,readOnly:true,reflectToAttribute:true,value:false},/**
         * If true, the ripple will remain in the "down" state until `holdDown`
         * is set to false again.
         */holdDown:{type:Boolean,value:false,observer:'_holdDownChanged'},/**
         * If true, the ripple will not generate a ripple effect
         * via pointer interaction.
         * Calling ripple's imperative api like `simulatedRipple` will
         * still generate the ripple effect.
         */noink:{type:Boolean,value:false},_animating:{type:Boolean},_boundAnimate:{type:Function,value:function value(){return this.animate.bind(this);}}},get target(){return this.keyEventTarget;},keyBindings:{'enter:keydown':'_onEnterKeydown','space:keydown':'_onSpaceKeydown','space:keyup':'_onSpaceKeyup'},attached:function attached(){// Set up a11yKeysBehavior to listen to key events on the target,
// so that space and enter activate the ripple even if the target doesn't
// handle key events. The key handlers deal with `noink` themselves.
if(this.parentNode.nodeType==11){// DOCUMENT_FRAGMENT_NODE
this.keyEventTarget=Polymer.dom(this).getOwnerRoot().host;}else{this.keyEventTarget=this.parentNode;}var keyEventTarget=/** @type {!EventTarget} */this.keyEventTarget;this.listen(keyEventTarget,'up','uiUpAction');this.listen(keyEventTarget,'down','uiDownAction');},detached:function detached(){this.unlisten(this.keyEventTarget,'up','uiUpAction');this.unlisten(this.keyEventTarget,'down','uiDownAction');this.keyEventTarget=null;},get shouldKeepAnimating(){for(var index=0;index<this.ripples.length;++index){if(!this.ripples[index].isAnimationComplete){return true;}}return false;},simulatedRipple:function simulatedRipple(){this.downAction(null);// Please see polymer/polymer#1305
this.async(function(){this.upAction();},1);},/**
       * Provokes a ripple down effect via a UI event,
       * respecting the `noink` property.
       * @param {Event=} event
       */uiDownAction:function uiDownAction(event){if(!this.noink){this.downAction(event);}},/**
       * Provokes a ripple down effect via a UI event,
       * *not* respecting the `noink` property.
       * @param {Event=} event
       */downAction:function downAction(event){if(this.holdDown&&this.ripples.length>0){return;}var ripple=this.addRipple();ripple.downAction(event);if(!this._animating){this._animating=true;this.animate();}},/**
       * Provokes a ripple up effect via a UI event,
       * respecting the `noink` property.
       * @param {Event=} event
       */uiUpAction:function uiUpAction(event){if(!this.noink){this.upAction(event);}},/**
       * Provokes a ripple up effect via a UI event,
       * *not* respecting the `noink` property.
       * @param {Event=} event
       */upAction:function upAction(event){if(this.holdDown){return;}this.ripples.forEach(function(ripple){ripple.upAction(event);});this._animating=true;this.animate();},onAnimationComplete:function onAnimationComplete(){this._animating=false;this.$.background.style.backgroundColor=null;this.fire('transitionend');},addRipple:function addRipple(){var ripple=new Ripple(this);Polymer.dom(this.$.waves).appendChild(ripple.waveContainer);this.$.background.style.backgroundColor=ripple.color;this.ripples.push(ripple);this._setAnimating(true);return ripple;},removeRipple:function removeRipple(ripple){var rippleIndex=this.ripples.indexOf(ripple);if(rippleIndex<0){return;}this.ripples.splice(rippleIndex,1);ripple.remove();if(!this.ripples.length){this._setAnimating(false);}},/**
       * This conflicts with Element#antimate().
       * https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
       * @suppress {checkTypes}
       */animate:function animate(){if(!this._animating){return;}var index;var ripple;for(index=0;index<this.ripples.length;++index){ripple=this.ripples[index];ripple.draw();this.$.background.style.opacity=ripple.outerOpacity;if(ripple.isOpacityFullyDecayed&&!ripple.isRestingAtMaxRadius){this.removeRipple(ripple);}}if(!this.shouldKeepAnimating&&this.ripples.length===0){this.onAnimationComplete();}else{window.requestAnimationFrame(this._boundAnimate);}},_onEnterKeydown:function _onEnterKeydown(){this.uiDownAction();this.async(this.uiUpAction,1);},_onSpaceKeydown:function _onSpaceKeydown(){this.uiDownAction();},_onSpaceKeyup:function _onSpaceKeyup(){this.uiUpAction();},// note: holdDown does not respect noink since it can be a focus based
// effect.
_holdDownChanged:function _holdDownChanged(newVal,oldVal){if(oldVal===undefined){return;}if(newVal){this.downAction();}else{this.upAction();}}/**
      Fired when the animation finishes.
      This is useful if you want to wait until
      the ripple animation finishes to perform some action.

      @event transitionend
      @param {{node: Object}} detail Contains the animated node.
      */});})();/**
   * `Polymer.PaperRippleBehavior` dynamically implements a ripple
   * when the element has focus via pointer or keyboard.
   *
   * NOTE: This behavior is intended to be used in conjunction with and after
   * `Polymer.IronButtonState` and `Polymer.IronControlState`.
   *
   * @polymerBehavior Polymer.PaperRippleBehavior
   */Polymer.PaperRippleBehavior={properties:{/**
       * If true, the element will not produce a ripple effect when interacted
       * with via the pointer.
       */noink:{type:Boolean,observer:'_noinkChanged'},/**
       * @type {Element|undefined}
       */_rippleContainer:{type:Object}},/**
     * Ensures a `<paper-ripple>` element is available when the element is
     * focused.
     */_buttonStateChanged:function _buttonStateChanged(){if(this.focused){this.ensureRipple();}},/**
     * In addition to the functionality provided in `IronButtonState`, ensures
     * a ripple effect is created when the element is in a `pressed` state.
     */_downHandler:function _downHandler(event){Polymer.IronButtonStateImpl._downHandler.call(this,event);if(this.pressed){this.ensureRipple(event);}},/**
     * Ensures this element contains a ripple effect. For startup efficiency
     * the ripple effect is dynamically on demand when needed.
     * @param {!Event=} optTriggeringEvent (optional) event that triggered the
     * ripple.
     */ensureRipple:function ensureRipple(optTriggeringEvent){if(!this.hasRipple()){this._ripple=this._createRipple();this._ripple.noink=this.noink;var rippleContainer=this._rippleContainer||this.root;if(rippleContainer){Polymer.dom(rippleContainer).appendChild(this._ripple);}if(optTriggeringEvent){// Check if the event happened inside of the ripple container
// Fall back to host instead of the root because distributed text
// nodes are not valid event targets
var domContainer=Polymer.dom(this._rippleContainer||this);var target=Polymer.dom(optTriggeringEvent).rootTarget;if(domContainer.deepContains(/** @type {Node} */target)){this._ripple.uiDownAction(optTriggeringEvent);}}}},/**
     * Returns the `<paper-ripple>` element used by this element to create
     * ripple effects. The element's ripple is created on demand, when
     * necessary, and calling this method will force the
     * ripple to be created.
     */getRipple:function getRipple(){this.ensureRipple();return this._ripple;},/**
     * Returns true if this element currently contains a ripple effect.
     * @return {boolean}
     */hasRipple:function hasRipple(){return Boolean(this._ripple);},/**
     * Create the element's ripple effect via creating a `<paper-ripple>`.
     * Override this method to customize the ripple element.
     * @return {!PaperRippleElement} Returns a `<paper-ripple>` element.
     */_createRipple:function _createRipple(){return(/** @type {!PaperRippleElement} */document.createElement('paper-ripple'));},_noinkChanged:function _noinkChanged(noink){if(this.hasRipple()){this._ripple.noink=noink;}}};/** @polymerBehavior Polymer.PaperButtonBehavior */Polymer.PaperButtonBehaviorImpl={properties:{/**
       * The z-depth of this element, from 0-5. Setting to 0 will remove the
       * shadow, and each increasing number greater than 0 will be "deeper"
       * than the last.
       *
       * @attribute elevation
       * @type number
       * @default 1
       */elevation:{type:Number,reflectToAttribute:true,readOnly:true}},observers:['_calculateElevation(focused, disabled, active, pressed, receivedFocusFromKeyboard)','_computeKeyboardClass(receivedFocusFromKeyboard)'],hostAttributes:{role:'button',tabindex:'0',animated:true},_calculateElevation:function _calculateElevation(){var e=1;if(this.disabled){e=0;}else if(this.active||this.pressed){e=4;}else if(this.receivedFocusFromKeyboard){e=3;}this._setElevation(e);},_computeKeyboardClass:function _computeKeyboardClass(receivedFocusFromKeyboard){this.toggleClass('keyboard-focus',receivedFocusFromKeyboard);},/**
     * In addition to `IronButtonState` behavior, when space key goes down,
     * create a ripple down effect.
     *
     * @param {!KeyboardEvent} event .
     */_spaceKeyDownHandler:function _spaceKeyDownHandler(event){Polymer.IronButtonStateImpl._spaceKeyDownHandler.call(this,event);// Ensure that there is at most one ripple when the space key is held down.
if(this.hasRipple()&&this.getRipple().ripples.length<1){this._ripple.uiDownAction();}},/**
     * In addition to `IronButtonState` behavior, when space key goes up,
     * create a ripple up effect.
     *
     * @param {!KeyboardEvent} event .
     */_spaceKeyUpHandler:function _spaceKeyUpHandler(event){Polymer.IronButtonStateImpl._spaceKeyUpHandler.call(this,event);if(this.hasRipple()){this._ripple.uiUpAction();}}};/** @polymerBehavior */Polymer.PaperButtonBehavior=[Polymer.IronButtonState,Polymer.IronControlState,Polymer.PaperRippleBehavior,Polymer.PaperButtonBehaviorImpl];Polymer({is:'paper-button',behaviors:[Polymer.PaperButtonBehavior],properties:{/**
         * If true, the button should be styled with a shadow.
         */raised:{type:Boolean,reflectToAttribute:true,value:false,observer:'_calculateElevation'}},_calculateElevation:function _calculateElevation(){if(!this.raised){this._setElevation(0);}else{Polymer.PaperButtonBehaviorImpl._calculateElevation.apply(this);}}/**
      Fired when the animation finishes.
      This is useful if you want to wait until
      the ripple animation finishes to perform some action.

      @event transitionend
      Event param: {{node: Object}} detail Contains the animated node.
      */});(function(){function IronMeta(options){this.type=options&&options.type||'default';this.key=options&&options.key;if('value'in options){this.value=options.value;}}IronMeta.types={};IronMeta.prototype={get value(){var type=this.type;var key=this.key;if(type&&key){return IronMeta.types[type]&&IronMeta.types[type][key];}},set value(value){var type=this.type;var key=this.key;if(type&&key){var type=IronMeta.types[type]=IronMeta.types[type]||{};if(value==null){delete type[key];}else{type[key]=value;}}},get list(){var type=this.type;if(type){return Object.keys(IronMeta.types[this.type]).map(function(key){return metaDatas[this.type][key];},this);}},byKey:function byKey(key){this.key=key;return this.value;}};Polymer.IronMeta=IronMeta;var metaDatas=Polymer.IronMeta.types;Polymer({is:'iron-meta',properties:{/**
         * The type of meta-data.  All meta-data of the same type is stored
         * together.
         */type:{type:String,value:'default'},/**
         * The key used to store `value` under the `type` namespace.
         */key:{type:String},/**
         * The meta-data to store or retrieve.
         */value:{type:String,notify:true},/**
         * If true, `value` is set to the iron-meta instance itself.
         */self:{type:Boolean,observer:'_selfChanged'},__meta:{type:Boolean,computed:'__computeMeta(type, key, value)'}},hostAttributes:{hidden:true},__computeMeta:function __computeMeta(type,key,value){var meta=new Polymer.IronMeta({type:type,key:key});if(value!==undefined&&value!==meta.value){meta.value=value;}else if(this.value!==meta.value){this.value=meta.value;}return meta;},get list(){return this.__meta&&this.__meta.list;},_selfChanged:function _selfChanged(self){if(self){this.value=this;}},/**
       * Retrieves meta data value by key.
       *
       * @method byKey
       * @param {string} key The key of the meta-data to be returned.
       * @return {*}
       */byKey:function byKey(key){return new Polymer.IronMeta({type:this.type,key:key}).value;}});})();/**
   * Singleton IronMeta instance.
   */Polymer.IronValidatableBehaviorMeta=null;/**
   * `Use Polymer.IronValidatableBehavior` to implement an element that validates user input.
   * Use the related `Polymer.IronValidatorBehavior` to add custom validation logic to an iron-input.
   *
   * By default, an `<iron-form>` element validates its fields when the user presses the submit button.
   * To validate a form imperatively, call the form's `validate()` method, which in turn will
   * call `validate()` on all its children. By using `Polymer.IronValidatableBehavior`, your
   * custom element will get a public `validate()`, which
   * will return the validity of the element, and a corresponding `invalid` attribute,
   * which can be used for styling.
   *
   * To implement the custom validation logic of your element, you must override
   * the protected `_getValidity()` method of this behaviour, rather than `validate()`.
   * See [this](https://github.com/PolymerElements/iron-form/blob/master/demo/simple-element.html)
   * for an example.
   *
   * ### Accessibility
   *
   * Changing the `invalid` property, either manually or by calling `validate()` will update the
   * `aria-invalid` attribute.
   *
   * @demo demo/index.html
   * @polymerBehavior
   */Polymer.IronValidatableBehavior={properties:{/**
       * Name of the validator to use.
       */validator:{type:String},/**
       * True if the last call to `validate` is invalid.
       */invalid:{notify:true,reflectToAttribute:true,type:Boolean,value:false,observer:'_invalidChanged'}},registered:function registered(){Polymer.IronValidatableBehaviorMeta=new Polymer.IronMeta({type:'validator'});},_invalidChanged:function _invalidChanged(){if(this.invalid){this.setAttribute('aria-invalid','true');}else{this.removeAttribute('aria-invalid');}},/* Recompute this every time it's needed, because we don't know if the
     * underlying IronValidatableBehaviorMeta has changed. */get _validator(){return Polymer.IronValidatableBehaviorMeta&&Polymer.IronValidatableBehaviorMeta.byKey(this.validator);},/**
     * @return {boolean} True if the validator `validator` exists.
     */hasValidator:function hasValidator(){return this._validator!=null;},/**
     * Returns true if the `value` is valid, and updates `invalid`. If you want
     * your element to have custom validation logic, do not override this method;
     * override `_getValidity(value)` instead.

     * @param {Object} value Deprecated: The value to be validated. By default,
     * it is passed to the validator's `validate()` function, if a validator is set.
     * If this argument is not specified, then the element's `value` property
     * is used, if it exists.
     * @return {boolean} True if `value` is valid.
     */validate:function validate(value){// If this is an element that also has a value property, and there was
// no explicit value argument passed, use the element's property instead.
if(value===undefined&&this.value!==undefined)this.invalid=!this._getValidity(this.value);else this.invalid=!this._getValidity(value);return!this.invalid;},/**
     * Returns true if `value` is valid.  By default, it is passed
     * to the validator's `validate()` function, if a validator is set. You
     * should override this method if you want to implement custom validity
     * logic for your element.
     *
     * @param {Object} value The value to be validated.
     * @return {boolean} True if `value` is valid.
     */_getValidity:function _getValidity(value){if(this.hasValidator()){return this._validator.validate(value);}return true;}};/**
  Polymer.IronFormElementBehavior enables a custom element to be included
  in an `iron-form`.

  Events `iron-form-element-register` and `iron-form-element-unregister` are not fired on Polymer 2.0.

  @demo demo/index.html
  @polymerBehavior
  */Polymer.IronFormElementBehavior={properties:{/**
       * Fired when the element is added to an `iron-form`.
       *
       * @event iron-form-element-register
       *//**
       * Fired when the element is removed from an `iron-form`.
       *
       * @event iron-form-element-unregister
       *//**
       * The name of this element.
       */name:{type:String},/**
       * The value for this element.
       */value:{notify:true,type:String},/**
       * Set to true to mark the input as required. If used in a form, a
       * custom element that uses this behavior should also use
       * Polymer.IronValidatableBehavior and define a custom validation method.
       * Otherwise, a `required` element will always be considered valid.
       * It's also strongly recommended to provide a visual style for the element
       * when its value is invalid.
       */required:{type:Boolean,value:false},/**
       * The form that the element is registered to.
       */_parentForm:{type:Object}},attached:Polymer.Element?null:function(){// Note: the iron-form that this element belongs to will set this
// element's _parentForm property when handling this event.
this.fire('iron-form-element-register');},detached:Polymer.Element?null:function(){if(this._parentForm){this._parentForm.fire('iron-form-element-unregister',{target:this});}}};/**
   * Use `Polymer.IronCheckedElementBehavior` to implement a custom element
   * that has a `checked` property, which can be used for validation if the
   * element is also `required`. Element instances implementing this behavior
   * will also be registered for use in an `iron-form` element.
   *
   * @demo demo/index.html
   * @polymerBehavior Polymer.IronCheckedElementBehavior
   */Polymer.IronCheckedElementBehaviorImpl={properties:{/**
       * Fired when the checked state changes.
       *
       * @event iron-change
       *//**
       * Gets or sets the state, `true` is checked and `false` is unchecked.
       */checked:{type:Boolean,value:false,reflectToAttribute:true,notify:true,observer:'_checkedChanged'},/**
       * If true, the button toggles the active state with each tap or press
       * of the spacebar.
       */toggles:{type:Boolean,value:true,reflectToAttribute:true},/* Overriden from Polymer.IronFormElementBehavior */value:{type:String,value:'on',observer:'_valueChanged'}},observers:['_requiredChanged(required)'],created:function created(){// Used by `iron-form` to handle the case that an element with this behavior
// doesn't have a role of 'checkbox' or 'radio', but should still only be
// included when the form is serialized if `this.checked === true`.
this._hasIronCheckedElementBehavior=true;},/**
     * Returns false if the element is required and not checked, and true otherwise.
     * @param {*=} _value Ignored.
     * @return {boolean} true if `required` is false or if `checked` is true.
     */_getValidity:function _getValidity(_value){return this.disabled||!this.required||this.checked;},/**
     * Update the aria-required label when `required` is changed.
     */_requiredChanged:function _requiredChanged(){if(this.required){this.setAttribute('aria-required','true');}else{this.removeAttribute('aria-required');}},/**
     * Fire `iron-changed` when the checked state changes.
     */_checkedChanged:function _checkedChanged(){this.active=this.checked;this.fire('iron-change');},/**
     * Reset value to 'on' if it is set to `undefined`.
     */_valueChanged:function _valueChanged(){if(this.value===undefined||this.value===null){this.value='on';}}};/** @polymerBehavior Polymer.IronCheckedElementBehavior */Polymer.IronCheckedElementBehavior=[Polymer.IronFormElementBehavior,Polymer.IronValidatableBehavior,Polymer.IronCheckedElementBehaviorImpl];/**
   * `Polymer.PaperInkyFocusBehavior` implements a ripple when the element has keyboard focus.
   *
   * @polymerBehavior Polymer.PaperInkyFocusBehavior
   */Polymer.PaperInkyFocusBehaviorImpl={observers:['_focusedChanged(receivedFocusFromKeyboard)'],_focusedChanged:function _focusedChanged(receivedFocusFromKeyboard){if(receivedFocusFromKeyboard){this.ensureRipple();}if(this.hasRipple()){this._ripple.holdDown=receivedFocusFromKeyboard;}},_createRipple:function _createRipple(){var ripple=Polymer.PaperRippleBehavior._createRipple();ripple.id='ink';ripple.setAttribute('center','');ripple.classList.add('circle');return ripple;}};/** @polymerBehavior Polymer.PaperInkyFocusBehavior */Polymer.PaperInkyFocusBehavior=[Polymer.IronButtonState,Polymer.IronControlState,Polymer.PaperRippleBehavior,Polymer.PaperInkyFocusBehaviorImpl];/**
   * Use `Polymer.PaperCheckedElementBehavior` to implement a custom element
   * that has a `checked` property similar to `Polymer.IronCheckedElementBehavior`
   * and is compatible with having a ripple effect.
   * @polymerBehavior Polymer.PaperCheckedElementBehavior
   */Polymer.PaperCheckedElementBehaviorImpl={/**
     * Synchronizes the element's checked state with its ripple effect.
     */_checkedChanged:function _checkedChanged(){Polymer.IronCheckedElementBehaviorImpl._checkedChanged.call(this);if(this.hasRipple()){if(this.checked){this._ripple.setAttribute('checked','');}else{this._ripple.removeAttribute('checked');}}},/**
     * Synchronizes the element's `active` and `checked` state.
     */_buttonStateChanged:function _buttonStateChanged(){Polymer.PaperRippleBehavior._buttonStateChanged.call(this);if(this.disabled){return;}if(this.isAttached){this.checked=this.active;}}};/** @polymerBehavior Polymer.PaperCheckedElementBehavior */Polymer.PaperCheckedElementBehavior=[Polymer.PaperInkyFocusBehavior,Polymer.IronCheckedElementBehavior,Polymer.PaperCheckedElementBehaviorImpl];Polymer({is:'paper-checkbox',behaviors:[Polymer.PaperCheckedElementBehavior],hostAttributes:{role:'checkbox','aria-checked':false,tabindex:0},properties:{/**
         * Fired when the checked state changes due to user interaction.
         *
         * @event change
         *//**
         * Fired when the checked state changes.
         *
         * @event iron-change
         */ariaActiveAttribute:{type:String,value:'aria-checked'}},attached:function attached(){// Wait until styles have resolved to check for the default sentinel.
// See polymer#4009 for more details.
Polymer.RenderStatus.afterNextRender(this,function(){var inkSize=this.getComputedStyleValue('--calculated-paper-checkbox-ink-size').trim();// If unset, compute and set the default `--paper-checkbox-ink-size`.
if(inkSize==='-1px'){var checkboxSize=parseFloat(this.getComputedStyleValue('--calculated-paper-checkbox-size').trim());var defaultInkSize=Math.floor(8/3*checkboxSize);// The checkbox and ripple need to have the same parity so that their
// centers align.
if(defaultInkSize%2!==checkboxSize%2){defaultInkSize++;}this.updateStyles({'--paper-checkbox-ink-size':defaultInkSize+'px'});}});},_computeCheckboxClass:function _computeCheckboxClass(checked,invalid){var className='';if(checked){className+='checked ';}if(invalid){className+='invalid';}return className;},_computeCheckmarkClass:function _computeCheckmarkClass(checked){return checked?'':'hidden';},// create ripple inside the checkboxContainer
_createRipple:function _createRipple(){this._rippleContainer=this.$.checkboxContainer;return Polymer.PaperInkyFocusBehaviorImpl._createRipple.call(this);}});(function(){'use strict';Polymer.IronA11yAnnouncer=Polymer({is:'iron-a11y-announcer',properties:{/**
           * The value of mode is used to set the `aria-live` attribute
           * for the element that will be announced. Valid values are: `off`,
           * `polite` and `assertive`.
           */mode:{type:String,value:'polite'},_text:{type:String,value:''}},created:function created(){if(!Polymer.IronA11yAnnouncer.instance){Polymer.IronA11yAnnouncer.instance=this;}document.body.addEventListener('iron-announce',this._onIronAnnounce.bind(this));},/**
         * Cause a text string to be announced by screen readers.
         *
         * @param {string} text The text that should be announced.
         */announce:function announce(text){this._text='';this.async(function(){this._text=text;},100);},_onIronAnnounce:function _onIronAnnounce(event){if(event.detail&&event.detail.text){this.announce(event.detail.text);}}});Polymer.IronA11yAnnouncer.instance=null;Polymer.IronA11yAnnouncer.requestAvailability=function(){if(!Polymer.IronA11yAnnouncer.instance){Polymer.IronA11yAnnouncer.instance=document.createElement('iron-a11y-announcer');}document.body.appendChild(Polymer.IronA11yAnnouncer.instance);};})();Polymer({is:'iron-input',behaviors:[Polymer.IronValidatableBehavior],/**
       * Fired whenever `validate()` is called.
       *
       * @event iron-input-validate
       */properties:{/**
         * Use this property instead of `value` for two-way data binding, or to
         * set a default value for the input. **Do not** use the distributed
         * input's `value` property to set a default value.
         */bindValue:{type:String},/**
         * Computed property that echoes `bindValue` (mostly used for Polymer 1.0
         * backcompatibility, if you were one-way binding to the Polymer 1.0
         * `input is="iron-input"` value attribute).
         */value:{computed:'_computeValue(bindValue)'},/**
         * Regex-like list of characters allowed as input; all characters not in the list
         * will be rejected. The recommended format should be a list of allowed characters,
         * for example, `[a-zA-Z0-9.+-!;:]`.
         *
         * This pattern represents the allowed characters for the field; as the user inputs text,
         * each individual character will be checked against the pattern (rather than checking
         * the entire value as a whole). If a character is not a match, it will be rejected.
         *
         * Pasted input will have each character checked individually; if any character
         * doesn't match `allowedPattern`, the entire pasted string will be rejected.
         *
         * Note: if you were using `iron-input` in 1.0, you were also required to
         * set `prevent-invalid-input`. This is no longer needed as of Polymer 2.0,
         * and will be set automatically for you if an `allowedPattern` is provided.
         *
         */allowedPattern:{type:String},/**
         * Set to true to auto-validate the input value as you type.
         */autoValidate:{type:Boolean,value:false}},observers:['_bindValueChanged(bindValue, _inputElement)'],listeners:{'input':'_onInput','keypress':'_onKeypress'},created:function created(){Polymer.IronA11yAnnouncer.requestAvailability();this._previousValidInput='';this._patternAlreadyChecked=false;},attached:function attached(){// If the input is added at a later time, update the internal reference.
this._observer=Polymer.dom(this).observeNodes(function(info){this._initSlottedInput();}.bind(this));},detached:function detached(){if(this._observer){Polymer.dom(this).unobserveNodes(this._observer);this._observer=null;}},/**
       * Returns the distributed <input> element.
       */get inputElement(){return this._inputElement;},_initSlottedInput:function _initSlottedInput(){this._inputElement=this.getEffectiveChildren()[0];if(this.inputElement&&this.inputElement.value){this.bindValue=this.inputElement.value;}this.fire('iron-input-ready');},get _patternRegExp(){var pattern;if(this.allowedPattern){pattern=new RegExp(this.allowedPattern);}else{switch(this.type){case'number':pattern=/[0-9.,e-]/;break;}}return pattern;},/**
       * @suppress {checkTypes}
       */_bindValueChanged:function _bindValueChanged(bindValue,inputElement){// The observer could have run before attached() when we have actually initialized
// this property.
if(!inputElement){return;}if(bindValue===undefined){inputElement.value=null;}else if(bindValue!==inputElement.value){this.inputElement.value=bindValue;}if(this.autoValidate){this.validate();}// manually notify because we don't want to notify until after setting value
this.fire('bind-value-changed',{value:bindValue});},_onInput:function _onInput(){// Need to validate each of the characters pasted if they haven't
// been validated inside `_onKeypress` already.
if(this.allowedPattern&&!this._patternAlreadyChecked){var valid=this._checkPatternValidity();if(!valid){this._announceInvalidCharacter('Invalid string of characters not entered.');this.inputElement.value=this._previousValidInput;}}this.bindValue=this._previousValidInput=this.inputElement.value;this._patternAlreadyChecked=false;},_isPrintable:function _isPrintable(event){// What a control/printable character is varies wildly based on the browser.
// - most control characters (arrows, backspace) do not send a `keypress` event
//   in Chrome, but the *do* on Firefox
// - in Firefox, when they do send a `keypress` event, control chars have
//   a charCode = 0, keyCode = xx (for ex. 40 for down arrow)
// - printable characters always send a keypress event.
// - in Firefox, printable chars always have a keyCode = 0. In Chrome, the keyCode
//   always matches the charCode.
// None of this makes any sense.
// For these keys, ASCII code == browser keycode.
var anyNonPrintable=event.keyCode==8||// backspace
event.keyCode==9||// tab
event.keyCode==13||// enter
event.keyCode==27;// escape
// For these keys, make sure it's a browser keycode and not an ASCII code.
var mozNonPrintable=event.keyCode==19||// pause
event.keyCode==20||// caps lock
event.keyCode==45||// insert
event.keyCode==46||// delete
event.keyCode==144||// num lock
event.keyCode==145||// scroll lock
event.keyCode>32&&event.keyCode<41||// page up/down, end, home, arrows
event.keyCode>111&&event.keyCode<124;// fn keys
return!anyNonPrintable&&!(event.charCode==0&&mozNonPrintable);},_onKeypress:function _onKeypress(event){if(!this.allowedPattern&&this.type!=='number'){return;}var regexp=this._patternRegExp;if(!regexp){return;}// Handle special keys and backspace
if(event.metaKey||event.ctrlKey||event.altKey){return;}// Check the pattern either here or in `_onInput`, but not in both.
this._patternAlreadyChecked=true;var thisChar=String.fromCharCode(event.charCode);if(this._isPrintable(event)&&!regexp.test(thisChar)){event.preventDefault();this._announceInvalidCharacter('Invalid character '+thisChar+' not entered.');}},_checkPatternValidity:function _checkPatternValidity(){var regexp=this._patternRegExp;if(!regexp){return true;}for(var i=0;i<this.inputElement.value.length;i++){if(!regexp.test(this.inputElement.value[i])){return false;}}return true;},/**
       * Returns true if `value` is valid. The validator provided in `validator` will be used first,
       * then any constraints.
       * @return {boolean} True if the value is valid.
       */validate:function validate(){if(!this.inputElement){this.invalid=false;return true;}// Use the nested input's native validity.
var valid=this.inputElement.checkValidity();// Only do extra checking if the browser thought this was valid.
if(valid){// Empty, required input is invalid
if(this.required&&this.bindValue===''){valid=false;}else if(this.hasValidator()){valid=Polymer.IronValidatableBehavior.validate.call(this,this.bindValue);}}this.invalid=!valid;this.fire('iron-input-validate');return valid;},_announceInvalidCharacter:function _announceInvalidCharacter(message){this.fire('iron-announce',{text:message});},_computeValue:function _computeValue(bindValue){return bindValue;}});// Generate unique, monotonically increasing IDs for labels (needed by
// aria-labelledby) and add-ons.
Polymer.PaperInputHelper={};Polymer.PaperInputHelper.NextLabelID=1;Polymer.PaperInputHelper.NextAddonID=1;/**
   * Use `Polymer.PaperInputBehavior` to implement inputs with `<paper-input-container>`. This
   * behavior is implemented by `<paper-input>`. It exposes a number of properties from
   * `<paper-input-container>` and `<input is="iron-input">` and they should be bound in your
   * template.
   *
   * The input element can be accessed by the `inputElement` property if you need to access
   * properties or methods that are not exposed.
   * @polymerBehavior Polymer.PaperInputBehavior
   */Polymer.PaperInputBehaviorImpl={properties:{/**
       * Fired when the input changes due to user interaction.
       *
       * @event change
       *//**
       * The label for this input. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * `<label>`'s content and `hidden` property, e.g.
       * `<label hidden$="[[!label]]">[[label]]</label>` in your `template`
       */label:{type:String},/**
       * The value for this input. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<iron-input>`'s `bindValue`
       * property, or the value property of your input that is `notify:true`.
       */value:{notify:true,type:String},/**
       * Set to true to disable this input. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * both the `<paper-input-container>`'s and the input's `disabled` property.
       */disabled:{type:Boolean,value:false},/**
       * Returns true if the value is invalid. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to both the
       * `<paper-input-container>`'s and the input's `invalid` property.
       *
       * If `autoValidate` is true, the `invalid` attribute is managed automatically,
       * which can clobber attempts to manage it manually.
       */invalid:{type:Boolean,value:false,notify:true},/**
       * Set this to specify the pattern allowed by `preventInvalidInput`. If
       * you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `allowedPattern`
       * property.
       */allowedPattern:{type:String},/**
       * The type of the input. The supported types are `text`, `number` and `password`.
       * If you're using PaperInputBehavior to implement your own paper-input-like element,
       * bind this to the `<input is="iron-input">`'s `type` property.
       */type:{type:String},/**
       * The datalist of the input (if any). This should match the id of an existing `<datalist>`.
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `list` property.
       */list:{type:String},/**
       * A pattern to validate the `input` with. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<input is="iron-input">`'s `pattern` property.
       */pattern:{type:String},/**
       * Set to true to mark the input as required. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<input is="iron-input">`'s `required` property.
       */required:{type:Boolean,value:false},/**
       * The error message to display when the input is invalid. If you're using
       * PaperInputBehavior to implement your own paper-input-like element,
       * bind this to the `<paper-input-error>`'s content, if using.
       */errorMessage:{type:String},/**
       * Set to true to show a character counter.
       */charCounter:{type:Boolean,value:false},/**
       * Set to true to disable the floating label. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<paper-input-container>`'s `noLabelFloat` property.
       */noLabelFloat:{type:Boolean,value:false},/**
       * Set to true to always float the label. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<paper-input-container>`'s `alwaysFloatLabel` property.
       */alwaysFloatLabel:{type:Boolean,value:false},/**
       * Set to true to auto-validate the input value. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<paper-input-container>`'s `autoValidate` property.
       */autoValidate:{type:Boolean,value:false},/**
       * Name of the validator to use. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<input is="iron-input">`'s `validator` property.
       */validator:{type:String},// HTMLInputElement attributes for binding if needed
/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `autocomplete` property.
       */autocomplete:{type:String,value:'off'},/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `autofocus` property.
       */autofocus:{type:Boolean,observer:'_autofocusChanged'},/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `inputmode` property.
       */inputmode:{type:String},/**
       * The minimum length of the input value.
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `minlength` property.
       */minlength:{type:Number},/**
       * The maximum length of the input value.
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `maxlength` property.
       */maxlength:{type:Number},/**
       * The minimum (numeric or date-time) input value.
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `min` property.
       */min:{type:String},/**
       * The maximum (numeric or date-time) input value.
       * Can be a String (e.g. `"2000-01-01"`) or a Number (e.g. `2`).
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `max` property.
       */max:{type:String},/**
       * Limits the numeric or date-time increments.
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `step` property.
       */step:{type:String},/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `name` property.
       */name:{type:String},/**
       * A placeholder string in addition to the label. If this is set, the label will always float.
       */placeholder:{type:String,// need to set a default so _computeAlwaysFloatLabel is run
value:''},/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `readonly` property.
       */readonly:{type:Boolean,value:false},/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `size` property.
       */size:{type:Number},// Nonstandard attributes for binding if needed
/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `autocapitalize` property.
       */autocapitalize:{type:String,value:'none'},/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `autocorrect` property.
       */autocorrect:{type:String,value:'off'},/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `autosave` property,
       * used with type=search.
       */autosave:{type:String},/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `results` property,
       * used with type=search.
       */results:{type:Number},/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `accept` property,
       * used with type=file.
       */accept:{type:String},/**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the`<input is="iron-input">`'s `multiple` property,
       * used with type=file.
       */multiple:{type:Boolean},_ariaDescribedBy:{type:String,value:''},_ariaLabelledBy:{type:String,value:''}},listeners:{'addon-attached':'_onAddonAttached'},keyBindings:{'shift+tab:keydown':'_onShiftTabDown'},hostAttributes:{tabindex:0},/**
     * Returns a reference to the input element.
     */get inputElement(){return this.$.input;},/**
     * Returns a reference to the focusable element.
     */get _focusableElement(){return this.inputElement;},created:function created(){// These types have some default placeholder text; overlapping
// the label on top of it looks terrible. Auto-float the label in this case.
this._typesThatHaveText=["date","datetime","datetime-local","month","time","week","file"];},attached:function attached(){this._updateAriaLabelledBy();// In the 2.0 version of the element, this is handled in `onIronInputReady`,
// i.e. after the native input has finished distributing. In the 1.0 version,
// the input is in the shadow tree, so it's already available.
if(!Polymer.Element&&this.inputElement&&this._typesThatHaveText.indexOf(this.inputElement.type)!==-1){this.alwaysFloatLabel=true;}},_appendStringWithSpace:function _appendStringWithSpace(str,more){if(str){str=str+' '+more;}else{str=more;}return str;},_onAddonAttached:function _onAddonAttached(event){var target=Polymer.dom(event).rootTarget;if(target.id){this._ariaDescribedBy=this._appendStringWithSpace(this._ariaDescribedBy,target.id);}else{var id='paper-input-add-on-'+Polymer.PaperInputHelper.NextAddonID++;target.id=id;this._ariaDescribedBy=this._appendStringWithSpace(this._ariaDescribedBy,id);}},/**
     * Validates the input element and sets an error style if needed.
     *
     * @return {boolean}
     */validate:function validate(){return this.inputElement.validate();},/**
     * Forward focus to inputElement. Overriden from IronControlState.
     */_focusBlurHandler:function _focusBlurHandler(event){Polymer.IronControlState._focusBlurHandler.call(this,event);// Forward the focus to the nested input.
if(this.focused&&!this._shiftTabPressed&&this._focusableElement){this._focusableElement.focus();}},/**
     * Handler that is called when a shift+tab keypress is detected by the menu.
     *
     * @param {CustomEvent} event A key combination event.
     */_onShiftTabDown:function _onShiftTabDown(event){var oldTabIndex=this.getAttribute('tabindex');this._shiftTabPressed=true;this.setAttribute('tabindex','-1');this.async(function(){this.setAttribute('tabindex',oldTabIndex);this._shiftTabPressed=false;},1);},/**
     * If `autoValidate` is true, then validates the element.
     */_handleAutoValidate:function _handleAutoValidate(){if(this.autoValidate)this.validate();},/**
     * Restores the cursor to its original position after updating the value.
     * @param {string} newValue The value that should be saved.
     */updateValueAndPreserveCaret:function updateValueAndPreserveCaret(newValue){// Not all elements might have selection, and even if they have the
// right properties, accessing them might throw an exception (like for
// <input type=number>)
try{var start=this.inputElement.selectionStart;this.value=newValue;// The cursor automatically jumps to the end after re-setting the value,
// so restore it to its original position.
this.inputElement.selectionStart=start;this.inputElement.selectionEnd=start;}catch(e){// Just set the value and give up on the caret.
this.value=newValue;}},_computeAlwaysFloatLabel:function _computeAlwaysFloatLabel(alwaysFloatLabel,placeholder){return placeholder||alwaysFloatLabel;},_updateAriaLabelledBy:function _updateAriaLabelledBy(){var label=Polymer.dom(this.root).querySelector('label');if(!label){this._ariaLabelledBy='';return;}var labelledBy;if(label.id){labelledBy=label.id;}else{labelledBy='paper-input-label-'+Polymer.PaperInputHelper.NextLabelID++;label.id=labelledBy;}this._ariaLabelledBy=labelledBy;},_onChange:function _onChange(event){// In the Shadow DOM, the `change` event is not leaked into the
// ancestor tree, so we must do this manually.
// See https://w3c.github.io/webcomponents/spec/shadow/#events-that-are-not-leaked-into-ancestor-trees.
if(this.shadowRoot){this.fire(event.type,{sourceEvent:event},{node:this,bubbles:event.bubbles,cancelable:event.cancelable});}},_autofocusChanged:function _autofocusChanged(){// Firefox doesn't respect the autofocus attribute if it's applied after
// the page is loaded (Chrome/WebKit do respect it), preventing an
// autofocus attribute specified in markup from taking effect when the
// element is upgraded. As a workaround, if the autofocus property is set,
// and the focus hasn't already been moved elsewhere, we take focus.
if(this.autofocus&&this._focusableElement){// In IE 11, the default document.activeElement can be the page's
// outermost html element, but there are also cases (under the
// polyfill?) in which the activeElement is not a real HTMLElement, but
// just a plain object. We identify the latter case as having no valid
// activeElement.
var activeElement=document.activeElement;var isActiveElementValid=activeElement instanceof HTMLElement;// Has some other element has already taken the focus?
var isSomeElementActive=isActiveElementValid&&activeElement!==document.body&&activeElement!==document.documentElement;/* IE 11 */if(!isSomeElementActive){// No specific element has taken the focus yet, so we can take it.
this._focusableElement.focus();}}}};/** @polymerBehavior */Polymer.PaperInputBehavior=[Polymer.IronControlState,Polymer.IronA11yKeysBehavior,Polymer.PaperInputBehaviorImpl];/**
   * Use `Polymer.PaperInputAddonBehavior` to implement an add-on for `<paper-input-container>`. A
   * add-on appears below the input, and may display information based on the input value and
   * validity such as a character counter or an error message.
   * @polymerBehavior
   */Polymer.PaperInputAddonBehavior={attached:function attached(){// Workaround for https://github.com/webcomponents/shadydom/issues/96
Polymer.dom.flush();this.fire('addon-attached');},/**
     * The function called by `<paper-input-container>` when the input value or validity changes.
     * @param {{
     *   inputElement: (Element|undefined),
     *   value: (string|undefined),
     *   invalid: boolean
     * }} state -
     *     inputElement: The input element.
     *     value: The input value.
     *     invalid: True if the input value is invalid.
     */update:function update(state){}};Polymer({is:'paper-input-char-counter',behaviors:[Polymer.PaperInputAddonBehavior],properties:{_charCounterStr:{type:String,value:'0'}},/**
     * This overrides the update function in PaperInputAddonBehavior.
     * @param {{
     *   inputElement: (Element|undefined),
     *   value: (string|undefined),
     *   invalid: boolean
     * }} state -
     *     inputElement: The input element.
     *     value: The input value.
     *     invalid: True if the input value is invalid.
     */update:function update(state){if(!state.inputElement){return;}state.value=state.value||'';var counter=state.value.toString().length.toString();if(state.inputElement.hasAttribute('maxlength')){counter+='/'+state.inputElement.getAttribute('maxlength');}this._charCounterStr=counter;}});Polymer({is:'paper-input-container',properties:{/**
       * Set to true to disable the floating label. The label disappears when the input value is
       * not null.
       */noLabelFloat:{type:Boolean,value:false},/**
       * Set to true to always float the floating label.
       */alwaysFloatLabel:{type:Boolean,value:false},/**
       * The attribute to listen for value changes on.
       */attrForValue:{type:String,value:'bind-value'},/**
       * Set to true to auto-validate the input value when it changes.
       */autoValidate:{type:Boolean,value:false},/**
       * True if the input is invalid. This property is set automatically when the input value
       * changes if auto-validating, or when the `iron-input-validate` event is heard from a child.
       */invalid:{observer:'_invalidChanged',type:Boolean,value:false},/**
       * True if the input has focus.
       */focused:{readOnly:true,type:Boolean,value:false,notify:true},_addons:{type:Array// do not set a default value here intentionally - it will be initialized lazily when a
// distributed child is attached, which may occur before configuration for this element
// in polyfill.
},_inputHasContent:{type:Boolean,value:false},_inputSelector:{type:String,value:'input,iron-input,textarea,.paper-input-input'},_boundOnFocus:{type:Function,value:function value(){return this._onFocus.bind(this);}},_boundOnBlur:{type:Function,value:function value(){return this._onBlur.bind(this);}},_boundOnInput:{type:Function,value:function value(){return this._onInput.bind(this);}},_boundValueChanged:{type:Function,value:function value(){return this._onValueChanged.bind(this);}}},listeners:{'addon-attached':'_onAddonAttached','iron-input-validate':'_onIronInputValidate'},get _valueChangedEvent(){return this.attrForValue+'-changed';},get _propertyForValue(){return Polymer.CaseMap.dashToCamelCase(this.attrForValue);},get _inputElement(){return Polymer.dom(this).querySelector(this._inputSelector);},get _inputElementValue(){return this._inputElement[this._propertyForValue]||this._inputElement.value;},ready:function ready(){if(!this._addons){this._addons=[];}this.addEventListener('focus',this._boundOnFocus,true);this.addEventListener('blur',this._boundOnBlur,true);},attached:function attached(){if(this.attrForValue){this._inputElement.addEventListener(this._valueChangedEvent,this._boundValueChanged);}else{this.addEventListener('input',this._onInput);}// Only validate when attached if the input already has a value.
if(this._inputElementValue&&this._inputElementValue!=''){this._handleValueAndAutoValidate(this._inputElement);}else{this._handleValue(this._inputElement);}},_onAddonAttached:function _onAddonAttached(event){if(!this._addons){this._addons=[];}var target=event.target;if(this._addons.indexOf(target)===-1){this._addons.push(target);if(this.isAttached){this._handleValue(this._inputElement);}}},_onFocus:function _onFocus(){this._setFocused(true);},_onBlur:function _onBlur(){this._setFocused(false);this._handleValueAndAutoValidate(this._inputElement);},_onInput:function _onInput(event){this._handleValueAndAutoValidate(event.target);},_onValueChanged:function _onValueChanged(event){var input=event.target;// Problem: if the input is required but has no text entered, we should
// only validate it on blur (so that an empty form doesn't come up red
// immediately; however, in this handler, we don't know whether this is
// the booting up value or a value in the future. I am assuming that the
// case  we care about manifests itself when the value is undefined.
// If this causes future problems, we need to do something like track whether
// the iron-input-ready event has fired, and this handler came before that.
if(input.value===undefined){return;}this._handleValueAndAutoValidate(event.target);},_handleValue:function _handleValue(inputElement){var value=this._inputElementValue;// type="number" hack needed because this.value is empty until it's valid
if(value||value===0||inputElement.type==='number'&&!inputElement.checkValidity()){this._inputHasContent=true;}else{this._inputHasContent=false;}this.updateAddons({inputElement:inputElement,value:value,invalid:this.invalid});},_handleValueAndAutoValidate:function _handleValueAndAutoValidate(inputElement){if(this.autoValidate&&inputElement){var valid;if(inputElement.validate){valid=inputElement.validate(this._inputElementValue);}else{valid=inputElement.checkValidity();}this.invalid=!valid;}// Call this last to notify the add-ons.
this._handleValue(inputElement);},_onIronInputValidate:function _onIronInputValidate(event){this.invalid=this._inputElement.invalid;},_invalidChanged:function _invalidChanged(){if(this._addons){this.updateAddons({invalid:this.invalid});}},/**
     * Call this to update the state of add-ons.
     * @param {Object} state Add-on state.
     */updateAddons:function updateAddons(state){for(var addon,index=0;addon=this._addons[index];index++){addon.update(state);}},_computeInputContentClass:function _computeInputContentClass(noLabelFloat,alwaysFloatLabel,focused,invalid,_inputHasContent){var cls='input-content';if(!noLabelFloat){var label=this.querySelector('label');if(alwaysFloatLabel||_inputHasContent){cls+=' label-is-floating';// If the label is floating, ignore any offsets that may have been
// applied from a prefix element.
this.$.labelAndInputContainer.style.position='static';if(invalid){cls+=' is-invalid';}else if(focused){cls+=" label-is-highlighted";}}else{// When the label is not floating, it should overlap the input element.
if(label){this.$.labelAndInputContainer.style.position='relative';}if(invalid){cls+=' is-invalid';}}}else{if(_inputHasContent){cls+=' label-is-hidden';}if(invalid){cls+=' is-invalid';}}if(focused){cls+=' focused';}return cls;},_computeUnderlineClass:function _computeUnderlineClass(focused,invalid){var cls='underline';if(invalid){cls+=' is-invalid';}else if(focused){cls+=' is-highlighted';}return cls;},_computeAddOnContentClass:function _computeAddOnContentClass(focused,invalid){var cls='add-on-content';if(invalid){cls+=' is-invalid';}else if(focused){cls+=' is-highlighted';}return cls;}});Polymer({is:'paper-input-error',behaviors:[Polymer.PaperInputAddonBehavior],properties:{/**
       * True if the error is showing.
       */invalid:{readOnly:true,reflectToAttribute:true,type:Boolean}},/**
     * This overrides the update function in PaperInputAddonBehavior.
     * @param {{
     *   inputElement: (Element|undefined),
     *   value: (string|undefined),
     *   invalid: boolean
     * }} state -
     *     inputElement: The input element.
     *     value: The input value.
     *     invalid: True if the input value is invalid.
     */update:function update(state){this._setInvalid(state.invalid);}});Polymer({is:'paper-input',behaviors:[Polymer.PaperInputBehavior,Polymer.IronFormElementBehavior],beforeRegister:function beforeRegister(){// We need to tell which kind of of template to stamp based on
// what kind of `iron-input` we got, but because of polyfills and
// custom elements differences between v0 and v1, the safest bet is
// to check a particular method we know the iron-input#2.x can have.
// If it doesn't have it, then it's an iron-input#1.x.
var ironInput=document.createElement('iron-input');var version=typeof ironInput._initSlottedInput=='function'?'v1':'v0';var template=Polymer.DomModule.import('paper-input','template');var inputTemplate=Polymer.DomModule.import('paper-input','template#'+version);var inputPlaceholder=template.content.querySelector('#template-placeholder');if(inputPlaceholder){inputPlaceholder.parentNode.replaceChild(inputTemplate.content,inputPlaceholder);}// else it's already been processed, probably in superclass
},/**
     * Returns a reference to the focusable element. Overridden from PaperInputBehavior
     * to correctly focus the native input.
     */get _focusableElement(){return Polymer.Element?this.inputElement._inputElement:this.inputElement;},// Note: This event is only available in the 1.0 version of this element.
// In 2.0, the functionality of `_onIronInputReady` is done in
// PaperInputBehavior::attached.
listeners:{'iron-input-ready':'_onIronInputReady'},_onIronInputReady:function _onIronInputReady(){if(this.inputElement&&this._typesThatHaveText.indexOf(this.$.nativeInput.type)!==-1){this.alwaysFloatLabel=true;}// Only validate when attached if the input already has a value.
if(!!this.inputElement.bindValue){this.$.container._handleValueAndAutoValidate(this.inputElement);}}});(function(){'use strict';var workingURL;var urlDoc,urlBase,anchor;/**
     * @param {string} path
     * @param {string=} base
     * @return {!URL|!HTMLAnchorElement}
     */function resolveURL(path,base){if(workingURL===undefined){workingURL=false;try{var u=new URL('b','http://a');u.pathname='c%20d';workingURL=u.href==='http://a/c%20d';workingURL=workingURL&&new URL('http://www.google.com/?foo bar').href==='http://www.google.com/?foo%20bar';}catch(e){}}if(workingURL){return new URL(path,base);}if(!urlDoc){urlDoc=document.implementation.createHTMLDocument('url');urlBase=urlDoc.createElement('base');urlDoc.head.appendChild(urlBase);anchor=/** @type {HTMLAnchorElement}*/urlDoc.createElement('a');}urlBase.href=base;anchor.href=path.replace(/ /g,'%20');return anchor;}Polymer({is:'iron-location',properties:{/**
         * The pathname component of the URL.
         */path:{type:String,notify:true,value:function value(){return window.decodeURIComponent(window.location.pathname);}},/**
         * The query string portion of the URL.
         */query:{type:String,notify:true,value:function value(){return window.location.search.slice(1);}},/**
         * The hash component of the URL.
         */hash:{type:String,notify:true,value:function value(){return window.decodeURIComponent(window.location.hash.slice(1));}},/**
         * If the user was on a URL for less than `dwellTime` milliseconds, it
         * won't be added to the browser's history, but instead will be replaced
         * by the next entry.
         *
         * This is to prevent large numbers of entries from clogging up the user's
         * browser history. Disable by setting to a negative number.
         */dwellTime:{type:Number,value:2000},/**
         * A regexp that defines the set of URLs that should be considered part
         * of this web app.
         *
         * Clicking on a link that matches this regex won't result in a full page
         * navigation, but will instead just update the URL state in place.
         *
         * This regexp is given everything after the origin in an absolute
         * URL. So to match just URLs that start with /search/ do:
         *     url-space-regex="^/search/"
         *
         * @type {string|RegExp}
         */urlSpaceRegex:{type:String,value:''},/**
         * urlSpaceRegex, but coerced into a regexp.
         *
         * @type {RegExp}
         */_urlSpaceRegExp:{computed:'_makeRegExp(urlSpaceRegex)'},_lastChangedAt:{type:Number},_initialized:{type:Boolean,value:false}},hostAttributes:{hidden:true},observers:['_updateUrl(path, query, hash)'],attached:function attached(){this.listen(window,'hashchange','_hashChanged');this.listen(window,'location-changed','_urlChanged');this.listen(window,'popstate','_urlChanged');this.listen(/** @type {!HTMLBodyElement} */document.body,'click','_globalOnClick');// Give a 200ms grace period to make initial redirects without any
// additions to the user's history.
this._lastChangedAt=window.performance.now()-(this.dwellTime-200);this._initialized=true;this._urlChanged();},detached:function detached(){this.unlisten(window,'hashchange','_hashChanged');this.unlisten(window,'location-changed','_urlChanged');this.unlisten(window,'popstate','_urlChanged');this.unlisten(/** @type {!HTMLBodyElement} */document.body,'click','_globalOnClick');this._initialized=false;},_hashChanged:function _hashChanged(){this.hash=window.decodeURIComponent(window.location.hash.substring(1));},_urlChanged:function _urlChanged(){// We want to extract all info out of the updated URL before we
// try to write anything back into it.
//
// i.e. without _dontUpdateUrl we'd overwrite the new path with the old
// one when we set this.hash. Likewise for query.
this._dontUpdateUrl=true;this._hashChanged();this.path=window.decodeURIComponent(window.location.pathname);this.query=window.location.search.substring(1);this._dontUpdateUrl=false;this._updateUrl();},_getUrl:function _getUrl(){var partiallyEncodedPath=window.encodeURI(this.path).replace(/\#/g,'%23').replace(/\?/g,'%3F');var partiallyEncodedQuery='';if(this.query){partiallyEncodedQuery='?'+this.query.replace(/\#/g,'%23');}var partiallyEncodedHash='';if(this.hash){partiallyEncodedHash='#'+window.encodeURI(this.hash);}return partiallyEncodedPath+partiallyEncodedQuery+partiallyEncodedHash;},_updateUrl:function _updateUrl(){if(this._dontUpdateUrl||!this._initialized){return;}if(this.path===window.decodeURIComponent(window.location.pathname)&&this.query===window.location.search.substring(1)&&this.hash===window.decodeURIComponent(window.location.hash.substring(1))){// Nothing to do, the current URL is a representation of our properties.
return;}var newUrl=this._getUrl();// Need to use a full URL in case the containing page has a base URI.
var fullNewUrl=resolveURL(newUrl,window.location.protocol+'//'+window.location.host).href;var now=window.performance.now();var shouldReplace=this._lastChangedAt+this.dwellTime>now;this._lastChangedAt=now;if(shouldReplace){window.history.replaceState({},'',fullNewUrl);}else{window.history.pushState({},'',fullNewUrl);}this.fire('location-changed',{},{node:window});},/**
       * A necessary evil so that links work as expected. Does its best to
       * bail out early if possible.
       *
       * @param {MouseEvent} event .
       */_globalOnClick:function _globalOnClick(event){// If another event handler has stopped this event then there's nothing
// for us to do. This can happen e.g. when there are multiple
// iron-location elements in a page.
if(event.defaultPrevented){return;}var href=this._getSameOriginLinkHref(event);if(!href){return;}event.preventDefault();// If the navigation is to the current page we shouldn't add a history
// entry or fire a change event.
if(href===window.location.href){return;}window.history.pushState({},'',href);this.fire('location-changed',{},{node:window});},/**
       * Returns the absolute URL of the link (if any) that this click event
       * is clicking on, if we can and should override the resulting full
       * page navigation. Returns null otherwise.
       *
       * @param {MouseEvent} event .
       * @return {string?} .
       */_getSameOriginLinkHref:function _getSameOriginLinkHref(event){// We only care about left-clicks.
if(event.button!==0){return null;}// We don't want modified clicks, where the intent is to open the page
// in a new tab.
if(event.metaKey||event.ctrlKey){return null;}var eventPath=Polymer.dom(event).path;var anchor=null;for(var i=0;i<eventPath.length;i++){var element=eventPath[i];if(element.tagName==='A'&&element.href){anchor=element;break;}}// If there's no link there's nothing to do.
if(!anchor){return null;}// Target blank is a new tab, don't intercept.
if(anchor.target==='_blank'){return null;}// If the link is for an existing parent frame, don't intercept.
if((anchor.target==='_top'||anchor.target==='_parent')&&window.top!==window){return null;}var href=anchor.href;// It only makes sense for us to intercept same-origin navigations.
// pushState/replaceState don't work with cross-origin links.
var url;if(document.baseURI!=null){url=resolveURL(href,/** @type {string} */document.baseURI);}else{url=resolveURL(href);}var origin;// IE Polyfill
if(window.location.origin){origin=window.location.origin;}else{origin=window.location.protocol+'//'+window.location.host;}var urlOrigin;if(url.origin){urlOrigin=url.origin;}else{urlOrigin=url.protocol+'//'+url.host;}if(urlOrigin!==origin){return null;}var normalizedHref=url.pathname+url.search+url.hash;// pathname should start with '/', but may not if `new URL` is not supported
if(normalizedHref[0]!=='/'){normalizedHref='/'+normalizedHref;}// If we've been configured not to handle this url... don't handle it!
if(this._urlSpaceRegExp&&!this._urlSpaceRegExp.test(normalizedHref)){return null;}// Need to use a full URL in case the containing page has a base URI.
var fullNormalizedHref=resolveURL(normalizedHref,window.location.href).href;return fullNormalizedHref;},_makeRegExp:function _makeRegExp(urlSpaceRegex){return RegExp(urlSpaceRegex);}});})();(function(){var parsers=require('../common/parsers.js');window.Order=require('../common/order.js');;defineCustomElement('order-input',function(_Polymer$Element3){_inherits(_class3,_Polymer$Element3);function _class3(){_classCallCheck(this,_class3);return _possibleConstructorReturn(this,(_class3.__proto__||Object.getPrototypeOf(_class3)).apply(this,arguments));}_createClass(_class3,[{key:"_onInputChanged",value:function _onInputChanged(){var header=this.$.input.querySelector('header');if(header)header.hidden=true;var order=new parsers.OrderUpHtmlParser().parse(this.$.input);console.log('order',order);this._changeUrl(order);}},{key:"ready",value:function ready(){_get(_class3.prototype.__proto__||Object.getPrototypeOf(_class3.prototype),"ready",this).call(this);this.usePercentForTip=JSON.parse(localStorage.getItem('usePercentForTip'));this.$.input.focus();}// _computeTipPercentClass() {
//     return this.usePercentForTip ? '' : 'hidden';
// }
// _computeTipDollarClass() {
//     return !this.usePercentForTip ? '' : 'hidden';
// }
// _onSplitButtonTap() {
//     var text = this.$.textarea.value;
//     var tax = Number(this.$.tax.value || 0);
//     var fee = Number(this.$.fee.value || 0);
//     var tip = Number(this.$.tip.value || 0);
//     var isTipPercentage = this.usePercentForTip;
//
//     var order;
//     try {
//         order =  new parsers.OrderUpParser().parse(text, fee, tax, tip, isTipPercentage).split();
//     } catch(e) {
//         console.error('OrderUp parser failed', e);
//         console.log('trying csv parser');
//         order =  new parsers.CsvParser().parse(text).split();
//     }
//     this._changeUrl(order);
// }
// _onCheckboxTap() {
//     localStorage.setItem('usePercentForTip', JSON.stringify(!this.usePercentForTip));
// }
},{key:"_changeUrl",value:function _changeUrl(order){if(!order||!order.hasPeople){this.$.location.query='';return;}var query='tax='+order.tax+'&fee='+order.fee+'&tip='+order.tipDollars;var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=order.people[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){var _step2$value=_slicedToArray(_step2.value,2),person=_step2$value[0],val=_step2$value[1];query+='&'+encodeURIComponent(person)+'='+Utils._prettifyNumber(val);}}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}this.$.location.query=query;}}]);return _class3;}(Polymer.Element));})();/**
   * `Polymer.NeonAnimatableBehavior` is implemented by elements containing animations for use with
   * elements implementing `Polymer.NeonAnimationRunnerBehavior`.
   * @polymerBehavior
   */Polymer.NeonAnimatableBehavior={properties:{/**
       * Animation configuration. See README for more info.
       */animationConfig:{type:Object},/**
       * Convenience property for setting an 'entry' animation. Do not set `animationConfig.entry`
       * manually if using this. The animated node is set to `this` if using this property.
       */entryAnimation:{observer:'_entryAnimationChanged',type:String},/**
       * Convenience property for setting an 'exit' animation. Do not set `animationConfig.exit`
       * manually if using this. The animated node is set to `this` if using this property.
       */exitAnimation:{observer:'_exitAnimationChanged',type:String}},_entryAnimationChanged:function _entryAnimationChanged(){this.animationConfig=this.animationConfig||{};this.animationConfig['entry']=[{name:this.entryAnimation,node:this}];},_exitAnimationChanged:function _exitAnimationChanged(){this.animationConfig=this.animationConfig||{};this.animationConfig['exit']=[{name:this.exitAnimation,node:this}];},_copyProperties:function _copyProperties(config1,config2){// shallowly copy properties from config2 to config1
for(var property in config2){config1[property]=config2[property];}},_cloneConfig:function _cloneConfig(config){var clone={isClone:true};this._copyProperties(clone,config);return clone;},_getAnimationConfigRecursive:function _getAnimationConfigRecursive(type,map,allConfigs){if(!this.animationConfig){return;}if(this.animationConfig.value&&typeof this.animationConfig.value==='function'){this._warn(this._logf('playAnimation',"Please put 'animationConfig' inside of your components 'properties' object instead of outside of it."));return;}// type is optional
var thisConfig;if(type){thisConfig=this.animationConfig[type];}else{thisConfig=this.animationConfig;}if(!Array.isArray(thisConfig)){thisConfig=[thisConfig];}// iterate animations and recurse to process configurations from child nodes
if(thisConfig){for(var config,index=0;config=thisConfig[index];index++){if(config.animatable){config.animatable._getAnimationConfigRecursive(config.type||type,map,allConfigs);}else{if(config.id){var cachedConfig=map[config.id];if(cachedConfig){// merge configurations with the same id, making a clone lazily
if(!cachedConfig.isClone){map[config.id]=this._cloneConfig(cachedConfig);cachedConfig=map[config.id];}this._copyProperties(cachedConfig,config);}else{// put any configs with an id into a map
map[config.id]=config;}}else{allConfigs.push(config);}}}}},/**
     * An element implementing `Polymer.NeonAnimationRunnerBehavior` calls this method to configure
     * an animation with an optional type. Elements implementing `Polymer.NeonAnimatableBehavior`
     * should define the property `animationConfig`, which is either a configuration object
     * or a map of animation type to array of configuration objects.
     */getAnimationConfig:function getAnimationConfig(type){var map={};var allConfigs=[];this._getAnimationConfigRecursive(type,map,allConfigs);// append the configurations saved in the map to the array
for(var key in map){allConfigs.push(map[key]);}return allConfigs;}};/**
   * `Polymer.NeonAnimationRunnerBehavior` adds a method to run animations.
   *
   * @polymerBehavior Polymer.NeonAnimationRunnerBehavior
   */Polymer.NeonAnimationRunnerBehaviorImpl={_configureAnimations:function _configureAnimations(configs){var results=[];if(configs.length>0){for(var config,index=0;config=configs[index];index++){var neonAnimation=document.createElement(config.name);// is this element actually a neon animation?
if(neonAnimation.isNeonAnimation){var result=null;// configuration or play could fail if polyfills aren't loaded
try{result=neonAnimation.configure(config);// Check if we have an Effect rather than an Animation
if(typeof result.cancel!='function'){result=document.timeline.play(result);}}catch(e){result=null;console.warn('Couldnt play','(',config.name,').',e);}if(result){results.push({neonAnimation:neonAnimation,config:config,animation:result});}}else{console.warn(this.is+':',config.name,'not found!');}}}return results;},_shouldComplete:function _shouldComplete(activeEntries){var finished=true;for(var i=0;i<activeEntries.length;i++){if(activeEntries[i].animation.playState!='finished'){finished=false;break;}}return finished;},_complete:function _complete(activeEntries){for(var i=0;i<activeEntries.length;i++){activeEntries[i].neonAnimation.complete(activeEntries[i].config);}for(var i=0;i<activeEntries.length;i++){activeEntries[i].animation.cancel();}},/**
     * Plays an animation with an optional `type`.
     * @param {string=} type
     * @param {!Object=} cookie
     */playAnimation:function playAnimation(type,cookie){var configs=this.getAnimationConfig(type);if(!configs){return;}this._active=this._active||{};if(this._active[type]){this._complete(this._active[type]);delete this._active[type];}var activeEntries=this._configureAnimations(configs);if(activeEntries.length==0){this.fire('neon-animation-finish',cookie,{bubbles:false});return;}this._active[type]=activeEntries;for(var i=0;i<activeEntries.length;i++){activeEntries[i].animation.onfinish=function(){if(this._shouldComplete(activeEntries)){this._complete(activeEntries);delete this._active[type];this.fire('neon-animation-finish',cookie,{bubbles:false});}}.bind(this);}},/**
     * Cancels the currently running animations.
     */cancelAnimation:function cancelAnimation(){for(var k in this._animations){this._animations[k].cancel();}this._animations={};}};/** @polymerBehavior Polymer.NeonAnimationRunnerBehavior */Polymer.NeonAnimationRunnerBehavior=[Polymer.NeonAnimatableBehavior,Polymer.NeonAnimationRunnerBehaviorImpl];/**
   * Use `Polymer.NeonAnimationBehavior` to implement an animation.
   * @polymerBehavior
   */Polymer.NeonAnimationBehavior={properties:{/**
       * Defines the animation timing.
       */animationTiming:{type:Object,value:function value(){return{duration:500,easing:'cubic-bezier(0.4, 0, 0.2, 1)',fill:'both'};}}},/**
     * Can be used to determine that elements implement this behavior.
     */isNeonAnimation:true,/**
     * Do any animation configuration here.
     */// configure: function(config) {
// },
created:function created(){if(!document.body.animate){console.warn('No web animations detected. This element will not'+' function without a web animations polyfill.');}},/**
     * Returns the animation timing by mixing in properties from `config` to the defaults defined
     * by the animation.
     */timingFromConfig:function timingFromConfig(config){if(config.timing){for(var property in config.timing){this.animationTiming[property]=config.timing[property];}}return this.animationTiming;},/**
     * Sets `transform` and `transformOrigin` properties along with the prefixed versions.
     */setPrefixedProperty:function setPrefixedProperty(node,property,value){var map={'transform':['webkitTransform'],'transformOrigin':['mozTransformOrigin','webkitTransformOrigin']};var prefixes=map[property];for(var prefix,index=0;prefix=prefixes[index];index++){node.style[prefix]=value;}node.style[property]=value;},/**
     * Called when the animation finishes.
     */complete:function complete(){}};Polymer({is:'fade-in-animation',behaviors:[Polymer.NeonAnimationBehavior],configure:function configure(config){var node=config.node;this._effect=new KeyframeEffect(node,[{'opacity':'0'},{'opacity':'1'}],this.timingFromConfig(config));return this._effect;}});Polymer({is:'fade-out-animation',behaviors:[Polymer.NeonAnimationBehavior],configure:function configure(config){var node=config.node;this._effect=new KeyframeEffect(node,[{'opacity':'1'},{'opacity':'0'}],this.timingFromConfig(config));return this._effect;}});Polymer({is:'paper-tooltip',hostAttributes:{role:'tooltip',tabindex:-1},behaviors:[Polymer.NeonAnimationRunnerBehavior],properties:{/**
         * The id of the element that the tooltip is anchored to. This element
         * must be a sibling of the tooltip.
         */for:{type:String,observer:'_findTarget'},/**
         * Set this to true if you want to manually control when the tooltip
         * is shown or hidden.
         */manualMode:{type:Boolean,value:false,observer:'_manualModeChanged'},/**
         * Positions the tooltip to the top, right, bottom, left of its content.
         */position:{type:String,value:'bottom'},/**
         * If true, no parts of the tooltip will ever be shown offscreen.
         */fitToVisibleBounds:{type:Boolean,value:false},/**
         * The spacing between the top of the tooltip and the element it is
         * anchored to.
         */offset:{type:Number,value:14},/**
         * This property is deprecated, but left over so that it doesn't
         * break exiting code. Please use `offset` instead. If both `offset` and
         * `marginTop` are provided, `marginTop` will be ignored.
         * @deprecated since version 1.0.3
         */marginTop:{type:Number,value:14},/**
         * The delay that will be applied before the `entry` animation is
         * played when showing the tooltip.
         */animationDelay:{type:Number,value:500},/**
         * The entry and exit animations that will be played when showing and
         * hiding the tooltip. If you want to override this, you must ensure
         * that your animationConfig has the exact format below.
         */animationConfig:{type:Object,value:function value(){return{'entry':[{name:'fade-in-animation',node:this,timing:{delay:0}}],'exit':[{name:'fade-out-animation',node:this}]};}},_showing:{type:Boolean,value:false}},listeners:{'neon-animation-finish':'_onAnimationFinish'},/**
       * Returns the target element that this tooltip is anchored to. It is
       * either the element given by the `for` attribute, or the immediate parent
       * of the tooltip.
       */get target(){var parentNode=Polymer.dom(this).parentNode;// If the parentNode is a document fragment, then we need to use the host.
var ownerRoot=Polymer.dom(this).getOwnerRoot();var target;if(this.for){target=Polymer.dom(ownerRoot).querySelector('#'+this.for);}else{target=parentNode.nodeType==Node.DOCUMENT_FRAGMENT_NODE?ownerRoot.host:parentNode;}return target;},attached:function attached(){this._findTarget();},detached:function detached(){if(!this.manualMode)this._removeListeners();},show:function show(){// If the tooltip is already showing, there's nothing to do.
if(this._showing)return;if(Polymer.dom(this).textContent.trim()===''){// Check if effective children are also empty
var allChildrenEmpty=true;var effectiveChildren=Polymer.dom(this).getEffectiveChildNodes();for(var i=0;i<effectiveChildren.length;i++){if(effectiveChildren[i].textContent.trim()!==''){allChildrenEmpty=false;break;}}if(allChildrenEmpty){return;}}this.cancelAnimation();this._showing=true;this.toggleClass('hidden',false,this.$.tooltip);this.updatePosition();this.animationConfig.entry[0].timing=this.animationConfig.entry[0].timing||{};this.animationConfig.entry[0].timing.delay=this.animationDelay;this._animationPlaying=true;this.playAnimation('entry');},hide:function hide(){// If the tooltip is already hidden, there's nothing to do.
if(!this._showing){return;}// If the entry animation is still playing, don't try to play the exit
// animation since this will reset the opacity to 1. Just end the animation.
if(this._animationPlaying){this.cancelAnimation();this._showing=false;this._onAnimationFinish();return;}this._showing=false;this._animationPlaying=true;this.playAnimation('exit');},updatePosition:function updatePosition(){if(!this._target||!this.offsetParent)return;var offset=this.offset;// If a marginTop has been provided by the user (pre 1.0.3), use it.
if(this.marginTop!=14&&this.offset==14)offset=this.marginTop;var parentRect=this.offsetParent.getBoundingClientRect();var targetRect=this._target.getBoundingClientRect();var thisRect=this.getBoundingClientRect();var horizontalCenterOffset=(targetRect.width-thisRect.width)/2;var verticalCenterOffset=(targetRect.height-thisRect.height)/2;var targetLeft=targetRect.left-parentRect.left;var targetTop=targetRect.top-parentRect.top;var tooltipLeft,tooltipTop;switch(this.position){case'top':tooltipLeft=targetLeft+horizontalCenterOffset;tooltipTop=targetTop-thisRect.height-offset;break;case'bottom':tooltipLeft=targetLeft+horizontalCenterOffset;tooltipTop=targetTop+targetRect.height+offset;break;case'left':tooltipLeft=targetLeft-thisRect.width-offset;tooltipTop=targetTop+verticalCenterOffset;break;case'right':tooltipLeft=targetLeft+targetRect.width+offset;tooltipTop=targetTop+verticalCenterOffset;break;}// TODO(noms): This should use IronFitBehavior if possible.
if(this.fitToVisibleBounds){// Clip the left/right side
if(parentRect.left+tooltipLeft+thisRect.width>window.innerWidth){this.style.right='0px';this.style.left='auto';}else{this.style.left=Math.max(0,tooltipLeft)+'px';this.style.right='auto';}// Clip the top/bottom side.
if(parentRect.top+tooltipTop+thisRect.height>window.innerHeight){this.style.bottom=parentRect.height+'px';this.style.top='auto';}else{this.style.top=Math.max(-parentRect.top,tooltipTop)+'px';this.style.bottom='auto';}}else{this.style.left=tooltipLeft+'px';this.style.top=tooltipTop+'px';}},_addListeners:function _addListeners(){if(this._target){this.listen(this._target,'mouseenter','show');this.listen(this._target,'focus','show');this.listen(this._target,'mouseleave','hide');this.listen(this._target,'blur','hide');this.listen(this._target,'tap','hide');}this.listen(this,'mouseenter','hide');},_findTarget:function _findTarget(){if(!this.manualMode)this._removeListeners();this._target=this.target;if(!this.manualMode)this._addListeners();},_manualModeChanged:function _manualModeChanged(){if(this.manualMode)this._removeListeners();else this._addListeners();},_onAnimationFinish:function _onAnimationFinish(){this._animationPlaying=false;if(!this._showing){this.toggleClass('hidden',true,this.$.tooltip);}},_removeListeners:function _removeListeners(){if(this._target){this.unlisten(this._target,'mouseenter','show');this.unlisten(this._target,'focus','show');this.unlisten(this._target,'mouseleave','hide');this.unlisten(this._target,'blur','hide');this.unlisten(this._target,'tap','hide');}this.unlisten(this,'mouseenter','hide');}});(function(){var parsers=require('../common/parsers.js');var Order=require('../common/order.js');var QueryStringParserLocal=parsers.QueryStringParser;defineCustomElement('order-split-results-table',function(_Polymer$Element4){_inherits(_class4,_Polymer$Element4);_createClass(_class4,[{key:"_onClipboardTap",value:function _onClipboardTap(){this.$.textForClipboard.hidden=false;this.$.textForClipboard.select();var successful=document.execCommand('copy');if(!successful){console.error('clipboard copy failed');}else{this.$.textForClipboard.hidden=true;}}},{key:"_computeBreakdownItems",value:function _computeBreakdownItems(people){if(!people){return[];}return Array.from(this.order.people.entries()).map(function(entry){return{name:entry[0],price:entry[1]};});}},{key:"_computePersonTotal",value:function _computePersonTotal(name){return this._prettifyNumber(this.order.totals.get(name));}},{key:"_multiply",value:function _multiply(a,b){return this._prettifyNumber(a*b);}}]);function _class4(){_classCallCheck(this,_class4);var _this40=_possibleConstructorReturn(this,(_class4.__proto__||Object.getPrototypeOf(_class4)).call(this));_this40.hidden=true;return _this40;}_createClass(_class4,[{key:"_onOrderChanged",value:function _onOrderChanged(order){console.log(order);if(order&&order.constructor!==Order){throw new Error('order must be of type Order');}this.hidden=!order;}/**
                 * Returns a string of a number in the format "#.##"
                 * @example
                 * _prettifyNumber(12); // returns "12.00"
                 * @param {number} n - The number to prettify
                 * @returns {string} A string of a number rounded and padded to 2 decimal places
                 */},{key:"_prettifyNumber",value:function _prettifyNumber(n){return Utils._prettifyNumber(n);}/**
                 * Returns a listing of names to split costs
                 * @param {object} totals - The totals property from the Order
                 * @returns {string} A view mapping names to split costs
                 */},{key:"_makeTextForClipboard",value:function _makeTextForClipboard(totals){if(!this.order){return;}// get length of longest name
var longestName=-1;var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=totals[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){var _step3$value=_slicedToArray(_step3.value,2),person=_step3$value[0],price=_step3$value[1];longestName=Math.max(person.length,longestName);}// add 1 to longest name for a space after name
}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3;}}}longestName+=1;var output='';var name;var _iteratorNormalCompletion4=true;var _didIteratorError4=false;var _iteratorError4=undefined;try{for(var _iterator4=totals[Symbol.iterator](),_step4;!(_iteratorNormalCompletion4=(_step4=_iterator4.next()).done);_iteratorNormalCompletion4=true){var _step4$value=_slicedToArray(_step4.value,2),_person=_step4$value[0],_price=_step4$value[1];var _name=_person;for(var i=_person.length;i<longestName;i++){_name+=' ';}output+=_name+'$'+this._prettifyNumber(_price)+'\n';}}catch(err){_didIteratorError4=true;_iteratorError4=err;}finally{try{if(!_iteratorNormalCompletion4&&_iterator4.return){_iterator4.return();}}finally{if(_didIteratorError4){throw _iteratorError4;}}}return output+'\n'+this._makeUrl(this.order);}/**
                 * Returns a display breaking down the Order split calculations
                 * @param {Order} order - the Order to breakdown
                 * @returns {string} A view of the Order breakdown
                 */},{key:"_makeBreakdownDisplay",value:function _makeBreakdownDisplay(order){var breakdown='<table id="breakdown">';breakdown+='<tr><th>Person</th><th>Item Costs</th><th>Tax</th><th>Tip</th><th>Fees Per Person</th><th>Person Total</th></tr>';var _iteratorNormalCompletion5=true;var _didIteratorError5=false;var _iteratorError5=undefined;try{for(var _iterator5=order.people[Symbol.iterator](),_step5;!(_iteratorNormalCompletion5=(_step5=_iterator5.next()).done);_iteratorNormalCompletion5=true){var _step5$value=_slicedToArray(_step5.value,2),person=_step5$value[0],price=_step5$value[1];breakdown+='<tr><td>'+person+'</td><td>'+price+'</td><td> + '+// item costs
price+' * '+order.taxPercent+'</td><td> + '+// taxes
price+' * '+order.tipPercent+'</td><td> + '+// tip
order.feesPerPerson+'</td><td> = '+this._prettifyNumber(order.totals.get(person))+'</td></tr>';}}catch(err){_didIteratorError5=true;_iteratorError5=err;}finally{try{if(!_iteratorNormalCompletion5&&_iterator5.return){_iterator5.return();}}finally{if(_didIteratorError5){throw _iteratorError5;}}}breakdown+='</table>';return breakdown;}},{key:"_makeUrl",value:function _makeUrl(order){if(!this.order){return;}var link=void 0;if(this.origin){link=this.origin;}else{link=window.location.origin+window.location.pathname;}if(link.indexOf('index.html')===-1){link+='index.html';}link+='?tax='+order.tax+'&fee='+order.fee+'&tip='+order.tipDollars;var _iteratorNormalCompletion6=true;var _didIteratorError6=false;var _iteratorError6=undefined;try{for(var _iterator6=order.people[Symbol.iterator](),_step6;!(_iteratorNormalCompletion6=(_step6=_iterator6.next()).done);_iteratorNormalCompletion6=true){var _step6$value=_slicedToArray(_step6.value,2),person=_step6$value[0],val=_step6$value[1];link+='&'+encodeURIComponent(person)+'='+this._prettifyNumber(val);}}catch(err){_didIteratorError6=true;_iteratorError6=err;}finally{try{if(!_iteratorNormalCompletion6&&_iterator6.return){_iterator6.return();}}finally{if(_didIteratorError6){throw _iteratorError6;}}}return link;}},{key:"_handleQueryStringChanged",value:function _handleQueryStringChanged(e,_ref2){var value=_ref2.value;this.order=new QueryStringParserLocal().parse();}}],[{key:"properties",get:function get(){return{order:{type:Object,observer:'_onOrderChanged'},origin:{type:String,value:"https://mergemypullrequest.github.io/order-splitter/"}};}}]);return _class4;}(Polymer.Element));})();// this is to help with debugging any SW caching issues if they appear
var scriptSha='8b11433';var htmlSha=document.querySelector('#sha').innerText;console.debug("script version: "+scriptSha);console.debug("html version:   "+htmlSha);if(scriptSha!==htmlSha){alert('Whoops. The cached files on your machine are out of sync with each other. That\'s our bad. Please hard-refresh the page?');};
}).call(this,require("pBGvAp"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_2d7a0035.js","/")
},{"../common/order.js":1,"../common/parsers.js":2,"buffer":4,"pBGvAp":6}]},{},[7])