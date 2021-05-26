import {randomBytes, createHash} from "crypto";
import http from "http";
import https from "https";
import zlib from "zlib";
import Stream, {PassThrough, pipeline} from "stream";
import {types} from "util";
import {format, parse, resolve, URLSearchParams as URLSearchParams$1} from "url";
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
var src = dataUriToBuffer;
const {Readable} = Stream;
const wm = new WeakMap();
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
class Blob {
  constructor(blobParts = [], options = {type: ""}) {
    let size = 0;
    const parts = blobParts.map((element) => {
      let buffer;
      if (element instanceof Buffer) {
        buffer = element;
      } else if (ArrayBuffer.isView(element)) {
        buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
      } else if (element instanceof ArrayBuffer) {
        buffer = Buffer.from(element);
      } else if (element instanceof Blob) {
        buffer = element;
      } else {
        buffer = Buffer.from(typeof element === "string" ? element : String(element));
      }
      size += buffer.length || buffer.size || 0;
      return buffer;
    });
    const type = options.type === void 0 ? "" : String(options.type).toLowerCase();
    wm.set(this, {
      type: /[^\u0020-\u007E]/.test(type) ? "" : type,
      size,
      parts
    });
  }
  get size() {
    return wm.get(this).size;
  }
  get type() {
    return wm.get(this).type;
  }
  async text() {
    return Buffer.from(await this.arrayBuffer()).toString();
  }
  async arrayBuffer() {
    const data = new Uint8Array(this.size);
    let offset = 0;
    for await (const chunk of this.stream()) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    return data.buffer;
  }
  stream() {
    return Readable.from(read(wm.get(this).parts));
  }
  slice(start = 0, end = this.size, type = "") {
    const {size} = this;
    let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
    const span = Math.max(relativeEnd - relativeStart, 0);
    const parts = wm.get(this).parts.values();
    const blobParts = [];
    let added = 0;
    for (const part of parts) {
      const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
      if (relativeStart && size2 <= relativeStart) {
        relativeStart -= size2;
        relativeEnd -= size2;
      } else {
        const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
        blobParts.push(chunk);
        added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
        relativeStart = 0;
        if (added >= span) {
          break;
        }
      }
    }
    const blob = new Blob([], {type});
    Object.assign(wm.get(blob), {size: span, parts: blobParts});
    return blob;
  }
  get [Symbol.toStringTag]() {
    return "Blob";
  }
  static [Symbol.hasInstance](object) {
    return typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
  }
}
Object.defineProperties(Blob.prototype, {
  size: {enumerable: true},
  type: {enumerable: true},
  slice: {enumerable: true}
});
var fetchBlob = Blob;
class FetchBaseError extends Error {
  constructor(message, type) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.type = type;
  }
  get name() {
    return this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
class FetchError extends FetchBaseError {
  constructor(message, type, systemError) {
    super(message, type);
    if (systemError) {
      this.code = this.errno = systemError.code;
      this.erroredSysCall = systemError.syscall;
    }
  }
}
const NAME = Symbol.toStringTag;
const isURLSearchParameters = (object) => {
  return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
};
const isBlob = (object) => {
  return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
};
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
const isAbortSignal = (object) => {
  return typeof object === "object" && object[NAME] === "AbortSignal";
};
const carriage = "\r\n";
const dashes = "-".repeat(2);
const carriageLength = Buffer.byteLength(carriage);
const getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
const getBoundary = () => randomBytes(8).toString("hex");
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
const INTERNALS$2 = Symbol("Body internals");
class Body {
  constructor(body, {
    size = 0
  } = {}) {
    let boundary = null;
    if (body === null) {
      body = null;
    } else if (isURLSearchParameters(body)) {
      body = Buffer.from(body.toString());
    } else if (isBlob(body))
      ;
    else if (Buffer.isBuffer(body))
      ;
    else if (types.isAnyArrayBuffer(body)) {
      body = Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof Stream)
      ;
    else if (isFormData(body)) {
      boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
      body = Stream.Readable.from(formDataIterator(body, boundary));
    } else {
      body = Buffer.from(String(body));
    }
    this[INTERNALS$2] = {
      body,
      boundary,
      disturbed: false,
      error: null
    };
    this.size = size;
    if (body instanceof Stream) {
      body.on("error", (err) => {
        const error2 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
        this[INTERNALS$2].error = error2;
      });
    }
  }
  get body() {
    return this[INTERNALS$2].body;
  }
  get bodyUsed() {
    return this[INTERNALS$2].disturbed;
  }
  async arrayBuffer() {
    const {buffer, byteOffset, byteLength} = await consumeBody(this);
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  async blob() {
    const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
    const buf = await this.buffer();
    return new fetchBlob([buf], {
      type: ct
    });
  }
  async json() {
    const buffer = await consumeBody(this);
    return JSON.parse(buffer.toString());
  }
  async text() {
    const buffer = await consumeBody(this);
    return buffer.toString();
  }
  buffer() {
    return consumeBody(this);
  }
}
Object.defineProperties(Body.prototype, {
  body: {enumerable: true},
  bodyUsed: {enumerable: true},
  arrayBuffer: {enumerable: true},
  blob: {enumerable: true},
  json: {enumerable: true},
  text: {enumerable: true}
});
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let {body} = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof Stream)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    if (error2 instanceof FetchBaseError) {
      throw error2;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
const clone = (instance, highWaterMark) => {
  let p1;
  let p2;
  let {body} = instance;
  if (instance.bodyUsed) {
    throw new Error("cannot clone body after it is used");
  }
  if (body instanceof Stream && typeof body.getBoundary !== "function") {
    p1 = new PassThrough({highWaterMark});
    p2 = new PassThrough({highWaterMark});
    body.pipe(p1);
    body.pipe(p2);
    instance[INTERNALS$2].body = p1;
    body = p2;
  }
  return body;
};
const extractContentType = (body, request) => {
  if (body === null) {
    return null;
  }
  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }
  if (isURLSearchParameters(body)) {
    return "application/x-www-form-urlencoded;charset=UTF-8";
  }
  if (isBlob(body)) {
    return body.type || null;
  }
  if (Buffer.isBuffer(body) || types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null;
  }
  if (body && typeof body.getBoundary === "function") {
    return `multipart/form-data;boundary=${body.getBoundary()}`;
  }
  if (isFormData(body)) {
    return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
  }
  if (body instanceof Stream) {
    return null;
  }
  return "text/plain;charset=UTF-8";
};
const getTotalBytes = (request) => {
  const {body} = request;
  if (body === null) {
    return 0;
  }
  if (isBlob(body)) {
    return body.size;
  }
  if (Buffer.isBuffer(body)) {
    return body.length;
  }
  if (body && typeof body.getLengthSync === "function") {
    return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
  }
  if (isFormData(body)) {
    return getFormDataLength(request[INTERNALS$2].boundary);
  }
  return null;
};
const writeToStream = (dest, {body}) => {
  if (body === null) {
    dest.end();
  } else if (isBlob(body)) {
    body.stream().pipe(dest);
  } else if (Buffer.isBuffer(body)) {
    dest.write(body);
    dest.end();
  } else {
    body.pipe(dest);
  }
};
const validateHeaderName = typeof http.validateHeaderName === "function" ? http.validateHeaderName : (name) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
    const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(err, "code", {value: "ERR_INVALID_HTTP_TOKEN"});
    throw err;
  }
};
const validateHeaderValue = typeof http.validateHeaderValue === "function" ? http.validateHeaderValue : (name, value) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const err = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(err, "code", {value: "ERR_INVALID_CHAR"});
    throw err;
  }
};
class Headers extends URLSearchParams {
  constructor(init2) {
    let result = [];
    if (init2 instanceof Headers) {
      const raw = init2.raw();
      for (const [name, values] of Object.entries(raw)) {
        result.push(...values.map((value) => [name, value]));
      }
    } else if (init2 == null)
      ;
    else if (typeof init2 === "object" && !types.isBoxedPrimitive(init2)) {
      const method = init2[Symbol.iterator];
      if (method == null) {
        result.push(...Object.entries(init2));
      } else {
        if (typeof method !== "function") {
          throw new TypeError("Header pairs must be iterable");
        }
        result = [...init2].map((pair) => {
          if (typeof pair !== "object" || types.isBoxedPrimitive(pair)) {
            throw new TypeError("Each header pair must be an iterable object");
          }
          return [...pair];
        }).map((pair) => {
          if (pair.length !== 2) {
            throw new TypeError("Each header pair must be a name/value tuple");
          }
          return [...pair];
        });
      }
    } else {
      throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
    }
    result = result.length > 0 ? result.map(([name, value]) => {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return [String(name).toLowerCase(), String(value)];
    }) : void 0;
    super(result);
    return new Proxy(this, {
      get(target, p, receiver) {
        switch (p) {
          case "append":
          case "set":
            return (name, value) => {
              validateHeaderName(name);
              validateHeaderValue(name, String(value));
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
            };
          case "delete":
          case "has":
          case "getAll":
            return (name) => {
              validateHeaderName(name);
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
            };
          case "keys":
            return () => {
              target.sort();
              return new Set(URLSearchParams.prototype.keys.call(target)).keys();
            };
          default:
            return Reflect.get(target, p, receiver);
        }
      }
    });
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
  toString() {
    return Object.prototype.toString.call(this);
  }
  get(name) {
    const values = this.getAll(name);
    if (values.length === 0) {
      return null;
    }
    let value = values.join(", ");
    if (/^content-encoding$/i.test(name)) {
      value = value.toLowerCase();
    }
    return value;
  }
  forEach(callback) {
    for (const name of this.keys()) {
      callback(this.get(name), name);
    }
  }
  *values() {
    for (const name of this.keys()) {
      yield this.get(name);
    }
  }
  *entries() {
    for (const name of this.keys()) {
      yield [name, this.get(name)];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  raw() {
    return [...this.keys()].reduce((result, key) => {
      result[key] = this.getAll(key);
      return result;
    }, {});
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this.keys()].reduce((result, key) => {
      const values = this.getAll(key);
      if (key === "host") {
        result[key] = values[0];
      } else {
        result[key] = values.length > 1 ? values : values[0];
      }
      return result;
    }, {});
  }
}
Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
  result[property] = {enumerable: true};
  return result;
}, {}));
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch (e) {
      return false;
    }
  }));
}
const redirectStatus = new Set([301, 302, 303, 307, 308]);
const isRedirect = (code) => {
  return redirectStatus.has(code);
};
const INTERNALS$1 = Symbol("Response internals");
class Response extends Body {
  constructor(body = null, options = {}) {
    super(body, options);
    const status = options.status || 200;
    const headers = new Headers(options.headers);
    if (body !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(body);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    this[INTERNALS$1] = {
      url: options.url,
      status,
      statusText: options.statusText || "",
      headers,
      counter: options.counter,
      highWaterMark: options.highWaterMark
    };
  }
  get url() {
    return this[INTERNALS$1].url || "";
  }
  get status() {
    return this[INTERNALS$1].status;
  }
  get ok() {
    return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
  }
  get redirected() {
    return this[INTERNALS$1].counter > 0;
  }
  get statusText() {
    return this[INTERNALS$1].statusText;
  }
  get headers() {
    return this[INTERNALS$1].headers;
  }
  get highWaterMark() {
    return this[INTERNALS$1].highWaterMark;
  }
  clone() {
    return new Response(clone(this, this.highWaterMark), {
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size
    });
  }
  static redirect(url, status = 302) {
    if (!isRedirect(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    }
    return new Response(null, {
      headers: {
        location: new URL(url).toString()
      },
      status
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
}
Object.defineProperties(Response.prototype, {
  url: {enumerable: true},
  status: {enumerable: true},
  ok: {enumerable: true},
  redirected: {enumerable: true},
  statusText: {enumerable: true},
  headers: {enumerable: true},
  clone: {enumerable: true}
});
const getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search;
  }
  const lastOffset = parsedURL.href.length - 1;
  const hash = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
  return parsedURL.href[lastOffset - hash.length] === "?" ? "?" : "";
};
const INTERNALS = Symbol("Request internals");
const isRequest = (object) => {
  return typeof object === "object" && typeof object[INTERNALS] === "object";
};
class Request extends Body {
  constructor(input, init2 = {}) {
    let parsedURL;
    if (isRequest(input)) {
      parsedURL = new URL(input.url);
    } else {
      parsedURL = new URL(input);
      input = {};
    }
    let method = init2.method || input.method || "GET";
    method = method.toUpperCase();
    if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
      throw new TypeError("Request with GET/HEAD method cannot have body");
    }
    const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
    super(inputBody, {
      size: init2.size || input.size || 0
    });
    const headers = new Headers(init2.headers || input.headers || {});
    if (inputBody !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(inputBody, this);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    let signal = isRequest(input) ? input.signal : null;
    if ("signal" in init2) {
      signal = init2.signal;
    }
    if (signal !== null && !isAbortSignal(signal)) {
      throw new TypeError("Expected signal to be an instanceof AbortSignal");
    }
    this[INTERNALS] = {
      method,
      redirect: init2.redirect || input.redirect || "follow",
      headers,
      parsedURL,
      signal
    };
    this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
    this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
    this.counter = init2.counter || input.counter || 0;
    this.agent = init2.agent || input.agent;
    this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
    this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
  }
  get method() {
    return this[INTERNALS].method;
  }
  get url() {
    return format(this[INTERNALS].parsedURL);
  }
  get headers() {
    return this[INTERNALS].headers;
  }
  get redirect() {
    return this[INTERNALS].redirect;
  }
  get signal() {
    return this[INTERNALS].signal;
  }
  clone() {
    return new Request(this);
  }
  get [Symbol.toStringTag]() {
    return "Request";
  }
}
Object.defineProperties(Request.prototype, {
  method: {enumerable: true},
  url: {enumerable: true},
  headers: {enumerable: true},
  redirect: {enumerable: true},
  clone: {enumerable: true},
  signal: {enumerable: true}
});
const getNodeRequestOptions = (request) => {
  const {parsedURL} = request[INTERNALS];
  const headers = new Headers(request[INTERNALS].headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "*/*");
  }
  let contentLengthValue = null;
  if (request.body === null && /^(post|put)$/i.test(request.method)) {
    contentLengthValue = "0";
  }
  if (request.body !== null) {
    const totalBytes = getTotalBytes(request);
    if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
      contentLengthValue = String(totalBytes);
    }
  }
  if (contentLengthValue) {
    headers.set("Content-Length", contentLengthValue);
  }
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "node-fetch");
  }
  if (request.compress && !headers.has("Accept-Encoding")) {
    headers.set("Accept-Encoding", "gzip,deflate,br");
  }
  let {agent} = request;
  if (typeof agent === "function") {
    agent = agent(parsedURL);
  }
  if (!headers.has("Connection") && !agent) {
    headers.set("Connection", "close");
  }
  const search = getSearch(parsedURL);
  const requestOptions = {
    path: parsedURL.pathname + search,
    pathname: parsedURL.pathname,
    hostname: parsedURL.hostname,
    protocol: parsedURL.protocol,
    port: parsedURL.port,
    hash: parsedURL.hash,
    search: parsedURL.search,
    query: parsedURL.query,
    href: parsedURL.href,
    method: request.method,
    headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
    insecureHTTPParser: request.insecureHTTPParser,
    agent
  };
  return requestOptions;
};
class AbortError extends FetchBaseError {
  constructor(message, type = "aborted") {
    super(message, type);
  }
}
const supportedSchemas = new Set(["data:", "http:", "https:"]);
async function fetch$1(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, {headers: {"Content-Type": data.typeFull}});
      resolve2(response2);
      return;
    }
    const send = (options.protocol === "https:" ? https : http).request;
    const {signal} = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof Stream.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error2) {
                reject(error2);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof Stream.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch$1(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = pipeline(response_, new PassThrough(), (error2) => {
        reject(error2);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: zlib.Z_SYNC_FLUSH,
        finishFlush: zlib.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = pipeline(body, zlib.createGunzip(zlibOptions), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = pipeline(response_, new PassThrough(), (error2) => {
          reject(error2);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = pipeline(body, zlib.createInflate(), (error2) => {
              reject(error2);
            });
          } else {
            body = pipeline(body, zlib.createInflateRaw(), (error2) => {
              reject(error2);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = pipeline(body, zlib.createBrotliDecompress(), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function noop$1() {
}
function safe_not_equal$1(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
const subscriber_queue$1 = [];
function writable$1(value, start = noop$1) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal$1(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue$1.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue$1.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue$1.length; i += 2) {
            subscriber_queue$1[i][0](subscriber_queue$1[i + 1]);
          }
          subscriber_queue$1.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return {set, update, subscribe: subscribe2};
}
function normalize(loaded) {
  if (loaded.error) {
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return {status: 500, error: error2};
    }
    return {status, error: error2};
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
const s = JSON.stringify;
async function get_response({request, options, $session, route, status = 200, error: error2}) {
  const dependencies = {};
  const serialized_session = try_serialize($session, (error3) => {
    throw new Error(`Failed to serialize session data: ${error3.message}`);
  });
  const serialized_data = [];
  const match = route && route.pattern.exec(request.path);
  const params = route && route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let uses_credentials = false;
  const fetcher = async (resource, opts = {}) => {
    let url;
    if (typeof resource === "string") {
      url = resource;
    } else {
      url = resource.url;
      opts = {
        method: resource.method,
        headers: resource.headers,
        body: resource.body,
        mode: resource.mode,
        credentials: resource.credentials,
        cache: resource.cache,
        redirect: resource.redirect,
        referrer: resource.referrer,
        integrity: resource.integrity,
        ...opts
      };
    }
    if (options.local && url.startsWith(options.paths.assets)) {
      url = url.replace(options.paths.assets, "");
    }
    const parsed = parse(url);
    if (opts.credentials !== "omit") {
      uses_credentials = true;
    }
    let response;
    if (parsed.protocol) {
      response = await fetch$1(parsed.href, opts);
    } else {
      const resolved = resolve(request.path, parsed.pathname);
      const filename = resolved.slice(1);
      const filename_html = `${filename}/index.html`;
      const asset = options.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
      if (asset) {
        if (options.get_static_file) {
          response = new Response(options.get_static_file(asset.file), {
            headers: {
              "content-type": asset.type
            }
          });
        } else {
          response = await fetch$1(`http://${page.host}/${asset.file}`, opts);
        }
      }
      if (!response) {
        const rendered2 = await ssr({
          host: request.host,
          method: opts.method || "GET",
          headers: opts.headers || {},
          path: resolved,
          body: opts.body,
          query: new URLSearchParams$1(parsed.query || "")
        }, {
          ...options,
          fetched: url,
          initiator: route
        });
        if (rendered2) {
          dependencies[resolved] = rendered2;
          response = new Response(rendered2.body, {
            status: rendered2.status,
            headers: rendered2.headers
          });
        }
      }
    }
    if (response) {
      const headers2 = {};
      response.headers.forEach((value, key) => {
        if (key !== "etag")
          headers2[key] = value;
      });
      const inline = {
        url,
        payload: {
          status: response.status,
          statusText: response.statusText,
          headers: headers2,
          body: null
        }
      };
      const proxy = new Proxy(response, {
        get(response2, key, receiver) {
          if (key === "text") {
            return async () => {
              const text = await response2.text();
              inline.payload.body = text;
              serialized_data.push(inline);
              return text;
            };
          }
          if (key === "json") {
            return async () => {
              const json = await response2.json();
              inline.payload.body = s(json);
              serialized_data.push(inline);
              return json;
            };
          }
          return Reflect.get(response2, key, receiver);
        }
      });
      return proxy;
    }
    return new Response("Not found", {
      status: 404
    });
  };
  const component_promises = error2 ? [options.manifest.layout()] : [options.manifest.layout(), ...route.parts.map((part) => part.load())];
  const components2 = [];
  const props_promises = [];
  let context = {};
  let maxage;
  if (options.only_render_prerenderable_pages) {
    if (error2)
      return;
    const mod = await component_promises[component_promises.length - 1];
    if (!mod.prerender)
      return;
  }
  for (let i = 0; i < component_promises.length; i += 1) {
    let loaded;
    try {
      const mod = await component_promises[i];
      components2[i] = mod.default;
      if (mod.preload) {
        throw new Error("preload has been deprecated in favour of load. Please consult the documentation: https://kit.svelte.dev/docs#load");
      }
      if (mod.load) {
        loaded = await mod.load.call(null, {
          page,
          get session() {
            uses_credentials = true;
            return $session;
          },
          fetch: fetcher,
          context: {...context}
        });
        if (!loaded)
          return;
      }
    } catch (e) {
      if (error2)
        throw e instanceof Error ? e : new Error(e);
      loaded = {
        error: e instanceof Error ? e : {name: "Error", message: e.toString()},
        status: 500
      };
    }
    if (loaded) {
      loaded = normalize(loaded);
      if (loaded.error) {
        return await get_response({
          request,
          options,
          $session,
          route,
          status: loaded.status,
          error: loaded.error
        });
      }
      if (loaded.redirect) {
        return {
          status: loaded.status,
          headers: {
            location: loaded.redirect
          }
        };
      }
      if (loaded.context) {
        context = {
          ...context,
          ...loaded.context
        };
      }
      maxage = loaded.maxage || 0;
      props_promises[i] = loaded.props;
    }
  }
  const session = writable$1($session);
  let session_tracking_active = false;
  const unsubscribe = session.subscribe(() => {
    if (session_tracking_active)
      uses_credentials = true;
  });
  session_tracking_active = true;
  if (error2) {
    if (options.dev) {
      error2.stack = await options.get_stack(error2);
    } else {
      error2.stack = String(error2);
    }
  }
  const props = {
    status,
    error: error2,
    stores: {
      page: writable$1(null),
      navigating: writable$1(null),
      session
    },
    page,
    components: components2
  };
  for (let i = 0; i < props_promises.length; i += 1) {
    props[`props_${i}`] = await props_promises[i];
  }
  let rendered;
  try {
    rendered = options.root.render(props);
  } catch (e) {
    if (error2)
      throw e instanceof Error ? e : new Error(e);
    return await get_response({
      request,
      options,
      $session,
      route,
      status: 500,
      error: e instanceof Error ? e : {name: "Error", message: e.toString()}
    });
  }
  unsubscribe();
  const js_deps = route ? route.js : [];
  const css_deps = route ? route.css : [];
  const style = route ? route.style : "";
  const prefix = `${options.paths.assets}/${options.app_dir}`;
  const links = options.amp ? `<style amp-custom>${style || (await Promise.all(css_deps.map((dep) => options.get_amp_css(dep)))).join("\n")}</style>` : [
    ...js_deps.map((dep) => `<link rel="modulepreload" href="${prefix}/${dep}">`),
    ...css_deps.map((dep) => `<link rel="stylesheet" href="${prefix}/${dep}">`)
  ].join("\n			");
  const init2 = options.amp ? `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"></script>` : `
		<script type="module">
			import { start } from ${s(options.entry)};
			start({
				target: ${options.target ? `document.querySelector(${s(options.target)})` : "document.body"},
				paths: ${s(options.paths)},
				status: ${status},
				error: ${serialize_error(error2)},
				session: ${serialized_session},
				nodes: [
					${(route ? route.parts : []).map((part) => `import(${s(options.get_component_path(part.id))})`).join(",\n					")}
				],
				page: {
					host: ${s(request.host || "location.host")},
					path: ${s(request.path)},
					query: new URLSearchParams(${s(request.query.toString())}),
					params: ${s(params)}
				}
			});
		</script>`;
  const head = [
    rendered.head,
    style && !options.amp ? `<style data-svelte>${style}</style>` : "",
    links,
    init2
  ].join("\n\n");
  const body = options.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({url, payload}) => `<script type="svelte-data" url="${url}">${s(payload)}</script>`).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${uses_credentials ? "private" : "public"}, max-age=${maxage}`;
  }
  return {
    status,
    headers,
    body: options.template({head, body}),
    dependencies
  };
}
async function render_page(request, route, options) {
  if (options.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options.hooks.getSession({context: request.context});
  const response = await get_response({
    request,
    options,
    $session,
    route,
    status: route ? 200 : 404,
    error: route ? null : new Error(`Not found: ${request.path}`)
  });
  if (response) {
    return response;
  }
  if (options.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${options.fetched}`
    };
  }
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const {name, message, stack} = error2;
    serialized = try_serialize({name, message, stack});
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler({...request, params});
    if (response) {
      if (typeof response !== "object" || response.body == null) {
        return {
          status: 500,
          body: `Invalid response from route ${request.path}; ${response.body == null ? "body is missing" : `expected an object, got ${typeof response}`}`,
          headers: {}
        };
      }
      let {status = 200, body, headers = {}} = response;
      headers = lowercase_keys(headers);
      if (typeof body === "object" && !("content-type" in headers) || headers["content-type"] === "application/json") {
        headers = {...headers, "content-type": "application/json"};
        body = JSON.stringify(body);
      }
      return {status, body, headers};
    }
  }
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function md5(body) {
  return createHash("md5").update(body).digest("hex");
}
async function ssr(incoming, options) {
  if (incoming.path.endsWith("/") && incoming.path !== "/") {
    const q = incoming.query.toString();
    return {
      status: 301,
      headers: {
        location: incoming.path.slice(0, -1) + (q ? `?${q}` : "")
      }
    };
  }
  const context = await options.hooks.getContext(incoming) || {};
  try {
    return await options.hooks.handle({
      ...incoming,
      params: null,
      context
    }, async (request) => {
      for (const route of options.manifest.routes) {
        if (!route.pattern.test(request.path))
          continue;
        const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options);
        if (response) {
          if (response.status === 200) {
            if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
              const etag = `"${md5(response.body)}"`;
              if (request.headers["if-none-match"] === etag) {
                return {
                  status: 304,
                  headers: {},
                  body: null
                };
              }
              response.headers["etag"] = etag;
            }
          }
          return response;
        }
      }
      return await render_page(request, null, options);
    });
  } catch (e) {
    if (e && e.stack) {
      e.stack = await options.get_stack(e);
    }
    console.error(e && e.stack || e);
    return {
      status: 500,
      headers: {},
      body: options.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function set_store_value(store, ret, value = ret) {
  store.set(value);
  return ret;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function beforeUpdate(fn) {
  get_current_component().$$.before_update.push(fn);
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
const escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
const missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
let on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({$$});
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, options = {}) => {
      on_destroy = [];
      const result = {title: "", head: "", css: new Set()};
      const html = $$render(result, props, {}, options);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
const Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status} = $$props;
  let {error: error2} = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  return `<h1>${escape(status)}</h1>

<p>${escape(error2.message)}</p>


${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Error$1
});
var root_svelte = "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}";
const css$6 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\timport ErrorComponent from \\"..\\\\\\\\components\\\\\\\\error.svelte\\";\\n\\n\\t// error handling\\n\\texport let status = undefined;\\n\\texport let error = undefined;\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\n\\tconst Layout = components[0];\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title;\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n</script>\\n\\n<Layout {...(props_0 || {})}>\\n\\t{#if error}\\n\\t\\t<ErrorComponent {status} {error}/>\\n\\t{:else}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}/>\\n\\t{/if}\\n</Layout>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\tNavigated to {title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AA0DC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status = void 0} = $$props;
  let {error: error2 = void 0} = $$props;
  let {stores} = $$props;
  let {page} = $$props;
  let {components: components2} = $$props;
  let {props_0 = null} = $$props;
  let {props_1 = null} = $$props;
  const Layout = components2[0];
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title;
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components2 !== void 0)
    $$bindings.components(components2);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  $$result.css.add(css$6);
  {
    stores.page.set(page);
  }
  return `


${validate_component(Layout, "Layout").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${error2 ? `${validate_component(Error$1, "ErrorComponent").$$render($$result, {status, error: error2}, {}, {})}` : `${validate_component(components2[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {})}`}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1j55zn5"}">${navigated ? `Navigated to ${escape(title)}` : ``}</div>` : ``}`;
});
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
const template = ({head, body}) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.ico" />\n		<link rel="stylesheet" href="/cm-chessboard.css" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
function init({paths}) {
}
const empty = () => ({});
const components = [
  () => Promise.resolve().then(function() {
    return index;
  }),
  () => Promise.resolve().then(function() {
    return playersScores;
  }),
  () => Promise.resolve().then(function() {
    return searchMatches;
  }),
  () => Promise.resolve().then(function() {
    return myMatches;
  }),
  () => Promise.resolve().then(function() {
    return newGame;
  }),
  () => Promise.resolve().then(function() {
    return register;
  }),
  () => Promise.resolve().then(function() {
    return profile;
  }),
  () => Promise.resolve().then(function() {
    return about;
  }),
  () => Promise.resolve().then(function() {
    return login;
  }),
  () => Promise.resolve().then(function() {
    return game;
  })
];
const client_component_lookup = {".svelte/build/runtime/internal/start.js": "start-b8701432.js", "src/routes/index.svelte": "pages\\index.svelte-c5f4fd49.js", "src/routes/players-scores.svelte": "pages\\players-scores.svelte-340d3ce6.js", "src/routes/search-matches.svelte": "pages\\search-matches.svelte-cb469a08.js", "src/routes/my-matches.svelte": "pages\\my-matches.svelte-8673cd04.js", "src/routes/new-game.svelte": "pages\\new-game.svelte-968ea955.js", "src/routes/register.svelte": "pages\\register.svelte-cee224de.js", "src/routes/profile.svelte": "pages\\profile.svelte-5e557425.js", "src/routes/about.svelte": "pages\\about.svelte-9f75ccfc.js", "src/routes/login.svelte": "pages\\login.svelte-863eefba.js", "src/routes/game.svelte": "pages\\game.svelte-a5955edb.js"};
const manifest = {
  assets: [{file: "assets/images/chessboard-sprite-staunty.svg", size: 28899, type: "image/svg+xml"}, {file: "assets/images/chessboard-sprite.svg", size: 24188, type: "image/svg+xml"}, {file: "cm-chessboard.css", size: 5632, type: "text/css"}, {file: "favicon.ico", size: 1150, type: "image/vnd.microsoft.icon"}, {file: "robots.txt", size: 67, type: "text/plain"}],
  layout: () => Promise.resolve().then(function() {
    return $layout$1;
  }),
  error: () => Promise.resolve().then(function() {
    return error;
  }),
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      parts: [{id: "src/routes/index.svelte", load: components[0]}],
      css: ["assets/start-0590d930.css", "assets/pages\\index.svelte-6e9a9164.css"],
      js: ["start-b8701432.js", "chunks/index-a2f0fece.js", "chunks/store-bfd594f8.js", "chunks/navigation-ecc5701b.js", "pages\\index.svelte-c5f4fd49.js"]
    },
    {
      type: "page",
      pattern: /^\/players-scores\/?$/,
      params: empty,
      parts: [{id: "src/routes/players-scores.svelte", load: components[1]}],
      css: ["assets/start-0590d930.css", "assets/GameCard.svelte-c4847582.css"],
      js: ["start-b8701432.js", "chunks/index-a2f0fece.js", "chunks/store-bfd594f8.js", "chunks/navigation-ecc5701b.js", "pages\\players-scores.svelte-340d3ce6.js"]
    },
    {
      type: "page",
      pattern: /^\/search-matches\/?$/,
      params: empty,
      parts: [{id: "src/routes/search-matches.svelte", load: components[2]}],
      css: ["assets/start-0590d930.css", "assets/GameCard.svelte-c4847582.css"],
      js: ["start-b8701432.js", "chunks/index-a2f0fece.js", "chunks/store-bfd594f8.js", "chunks/navigation-ecc5701b.js", "pages\\search-matches.svelte-cb469a08.js"]
    },
    {
      type: "page",
      pattern: /^\/my-matches\/?$/,
      params: empty,
      parts: [{id: "src/routes/my-matches.svelte", load: components[3]}],
      css: ["assets/start-0590d930.css"],
      js: ["start-b8701432.js", "chunks/index-a2f0fece.js", "chunks/store-bfd594f8.js", "chunks/navigation-ecc5701b.js", "pages\\my-matches.svelte-8673cd04.js"]
    },
    {
      type: "page",
      pattern: /^\/new-game\/?$/,
      params: empty,
      parts: [{id: "src/routes/new-game.svelte", load: components[4]}],
      css: ["assets/start-0590d930.css"],
      js: ["start-b8701432.js", "chunks/index-a2f0fece.js", "chunks/store-bfd594f8.js", "chunks/navigation-ecc5701b.js", "pages\\new-game.svelte-968ea955.js"]
    },
    {
      type: "page",
      pattern: /^\/register\/?$/,
      params: empty,
      parts: [{id: "src/routes/register.svelte", load: components[5]}],
      css: ["assets/start-0590d930.css"],
      js: ["start-b8701432.js", "chunks/index-a2f0fece.js", "chunks/store-bfd594f8.js", "chunks/navigation-ecc5701b.js", "pages\\register.svelte-cee224de.js"]
    },
    {
      type: "page",
      pattern: /^\/profile\/?$/,
      params: empty,
      parts: [{id: "src/routes/profile.svelte", load: components[6]}],
      css: ["assets/start-0590d930.css"],
      js: ["start-b8701432.js", "chunks/index-a2f0fece.js", "chunks/store-bfd594f8.js", "chunks/navigation-ecc5701b.js", "pages\\profile.svelte-5e557425.js"]
    },
    {
      type: "page",
      pattern: /^\/about\/?$/,
      params: empty,
      parts: [{id: "src/routes/about.svelte", load: components[7]}],
      css: ["assets/start-0590d930.css"],
      js: ["start-b8701432.js", "chunks/index-a2f0fece.js", "chunks/store-bfd594f8.js", "chunks/navigation-ecc5701b.js", "pages\\about.svelte-9f75ccfc.js"]
    },
    {
      type: "page",
      pattern: /^\/login\/?$/,
      params: empty,
      parts: [{id: "src/routes/login.svelte", load: components[8]}],
      css: ["assets/start-0590d930.css"],
      js: ["start-b8701432.js", "chunks/index-a2f0fece.js", "chunks/store-bfd594f8.js", "chunks/navigation-ecc5701b.js", "pages\\login.svelte-863eefba.js"]
    },
    {
      type: "page",
      pattern: /^\/game\/?$/,
      params: empty,
      parts: [{id: "src/routes/game.svelte", load: components[9]}],
      css: ["assets/start-0590d930.css", "assets/pages\\game.svelte-7a74ad43.css"],
      js: ["start-b8701432.js", "chunks/index-a2f0fece.js", "chunks/store-bfd594f8.js", "chunks/navigation-ecc5701b.js", "pages\\game.svelte-a5955edb.js", "chunks/vendor-e90a73bf.js"]
    }
  ]
};
const get_hooks = (hooks2) => ({
  getContext: hooks2.getContext || (() => ({})),
  getSession: hooks2.getSession || (() => ({})),
  handle: hooks2.handle || ((request, render2) => render2(request))
});
const hooks = get_hooks(user_hooks);
function render(request, {
  paths = {base: "", assets: "/."},
  local = false,
  only_render_prerenderable_pages = false,
  get_static_file
} = {}) {
  return ssr({
    ...request,
    host: request.headers["host"]
  }, {
    paths,
    local,
    template,
    manifest,
    target: "#svelte",
    entry: "/./_app/start-b8701432.js",
    root: Root,
    hooks,
    dev: false,
    amp: false,
    only_render_prerenderable_pages,
    app_dir: "_app",
    get_component_path: (id) => "/./_app/" + client_component_lookup[id],
    get_stack: (error2) => error2.stack,
    get_static_file,
    get_amp_css: (dep) => amp_css_lookup[dep]
  });
}
var Counter_svelte = "button.svelte-qxv3xi{font-family:inherit;font-size:inherit;padding:1em 2em;color:#ff3e00;background-color:rgba(255, 62, 0, 0.1);border-radius:2em;border:2px solid rgba(255, 62, 0, 0);outline:none;width:200px;font-variant-numeric:tabular-nums}button.svelte-qxv3xi:focus{border:2px solid #ff3e00}button.svelte-qxv3xi:active{background-color:rgba(255, 62, 0, 0.2)}";
const css$5 = {
  code: "button.svelte-qxv3xi{font-family:inherit;font-size:inherit;padding:1em 2em;color:#ff3e00;background-color:rgba(255, 62, 0, 0.1);border-radius:2em;border:2px solid rgba(255, 62, 0, 0);outline:none;width:200px;font-variant-numeric:tabular-nums}button.svelte-qxv3xi:focus{border:2px solid #ff3e00}button.svelte-qxv3xi:active{background-color:rgba(255, 62, 0, 0.2)}",
  map: '{"version":3,"file":"Counter.svelte","sources":["Counter.svelte"],"sourcesContent":["<script>\\n\\tlet count = 0;\\n\\n\\tconst increment = () => {\\n\\t\\tcount += 1;\\n\\t};\\n</script>\\n\\n<button on:click={increment}>\\n\\tClicks: {count}\\n</button>\\n\\n<style>\\n\\tbutton {\\n\\t\\tfont-family: inherit;\\n\\t\\tfont-size: inherit;\\n\\t\\tpadding: 1em 2em;\\n\\t\\tcolor: #ff3e00;\\n\\t\\tbackground-color: rgba(255, 62, 0, 0.1);\\n\\t\\tborder-radius: 2em;\\n\\t\\tborder: 2px solid rgba(255, 62, 0, 0);\\n\\t\\toutline: none;\\n\\t\\twidth: 200px;\\n\\t\\tfont-variant-numeric: tabular-nums;\\n\\t}\\n\\n\\tbutton:focus {\\n\\t\\tborder: 2px solid #ff3e00;\\n\\t}\\n\\n\\tbutton:active {\\n\\t\\tbackground-color: rgba(255, 62, 0, 0.2);\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAaC,MAAM,cAAC,CAAC,AACP,WAAW,CAAE,OAAO,CACpB,SAAS,CAAE,OAAO,CAClB,OAAO,CAAE,GAAG,CAAC,GAAG,CAChB,KAAK,CAAE,OAAO,CACd,gBAAgB,CAAE,KAAK,GAAG,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACvC,aAAa,CAAE,GAAG,CAClB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACrC,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,KAAK,CACZ,oBAAoB,CAAE,YAAY,AACnC,CAAC,AAED,oBAAM,MAAM,AAAC,CAAC,AACb,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,AAC1B,CAAC,AAED,oBAAM,OAAO,AAAC,CAAC,AACd,gBAAgB,CAAE,KAAK,GAAG,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AACxC,CAAC"}'
};
const Counter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let count = 0;
  $$result.css.add(css$5);
  return `<button class="${"svelte-qxv3xi"}">Clicks: ${escape(count)}
</button>`;
});
var index_svelte = "h1.svelte-ocp1vb{color:#ff3e00;text-transform:uppercase;font-size:4rem;font-weight:100;line-height:1.1;margin:4rem auto;max-width:14rem}p.svelte-ocp1vb{max-width:14rem;margin:2rem auto;line-height:1.35}@media(min-width: 480px){h1.svelte-ocp1vb{max-width:none}p.svelte-ocp1vb{max-width:none}}";
const css$4 = {
  code: "h1.svelte-ocp1vb{color:#ff3e00;text-transform:uppercase;font-size:4rem;font-weight:100;line-height:1.1;margin:4rem auto;max-width:14rem}p.svelte-ocp1vb{max-width:14rem;margin:2rem auto;line-height:1.35}@media(min-width: 480px){h1.svelte-ocp1vb{max-width:none}p.svelte-ocp1vb{max-width:none}}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\n\\timport Counter from '$lib/Counter.svelte';\\n</script>\\n\\n<div>\\n\\t<h1>Hello world!</h1>\\n\\t<Counter />\\n\\n\\t<p>Visit <a href=\\"https://svelte.dev\\">svelte.dev</a> to learn how to build Svelte apps.</p>\\n</div>\\n\\t\\n\\n\\n<style>\\n\\tmain {\\n\\t\\ttext-align: center;\\n\\t\\tpadding: 1em;\\n\\t\\tmargin: 0 auto;\\n\\t}\\n\\n\\th1 {\\n\\t\\tcolor: #ff3e00;\\n\\t\\ttext-transform: uppercase;\\n\\t\\tfont-size: 4rem;\\n\\t\\tfont-weight: 100;\\n\\t\\tline-height: 1.1;\\n\\t\\tmargin: 4rem auto;\\n\\t\\tmax-width: 14rem;\\n\\t}\\n\\n\\tp {\\n\\t\\tmax-width: 14rem;\\n\\t\\tmargin: 2rem auto;\\n\\t\\tline-height: 1.35;\\n\\t}\\n\\n\\t@media (min-width: 480px) {\\n\\t\\th1 {\\n\\t\\t\\tmax-width: none;\\n\\t\\t}\\n\\n\\t\\tp {\\n\\t\\t\\tmax-width: none;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAoBC,EAAE,cAAC,CAAC,AACH,KAAK,CAAE,OAAO,CACd,cAAc,CAAE,SAAS,CACzB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,CAChB,WAAW,CAAE,GAAG,CAChB,MAAM,CAAE,IAAI,CAAC,IAAI,CACjB,SAAS,CAAE,KAAK,AACjB,CAAC,AAED,CAAC,cAAC,CAAC,AACF,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,IAAI,CAAC,IAAI,CACjB,WAAW,CAAE,IAAI,AAClB,CAAC,AAED,MAAM,AAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AAC1B,EAAE,cAAC,CAAC,AACH,SAAS,CAAE,IAAI,AAChB,CAAC,AAED,CAAC,cAAC,CAAC,AACF,SAAS,CAAE,IAAI,AAChB,CAAC,AACF,CAAC"}`
};
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$4);
  return `<div><h1 class="${"svelte-ocp1vb"}">Hello world!</h1>
	${validate_component(Counter, "Counter").$$render($$result, {}, {}, {})}

	<p class="${"svelte-ocp1vb"}">Visit <a href="${"https://svelte.dev"}">svelte.dev</a> to learn how to build Svelte apps.</p>
</div>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Routes
});
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return {set, update, subscribe: subscribe2};
}
const isAuthenticated = writable(false);
const user = writable({});
const curGame = writable("");
let moveDetails = writable("");
let fen = writable("");
var GameCard_svelte = ".border.svelte-1p6k5bh{border-style:solid}";
const Players_scores = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let playersScores2 = [];
  return `<h1>Score boards</h1>
<label><input type="${"radio"}"${add_attribute("value", 1, 0)}>
	chess
</label>

<label><input type="${"radio"}"${add_attribute("value", 2, 0)}>
	tic-tac-toe 
</label>
<ul>${each(playersScores2, (player) => `<li>${escape(player.user_name)}${escape(player.user_email)} = 
        ${`${escape(player.ttt_score)}`}
    </li>`)}</ul>`;
});
var playersScores = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Players_scores
});
const Search_matches = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let matches = [];
  return `<h1>Search Matches</h1>
<label><input type="${"radio"}"${add_attribute("value", 1, 0)}>
	Games of Tournaments I participated in
</label>

<label><input type="${"radio"}"${add_attribute("value", 2, 0)}>
	My own games results
</label>
<ul>${each(matches, (match) => `<li>${escape(match.player1_email)} vs ${escape(match.player2_email)} =${escape(match.winner_email == null ? "TIE" : match.winner_email)} </li>`)}</ul>`;
});
var searchMatches = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Search_matches
});
function guard(name) {
  return () => {
    throw new Error(`Cannot call ${name}(...) on the server`);
  };
}
const goto = guard("goto");
const My_matches = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_curGame;
  $$unsubscribe_curGame = subscribe(curGame, (value) => value);
  let runningGames = [];
  let selectedMatch = "";
  const searchForRunningGames = async () => {
    try {
      const response = await fetch("http://localhost:5001/player/running-matches", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token")
        }
      });
      const parseRes = await response.json();
      if (typeof parseRes === "string") {
        throw parseRes;
      }
      localStorage.setItem("token", parseRes.token);
      runningGames = parseRes.allIndividualMatches;
    } catch (err) {
      console.log(err);
    }
  };
  onMount(async () => searchForRunningGames());
  $$unsubscribe_curGame();
  return `<h1>Your Running Matches are</h1>
<ul>${each(runningGames, (game2) => `<li${add_attribute("current", game2.match_id, 0)}>id:${escape(game2.match_id)} player1:${escape(game2.player1_email)} VS player2:${escape(game2.player2_email)} 
        phases:${escape(game2.phases)},phase:${escape(game2.phase)},phase_id:${escape(game2.phases)},endgame:${escape(game2.endgame)}</li>
        <input type="${"radio"}"${add_attribute("value", game2.match_id, 0)}>`)}</ul>
<p>${escape(selectedMatch)}</p>`;
});
var myMatches = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: My_matches
});
const New_game = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let message = "";
  return `<h1>Create a new game</h1>
<label><input type="${"radio"}"${add_attribute("value", "chess", 0)}>
	Chess Game
</label>

<label><input type="${"radio"}"${add_attribute("value", "tic-tac-toe", 0)}>
	Tic Tac Toe Game
</label>
<p>${escape(message)}</p>`;
});
var newGame = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: New_game
});
const Register = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user$1;
  let displayError2;
  user$1 = {name: "", password: "", email: ""};
  displayError2 = "";
  return `<h1>Register Page</h1>
${displayError2 != "" ? `${escape(displayError2)}` : ``}
<form><input type="${"email"}" name="${"email"}" placeholder="${"email"}"${add_attribute("value", user$1.email, 1)}>
    <input type="${"password"}" name="${"password"}" placeholder="${"password"}"${add_attribute("value", user$1.password, 1)}>
    <input type="${"text"}" name="${"name"}" placeholder="${"name"}"${add_attribute("value", user$1.name, 1)}>
    <button>Submit</button></form>
`;
});
var register = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Register
});
const AdminOptions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let users = [];
  const getAllUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/admin/get-all-users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token")
        }
      });
      const parseRes = await response.json();
      if (typeof parseRes === "string") {
        throw parseRes;
      }
      users = parseRes.sort();
    } catch (err) {
      console.log(err);
    }
  };
  onMount(async () => getAllUsers());
  return `<h2>Admin Table</h2>

${``}
<ul>${each(users, (us) => `<div><li><div>${escape(us.user_email)}
            ${us.user_role_official == "1" || us.user_role_admin == "1" ? `-User is :${us.user_role_official == "1" ? `Official` : ``} ${us.user_role_admin == "1" ? `Admin` : ``}` : ``}</div>
        
        ${us.user_role_admin != "1" ? `<input type="${"radio"}"${add_attribute("value", {
    correlated_role: "user_role_admin",
    user_id: us.user_id
  }, 0)}>
            Admin` : ``}
        ${us.user_role_official != "1" ? `<input type="${"radio"}"${add_attribute("value", {
    correlated_role: "user_role_official",
    user_id: us.user_id
  }, 0)}>
            Official` : ``}</li>    
    </div>`)}</ul>`;
});
const OfficialOptions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let users = [];
  let my_tournaments = [];
  let tournament_name = "";
  const getAllPlayers = async () => {
    try {
      const response = await fetch("http://localhost:5001/official/get-all-players", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token")
        }
      });
      const parseRes = await response.json();
      if (typeof parseRes === "string") {
        throw parseRes;
      }
      users = parseRes;
    } catch (err) {
      console.log(err);
    }
  };
  const getMyTournaments = async () => {
    try {
      const response = await fetch("http://localhost:5001/official/my-tournaments", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token")
        }
      });
      const parseRes = await response.json();
      if (typeof parseRes === "string") {
        throw parseRes;
      }
      my_tournaments = parseRes;
    } catch (err) {
      console.log(err);
    }
  };
  onMount(async () => {
    await getAllPlayers();
    await getMyTournaments();
    console.log(my_tournaments);
  });
  return `<h2>Official Table</h2>
<h3>Tournaments Created By You:</h3>
<ul>${each(my_tournaments, (tourn) => `<li><p>name:${escape(tourn.tournament_name)} game_type:${escape(tourn.game_type)} total_players:${escape(tourn.total_players)}</p>  id:${escape(tourn.tournament_id)} 
        ${tourn.finished == "0" ? `<p>In progress\u{1F525}</p>` : `<p>Finished\u{1F6D1}</p>`}
        </li>`)}</ul>

<h3>New Tournament Menu</h3>
${``}
<ul>${each(users, (us) => `<li>${escape(us.user_email)}
        <input type="${"checkbox"}"${add_attribute("value", us, 0)}>
        </li>`)}</ul>
<input placeholder="${"enter tournament name here"}"${add_attribute("value", tournament_name, 1)}>
<label><input type="${"radio"}"${add_attribute("value", "chess", 0)}>Chess
<input type="${"radio"}"${add_attribute("value", "tic-tac-toe", 0)}>Tic Tac Toe
</label>
<button>Create tournament with those  players</button>`;
});
const Profile = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $user, $$unsubscribe_user;
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  $$unsubscribe_user();
  return `<h1>Profile Page</h1>

<p>Hello ${escape($user.user_name)} !!!</p>
<button>Log out</button>
${$user.user_role_admin == "1" ? `${validate_component(AdminOptions, "AdminOptions").$$render($$result, {}, {}, {})}` : ``}

${$user.user_role_official == "1" ? `${validate_component(OfficialOptions, "OfficialOptions").$$render($$result, {}, {}, {})}` : ``}`;
});
var profile = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Profile
});
const About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<h1>About page</h1>`;
});
var about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: About
});
const Login = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user$1;
  let displayError2;
  user$1 = {name: "", password: "", email: ""};
  displayError2 = "";
  return `<h1>Login Page</h1>
${displayError2 != "" ? `${escape(displayError2)}` : ``}
<form><input type="${"email"}" name="${"email"}" placeholder="${"email"}"${add_attribute("value", user$1.email, 1)}>
    <input type="${"password"}" name="${"password"}" placeholder="${"password"}"${add_attribute("value", user$1.password, 1)}>
    <button>Submit</button></form>`;
});
var login = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Login
});
const STATE = {
  waitForInputStart: 0,
  pieceClickedThreshold: 1,
  clickTo: 2,
  secondClickThreshold: 3,
  dragTo: 4,
  clickDragTo: 5,
  moveDone: 6,
  reset: 7
};
const MOVE_CANCELED_REASON = {
  secondClick: "secondClick",
  movedOutOfBoard: "movedOutOfBoard"
};
const DRAG_THRESHOLD = 4;
class ChessboardMoveInput {
  constructor(view, state, props, moveStartCallback, moveDoneCallback, moveCanceledCallback) {
    this.view = view;
    this.state = state;
    this.props = props;
    this.moveStartCallback = moveStartCallback;
    this.moveDoneCallback = moveDoneCallback;
    this.moveCanceledCallback = moveCanceledCallback;
    this.setMoveInputState(STATE.waitForInputStart);
  }
  setMoveInputState(newState, params = void 0) {
    const prevState = this.moveInputState;
    this.moveInputState = newState;
    switch (newState) {
      case STATE.waitForInputStart:
        break;
      case STATE.pieceClickedThreshold:
        if (STATE.waitForInputStart !== prevState) {
          throw new Error("moveInputState");
        }
        this.startIndex = params.index;
        this.endIndex = void 0;
        this.movedPiece = params.piece;
        this.updateStartEndMarkers();
        this.startPoint = params.point;
        if (!this.pointerMoveListener && !this.pointerUpListener) {
          if (params.type === "mousedown") {
            this.pointerMoveListener = this.onPointerMove.bind(this);
            this.pointerMoveListener.type = "mousemove";
            window.addEventListener("mousemove", this.pointerMoveListener);
            this.pointerUpListener = this.onPointerUp.bind(this);
            this.pointerUpListener.type = "mouseup";
            window.addEventListener("mouseup", this.pointerUpListener);
          } else if (params.type === "touchstart") {
            this.pointerMoveListener = this.onPointerMove.bind(this);
            this.pointerMoveListener.type = "touchmove";
            window.addEventListener("touchmove", this.pointerMoveListener);
            this.pointerUpListener = this.onPointerUp.bind(this);
            this.pointerUpListener.type = "touchend";
            window.addEventListener("touchend", this.pointerUpListener);
          } else {
            throw Error("event type");
          }
        } else {
          throw Error("_pointerMoveListener or _pointerUpListener");
        }
        break;
      case STATE.clickTo:
        if (this.draggablePiece) {
          Svg.removeElement(this.draggablePiece);
          this.draggablePiece = void 0;
        }
        if (prevState === STATE.dragTo) {
          this.view.setPieceVisibility(params.index);
        }
        break;
      case STATE.secondClickThreshold:
        if (STATE.clickTo !== prevState) {
          throw new Error("moveInputState");
        }
        this.startPoint = params.point;
        break;
      case STATE.dragTo:
        if (STATE.pieceClickedThreshold !== prevState) {
          throw new Error("moveInputState");
        }
        if (this.view.chessboard.state.inputEnabled) {
          this.view.setPieceVisibility(params.index, false);
          this.createDraggablePiece(params.piece);
        }
        break;
      case STATE.clickDragTo:
        if (STATE.secondClickThreshold !== prevState) {
          throw new Error("moveInputState");
        }
        if (this.view.chessboard.state.inputEnabled) {
          this.view.setPieceVisibility(params.index, false);
          this.createDraggablePiece(params.piece);
        }
        break;
      case STATE.moveDone:
        if ([STATE.dragTo, STATE.clickTo, STATE.clickDragTo].indexOf(prevState) === -1) {
          throw new Error("moveInputState");
        }
        this.endIndex = params.index;
        if (this.endIndex && this.moveDoneCallback(this.startIndex, this.endIndex)) {
          const prevSquares = this.state.squares.slice(0);
          this.state.setPiece(this.startIndex, void 0);
          this.state.setPiece(this.endIndex, this.movedPiece);
          if (prevState === STATE.clickTo) {
            this.updateStartEndMarkers();
            this.view.animatePieces(prevSquares, this.state.squares.slice(0), () => {
              this.setMoveInputState(STATE.reset);
            });
          } else {
            this.view.drawPieces(this.state.squares);
            this.setMoveInputState(STATE.reset);
          }
        } else {
          this.view.drawPiecesDebounced();
          this.setMoveInputState(STATE.reset);
        }
        break;
      case STATE.reset:
        if (this.startIndex && !this.endIndex && this.movedPiece) {
          this.state.setPiece(this.startIndex, this.movedPiece);
        }
        this.startIndex = void 0;
        this.endIndex = void 0;
        this.movedPiece = void 0;
        this.updateStartEndMarkers();
        if (this.draggablePiece) {
          Svg.removeElement(this.draggablePiece);
          this.draggablePiece = void 0;
        }
        if (this.pointerMoveListener) {
          window.removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener);
          this.pointerMoveListener = void 0;
        }
        if (this.pointerUpListener) {
          window.removeEventListener(this.pointerUpListener.type, this.pointerUpListener);
          this.pointerUpListener = void 0;
        }
        this.setMoveInputState(STATE.waitForInputStart);
        break;
      default:
        throw Error(`moveInputState ${newState}`);
    }
  }
  createDraggablePiece(pieceName) {
    if (this.draggablePiece) {
      throw Error("draggablePiece exists");
    }
    this.draggablePiece = Svg.createSvg(document.body);
    this.draggablePiece.classList.add("cm-chessboard-draggable-piece");
    this.draggablePiece.setAttribute("width", this.view.squareWidth);
    this.draggablePiece.setAttribute("height", this.view.squareHeight);
    this.draggablePiece.setAttribute("style", "pointer-events: none");
    this.draggablePiece.name = pieceName;
    const spriteUrl = this.props.sprite.cache ? "" : this.props.sprite.url;
    const piece = Svg.addElement(this.draggablePiece, "use", {
      href: `${spriteUrl}#${pieceName}`
    });
    const scaling = this.view.squareHeight / this.props.sprite.size;
    const transformScale = this.draggablePiece.createSVGTransform();
    transformScale.setScale(scaling, scaling);
    piece.transform.baseVal.appendItem(transformScale);
  }
  moveDraggablePiece(x, y) {
    this.draggablePiece.setAttribute("style", `pointer-events: none; position: absolute; left: ${x - this.view.squareHeight / 2}px; top: ${y - this.view.squareHeight / 2}px`);
  }
  onPointerDown(e) {
    if (e.type === "mousedown" && e.button === 0 || e.type === "touchstart") {
      const index2 = e.target.getAttribute("data-index");
      const pieceElement = this.view.getPiece(index2);
      let pieceName, color;
      if (pieceElement) {
        pieceName = pieceElement.getAttribute("data-piece");
        color = pieceName ? pieceName.substr(0, 1) : void 0;
        if (color === "w" && this.state.inputWhiteEnabled || color === "b" && this.state.inputBlackEnabled) {
          e.preventDefault();
        }
      }
      if (index2 !== void 0) {
        if (this.moveInputState !== STATE.waitForInputStart || this.state.inputWhiteEnabled && color === "w" || this.state.inputBlackEnabled && color === "b") {
          let point;
          if (e.type === "mousedown") {
            point = {x: e.clientX, y: e.clientY};
          } else if (e.type === "touchstart") {
            point = {x: e.touches[0].clientX, y: e.touches[0].clientY};
          }
          if (this.moveInputState === STATE.waitForInputStart && pieceName && this.moveStartCallback(index2)) {
            this.setMoveInputState(STATE.pieceClickedThreshold, {
              index: index2,
              piece: pieceName,
              point,
              type: e.type
            });
          } else if (this.moveInputState === STATE.clickTo) {
            if (index2 === this.startIndex) {
              this.setMoveInputState(STATE.secondClickThreshold, {
                index: index2,
                piece: pieceName,
                point,
                type: e.type
              });
            } else {
              this.setMoveInputState(STATE.moveDone, {index: index2});
            }
          }
        }
      }
    }
  }
  onPointerMove(e) {
    let pageX, pageY, clientX, clientY, target;
    if (e.type === "mousemove") {
      clientX = e.clientX;
      clientY = e.clientY;
      pageX = e.pageX;
      pageY = e.pageY;
      target = e.target;
    } else if (e.type === "touchmove") {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      pageX = e.touches[0].pageX;
      pageY = e.touches[0].pageY;
      target = document.elementFromPoint(clientX, clientY);
    }
    if (this.moveInputState === STATE.pieceClickedThreshold || this.moveInputState === STATE.secondClickThreshold) {
      if (Math.abs(this.startPoint.x - clientX) > DRAG_THRESHOLD || Math.abs(this.startPoint.y - clientY) > DRAG_THRESHOLD) {
        if (this.moveInputState === STATE.secondClickThreshold) {
          this.setMoveInputState(STATE.clickDragTo, {index: this.startIndex, piece: this.movedPiece});
        } else {
          this.setMoveInputState(STATE.dragTo, {index: this.startIndex, piece: this.movedPiece});
        }
        if (this.view.chessboard.state.inputEnabled) {
          this.moveDraggablePiece(pageX, pageY);
        }
      }
    } else if (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo || this.moveInputState === STATE.clickTo) {
      if (target && target.getAttribute && target.parentElement === this.view.boardGroup) {
        const index2 = target.getAttribute("data-index");
        if (index2 !== this.startIndex && index2 !== this.endIndex) {
          this.endIndex = index2;
          this.updateStartEndMarkers();
        } else if (index2 === this.startIndex && this.endIndex !== void 0) {
          this.endIndex = void 0;
          this.updateStartEndMarkers();
        }
      } else {
        if (this.endIndex !== void 0) {
          this.endIndex = void 0;
          this.updateStartEndMarkers();
        }
      }
      if (this.view.chessboard.state.inputEnabled && (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo)) {
        this.moveDraggablePiece(pageX, pageY);
      }
    }
  }
  onPointerUp(e) {
    let target;
    if (e.type === "mouseup") {
      target = e.target;
    } else if (e.type === "touchend") {
      target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
    if (target && target.getAttribute) {
      const index2 = target.getAttribute("data-index");
      if (index2) {
        if (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo) {
          if (this.startIndex === index2) {
            if (this.moveInputState === STATE.clickDragTo) {
              this.state.setPiece(this.startIndex, this.movedPiece);
              this.view.setPieceVisibility(this.startIndex);
              this.setMoveInputState(STATE.reset);
            } else {
              this.setMoveInputState(STATE.clickTo, {index: index2});
            }
          } else {
            this.setMoveInputState(STATE.moveDone, {index: index2});
          }
        } else if (this.moveInputState === STATE.pieceClickedThreshold) {
          this.setMoveInputState(STATE.clickTo, {index: index2});
        } else if (this.moveInputState === STATE.secondClickThreshold) {
          this.setMoveInputState(STATE.reset);
          this.moveCanceledCallback(MOVE_CANCELED_REASON.secondClick, index2);
        }
      } else {
        this.view.drawPiecesDebounced();
        this.setMoveInputState(STATE.reset);
        this.moveCanceledCallback(MOVE_CANCELED_REASON.movedOutOfBoard, void 0);
      }
    } else {
      this.view.drawPiecesDebounced();
      this.setMoveInputState(STATE.reset);
    }
  }
  updateStartEndMarkers() {
    this.state.removeMarkers(void 0, MARKER_TYPE.move);
    if (this.startIndex) {
      this.state.addMarker(this.startIndex, MARKER_TYPE.move);
    }
    if (this.endIndex) {
      this.state.addMarker(this.endIndex, MARKER_TYPE.move);
    }
    this.view.drawMarkersDebounced();
  }
  reset() {
    this.setMoveInputState(STATE.reset);
  }
  destroy() {
    this.reset();
  }
}
const CHANGE_TYPE = {
  move: 0,
  appear: 1,
  disappear: 2
};
function AnimationRunningException() {
}
class ChessboardPiecesAnimation {
  constructor(view, fromSquares, toSquares, duration, callback) {
    this.view = view;
    if (this.view.animationRunning) {
      throw new AnimationRunningException();
    }
    if (fromSquares && toSquares) {
      this.animatedElements = this.createAnimation(fromSquares, toSquares);
      this.duration = duration;
      this.callback = callback;
      this.view.animationRunning = true;
      this.frameHandle = requestAnimationFrame(this.animationStep.bind(this));
    }
  }
  seekChanges(fromSquares, toSquares) {
    const appearedList = [], disappearedList = [], changes = [];
    for (let i = 0; i < 64; i++) {
      const previousSquare = fromSquares[i];
      const newSquare = toSquares[i];
      if (newSquare !== previousSquare) {
        if (newSquare) {
          appearedList.push({piece: newSquare, index: i});
        }
        if (previousSquare) {
          disappearedList.push({piece: previousSquare, index: i});
        }
      }
    }
    appearedList.forEach((appeared) => {
      let shortestDistance = 8;
      let foundMoved = void 0;
      disappearedList.forEach((disappeared) => {
        if (appeared.piece === disappeared.piece) {
          const moveDistance = this.squareDistance(appeared.index, disappeared.index);
          if (moveDistance < shortestDistance) {
            foundMoved = disappeared;
            shortestDistance = moveDistance;
          }
        }
      });
      if (foundMoved) {
        disappearedList.splice(disappearedList.indexOf(foundMoved), 1);
        changes.push({
          type: CHANGE_TYPE.move,
          piece: appeared.piece,
          atIndex: foundMoved.index,
          toIndex: appeared.index
        });
      } else {
        changes.push({type: CHANGE_TYPE.appear, piece: appeared.piece, atIndex: appeared.index});
      }
    });
    disappearedList.forEach((disappeared) => {
      changes.push({type: CHANGE_TYPE.disappear, piece: disappeared.piece, atIndex: disappeared.index});
    });
    return changes;
  }
  createAnimation(fromSquares, toSquares) {
    const changes = this.seekChanges(fromSquares, toSquares);
    const animatedElements = [];
    changes.forEach((change) => {
      const animatedItem = {
        type: change.type
      };
      switch (change.type) {
        case CHANGE_TYPE.move:
          animatedItem.element = this.view.getPiece(change.atIndex);
          animatedItem.atPoint = this.view.squareIndexToPoint(change.atIndex);
          animatedItem.toPoint = this.view.squareIndexToPoint(change.toIndex);
          break;
        case CHANGE_TYPE.appear:
          animatedItem.element = this.view.drawPiece(change.atIndex, change.piece);
          animatedItem.element.style.opacity = 0;
          break;
        case CHANGE_TYPE.disappear:
          animatedItem.element = this.view.getPiece(change.atIndex);
          break;
      }
      animatedElements.push(animatedItem);
    });
    return animatedElements;
  }
  animationStep(time) {
    if (!this.startTime) {
      this.startTime = time;
    }
    const timeDiff = time - this.startTime;
    if (timeDiff <= this.duration) {
      this.frameHandle = requestAnimationFrame(this.animationStep.bind(this));
    } else {
      cancelAnimationFrame(this.frameHandle);
      this.view.animationRunning = false;
      this.callback();
    }
    const t = Math.min(1, timeDiff / this.duration);
    const progress = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    this.animatedElements.forEach((animatedItem) => {
      if (animatedItem.element) {
        switch (animatedItem.type) {
          case CHANGE_TYPE.move:
            animatedItem.element.transform.baseVal.removeItem(0);
            const transform = this.view.svg.createSVGTransform();
            transform.setTranslate(animatedItem.atPoint.x + (animatedItem.toPoint.x - animatedItem.atPoint.x) * progress, animatedItem.atPoint.y + (animatedItem.toPoint.y - animatedItem.atPoint.y) * progress);
            animatedItem.element.transform.baseVal.appendItem(transform);
            break;
          case CHANGE_TYPE.appear:
            animatedItem.element.style.opacity = progress;
            break;
          case CHANGE_TYPE.disappear:
            animatedItem.element.style.opacity = 1 - progress;
            break;
        }
      } else {
        console.warn("animatedItem has no element", animatedItem);
      }
    });
  }
  squareDistance(index1, index2) {
    const file1 = index1 % 8;
    const rank1 = Math.floor(index1 / 8);
    const file2 = index2 % 8;
    const rank2 = Math.floor(index2 / 8);
    return Math.max(Math.abs(rank2 - rank1), Math.abs(file2 - file1));
  }
}
const SQUARE_COORDINATES = [
  "a1",
  "b1",
  "c1",
  "d1",
  "e1",
  "f1",
  "g1",
  "h1",
  "a2",
  "b2",
  "c2",
  "d2",
  "e2",
  "f2",
  "g2",
  "h2",
  "a3",
  "b3",
  "c3",
  "d3",
  "e3",
  "f3",
  "g3",
  "h3",
  "a4",
  "b4",
  "c4",
  "d4",
  "e4",
  "f4",
  "g4",
  "h4",
  "a5",
  "b5",
  "c5",
  "d5",
  "e5",
  "f5",
  "g5",
  "h5",
  "a6",
  "b6",
  "c6",
  "d6",
  "e6",
  "f6",
  "g6",
  "h6",
  "a7",
  "b7",
  "c7",
  "d7",
  "e7",
  "f7",
  "g7",
  "h7",
  "a8",
  "b8",
  "c8",
  "d8",
  "e8",
  "f8",
  "g8",
  "h8"
];
class ChessboardView {
  constructor(chessboard, callbackAfterCreation) {
    this.animationRunning = false;
    this.currentAnimation = void 0;
    this.chessboard = chessboard;
    this.moveInput = new ChessboardMoveInput(this, chessboard.state, chessboard.props, this.moveStartCallback.bind(this), this.moveDoneCallback.bind(this), this.moveCanceledCallback.bind(this));
    this.animationQueue = [];
    if (chessboard.props.sprite.cache) {
      this.cacheSprite();
    }
    if (chessboard.props.responsive) {
      this.resizeListener = this.handleResize.bind(this);
      window.addEventListener("resize", this.resizeListener);
    }
    this.pointerDownListener = this.pointerDownHandler.bind(this);
    this.chessboard.element.addEventListener("mousedown", this.pointerDownListener);
    this.chessboard.element.addEventListener("touchstart", this.pointerDownListener);
    this.createSvgAndGroups();
    this.updateMetrics();
    callbackAfterCreation();
    if (chessboard.props.responsive) {
      setTimeout(() => {
        this.handleResize();
      });
    }
  }
  pointerDownHandler(e) {
    this.moveInput.onPointerDown(e);
  }
  destroy() {
    this.moveInput.destroy();
    window.removeEventListener("resize", this.resizeListener);
    this.chessboard.element.removeEventListener("mousedown", this.pointerDownListener);
    this.chessboard.element.removeEventListener("touchstart", this.pointerDownListener);
    window.clearTimeout(this.resizeDebounce);
    window.clearTimeout(this.redrawDebounce);
    window.clearTimeout(this.drawPiecesDebounce);
    window.clearTimeout(this.drawMarkersDebounce);
    Svg.removeElement(this.svg);
    this.animationQueue = [];
    if (this.currentAnimation) {
      cancelAnimationFrame(this.currentAnimation.frameHandle);
    }
  }
  cacheSprite() {
    const wrapperId = "chessboardSpriteCache";
    if (!document.getElementById(wrapperId)) {
      const wrapper = document.createElement("div");
      wrapper.style.display = "none";
      wrapper.id = wrapperId;
      document.body.appendChild(wrapper);
      const xhr = new XMLHttpRequest();
      xhr.open("GET", this.chessboard.props.sprite.url, true);
      xhr.onload = function() {
        wrapper.insertAdjacentHTML("afterbegin", xhr.response);
      };
      xhr.send();
    }
  }
  createSvgAndGroups() {
    if (this.svg) {
      Svg.removeElement(this.svg);
    }
    this.svg = Svg.createSvg(this.chessboard.element);
    let cssClass = this.chessboard.props.style.cssClass ? this.chessboard.props.style.cssClass : "default";
    this.svg.setAttribute("class", "cm-chessboard border-type-" + this.chessboard.props.style.borderType + " " + cssClass);
    this.updateMetrics();
    this.boardGroup = Svg.addElement(this.svg, "g", {class: "board"});
    this.coordinatesGroup = Svg.addElement(this.svg, "g", {class: "coordinates"});
    this.markersGroup = Svg.addElement(this.svg, "g", {class: "markers"});
    this.piecesGroup = Svg.addElement(this.svg, "g", {class: "pieces"});
  }
  updateMetrics() {
    this.width = this.chessboard.element.clientWidth;
    this.height = this.chessboard.element.clientHeight;
    if (this.chessboard.props.style.borderType === BORDER_TYPE.frame) {
      this.borderSize = this.width / 25;
    } else if (this.chessboard.props.style.borderType === BORDER_TYPE.thin) {
      this.borderSize = this.width / 320;
    } else {
      this.borderSize = 0;
    }
    this.innerWidth = this.width - 2 * this.borderSize;
    this.innerHeight = this.height - 2 * this.borderSize;
    this.squareWidth = this.innerWidth / 8;
    this.squareHeight = this.innerHeight / 8;
    this.scalingX = this.squareWidth / this.chessboard.props.sprite.size;
    this.scalingY = this.squareHeight / this.chessboard.props.sprite.size;
    this.pieceXTranslate = this.squareWidth / 2 - this.chessboard.props.sprite.size * this.scalingY / 2;
  }
  handleResize() {
    window.clearTimeout(this.resizeDebounce);
    this.resizeDebounce = setTimeout(() => {
      if (this.chessboard.props.style.aspectRatio) {
        this.chessboard.element.style.height = this.chessboard.element.clientWidth * this.chessboard.props.style.aspectRatio + "px";
      }
      if (this.chessboard.element.clientWidth !== this.width || this.chessboard.element.clientHeight !== this.height) {
        this.updateMetrics();
        this.redraw();
      }
      this.svg.setAttribute("width", "100%");
      this.svg.setAttribute("height", "100%");
    });
  }
  redraw() {
    return new Promise((resolve2) => {
      window.clearTimeout(this.redrawDebounce);
      this.redrawDebounce = setTimeout(() => {
        this.drawBoard();
        this.drawCoordinates();
        this.drawMarkers();
        this.setCursor();
      });
      this.drawPiecesDebounced(this.chessboard.state.squares, () => {
        resolve2();
      });
    });
  }
  drawBoard() {
    while (this.boardGroup.firstChild) {
      this.boardGroup.removeChild(this.boardGroup.lastChild);
    }
    if (this.chessboard.props.style.borderType !== BORDER_TYPE.none) {
      let boardBorder = Svg.addElement(this.boardGroup, "rect", {width: this.width, height: this.height});
      boardBorder.setAttribute("class", "border");
      if (this.chessboard.props.style.borderType === BORDER_TYPE.frame) {
        const innerPos = this.borderSize;
        let borderInner = Svg.addElement(this.boardGroup, "rect", {
          x: innerPos,
          y: innerPos,
          width: this.width - innerPos * 2,
          height: this.height - innerPos * 2
        });
        borderInner.setAttribute("class", "border-inner");
      }
    }
    for (let i = 0; i < 64; i++) {
      const index2 = this.chessboard.state.orientation === COLOR.white ? i : 63 - i;
      const squareColor = (9 * index2 & 8) === 0 ? "black" : "white";
      const fieldClass = `square ${squareColor}`;
      const point = this.squareIndexToPoint(index2);
      const squareRect = Svg.addElement(this.boardGroup, "rect", {
        x: point.x,
        y: point.y,
        width: this.squareWidth,
        height: this.squareHeight
      });
      squareRect.setAttribute("class", fieldClass);
      squareRect.setAttribute("data-index", "" + index2);
    }
  }
  drawCoordinates() {
    if (!this.chessboard.props.style.showCoordinates) {
      return;
    }
    while (this.coordinatesGroup.firstChild) {
      this.coordinatesGroup.removeChild(this.coordinatesGroup.lastChild);
    }
    const inline = this.chessboard.props.style.borderType !== BORDER_TYPE.frame;
    for (let file = 0; file < 8; file++) {
      let x = this.borderSize + (17 + this.chessboard.props.sprite.size * file) * this.scalingX;
      let y = this.height - this.scalingY * 3.5;
      let cssClass = "coordinate file";
      if (inline) {
        x = x + this.scalingX * 15.5;
        cssClass += file % 2 ? " white" : " black";
      }
      const textElement = Svg.addElement(this.coordinatesGroup, "text", {
        class: cssClass,
        x,
        y,
        style: `font-size: ${this.scalingY * 10}px`
      });
      if (this.chessboard.state.orientation === COLOR.white) {
        textElement.textContent = String.fromCharCode(97 + file);
      } else {
        textElement.textContent = String.fromCharCode(104 - file);
      }
    }
    for (let rank = 0; rank < 8; rank++) {
      let x = this.borderSize / 3.7;
      let y = this.borderSize + 25 * this.scalingY + rank * this.squareHeight;
      let cssClass = "coordinate rank";
      if (inline) {
        cssClass += rank % 2 ? " black" : " white";
        if (this.chessboard.props.style.borderType === BORDER_TYPE.frame) {
          x = x + this.scalingX * 10;
          y = y - this.scalingY * 15;
        } else {
          x = x + this.scalingX * 2;
          y = y - this.scalingY * 15;
        }
      }
      const textElement = Svg.addElement(this.coordinatesGroup, "text", {
        class: cssClass,
        x,
        y,
        style: `font-size: ${this.scalingY * 10}px`
      });
      if (this.chessboard.state.orientation === COLOR.white) {
        textElement.textContent = 8 - rank;
      } else {
        textElement.textContent = 1 + rank;
      }
    }
  }
  drawPiecesDebounced(squares = this.chessboard.state.squares, callback = void 0) {
    window.clearTimeout(this.drawPiecesDebounce);
    this.drawPiecesDebounce = setTimeout(() => {
      this.drawPieces(squares);
      if (callback) {
        callback();
      }
    });
  }
  drawPieces(squares = this.chessboard.state.squares) {
    while (this.piecesGroup.firstChild) {
      this.piecesGroup.removeChild(this.piecesGroup.lastChild);
    }
    for (let i = 0; i < 64; i++) {
      const pieceName = squares[i];
      if (pieceName) {
        this.drawPiece(i, pieceName);
      }
    }
  }
  drawPiece(index2, pieceName) {
    const pieceGroup = Svg.addElement(this.piecesGroup, "g");
    pieceGroup.setAttribute("data-piece", pieceName);
    pieceGroup.setAttribute("data-index", index2);
    const point = this.squareIndexToPoint(index2);
    const transform = this.svg.createSVGTransform();
    transform.setTranslate(point.x, point.y);
    pieceGroup.transform.baseVal.appendItem(transform);
    const spriteUrl = this.chessboard.props.sprite.cache ? "" : this.chessboard.props.sprite.url;
    const pieceUse = Svg.addElement(pieceGroup, "use", {
      href: `${spriteUrl}#${pieceName}`,
      class: "piece"
    });
    const transformTranslate = this.svg.createSVGTransform();
    transformTranslate.setTranslate(this.pieceXTranslate, 0);
    pieceUse.transform.baseVal.appendItem(transformTranslate);
    const transformScale = this.svg.createSVGTransform();
    transformScale.setScale(this.scalingY, this.scalingY);
    pieceUse.transform.baseVal.appendItem(transformScale);
    return pieceGroup;
  }
  setPieceVisibility(index2, visible = true) {
    const piece = this.getPiece(index2);
    if (visible) {
      piece.setAttribute("visibility", "visible");
    } else {
      piece.setAttribute("visibility", "hidden");
    }
  }
  getPiece(index2) {
    return this.piecesGroup.querySelector(`g[data-index='${index2}']`);
  }
  drawMarkersDebounced() {
    window.clearTimeout(this.drawMarkersDebounce);
    this.drawMarkersDebounce = setTimeout(() => {
      this.drawMarkers();
    }, 10);
  }
  drawMarkers() {
    while (this.markersGroup.firstChild) {
      this.markersGroup.removeChild(this.markersGroup.firstChild);
    }
    this.chessboard.state.markers.forEach((marker) => {
      this.drawMarker(marker);
    });
  }
  drawMarker(marker) {
    const markerGroup = Svg.addElement(this.markersGroup, "g");
    markerGroup.setAttribute("data-index", marker.index);
    const point = this.squareIndexToPoint(marker.index);
    const transform = this.svg.createSVGTransform();
    transform.setTranslate(point.x, point.y);
    markerGroup.transform.baseVal.appendItem(transform);
    const spriteUrl = this.chessboard.props.sprite.cache ? "" : this.chessboard.props.sprite.url;
    const markerUse = Svg.addElement(markerGroup, "use", {href: `${spriteUrl}#${marker.type.slice}`, class: "marker " + marker.type.class});
    const transformScale = this.svg.createSVGTransform();
    transformScale.setScale(this.scalingX, this.scalingY);
    markerUse.transform.baseVal.appendItem(transformScale);
    return markerGroup;
  }
  animatePieces(fromSquares, toSquares, callback) {
    this.animationQueue.push({fromSquares, toSquares, callback});
    if (!this.animationRunning) {
      this.nextPieceAnimationInQueue();
    }
  }
  nextPieceAnimationInQueue() {
    const nextAnimation = this.animationQueue.shift();
    if (nextAnimation !== void 0) {
      this.currentAnimation = new ChessboardPiecesAnimation(this, nextAnimation.fromSquares, nextAnimation.toSquares, this.chessboard.props.animationDuration / (this.animationQueue.length + 1), () => {
        if (!this.moveInput.draggablePiece) {
          this.drawPieces(nextAnimation.toSquares);
        }
        this.nextPieceAnimationInQueue();
        if (nextAnimation.callback) {
          nextAnimation.callback();
        }
      });
    }
  }
  enableMoveInput(eventHandler, color = void 0) {
    if (color === COLOR.white) {
      this.chessboard.state.inputWhiteEnabled = true;
    } else if (color === COLOR.black) {
      this.chessboard.state.inputBlackEnabled = true;
    } else {
      this.chessboard.state.inputWhiteEnabled = true;
      this.chessboard.state.inputBlackEnabled = true;
    }
    this.chessboard.state.inputEnabled = true;
    this.moveInputCallback = eventHandler;
    this.setCursor();
  }
  disableMoveInput() {
    this.chessboard.state.inputWhiteEnabled = false;
    this.chessboard.state.inputBlackEnabled = false;
    this.chessboard.state.inputEnabled = false;
    this.moveInputCallback = void 0;
    this.setCursor();
  }
  moveStartCallback(index2) {
    if (this.moveInputCallback) {
      return this.moveInputCallback({
        chessboard: this.chessboard,
        type: INPUT_EVENT_TYPE.moveStart,
        square: SQUARE_COORDINATES[index2]
      });
    } else {
      return true;
    }
  }
  moveDoneCallback(fromIndex, toIndex) {
    if (this.moveInputCallback) {
      return this.moveInputCallback({
        chessboard: this.chessboard,
        type: INPUT_EVENT_TYPE.moveDone,
        squareFrom: SQUARE_COORDINATES[fromIndex],
        squareTo: SQUARE_COORDINATES[toIndex]
      });
    } else {
      return true;
    }
  }
  moveCanceledCallback(reason, index2) {
    if (this.moveInputCallback) {
      this.moveInputCallback({
        chessboard: this.chessboard,
        type: INPUT_EVENT_TYPE.moveCanceled,
        reason,
        square: index2 ? SQUARE_COORDINATES[index2] : void 0
      });
    }
  }
  setCursor() {
    this.chessboard.initialization.then(() => {
      if (this.chessboard.state.inputWhiteEnabled || this.chessboard.state.inputBlackEnabled || this.chessboard.boardClickListener) {
        this.boardGroup.setAttribute("class", "board input-enabled");
      } else {
        this.boardGroup.setAttribute("class", "board");
      }
    });
  }
  squareIndexToPoint(index2) {
    let x, y;
    if (this.chessboard.state.orientation === COLOR.white) {
      x = this.borderSize + index2 % 8 * this.squareWidth;
      y = this.borderSize + (7 - Math.floor(index2 / 8)) * this.squareHeight;
    } else {
      x = this.borderSize + (7 - index2 % 8) * this.squareWidth;
      y = this.borderSize + Math.floor(index2 / 8) * this.squareHeight;
    }
    return {x, y};
  }
}
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
class Svg {
  static createSvg(containerElement = void 0) {
    let svg = document.createElementNS(SVG_NAMESPACE, "svg");
    if (containerElement) {
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      containerElement.appendChild(svg);
    }
    return svg;
  }
  static addElement(parent, name, attributes) {
    let element = document.createElementNS(SVG_NAMESPACE, name);
    if (name === "use") {
      attributes["xlink:href"] = attributes["href"];
    }
    for (let attribute in attributes) {
      if (attributes.hasOwnProperty(attribute)) {
        if (attribute.indexOf(":") !== -1) {
          const value = attribute.split(":");
          element.setAttributeNS("http://www.w3.org/1999/" + value[0], value[1], attributes[attribute]);
        } else {
          element.setAttribute(attribute, attributes[attribute]);
        }
      }
    }
    parent.appendChild(element);
    return element;
  }
  static removeElement(element) {
    element.parentNode.removeChild(element);
  }
}
class ChessboardState {
  constructor() {
    this.squares = new Array(64).fill(void 0);
    this.orientation = void 0;
    this.markers = [];
  }
  setPiece(index2, piece) {
    this.squares[index2] = piece;
  }
  addMarker(index2, type) {
    this.markers.push({index: index2, type});
  }
  removeMarkers(index2 = void 0, type = void 0) {
    if (!index2 && !type) {
      this.markers = [];
    } else {
      this.markers = this.markers.filter((marker) => {
        if (!marker.type) {
          if (index2 === marker.index) {
            return false;
          }
        } else if (!index2) {
          if (marker.type === type) {
            return false;
          }
        } else if (marker.type === type && index2 === marker.index) {
          return false;
        }
        return true;
      });
    }
  }
  setPosition(fen2) {
    if (fen2) {
      const parts = fen2.replace(/^\s*/, "").replace(/\s*$/, "").split(/\/|\s/);
      for (let part = 0; part < 8; part++) {
        const row = parts[7 - part].replace(/\d/g, (str) => {
          const numSpaces = parseInt(str);
          let ret = "";
          for (let i = 0; i < numSpaces; i++) {
            ret += "-";
          }
          return ret;
        });
        for (let c = 0; c < 8; c++) {
          const char = row.substr(c, 1);
          let piece = void 0;
          if (char !== "-") {
            if (char.toUpperCase() === char) {
              piece = `w${char.toLowerCase()}`;
            } else {
              piece = `b${char}`;
            }
          }
          this.squares[part * 8 + c] = piece;
        }
      }
    }
  }
  getPosition() {
    let parts = new Array(8).fill("");
    for (let part = 0; part < 8; part++) {
      let spaceCounter = 0;
      for (let i = 0; i < 8; i++) {
        const piece = this.squares[part * 8 + i];
        if (piece === void 0) {
          spaceCounter++;
        } else {
          if (spaceCounter > 0) {
            parts[7 - part] += spaceCounter;
            spaceCounter = 0;
          }
          const color = piece.substr(0, 1);
          const name = piece.substr(1, 1);
          if (color === "w") {
            parts[7 - part] += name.toUpperCase();
          } else {
            parts[7 - part] += name;
          }
        }
      }
      if (spaceCounter > 0) {
        parts[7 - part] += spaceCounter;
        spaceCounter = 0;
      }
    }
    return parts.join("/");
  }
  squareToIndex(square) {
    const file = square.substr(0, 1).charCodeAt(0) - 97;
    const rank = square.substr(1, 1) - 1;
    return 8 * rank + file;
  }
}
const COLOR = {
  white: "w",
  black: "b"
};
const INPUT_EVENT_TYPE = {
  moveStart: "moveStart",
  moveDone: "moveDone",
  moveCanceled: "moveCanceled"
};
const SQUARE_SELECT_TYPE = {
  primary: "primary",
  secondary: "secondary"
};
const BORDER_TYPE = {
  none: "none",
  thin: "thin",
  frame: "frame"
};
const MARKER_TYPE = {
  move: {class: "move", slice: "markerFrame"},
  emphasize: {class: "emphasize", slice: "markerSquare"},
  danger: {class: "danger", slice: "markerCircle"}
};
const FEN_START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const FEN_EMPTY_POSITION = "8/8/8/8/8/8/8/8";
class Chessboard {
  constructor(element, props = {}) {
    if (!element) {
      throw new Error("container element is " + element);
    }
    this.element = element;
    let defaultProps = {
      position: "empty",
      orientation: COLOR.white,
      style: {
        cssClass: "default",
        showCoordinates: true,
        borderType: BORDER_TYPE.thin,
        aspectRatio: 1
      },
      responsive: true,
      animationDuration: 300,
      sprite: {
        url: "./assets/images/chessboard-sprite-staunty.svg",
        size: 40,
        cache: true
      }
    };
    if (props.style && props.style.showBorder !== void 0) {
      console.warn("style.showBorder is deprecated, use style.borderType instead");
      if (props.style.showBorder) {
        props.style.borderType = BORDER_TYPE.frame;
      } else {
        props.style.borderType = BORDER_TYPE.thin;
      }
    }
    if (props.moveInputMode) {
      console.warn("`props.moveInputMode` is deprecated, you don't need it anymore");
    }
    this.props = {};
    Object.assign(this.props, defaultProps);
    Object.assign(this.props, props);
    this.props.sprite = defaultProps.sprite;
    this.props.style = defaultProps.style;
    if (props.sprite) {
      Object.assign(this.props.sprite, props.sprite);
    }
    if (props.style) {
      Object.assign(this.props.style, props.style);
    }
    if (this.props.style.aspectRatio) {
      this.element.style.height = this.element.offsetWidth * this.props.style.aspectRatio + "px";
    }
    this.state = new ChessboardState();
    this.state.orientation = this.props.orientation;
    this.initialization = new Promise((resolve2) => {
      this.view = new ChessboardView(this, () => {
        if (this.props.position === "start") {
          this.state.setPosition(FEN_START_POSITION);
        } else if (this.props.position === "empty" || this.props.position === void 0) {
          this.state.setPosition(FEN_EMPTY_POSITION);
        } else {
          this.state.setPosition(this.props.position);
        }
        setTimeout(() => {
          this.view.redraw().then(() => {
            resolve2();
          });
        });
      });
    });
  }
  setPiece(square, piece) {
    return new Promise((resolve2) => {
      this.initialization.then(() => {
        this.state.setPiece(this.state.squareToIndex(square), piece);
        this.view.drawPiecesDebounced(this.state.squares, () => {
          resolve2();
        });
      });
    });
  }
  getPiece(square) {
    return this.state.squares[this.state.squareToIndex(square)];
  }
  setPosition(fen2, animated = true) {
    return new Promise((resolve2) => {
      this.initialization.then(() => {
        const currentFen = this.state.getPosition();
        const fenParts = fen2.split(" ");
        const fenNormalized = fenParts[0];
        if (fenNormalized !== currentFen) {
          const prevSquares = this.state.squares.slice(0);
          if (fen2 === "start") {
            this.state.setPosition(FEN_START_POSITION);
          } else if (fen2 === "empty" || fen2 === void 0) {
            this.state.setPosition(FEN_EMPTY_POSITION);
          } else {
            this.state.setPosition(fen2);
          }
          if (animated) {
            this.view.animatePieces(prevSquares, this.state.squares.slice(0), () => {
              resolve2();
            });
          } else {
            this.view.drawPiecesDebounced();
            resolve2();
          }
        } else {
          resolve2();
        }
      });
    });
  }
  getPosition() {
    return this.state.getPosition();
  }
  addMarker(square, type = MARKER_TYPE.emphasize) {
    this.state.addMarker(this.state.squareToIndex(square), type);
    this.view.drawMarkersDebounced();
  }
  getMarkers(square = void 0, type = void 0) {
    const markersFound = [];
    this.state.markers.forEach((marker) => {
      const markerSquare = SQUARE_COORDINATES[marker.index];
      if (!square && (!type || type === marker.type) || !type && square === markerSquare || type === marker.type && square === markerSquare) {
        markersFound.push({square: SQUARE_COORDINATES[marker.index], type: marker.type});
      }
    });
    return markersFound;
  }
  removeMarkers(square = void 0, type = void 0) {
    const index2 = square ? this.state.squareToIndex(square) : void 0;
    this.state.removeMarkers(index2, type);
    this.view.drawMarkersDebounced();
  }
  setOrientation(color) {
    this.state.orientation = color;
    this.view.redraw();
  }
  getOrientation() {
    return this.state.orientation;
  }
  destroy() {
    return new Promise((resolve2) => {
      this.initialization.then(() => {
        this.view.destroy();
        this.view = void 0;
        this.state = void 0;
        this.element.removeEventListener("contextmenu", this.contextMenuListener);
        resolve2();
      });
    });
  }
  enableMoveInput(eventHandler, color = void 0) {
    this.view.enableMoveInput(eventHandler, color);
  }
  disableMoveInput() {
    this.view.disableMoveInput();
  }
  enableContextInput(eventHandler) {
    console.warn("enableContextInput is deprecated, use enableSquareSelect");
    this.enableSquareSelect(function(event) {
      if (event.type === SQUARE_SELECT_TYPE.secondary) {
        eventHandler(event);
      }
    });
  }
  disableContextInput() {
    this.disableSquareSelect();
  }
  enableSquareSelect(eventHandler) {
    if (this.squareSelectListener) {
      console.warn("squareSelectListener already existing");
      return;
    }
    this.squareSelectListener = function(e) {
      const index2 = e.target.getAttribute("data-index");
      if (e.type === "contextmenu") {
        e.preventDefault();
        return;
      }
      eventHandler({
        chessboard: this,
        type: e.button === 2 ? SQUARE_SELECT_TYPE.secondary : SQUARE_SELECT_TYPE.primary,
        square: SQUARE_COORDINATES[index2]
      });
    };
    this.element.addEventListener("contextmenu", this.squareSelectListener);
    this.element.addEventListener("mouseup", this.squareSelectListener);
    this.element.addEventListener("touchend", this.squareSelectListener);
  }
  disableSquareSelect() {
    this.element.removeEventListener("contextmenu", this.squareSelectListener);
    this.element.removeEventListener("mouseup", this.squareSelectListener);
    this.element.removeEventListener("touchend", this.squareSelectListener);
    this.squareSelectListener = void 0;
  }
}
function createCommonjsModule(fn) {
  var module = {exports: {}};
  return fn(module, module.exports), module.exports;
}
var chess = createCommonjsModule(function(module, exports) {
  var Chess = function(fen2) {
    var BLACK = "b";
    var WHITE = "w";
    var EMPTY = -1;
    var PAWN = "p";
    var KNIGHT = "n";
    var BISHOP = "b";
    var ROOK = "r";
    var QUEEN = "q";
    var KING = "k";
    var SYMBOLS = "pnbrqkPNBRQK";
    var DEFAULT_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    var POSSIBLE_RESULTS = ["1-0", "0-1", "1/2-1/2", "*"];
    var PAWN_OFFSETS = {
      b: [16, 32, 17, 15],
      w: [-16, -32, -17, -15]
    };
    var PIECE_OFFSETS = {
      n: [-18, -33, -31, -14, 18, 33, 31, 14],
      b: [-17, -15, 17, 15],
      r: [-16, 1, 16, -1],
      q: [-17, -16, -15, 1, 17, 16, 15, -1],
      k: [-17, -16, -15, 1, 17, 16, 15, -1]
    };
    var ATTACKS = [
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      24,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      2,
      24,
      2,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      53,
      56,
      53,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      24,
      24,
      24,
      24,
      24,
      56,
      0,
      56,
      24,
      24,
      24,
      24,
      24,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      53,
      56,
      53,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      2,
      24,
      2,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      24,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      20
    ];
    var RAYS = [
      17,
      0,
      0,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      17,
      0,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      16,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      16,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      16,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      -16,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      -16,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      -16,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      0,
      -17,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      0,
      0,
      -17
    ];
    var SHIFTS = {p: 0, n: 1, b: 2, r: 3, q: 4, k: 5};
    var FLAGS = {
      NORMAL: "n",
      CAPTURE: "c",
      BIG_PAWN: "b",
      EP_CAPTURE: "e",
      PROMOTION: "p",
      KSIDE_CASTLE: "k",
      QSIDE_CASTLE: "q"
    };
    var BITS = {
      NORMAL: 1,
      CAPTURE: 2,
      BIG_PAWN: 4,
      EP_CAPTURE: 8,
      PROMOTION: 16,
      KSIDE_CASTLE: 32,
      QSIDE_CASTLE: 64
    };
    var RANK_1 = 7;
    var RANK_2 = 6;
    var RANK_7 = 1;
    var RANK_8 = 0;
    var SQUARES = {
      a8: 0,
      b8: 1,
      c8: 2,
      d8: 3,
      e8: 4,
      f8: 5,
      g8: 6,
      h8: 7,
      a7: 16,
      b7: 17,
      c7: 18,
      d7: 19,
      e7: 20,
      f7: 21,
      g7: 22,
      h7: 23,
      a6: 32,
      b6: 33,
      c6: 34,
      d6: 35,
      e6: 36,
      f6: 37,
      g6: 38,
      h6: 39,
      a5: 48,
      b5: 49,
      c5: 50,
      d5: 51,
      e5: 52,
      f5: 53,
      g5: 54,
      h5: 55,
      a4: 64,
      b4: 65,
      c4: 66,
      d4: 67,
      e4: 68,
      f4: 69,
      g4: 70,
      h4: 71,
      a3: 80,
      b3: 81,
      c3: 82,
      d3: 83,
      e3: 84,
      f3: 85,
      g3: 86,
      h3: 87,
      a2: 96,
      b2: 97,
      c2: 98,
      d2: 99,
      e2: 100,
      f2: 101,
      g2: 102,
      h2: 103,
      a1: 112,
      b1: 113,
      c1: 114,
      d1: 115,
      e1: 116,
      f1: 117,
      g1: 118,
      h1: 119
    };
    var ROOKS = {
      w: [
        {square: SQUARES.a1, flag: BITS.QSIDE_CASTLE},
        {square: SQUARES.h1, flag: BITS.KSIDE_CASTLE}
      ],
      b: [
        {square: SQUARES.a8, flag: BITS.QSIDE_CASTLE},
        {square: SQUARES.h8, flag: BITS.KSIDE_CASTLE}
      ]
    };
    var board = new Array(128);
    var kings = {w: EMPTY, b: EMPTY};
    var turn = WHITE;
    var castling = {w: 0, b: 0};
    var ep_square = EMPTY;
    var half_moves = 0;
    var move_number = 1;
    var history = [];
    var header = {};
    var comments = {};
    if (typeof fen2 === "undefined") {
      load(DEFAULT_POSITION);
    } else {
      load(fen2);
    }
    function clear(keep_headers) {
      if (typeof keep_headers === "undefined") {
        keep_headers = false;
      }
      board = new Array(128);
      kings = {w: EMPTY, b: EMPTY};
      turn = WHITE;
      castling = {w: 0, b: 0};
      ep_square = EMPTY;
      half_moves = 0;
      move_number = 1;
      history = [];
      if (!keep_headers)
        header = {};
      comments = {};
      update_setup(generate_fen());
    }
    function prune_comments() {
      var reversed_history = [];
      var current_comments = {};
      var copy_comment = function(fen3) {
        if (fen3 in comments) {
          current_comments[fen3] = comments[fen3];
        }
      };
      while (history.length > 0) {
        reversed_history.push(undo_move());
      }
      copy_comment(generate_fen());
      while (reversed_history.length > 0) {
        make_move(reversed_history.pop());
        copy_comment(generate_fen());
      }
      comments = current_comments;
    }
    function reset() {
      load(DEFAULT_POSITION);
    }
    function load(fen3, keep_headers) {
      if (typeof keep_headers === "undefined") {
        keep_headers = false;
      }
      var tokens = fen3.split(/\s+/);
      var position = tokens[0];
      var square = 0;
      if (!validate_fen(fen3).valid) {
        return false;
      }
      clear(keep_headers);
      for (var i = 0; i < position.length; i++) {
        var piece = position.charAt(i);
        if (piece === "/") {
          square += 8;
        } else if (is_digit(piece)) {
          square += parseInt(piece, 10);
        } else {
          var color = piece < "a" ? WHITE : BLACK;
          put({type: piece.toLowerCase(), color}, algebraic(square));
          square++;
        }
      }
      turn = tokens[1];
      if (tokens[2].indexOf("K") > -1) {
        castling.w |= BITS.KSIDE_CASTLE;
      }
      if (tokens[2].indexOf("Q") > -1) {
        castling.w |= BITS.QSIDE_CASTLE;
      }
      if (tokens[2].indexOf("k") > -1) {
        castling.b |= BITS.KSIDE_CASTLE;
      }
      if (tokens[2].indexOf("q") > -1) {
        castling.b |= BITS.QSIDE_CASTLE;
      }
      ep_square = tokens[3] === "-" ? EMPTY : SQUARES[tokens[3]];
      half_moves = parseInt(tokens[4], 10);
      move_number = parseInt(tokens[5], 10);
      update_setup(generate_fen());
      return true;
    }
    function validate_fen(fen3) {
      var errors = {
        0: "No errors.",
        1: "FEN string must contain six space-delimited fields.",
        2: "6th field (move number) must be a positive integer.",
        3: "5th field (half move counter) must be a non-negative integer.",
        4: "4th field (en-passant square) is invalid.",
        5: "3rd field (castling availability) is invalid.",
        6: "2nd field (side to move) is invalid.",
        7: "1st field (piece positions) does not contain 8 '/'-delimited rows.",
        8: "1st field (piece positions) is invalid [consecutive numbers].",
        9: "1st field (piece positions) is invalid [invalid piece].",
        10: "1st field (piece positions) is invalid [row too large].",
        11: "Illegal en-passant square"
      };
      var tokens = fen3.split(/\s+/);
      if (tokens.length !== 6) {
        return {valid: false, error_number: 1, error: errors[1]};
      }
      if (isNaN(tokens[5]) || parseInt(tokens[5], 10) <= 0) {
        return {valid: false, error_number: 2, error: errors[2]};
      }
      if (isNaN(tokens[4]) || parseInt(tokens[4], 10) < 0) {
        return {valid: false, error_number: 3, error: errors[3]};
      }
      if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) {
        return {valid: false, error_number: 4, error: errors[4]};
      }
      if (!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(tokens[2])) {
        return {valid: false, error_number: 5, error: errors[5]};
      }
      if (!/^(w|b)$/.test(tokens[1])) {
        return {valid: false, error_number: 6, error: errors[6]};
      }
      var rows = tokens[0].split("/");
      if (rows.length !== 8) {
        return {valid: false, error_number: 7, error: errors[7]};
      }
      for (var i = 0; i < rows.length; i++) {
        var sum_fields = 0;
        var previous_was_number = false;
        for (var k = 0; k < rows[i].length; k++) {
          if (!isNaN(rows[i][k])) {
            if (previous_was_number) {
              return {valid: false, error_number: 8, error: errors[8]};
            }
            sum_fields += parseInt(rows[i][k], 10);
            previous_was_number = true;
          } else {
            if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) {
              return {valid: false, error_number: 9, error: errors[9]};
            }
            sum_fields += 1;
            previous_was_number = false;
          }
        }
        if (sum_fields !== 8) {
          return {valid: false, error_number: 10, error: errors[10]};
        }
      }
      if (tokens[3][1] == "3" && tokens[1] == "w" || tokens[3][1] == "6" && tokens[1] == "b") {
        return {valid: false, error_number: 11, error: errors[11]};
      }
      return {valid: true, error_number: 0, error: errors[0]};
    }
    function generate_fen() {
      var empty2 = 0;
      var fen3 = "";
      for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
        if (board[i] == null) {
          empty2++;
        } else {
          if (empty2 > 0) {
            fen3 += empty2;
            empty2 = 0;
          }
          var color = board[i].color;
          var piece = board[i].type;
          fen3 += color === WHITE ? piece.toUpperCase() : piece.toLowerCase();
        }
        if (i + 1 & 136) {
          if (empty2 > 0) {
            fen3 += empty2;
          }
          if (i !== SQUARES.h1) {
            fen3 += "/";
          }
          empty2 = 0;
          i += 8;
        }
      }
      var cflags = "";
      if (castling[WHITE] & BITS.KSIDE_CASTLE) {
        cflags += "K";
      }
      if (castling[WHITE] & BITS.QSIDE_CASTLE) {
        cflags += "Q";
      }
      if (castling[BLACK] & BITS.KSIDE_CASTLE) {
        cflags += "k";
      }
      if (castling[BLACK] & BITS.QSIDE_CASTLE) {
        cflags += "q";
      }
      cflags = cflags || "-";
      var epflags = ep_square === EMPTY ? "-" : algebraic(ep_square);
      return [fen3, turn, cflags, epflags, half_moves, move_number].join(" ");
    }
    function set_header(args) {
      for (var i = 0; i < args.length; i += 2) {
        if (typeof args[i] === "string" && typeof args[i + 1] === "string") {
          header[args[i]] = args[i + 1];
        }
      }
      return header;
    }
    function update_setup(fen3) {
      if (history.length > 0)
        return;
      if (fen3 !== DEFAULT_POSITION) {
        header["SetUp"] = "1";
        header["FEN"] = fen3;
      } else {
        delete header["SetUp"];
        delete header["FEN"];
      }
    }
    function get(square) {
      var piece = board[SQUARES[square]];
      return piece ? {type: piece.type, color: piece.color} : null;
    }
    function put(piece, square) {
      if (!("type" in piece && "color" in piece)) {
        return false;
      }
      if (SYMBOLS.indexOf(piece.type.toLowerCase()) === -1) {
        return false;
      }
      if (!(square in SQUARES)) {
        return false;
      }
      var sq = SQUARES[square];
      if (piece.type == KING && !(kings[piece.color] == EMPTY || kings[piece.color] == sq)) {
        return false;
      }
      board[sq] = {type: piece.type, color: piece.color};
      if (piece.type === KING) {
        kings[piece.color] = sq;
      }
      update_setup(generate_fen());
      return true;
    }
    function remove(square) {
      var piece = get(square);
      board[SQUARES[square]] = null;
      if (piece && piece.type === KING) {
        kings[piece.color] = EMPTY;
      }
      update_setup(generate_fen());
      return piece;
    }
    function build_move(board2, from, to, flags, promotion) {
      var move = {
        color: turn,
        from,
        to,
        flags,
        piece: board2[from].type
      };
      if (promotion) {
        move.flags |= BITS.PROMOTION;
        move.promotion = promotion;
      }
      if (board2[to]) {
        move.captured = board2[to].type;
      } else if (flags & BITS.EP_CAPTURE) {
        move.captured = PAWN;
      }
      return move;
    }
    function generate_moves(options) {
      function add_move(board2, moves2, from, to, flags) {
        if (board2[from].type === PAWN && (rank(to) === RANK_8 || rank(to) === RANK_1)) {
          var pieces = [QUEEN, ROOK, BISHOP, KNIGHT];
          for (var i2 = 0, len2 = pieces.length; i2 < len2; i2++) {
            moves2.push(build_move(board2, from, to, flags, pieces[i2]));
          }
        } else {
          moves2.push(build_move(board2, from, to, flags));
        }
      }
      var moves = [];
      var us = turn;
      var them = swap_color(us);
      var second_rank = {b: RANK_7, w: RANK_2};
      var first_sq = SQUARES.a8;
      var last_sq = SQUARES.h1;
      var single_square = false;
      var legal = typeof options !== "undefined" && "legal" in options ? options.legal : true;
      if (typeof options !== "undefined" && "square" in options) {
        if (options.square in SQUARES) {
          first_sq = last_sq = SQUARES[options.square];
          single_square = true;
        } else {
          return [];
        }
      }
      for (var i = first_sq; i <= last_sq; i++) {
        if (i & 136) {
          i += 7;
          continue;
        }
        var piece = board[i];
        if (piece == null || piece.color !== us) {
          continue;
        }
        if (piece.type === PAWN) {
          var square = i + PAWN_OFFSETS[us][0];
          if (board[square] == null) {
            add_move(board, moves, i, square, BITS.NORMAL);
            var square = i + PAWN_OFFSETS[us][1];
            if (second_rank[us] === rank(i) && board[square] == null) {
              add_move(board, moves, i, square, BITS.BIG_PAWN);
            }
          }
          for (j = 2; j < 4; j++) {
            var square = i + PAWN_OFFSETS[us][j];
            if (square & 136)
              continue;
            if (board[square] != null && board[square].color === them) {
              add_move(board, moves, i, square, BITS.CAPTURE);
            } else if (square === ep_square) {
              add_move(board, moves, i, ep_square, BITS.EP_CAPTURE);
            }
          }
        } else {
          for (var j = 0, len = PIECE_OFFSETS[piece.type].length; j < len; j++) {
            var offset = PIECE_OFFSETS[piece.type][j];
            var square = i;
            while (true) {
              square += offset;
              if (square & 136)
                break;
              if (board[square] == null) {
                add_move(board, moves, i, square, BITS.NORMAL);
              } else {
                if (board[square].color === us)
                  break;
                add_move(board, moves, i, square, BITS.CAPTURE);
                break;
              }
              if (piece.type === "n" || piece.type === "k")
                break;
            }
          }
        }
      }
      if (!single_square || last_sq === kings[us]) {
        if (castling[us] & BITS.KSIDE_CASTLE) {
          var castling_from = kings[us];
          var castling_to = castling_from + 2;
          if (board[castling_from + 1] == null && board[castling_to] == null && !attacked(them, kings[us]) && !attacked(them, castling_from + 1) && !attacked(them, castling_to)) {
            add_move(board, moves, kings[us], castling_to, BITS.KSIDE_CASTLE);
          }
        }
        if (castling[us] & BITS.QSIDE_CASTLE) {
          var castling_from = kings[us];
          var castling_to = castling_from - 2;
          if (board[castling_from - 1] == null && board[castling_from - 2] == null && board[castling_from - 3] == null && !attacked(them, kings[us]) && !attacked(them, castling_from - 1) && !attacked(them, castling_to)) {
            add_move(board, moves, kings[us], castling_to, BITS.QSIDE_CASTLE);
          }
        }
      }
      if (!legal) {
        return moves;
      }
      var legal_moves = [];
      for (var i = 0, len = moves.length; i < len; i++) {
        make_move(moves[i]);
        if (!king_attacked(us)) {
          legal_moves.push(moves[i]);
        }
        undo_move();
      }
      return legal_moves;
    }
    function move_to_san(move, sloppy) {
      var output = "";
      if (move.flags & BITS.KSIDE_CASTLE) {
        output = "O-O";
      } else if (move.flags & BITS.QSIDE_CASTLE) {
        output = "O-O-O";
      } else {
        var disambiguator = get_disambiguator(move, sloppy);
        if (move.piece !== PAWN) {
          output += move.piece.toUpperCase() + disambiguator;
        }
        if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
          if (move.piece === PAWN) {
            output += algebraic(move.from)[0];
          }
          output += "x";
        }
        output += algebraic(move.to);
        if (move.flags & BITS.PROMOTION) {
          output += "=" + move.promotion.toUpperCase();
        }
      }
      make_move(move);
      if (in_check()) {
        if (in_checkmate()) {
          output += "#";
        } else {
          output += "+";
        }
      }
      undo_move();
      return output;
    }
    function stripped_san(move) {
      return move.replace(/=/, "").replace(/[+#]?[?!]*$/, "");
    }
    function attacked(color, square) {
      for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
        if (i & 136) {
          i += 7;
          continue;
        }
        if (board[i] == null || board[i].color !== color)
          continue;
        var piece = board[i];
        var difference = i - square;
        var index2 = difference + 119;
        if (ATTACKS[index2] & 1 << SHIFTS[piece.type]) {
          if (piece.type === PAWN) {
            if (difference > 0) {
              if (piece.color === WHITE)
                return true;
            } else {
              if (piece.color === BLACK)
                return true;
            }
            continue;
          }
          if (piece.type === "n" || piece.type === "k")
            return true;
          var offset = RAYS[index2];
          var j = i + offset;
          var blocked = false;
          while (j !== square) {
            if (board[j] != null) {
              blocked = true;
              break;
            }
            j += offset;
          }
          if (!blocked)
            return true;
        }
      }
      return false;
    }
    function king_attacked(color) {
      return attacked(swap_color(color), kings[color]);
    }
    function in_check() {
      return king_attacked(turn);
    }
    function in_checkmate() {
      return in_check() && generate_moves().length === 0;
    }
    function in_stalemate() {
      return !in_check() && generate_moves().length === 0;
    }
    function insufficient_material() {
      var pieces = {};
      var bishops = [];
      var num_pieces = 0;
      var sq_color = 0;
      for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
        sq_color = (sq_color + 1) % 2;
        if (i & 136) {
          i += 7;
          continue;
        }
        var piece = board[i];
        if (piece) {
          pieces[piece.type] = piece.type in pieces ? pieces[piece.type] + 1 : 1;
          if (piece.type === BISHOP) {
            bishops.push(sq_color);
          }
          num_pieces++;
        }
      }
      if (num_pieces === 2) {
        return true;
      } else if (num_pieces === 3 && (pieces[BISHOP] === 1 || pieces[KNIGHT] === 1)) {
        return true;
      } else if (num_pieces === pieces[BISHOP] + 2) {
        var sum = 0;
        var len = bishops.length;
        for (var i = 0; i < len; i++) {
          sum += bishops[i];
        }
        if (sum === 0 || sum === len) {
          return true;
        }
      }
      return false;
    }
    function in_threefold_repetition() {
      var moves = [];
      var positions = {};
      var repetition = false;
      while (true) {
        var move = undo_move();
        if (!move)
          break;
        moves.push(move);
      }
      while (true) {
        var fen3 = generate_fen().split(" ").slice(0, 4).join(" ");
        positions[fen3] = fen3 in positions ? positions[fen3] + 1 : 1;
        if (positions[fen3] >= 3) {
          repetition = true;
        }
        if (!moves.length) {
          break;
        }
        make_move(moves.pop());
      }
      return repetition;
    }
    function push(move) {
      history.push({
        move,
        kings: {b: kings.b, w: kings.w},
        turn,
        castling: {b: castling.b, w: castling.w},
        ep_square,
        half_moves,
        move_number
      });
    }
    function make_move(move) {
      var us = turn;
      var them = swap_color(us);
      push(move);
      board[move.to] = board[move.from];
      board[move.from] = null;
      if (move.flags & BITS.EP_CAPTURE) {
        if (turn === BLACK) {
          board[move.to - 16] = null;
        } else {
          board[move.to + 16] = null;
        }
      }
      if (move.flags & BITS.PROMOTION) {
        board[move.to] = {type: move.promotion, color: us};
      }
      if (board[move.to].type === KING) {
        kings[board[move.to].color] = move.to;
        if (move.flags & BITS.KSIDE_CASTLE) {
          var castling_to = move.to - 1;
          var castling_from = move.to + 1;
          board[castling_to] = board[castling_from];
          board[castling_from] = null;
        } else if (move.flags & BITS.QSIDE_CASTLE) {
          var castling_to = move.to + 1;
          var castling_from = move.to - 2;
          board[castling_to] = board[castling_from];
          board[castling_from] = null;
        }
        castling[us] = "";
      }
      if (castling[us]) {
        for (var i = 0, len = ROOKS[us].length; i < len; i++) {
          if (move.from === ROOKS[us][i].square && castling[us] & ROOKS[us][i].flag) {
            castling[us] ^= ROOKS[us][i].flag;
            break;
          }
        }
      }
      if (castling[them]) {
        for (var i = 0, len = ROOKS[them].length; i < len; i++) {
          if (move.to === ROOKS[them][i].square && castling[them] & ROOKS[them][i].flag) {
            castling[them] ^= ROOKS[them][i].flag;
            break;
          }
        }
      }
      if (move.flags & BITS.BIG_PAWN) {
        if (turn === "b") {
          ep_square = move.to - 16;
        } else {
          ep_square = move.to + 16;
        }
      } else {
        ep_square = EMPTY;
      }
      if (move.piece === PAWN) {
        half_moves = 0;
      } else if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
        half_moves = 0;
      } else {
        half_moves++;
      }
      if (turn === BLACK) {
        move_number++;
      }
      turn = swap_color(turn);
    }
    function undo_move() {
      var old = history.pop();
      if (old == null) {
        return null;
      }
      var move = old.move;
      kings = old.kings;
      turn = old.turn;
      castling = old.castling;
      ep_square = old.ep_square;
      half_moves = old.half_moves;
      move_number = old.move_number;
      var us = turn;
      var them = swap_color(turn);
      board[move.from] = board[move.to];
      board[move.from].type = move.piece;
      board[move.to] = null;
      if (move.flags & BITS.CAPTURE) {
        board[move.to] = {type: move.captured, color: them};
      } else if (move.flags & BITS.EP_CAPTURE) {
        var index2;
        if (us === BLACK) {
          index2 = move.to - 16;
        } else {
          index2 = move.to + 16;
        }
        board[index2] = {type: PAWN, color: them};
      }
      if (move.flags & (BITS.KSIDE_CASTLE | BITS.QSIDE_CASTLE)) {
        var castling_to, castling_from;
        if (move.flags & BITS.KSIDE_CASTLE) {
          castling_to = move.to + 1;
          castling_from = move.to - 1;
        } else if (move.flags & BITS.QSIDE_CASTLE) {
          castling_to = move.to - 2;
          castling_from = move.to + 1;
        }
        board[castling_to] = board[castling_from];
        board[castling_from] = null;
      }
      return move;
    }
    function get_disambiguator(move, sloppy) {
      var moves = generate_moves({legal: !sloppy});
      var from = move.from;
      var to = move.to;
      var piece = move.piece;
      var ambiguities = 0;
      var same_rank = 0;
      var same_file = 0;
      for (var i = 0, len = moves.length; i < len; i++) {
        var ambig_from = moves[i].from;
        var ambig_to = moves[i].to;
        var ambig_piece = moves[i].piece;
        if (piece === ambig_piece && from !== ambig_from && to === ambig_to) {
          ambiguities++;
          if (rank(from) === rank(ambig_from)) {
            same_rank++;
          }
          if (file(from) === file(ambig_from)) {
            same_file++;
          }
        }
      }
      if (ambiguities > 0) {
        if (same_rank > 0 && same_file > 0) {
          return algebraic(from);
        } else if (same_file > 0) {
          return algebraic(from).charAt(1);
        } else {
          return algebraic(from).charAt(0);
        }
      }
      return "";
    }
    function ascii() {
      var s2 = "   +------------------------+\n";
      for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
        if (file(i) === 0) {
          s2 += " " + "87654321"[rank(i)] + " |";
        }
        if (board[i] == null) {
          s2 += " . ";
        } else {
          var piece = board[i].type;
          var color = board[i].color;
          var symbol = color === WHITE ? piece.toUpperCase() : piece.toLowerCase();
          s2 += " " + symbol + " ";
        }
        if (i + 1 & 136) {
          s2 += "|\n";
          i += 8;
        }
      }
      s2 += "   +------------------------+\n";
      s2 += "     a  b  c  d  e  f  g  h\n";
      return s2;
    }
    function move_from_san(move, sloppy) {
      var clean_move = stripped_san(move);
      if (sloppy) {
        var matches = clean_move.match(/([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/);
        if (matches) {
          var piece = matches[1];
          var from = matches[2];
          var to = matches[3];
          var promotion = matches[4];
        }
      }
      var moves = generate_moves();
      for (var i = 0, len = moves.length; i < len; i++) {
        if (clean_move === stripped_san(move_to_san(moves[i])) || sloppy && clean_move === stripped_san(move_to_san(moves[i], true))) {
          return moves[i];
        } else {
          if (matches && (!piece || piece.toLowerCase() == moves[i].piece) && SQUARES[from] == moves[i].from && SQUARES[to] == moves[i].to && (!promotion || promotion.toLowerCase() == moves[i].promotion)) {
            return moves[i];
          }
        }
      }
      return null;
    }
    function rank(i) {
      return i >> 4;
    }
    function file(i) {
      return i & 15;
    }
    function algebraic(i) {
      var f = file(i), r = rank(i);
      return "abcdefgh".substring(f, f + 1) + "87654321".substring(r, r + 1);
    }
    function swap_color(c) {
      return c === WHITE ? BLACK : WHITE;
    }
    function is_digit(c) {
      return "0123456789".indexOf(c) !== -1;
    }
    function make_pretty(ugly_move) {
      var move = clone2(ugly_move);
      move.san = move_to_san(move, false);
      move.to = algebraic(move.to);
      move.from = algebraic(move.from);
      var flags = "";
      for (var flag in BITS) {
        if (BITS[flag] & move.flags) {
          flags += FLAGS[flag];
        }
      }
      move.flags = flags;
      return move;
    }
    function clone2(obj) {
      var dupe = obj instanceof Array ? [] : {};
      for (var property in obj) {
        if (typeof property === "object") {
          dupe[property] = clone2(obj[property]);
        } else {
          dupe[property] = obj[property];
        }
      }
      return dupe;
    }
    function trim(str) {
      return str.replace(/^\s+|\s+$/g, "");
    }
    function perft(depth) {
      var moves = generate_moves({legal: false});
      var nodes = 0;
      var color = turn;
      for (var i = 0, len = moves.length; i < len; i++) {
        make_move(moves[i]);
        if (!king_attacked(color)) {
          if (depth - 1 > 0) {
            var child_nodes = perft(depth - 1);
            nodes += child_nodes;
          } else {
            nodes++;
          }
        }
        undo_move();
      }
      return nodes;
    }
    return {
      WHITE,
      BLACK,
      PAWN,
      KNIGHT,
      BISHOP,
      ROOK,
      QUEEN,
      KING,
      SQUARES: function() {
        var keys = [];
        for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
          if (i & 136) {
            i += 7;
            continue;
          }
          keys.push(algebraic(i));
        }
        return keys;
      }(),
      FLAGS,
      load: function(fen3) {
        return load(fen3);
      },
      reset: function() {
        return reset();
      },
      moves: function(options) {
        var ugly_moves = generate_moves(options);
        var moves = [];
        for (var i = 0, len = ugly_moves.length; i < len; i++) {
          if (typeof options !== "undefined" && "verbose" in options && options.verbose) {
            moves.push(make_pretty(ugly_moves[i]));
          } else {
            moves.push(move_to_san(ugly_moves[i], false));
          }
        }
        return moves;
      },
      in_check: function() {
        return in_check();
      },
      in_checkmate: function() {
        return in_checkmate();
      },
      in_stalemate: function() {
        return in_stalemate();
      },
      in_draw: function() {
        return half_moves >= 100 || in_stalemate() || insufficient_material() || in_threefold_repetition();
      },
      insufficient_material: function() {
        return insufficient_material();
      },
      in_threefold_repetition: function() {
        return in_threefold_repetition();
      },
      game_over: function() {
        return half_moves >= 100 || in_checkmate() || in_stalemate() || insufficient_material() || in_threefold_repetition();
      },
      validate_fen: function(fen3) {
        return validate_fen(fen3);
      },
      fen: function() {
        return generate_fen();
      },
      board: function() {
        var output = [], row = [];
        for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
          if (board[i] == null) {
            row.push(null);
          } else {
            row.push({type: board[i].type, color: board[i].color});
          }
          if (i + 1 & 136) {
            output.push(row);
            row = [];
            i += 8;
          }
        }
        return output;
      },
      pgn: function(options) {
        var newline = typeof options === "object" && typeof options.newline_char === "string" ? options.newline_char : "\n";
        var max_width = typeof options === "object" && typeof options.max_width === "number" ? options.max_width : 0;
        var result = [];
        var header_exists = false;
        for (var i in header) {
          result.push("[" + i + ' "' + header[i] + '"]' + newline);
          header_exists = true;
        }
        if (header_exists && history.length) {
          result.push(newline);
        }
        var append_comment = function(move_string2) {
          var comment = comments[generate_fen()];
          if (typeof comment !== "undefined") {
            var delimiter = move_string2.length > 0 ? " " : "";
            move_string2 = `${move_string2}${delimiter}{${comment}}`;
          }
          return move_string2;
        };
        var reversed_history = [];
        while (history.length > 0) {
          reversed_history.push(undo_move());
        }
        var moves = [];
        var move_string = "";
        if (reversed_history.length === 0) {
          moves.push(append_comment(""));
        }
        while (reversed_history.length > 0) {
          move_string = append_comment(move_string);
          var move = reversed_history.pop();
          if (!history.length && move.color === "b") {
            move_string = move_number + ". ...";
          } else if (move.color === "w") {
            if (move_string.length) {
              moves.push(move_string);
            }
            move_string = move_number + ".";
          }
          move_string = move_string + " " + move_to_san(move, false);
          make_move(move);
        }
        if (move_string.length) {
          moves.push(append_comment(move_string));
        }
        if (typeof header.Result !== "undefined") {
          moves.push(header.Result);
        }
        if (max_width === 0) {
          return result.join("") + moves.join(" ");
        }
        var strip = function() {
          if (result.length > 0 && result[result.length - 1] === " ") {
            result.pop();
            return true;
          }
          return false;
        };
        var wrap_comment = function(width, move2) {
          for (var token of move2.split(" ")) {
            if (!token) {
              continue;
            }
            if (width + token.length > max_width) {
              while (strip()) {
                width--;
              }
              result.push(newline);
              width = 0;
            }
            result.push(token);
            width += token.length;
            result.push(" ");
            width++;
          }
          if (strip()) {
            width--;
          }
          return width;
        };
        var current_width = 0;
        for (var i = 0; i < moves.length; i++) {
          if (current_width + moves[i].length > max_width) {
            if (moves[i].includes("{")) {
              current_width = wrap_comment(current_width, moves[i]);
              continue;
            }
          }
          if (current_width + moves[i].length > max_width && i !== 0) {
            if (result[result.length - 1] === " ") {
              result.pop();
            }
            result.push(newline);
            current_width = 0;
          } else if (i !== 0) {
            result.push(" ");
            current_width++;
          }
          result.push(moves[i]);
          current_width += moves[i].length;
        }
        return result.join("");
      },
      load_pgn: function(pgn, options) {
        var sloppy = typeof options !== "undefined" && "sloppy" in options ? options.sloppy : false;
        function mask(str) {
          return str.replace(/\\/g, "\\");
        }
        function has_keys(object) {
          for (var key2 in object) {
            return true;
          }
          return false;
        }
        function parse_pgn_header(header2, options2) {
          var newline_char2 = typeof options2 === "object" && typeof options2.newline_char === "string" ? options2.newline_char : "\r?\n";
          var header_obj = {};
          var headers2 = header2.split(new RegExp(mask(newline_char2)));
          var key2 = "";
          var value = "";
          for (var i = 0; i < headers2.length; i++) {
            key2 = headers2[i].replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, "$1");
            value = headers2[i].replace(/^\[[A-Za-z]+\s"(.*)"\ *\]$/, "$1");
            if (trim(key2).length > 0) {
              header_obj[key2] = value;
            }
          }
          return header_obj;
        }
        var newline_char = typeof options === "object" && typeof options.newline_char === "string" ? options.newline_char : "\r?\n";
        var header_regex = new RegExp("^(\\[((?:" + mask(newline_char) + ")|.)*\\])(?:" + mask(newline_char) + "){2}");
        var header_string = header_regex.test(pgn) ? header_regex.exec(pgn)[1] : "";
        reset();
        var headers = parse_pgn_header(header_string, options);
        for (var key in headers) {
          set_header([key, headers[key]]);
        }
        if (headers["SetUp"] === "1") {
          if (!("FEN" in headers && load(headers["FEN"], true))) {
            return false;
          }
        }
        var to_hex = function(string) {
          return Array.from(string).map(function(c) {
            return c.charCodeAt(0) < 128 ? c.charCodeAt(0).toString(16) : encodeURIComponent(c).replace(/\%/g, "").toLowerCase();
          }).join("");
        };
        var from_hex = function(string) {
          return string.length == 0 ? "" : decodeURIComponent("%" + string.match(/.{1,2}/g).join("%"));
        };
        var encode_comment = function(string) {
          string = string.replace(new RegExp(mask(newline_char), "g"), " ");
          return `{${to_hex(string.slice(1, string.length - 1))}}`;
        };
        var decode_comment = function(string) {
          if (string.startsWith("{") && string.endsWith("}")) {
            return from_hex(string.slice(1, string.length - 1));
          }
        };
        var ms = pgn.replace(header_string, "").replace(new RegExp(`({[^}]*})+?|;([^${mask(newline_char)}]*)`, "g"), function(match, bracket, semicolon) {
          return bracket !== void 0 ? encode_comment(bracket) : " " + encode_comment(`{${semicolon.slice(1)}}`);
        }).replace(new RegExp(mask(newline_char), "g"), " ");
        var rav_regex = /(\([^\(\)]+\))+?/g;
        while (rav_regex.test(ms)) {
          ms = ms.replace(rav_regex, "");
        }
        ms = ms.replace(/\d+\.(\.\.)?/g, "");
        ms = ms.replace(/\.\.\./g, "");
        ms = ms.replace(/\$\d+/g, "");
        var moves = trim(ms).split(new RegExp(/\s+/));
        moves = moves.join(",").replace(/,,+/g, ",").split(",");
        var move = "";
        for (var half_move = 0; half_move < moves.length - 1; half_move++) {
          var comment = decode_comment(moves[half_move]);
          if (comment !== void 0) {
            comments[generate_fen()] = comment;
            continue;
          }
          move = move_from_san(moves[half_move], sloppy);
          if (move == null) {
            return false;
          } else {
            make_move(move);
          }
        }
        comment = decode_comment(moves[moves.length - 1]);
        if (comment !== void 0) {
          comments[generate_fen()] = comment;
          moves.pop();
        }
        move = moves[moves.length - 1];
        if (POSSIBLE_RESULTS.indexOf(move) > -1) {
          if (has_keys(header) && typeof header.Result === "undefined") {
            set_header(["Result", move]);
          }
        } else {
          move = move_from_san(move, sloppy);
          if (move == null) {
            return false;
          } else {
            make_move(move);
          }
        }
        return true;
      },
      header: function() {
        return set_header(arguments);
      },
      ascii: function() {
        return ascii();
      },
      turn: function() {
        return turn;
      },
      move: function(move, options) {
        var sloppy = typeof options !== "undefined" && "sloppy" in options ? options.sloppy : false;
        var move_obj = null;
        if (typeof move === "string") {
          move_obj = move_from_san(move, sloppy);
        } else if (typeof move === "object") {
          var moves = generate_moves();
          for (var i = 0, len = moves.length; i < len; i++) {
            if (move.from === algebraic(moves[i].from) && move.to === algebraic(moves[i].to) && (!("promotion" in moves[i]) || move.promotion === moves[i].promotion)) {
              move_obj = moves[i];
              break;
            }
          }
        }
        if (!move_obj) {
          return null;
        }
        var pretty_move = make_pretty(move_obj);
        make_move(move_obj);
        return pretty_move;
      },
      undo: function() {
        var move = undo_move();
        return move ? make_pretty(move) : null;
      },
      clear: function() {
        return clear();
      },
      put: function(piece, square) {
        return put(piece, square);
      },
      get: function(square) {
        return get(square);
      },
      remove: function(square) {
        return remove(square);
      },
      perft: function(depth) {
        return perft(depth);
      },
      square_color: function(square) {
        if (square in SQUARES) {
          var sq_0x88 = SQUARES[square];
          return (rank(sq_0x88) + file(sq_0x88)) % 2 === 0 ? "light" : "dark";
        }
        return null;
      },
      history: function(options) {
        var reversed_history = [];
        var move_history = [];
        var verbose = typeof options !== "undefined" && "verbose" in options && options.verbose;
        while (history.length > 0) {
          reversed_history.push(undo_move());
        }
        while (reversed_history.length > 0) {
          var move = reversed_history.pop();
          if (verbose) {
            move_history.push(make_pretty(move));
          } else {
            move_history.push(move_to_san(move));
          }
          make_move(move);
        }
        return move_history;
      },
      get_comment: function() {
        return comments[generate_fen()];
      },
      set_comment: function(comment) {
        comments[generate_fen()] = comment.replace("{", "[").replace("}", "]");
      },
      delete_comment: function() {
        var comment = comments[generate_fen()];
        delete comments[generate_fen()];
        return comment;
      },
      get_comments: function() {
        prune_comments();
        return Object.keys(comments).map(function(fen3) {
          return {fen: fen3, comment: comments[fen3]};
        });
      },
      delete_comments: function() {
        prune_comments();
        return Object.keys(comments).map(function(fen3) {
          var comment = comments[fen3];
          delete comments[fen3];
          return {fen: fen3, comment};
        });
      }
    };
  };
  exports.Chess = Chess;
});
const Chessboard_1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $moveDetails, $$unsubscribe_moveDetails;
  let $fenIO, $$unsubscribe_fenIO;
  $$unsubscribe_moveDetails = subscribe(moveDetails, (value) => $moveDetails = value);
  $$unsubscribe_fenIO = subscribe(fen, (value) => $fenIO = value);
  let {playingFirst} = $$props;
  let {fen: fen$1} = $$props;
  let {myturn = true} = $$props;
  let chess$1;
  let inCheck;
  let inCheckmate;
  let board_container;
  let chessboard;
  let game_state;
  const initializeChessboard = () => {
    const child = document.createElement("div");
    child.id = "board1";
    child.style = "width: 400px";
    board_container.appendChild(child);
    chessboard = new Chessboard(document.getElementById("board1"), {
      position: "start",
      sprite: {
        url: "/assets/images/chessboard-sprite-staunty.svg"
      },
      orientation: COLOR.white
    });
  };
  function inputHandler(event) {
    if (event.type === INPUT_EVENT_TYPE.moveDone) {
      const move = {
        from: event.squareFrom,
        to: event.squareTo
      };
      const result = chess$1.move(move);
      if (result && myturn) {
        set_store_value(moveDetails, $moveDetails = move, $moveDetails);
        set_store_value(fen, $fenIO = chess$1.fen(), $fenIO);
      } else if (!myturn) {
        event.chessboard.disableMoveInput();
      } else {
        console.warn("invalid move", move);
      }
      return result;
    } else {
      return true;
    }
  }
  onDestroy(async () => {
    await chessboard.destroy();
    set_store_value(fen, $fenIO = "", $fenIO);
    set_store_value(moveDetails, $moveDetails = "", $moveDetails);
  });
  afterUpdate(async () => {
    chess$1 = new chess.Chess(fen$1);
    chessboard.setPosition(chess$1.fen());
    inCheck = chess$1.in_check();
    inCheckmate = chess$1.in_checkmate();
    if (playingFirst === false) {
      chessboard.setOrientation(COLOR.black);
    }
    if (myturn) {
      if (chess$1.in_checkmate() == true) {
        game_state = "Game is finished :you lost \u{1F97A}";
      } else if (chess$1.in_stalemate() == true) {
        game_state = "Game is finished :It's a tie \u{1F454}";
      } else {
        game_state = "Game in Progress \u{1F525}";
      }
      chessboard.enableMoveInput(inputHandler);
    } else {
      if (chess$1.in_checkmate() == true) {
        game_state = "Game is finished :you Win \u{1F60E}";
      } else if (chess$1.in_stalemate() == true) {
        console.log(chess$1.in_stalemate());
        game_state = "Game is finished :It's a tie \u{1F454}";
      } else {
        game_state = "Game in Progress \u{1F525}";
      }
      chessboard.disableMoveInput(inputHandler);
    }
  });
  onMount(async () => {
    initializeChessboard();
  });
  if ($$props.playingFirst === void 0 && $$bindings.playingFirst && playingFirst !== void 0)
    $$bindings.playingFirst(playingFirst);
  if ($$props.fen === void 0 && $$bindings.fen && fen$1 !== void 0)
    $$bindings.fen(fen$1);
  if ($$props.myturn === void 0 && $$bindings.myturn && myturn !== void 0)
    $$bindings.myturn(myturn);
  $$unsubscribe_moveDetails();
  $$unsubscribe_fenIO();
  return `<p>In check:${escape(inCheck)}</p>
<p>In checkmate:${escape(inCheckmate)}</p>
<p>${escape(game_state)}</p>
<div${add_attribute("this", board_container, 1)}></div>`;
});
var Square_svelte = ".square.svelte-1yp11ow{flex:1 0 25%;width:50px;height:70px;background-color:whitesmoke;border:2px solid black;margin:5px;padding:5px;font-size:20px;text-align:center}.square.svelte-1yp11ow:hover{border:2px solid red}";
const css$3 = {
  code: ".square.svelte-1yp11ow{flex:1 0 25%;width:50px;height:70px;background-color:whitesmoke;border:2px solid black;margin:5px;padding:5px;font-size:20px;text-align:center}.square.svelte-1yp11ow:hover{border:2px solid red}",
  map: `{"version":3,"file":"Square.svelte","sources":["Square.svelte"],"sourcesContent":["<script>\\r\\n  export let value;\\r\\n  export let handleClick;\\r\\n</script>\\r\\n\\r\\n<style>\\r\\n  .square {\\r\\n    flex: 1 0 25%;\\r\\n    width: 50px;\\r\\n    height: 70px;\\r\\n    background-color: whitesmoke;\\r\\n    border: 2px solid black;\\r\\n    margin: 5px;\\r\\n    padding: 5px;\\r\\n    font-size: 20px;\\r\\n    text-align: center;\\r\\n  }\\r\\n\\r\\n  .square:hover {\\r\\n    border: 2px solid red;\\r\\n  }\\r\\n</style>\\r\\n\\r\\n<button class=\\"square\\" on:click={handleClick}>{value || ''}</button>\\r\\n"],"names":[],"mappings":"AAME,OAAO,eAAC,CAAC,AACP,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CACb,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,UAAU,CAC5B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,CACvB,MAAM,CAAE,GAAG,CACX,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,MAAM,AACpB,CAAC,AAED,sBAAO,MAAM,AAAC,CAAC,AACb,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,GAAG,AACvB,CAAC"}`
};
const Square = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {value} = $$props;
  let {handleClick} = $$props;
  if ($$props.value === void 0 && $$bindings.value && value !== void 0)
    $$bindings.value(value);
  if ($$props.handleClick === void 0 && $$bindings.handleClick && handleClick !== void 0)
    $$bindings.handleClick(handleClick);
  $$result.css.add(css$3);
  return `<button class="${"square svelte-1yp11ow"}">${escape(value || "")}</button>`;
});
var Board_svelte = "h3.svelte-dt6evk{color:red}.board.svelte-dt6evk{display:flex;flex-wrap:wrap;width:300px}";
const css$2 = {
  code: "h3.svelte-dt6evk{color:red}.board.svelte-dt6evk{display:flex;flex-wrap:wrap;width:300px}",
  map: `{"version":3,"file":"Board.svelte","sources":["Board.svelte"],"sourcesContent":["<script>\\r\\n  import Square from \\"./Square.svelte\\";\\r\\n  import {moveDetails,fen as fenIO} from '../../stores/store.js';\\r\\n  import {onMount,onDestroy,beforeUpdate,afterUpdate} from 'svelte';\\r\\n\\r\\n  export let iAmX=true;\\r\\n  export let myturn;\\r\\n  export let squares;\\r\\n\\r\\n  let winnerMsg = null;\\r\\n  let winner=\\"none\\";\\r\\n  let xIsNext ;\\r\\n  $: status = \\"Next Player: \\" + (xIsNext ? \\"X\\" : \\"0\\");\\r\\n\\r\\n\\r\\n  function handleClick(i) {\\r\\n    if(!myturn){\\r\\n      return;\\r\\n    }\\r\\n    if (!squares[i]) {\\r\\n      squares[i] = xIsNext ? \\"X\\" : \\"0\\";\\r\\n      xIsNext = !xIsNext;\\r\\n      winnerMsg = calculateWinner(squares);\\r\\n      console.log({msg:\\"everything works fine\\",winnerMsg})\\r\\n    }\\r\\n    $fenIO=JSON.stringify(squares);\\r\\n    const move={\\r\\n      player: xIsNext ? \\"X\\" : \\"0\\",\\r\\n      from: \\"\\",\\r\\n      to: \`\${i}\`,\\r\\n    }\\r\\n    if(winnerMsg){\\r\\n      switch(winnerMsg) {\\r\\n      case \\"Winner: X\\":\\r\\n        move.player=\\"win\\"\\r\\n        break;\\r\\n      case \\"Winner: 0\\":\\r\\n        //move.player=move.player+\\" win\\"\\r\\n        move.player=\\"win\\"\\r\\n        console.log(iAmX)\\r\\n        break;\\r\\n      case \\"It's a draw\\":\\r\\n        //move.player=move.player+\\" tie\\"\\r\\n        move.player=\\"tie\\"\\r\\n        console.log(\\"tie\\")\\r\\n        break;\\r\\n      default:\\r\\n        // code block\\r\\n      }\\r\\n    }\\r\\n    console.log(move);\\r\\n    $moveDetails=move; //triggers the makemove function\\r\\n    \\r\\n  }\\r\\n\\r\\n  function calculateWinner(squares) {\\r\\n    const winningCombo = [\\r\\n      [0, 1, 2],\\r\\n      [3, 4, 5],\\r\\n      [6, 7, 8],\\r\\n      [0, 3, 6],\\r\\n      [1, 4, 7],\\r\\n      [2, 5, 8],\\r\\n      [0, 4, 8],\\r\\n      [2, 4, 6]\\r\\n    ];\\r\\n    for (let i = 0; i < winningCombo.length; i++) {\\r\\n      const [a, b, c] = winningCombo[i];\\r\\n      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]){\\r\\n        //winner =(iAmx && squares[a]==\\"X\\")?\\"you\\":\\"opponent\\"\\r\\n        //console.log(\`Winner: \${squares[a]}\`)\\r\\n        return \`Winner: \${squares[a]}\`;\\r\\n      }\\r\\n    }\\r\\n\\r\\n    const isDraw = squares.every(square => square !== null);\\r\\n    //winner=isDraw?\\"tie\\":\\"none\\";\\r\\n    return isDraw ? \\"It's a draw\\" : null;\\r\\n  }\\r\\n\\r\\n  \\r\\n  $:if((iAmX && myturn==true)||(!iAmX && myturn==false)){\\r\\n    xIsNext=true\\r\\n  }else{\\r\\n    xIsNext=false\\r\\n  }\\r\\n\\r\\n  // $:if(winnerMsg){\\r\\n  //   switch(winnerMsg) {\\r\\n  //   case \\"Winner: X\\":\\r\\n  //     console.log(iAmX)\\r\\n  //     break;\\r\\n  //   case \\"Winner: O\\":\\r\\n  //     console.log(iAmX)\\r\\n  //     break;\\r\\n  //   case \\"It's a draw\\":\\r\\n  //     console.log(\\"draw\\")\\r\\n  //     break;\\r\\n  //   default:\\r\\n  //     // code block\\r\\n  //   }\\r\\n  // }\\r\\n\\r\\n  afterUpdate(async() =>{\\r\\n    winnerMsg=calculateWinner(squares)\\r\\n  });\\r\\n\\r\\n  onDestroy(async() =>{ \\r\\n    $fenIO='';\\r\\n    $moveDetails='';\\r\\n  });\\r\\n\\r\\n\\r\\n</script>\\r\\n\\r\\n<style>\\r\\n  h3 {\\r\\n    color: red;\\r\\n  }\\r\\n\\r\\n  .board {\\r\\n    display: flex;\\r\\n    flex-wrap: wrap;\\r\\n    width: 300px;\\r\\n  }\\r\\n</style>\\r\\n\\r\\n{#if winnerMsg}\\r\\n  <h3>{winnerMsg}</h3>\\r\\n{:else}\\r\\n  <h3>{status}</h3>\\r\\n{/if}\\r\\n<h3>iAmX {iAmX}</h3>\\r\\n<h3>winner {winner}</h3>\\r\\n<h3>my turn{myturn}</h3>\\r\\n<h3>xIsNext {xIsNext}</h3>\\r\\n\\r\\n<div class=\\"board\\">\\r\\n  {#each squares as square, i}\\r\\n    <Square value={square} handleClick={() => handleClick(i)} />\\r\\n  {/each}\\r\\n</div>\\r\\n"],"names":[],"mappings":"AAoHE,EAAE,cAAC,CAAC,AACF,KAAK,CAAE,GAAG,AACZ,CAAC,AAED,MAAM,cAAC,CAAC,AACN,OAAO,CAAE,IAAI,CACb,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,KAAK,AACd,CAAC"}`
};
let winner = "none";
function calculateWinner(squares) {
  const winningCombo = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (let i = 0; i < winningCombo.length; i++) {
    const [a, b, c] = winningCombo[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return `Winner: ${squares[a]}`;
    }
  }
  const isDraw = squares.every((square) => square !== null);
  return isDraw ? "It's a draw" : null;
}
const Board = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let status;
  let $fenIO, $$unsubscribe_fenIO;
  let $moveDetails, $$unsubscribe_moveDetails;
  $$unsubscribe_fenIO = subscribe(fen, (value) => $fenIO = value);
  $$unsubscribe_moveDetails = subscribe(moveDetails, (value) => $moveDetails = value);
  let {iAmX = true} = $$props;
  let {myturn} = $$props;
  let {squares} = $$props;
  let winnerMsg = null;
  let xIsNext;
  function handleClick(i) {
    if (!myturn) {
      return;
    }
    if (!squares[i]) {
      squares[i] = xIsNext ? "X" : "0";
      xIsNext = !xIsNext;
      winnerMsg = calculateWinner(squares);
      console.log({msg: "everything works fine", winnerMsg});
    }
    set_store_value(fen, $fenIO = JSON.stringify(squares), $fenIO);
    const move = {
      player: xIsNext ? "X" : "0",
      from: "",
      to: `${i}`
    };
    if (winnerMsg) {
      switch (winnerMsg) {
        case "Winner: X":
          move.player = "win";
          break;
        case "Winner: 0":
          move.player = "win";
          console.log(iAmX);
          break;
        case "It's a draw":
          move.player = "tie";
          console.log("tie");
          break;
      }
    }
    console.log(move);
    set_store_value(moveDetails, $moveDetails = move, $moveDetails);
  }
  afterUpdate(async () => {
    winnerMsg = calculateWinner(squares);
  });
  onDestroy(async () => {
    set_store_value(fen, $fenIO = "", $fenIO);
    set_store_value(moveDetails, $moveDetails = "", $moveDetails);
  });
  if ($$props.iAmX === void 0 && $$bindings.iAmX && iAmX !== void 0)
    $$bindings.iAmX(iAmX);
  if ($$props.myturn === void 0 && $$bindings.myturn && myturn !== void 0)
    $$bindings.myturn(myturn);
  if ($$props.squares === void 0 && $$bindings.squares && squares !== void 0)
    $$bindings.squares(squares);
  $$result.css.add(css$2);
  {
    if (iAmX && myturn == true || !iAmX && myturn == false) {
      xIsNext = true;
    } else {
      xIsNext = false;
    }
  }
  status = "Next Player: " + (xIsNext ? "X" : "0");
  $$unsubscribe_fenIO();
  $$unsubscribe_moveDetails();
  return `${winnerMsg ? `<h3 class="${"svelte-dt6evk"}">${escape(winnerMsg)}</h3>` : `<h3 class="${"svelte-dt6evk"}">${escape(status)}</h3>`}
<h3 class="${"svelte-dt6evk"}">iAmX ${escape(iAmX)}</h3>
<h3 class="${"svelte-dt6evk"}">winner ${escape(winner)}</h3>
<h3 class="${"svelte-dt6evk"}">my turn${escape(myturn)}</h3>
<h3 class="${"svelte-dt6evk"}">xIsNext ${escape(xIsNext)}</h3>

<div class="${"board svelte-dt6evk"}">${each(squares, (square, i) => `${validate_component(Square, "Square").$$render($$result, {
    value: square,
    handleClick: () => handleClick(i)
  }, {}, {})}`)}</div>`;
});
const Ttt_board = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {playingFirst} = $$props;
  let {fen: fen2} = $$props;
  let {myturn = true} = $$props;
  let fenParsed;
  const getBoardState = () => {
    fenParsed = JSON.parse(fen2);
  };
  beforeUpdate(async () => {
    getBoardState();
  });
  if ($$props.playingFirst === void 0 && $$bindings.playingFirst && playingFirst !== void 0)
    $$bindings.playingFirst(playingFirst);
  if ($$props.fen === void 0 && $$bindings.fen && fen2 !== void 0)
    $$bindings.fen(fen2);
  if ($$props.myturn === void 0 && $$bindings.myturn && myturn !== void 0)
    $$bindings.myturn(myturn);
  return `<p>${escape(myturn)}</p>
<p>${escape(fen2)}</p>
${validate_component(Board, "Board").$$render($$result, {
    iAmX: playingFirst,
    myturn,
    squares: fenParsed
  }, {}, {})}`;
});
const Game = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $curGame, $$unsubscribe_curGame;
  let $user, $$unsubscribe_user;
  let $fen, $$unsubscribe_fen;
  let $moveDetails, $$unsubscribe_moveDetails;
  $$unsubscribe_curGame = subscribe(curGame, (value) => $curGame = value);
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  $$unsubscribe_fen = subscribe(fen, (value) => $fen = value);
  $$unsubscribe_moveDetails = subscribe(moveDetails, (value) => $moveDetails = value);
  let myturn = true;
  let opponent;
  let playingFirst = true;
  let game_type;
  const getMatch = async () => {
    try {
      const response = await fetch("http://localhost:5002/game/get-match-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token")
        },
        body: JSON.stringify({match_id: $curGame})
      });
      const parseRes = await response.json();
      if (typeof parseRes === "string") {
        throw parseRes;
      }
      game_type = parseRes.game_type;
      playingFirst = $user.user_email == parseRes.player1_email;
      $user.user_email == parseRes.player1_email ? opponent = parseRes.player2_email : opponent = parseRes.player1_email;
      set_store_value(fen, $fen = parseRes.fen, $fen);
      if (parseRes.cur_player == $user.user_email) {
        myturn = true;
      } else {
        myturn = false;
      }
    } catch (err) {
      displayError = err;
    }
  };
  const makeMove = async () => {
    try {
      const response = await fetch("http://localhost:5002/game/make-move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token")
        },
        body: JSON.stringify({
          match_id: $curGame,
          move: $moveDetails,
          fen: $fen
        })
      });
      const parseRes = await response.json();
      if (typeof parseRes === "string") {
        throw parseRes;
      }
      myturn = false;
      set_store_value(fen, $fen = parseRes.fen, $fen);
    } catch (err) {
      displayError = err;
    }
  };
  const getMyTurn = async () => {
    try {
      const response = await fetch("http://localhost:5002/game/my-turn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token")
        },
        body: JSON.stringify({match_id: $curGame})
      });
      const parseRes = await response.json();
      if (typeof parseRes === "string") {
        throw parseRes;
      }
      if (parseRes.success) {
        myturn = true;
        set_store_value(fen, $fen = parseRes.match.fen, $fen);
      }
    } catch (err) {
      displayError = err;
    }
  };
  onMount(async () => {
    await getMatch();
  });
  onDestroy(async () => {
    set_store_value(curGame, $curGame = "", $curGame);
    clearInterval(interval_ID);
  });
  let interval_ID;
  {
    if (myturn == false) {
      interval_ID = setInterval(() => getMyTurn(), 1e3);
    } else if (myturn == true) {
      clearInterval(interval_ID);
    }
  }
  {
    if ($moveDetails != "") {
      makeMove();
    }
  }
  $$unsubscribe_curGame();
  $$unsubscribe_user();
  $$unsubscribe_fen();
  $$unsubscribe_moveDetails();
  return `<h1>match_id is:${escape($curGame)}</h1>
${myturn == true ? `<h3>You&#39;re turn</h3>` : `<h3>${escape(opponent)}&#39;s turn</h3>`}
${game_type == "chess" ? `${validate_component(Chessboard_1, "Chessboard").$$render($$result, {playingFirst, fen: $fen, myturn}, {}, {})}` : `${game_type == "tic-tac-toe" ? `${validate_component(Ttt_board, "TttBoard").$$render($$result, {playingFirst, fen: $fen, myturn}, {}, {})}` : ``}`}`;
});
var game = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Game
});
var Nav_svelte = ".topnav.svelte-1c5xf0a.svelte-1c5xf0a{overflow:hidden;background-color:#333}.topnav.svelte-1c5xf0a a.svelte-1c5xf0a{float:left;color:#f2f2f2;text-align:center;padding:14px 16px;text-decoration:none;font-size:17px}.topnav.svelte-1c5xf0a a.svelte-1c5xf0a:hover{background-color:#ddd;color:black}";
const css$1 = {
  code: ".topnav.svelte-1c5xf0a.svelte-1c5xf0a{overflow:hidden;background-color:#333}.topnav.svelte-1c5xf0a a.svelte-1c5xf0a{float:left;color:#f2f2f2;text-align:center;padding:14px 16px;text-decoration:none;font-size:17px}.topnav.svelte-1c5xf0a a.svelte-1c5xf0a:hover{background-color:#ddd;color:black}",
  map: `{"version":3,"file":"Nav.svelte","sources":["Nav.svelte"],"sourcesContent":["<script>\\r\\n    import {isAuthenticated,user} from '../stores/store.js';\\r\\n    //isAuthenticated.set(false);\\r\\n</script>\\r\\n\\r\\n<nav class=\\"topnav\\">\\r\\n    {#if ! $isAuthenticated }\\r\\n        <a href=\\"/register\\">Register</a>\\r\\n        <a href=\\"/login\\">Logging in</a>\\r\\n    {:else}\\r\\n        <a href=\\"/my-matches\\">My Matches</a>\\r\\n        <a href=\\"/search-matches\\">Search Matches</a>\\r\\n        <a href=\\"/players-scores\\">Score Board</a>\\r\\n        <a href=\\"/new-game\\">New game</a>\\r\\n        <a href=\\"/profile\\"><bold>\u{1F47D}{$user.user_email}</bold></a>\\r\\n    {/if}\\r\\n</nav>\\r\\n\\r\\n<style>\\r\\n    .topnav {\\r\\n    overflow: hidden;\\r\\n    background-color: #333;\\r\\n    }\\r\\n\\r\\n    .topnav a {\\r\\n    float: left;\\r\\n    color: #f2f2f2;\\r\\n    text-align: center;\\r\\n    padding: 14px 16px;\\r\\n    text-decoration: none;\\r\\n    font-size: 17px;\\r\\n    }\\r\\n\\r\\n    .topnav a:hover {\\r\\n    background-color: #ddd;\\r\\n    color: black;\\r\\n    }\\r\\n\\r\\n    .topnav a.active {\\r\\n    background-color: #4CAF50;\\r\\n    color: white;\\r\\n    }\\r\\n</style>"],"names":[],"mappings":"AAmBI,OAAO,8BAAC,CAAC,AACT,QAAQ,CAAE,MAAM,CAChB,gBAAgB,CAAE,IAAI,AACtB,CAAC,AAED,sBAAO,CAAC,CAAC,eAAC,CAAC,AACX,KAAK,CAAE,IAAI,CACX,KAAK,CAAE,OAAO,CACd,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,eAAe,CAAE,IAAI,CACrB,SAAS,CAAE,IAAI,AACf,CAAC,AAED,sBAAO,CAAC,gBAAC,MAAM,AAAC,CAAC,AACjB,gBAAgB,CAAE,IAAI,CACtB,KAAK,CAAE,KAAK,AACZ,CAAC"}`
};
const Nav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isAuthenticated, $$unsubscribe_isAuthenticated;
  let $user, $$unsubscribe_user;
  $$unsubscribe_isAuthenticated = subscribe(isAuthenticated, (value) => $isAuthenticated = value);
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  $$result.css.add(css$1);
  $$unsubscribe_isAuthenticated();
  $$unsubscribe_user();
  return `<nav class="${"topnav svelte-1c5xf0a"}">${!$isAuthenticated ? `<a href="${"/register"}" class="${"svelte-1c5xf0a"}">Register</a>
        <a href="${"/login"}" class="${"svelte-1c5xf0a"}">Logging in</a>` : `<a href="${"/my-matches"}" class="${"svelte-1c5xf0a"}">My Matches</a>
        <a href="${"/search-matches"}" class="${"svelte-1c5xf0a"}">Search Matches</a>
        <a href="${"/players-scores"}" class="${"svelte-1c5xf0a"}">Score Board</a>
        <a href="${"/new-game"}" class="${"svelte-1c5xf0a"}">New game</a>
        <a href="${"/profile"}" class="${"svelte-1c5xf0a"}"><bold>\u{1F47D}${escape($user.user_email)}</bold></a>`}
</nav>`;
});
var $layout_svelte = "main.svelte-yoigby{text-align:center;padding:1em;margin:0 auto}";
const css = {
  code: "main.svelte-yoigby{text-align:center;padding:1em;margin:0 auto}",
  map: `{"version":3,"file":"$layout.svelte","sources":["$layout.svelte"],"sourcesContent":["<script>\\r\\n\\timport Nav from '$lib/Nav.svelte';\\r\\n\\timport {isAuthenticated,user as userState} from '../stores/store.js';\\r\\n\\timport {onMount} from \\"svelte\\";\\r\\n\\timport {goto} from \\"$app/navigation\\"\\r\\n\\tonMount(async()=>{\\r\\n\\t\\tif(localStorage.getItem(\\"token\\")){\\r\\n\\t\\t\\tconst res =await fetch(\\"http://localhost:5000/auth/is-verify\\",{\\r\\n                method:\\"GET\\",\\r\\n                headers:{\\r\\n\\t\\t\\t\\t\\t\\"Content-Type\\":\\"application/json\\",\\r\\n\\t\\t\\t\\t\\t\\"token\\":localStorage.getItem(\\"token\\")}\\r\\n            })\\r\\n\\r\\n\\t\\t\\tconst parseRes=await res.json()\\r\\n\\t\\t\\t//console.log(parseRes)\\r\\n\\t\\t\\tif(parseRes===true){\\r\\n\\t\\t\\t\\t//get from localStorage\\r\\n\\t\\t\\t\\tconst user=JSON.parse(localStorage.getItem(\\"user_data\\"))\\r\\n\\t\\t\\t\\t//console.log(user)\\r\\n\\t\\t\\t\\tuserState.set(user)\\r\\n\\t\\t\\t\\tisAuthenticated.set(true)\\r\\n\\t\\t\\t\\t//console.log(localStorage.getItem(\\"user_data\\"))\\r\\n\\t\\t\\t\\tgoto(\\"/profile\\")\\r\\n\\t\\t\\t}else{\\r\\n\\t\\t\\t\\t//if user token is not Authorize \\r\\n\\t\\t\\t\\t//Under normal use because of expiretion\\r\\n\\t\\t\\t\\t//Thats why redirect to login\\r\\n\\t\\t\\t\\tisAuthenticated.set(false)\\r\\n            \\tuserState.set({})\\r\\n\\t\\t\\t\\tlocalStorage.removeItem(\\"token\\")\\r\\n\\t\\t\\t\\tlocalStorage.removeItem(\\"user_data\\")\\r\\n            \\tgoto(\\"/login\\")\\r\\n\\t\\t\\t}\\r\\n\\t\\t\\t//console.log(parseRes)\\r\\n\\t\\t}\\r\\n\\t})\\r\\n</script>\\r\\n\\r\\n<Nav/>\\r\\n<main>\\r\\n\\t<slot></slot>\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\tpadding: 1em;\\r\\n\\t\\tmargin: 0 auto;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA6CC,IAAI,cAAC,CAAC,AACL,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,GAAG,CACZ,MAAM,CAAE,CAAC,CAAC,IAAI,AACf,CAAC"}`
};
const $layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  onMount(async () => {
    if (localStorage.getItem("token")) {
      const res = await fetch("http://localhost:5000/auth/is-verify", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token")
        }
      });
      const parseRes = await res.json();
      if (parseRes === true) {
        const user$1 = JSON.parse(localStorage.getItem("user_data"));
        user.set(user$1);
        isAuthenticated.set(true);
        goto("/profile");
      } else {
        isAuthenticated.set(false);
        user.set({});
        localStorage.removeItem("token");
        localStorage.removeItem("user_data");
        goto("/login");
      }
    }
  });
  $$result.css.add(css);
  return `${validate_component(Nav, "Nav").$$render($$result, {}, {}, {})}
<main class="${"svelte-yoigby"}">${slots.default ? slots.default({}) : ``}
</main>`;
});
var $layout$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: $layout
});
export {init, render};
