var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name2, symbol) => (symbol = Symbol[name2]) ? symbol : Symbol.for("Symbol." + name2);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name2, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name: name2, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name2, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name2]() {
    return __privateGet(this, extra);
  }, set [name2](x) {
    return __privateSet(this, extra, x);
  } }, name2));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name2) : __name(target, name2);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name2, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name2 in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name2];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name2] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name2, desc), p ? k ^ 4 ? extra : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/host.ts
import z2 from "@deepseek-ai/schemastery";

// src/service.ts
import { TypertRemoteService, Remote } from "@deepseek-ai/dsh-typert-protocol";
var _readArtifact_dec, _listArtifacts_dec, _snapshot_dec, _a, _init;
var ZeroService = class extends (_a = TypertRemoteService, _snapshot_dec = [Remote], _listArtifacts_dec = [Remote], _readArtifact_dec = [Remote], _a) {
  constructor(ctx, state) {
    super(ctx, "dshZero");
    __runInitializers(_init, 5, this);
    __publicField(this, "state");
    this.state = state;
  }
  snapshot() {
    return this.state.snapshot();
  }
  listArtifacts(sessionId, cursor) {
    return this.state.listArtifacts(sessionId, cursor);
  }
  readArtifact(sessionId, id, offset, length, signal) {
    return this.state.readArtifact(sessionId, id, offset, length, signal);
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "snapshot", _snapshot_dec, ZeroService);
__decorateElement(_init, 1, "listArtifacts", _listArtifacts_dec, ZeroService);
__decorateElement(_init, 1, "readArtifact", _readArtifact_dec, ZeroService);
__decoratorMetadata(_init, ZeroService);

// src/service-state.js
import { randomUUID } from "node:crypto";
var bucket = () => ({ original: 0, retained: 0, grossReduction: 0, recovery: 0, netProjectionReduction: 0 });
var ServiceState = class {
  constructor({ readRange: readRange2, maxArtifacts = 1e3 }) {
    this.readRange = readRange2;
    this.maxArtifacts = maxArtifacts;
    this.artifacts = /* @__PURE__ */ new Map();
    this.startedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.stats = { scope: "host-activation", startedAt: this.startedAt, selected: 0, originalBytes: 0, retainedBytes: 0, viewerBytes: 0, modelRecoveryBytes: 0, estimated: bucket(), exact: bucket(), bypass: {} };
  }
  addArtifact({ sessionId, locator, bytes, toolName }) {
    const item = { id: randomUUID(), sessionId, locator, bytes, toolName, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.artifacts.set(item.id, item);
    while (this.artifacts.size > this.maxArtifacts) {
      this.artifacts.delete(this.artifacts.keys().next().value);
      if (this.stats.selected) this.incomparable = true;
    }
    return item;
  }
  record(entry) {
    if (!entry.selected) {
      const reason = entry.reason ?? "unknown";
      this.stats.bypass[reason] = (this.stats.bypass[reason] ?? 0) + 1;
      return;
    }
    this.stats.selected++;
    this.stats.originalBytes += entry.originalBytes;
    this.stats.retainedBytes += entry.retainedBytes;
    const b = this.stats[entry.basis];
    b.original += entry.originalCount;
    b.retained += entry.retainedCount;
    b.grossReduction = b.original - b.retained;
    b.netProjectionReduction = b.grossReduction - b.recovery;
  }
  recordRecovery({ basis, count: count2, bytes, source, comparable = true }) {
    if (source === "viewer") {
      this.stats.viewerBytes += bytes;
      return;
    }
    if (!comparable) this.incomparable = true;
    this.stats.modelRecoveryBytes += bytes;
    const b = this.stats[basis];
    b.recovery += count2;
    b.netProjectionReduction = b.grossReduction - b.recovery;
  }
  snapshot() {
    const view = structuredClone(this.stats);
    if (this.incomparable) {
      view.exact.netProjectionReduction = null;
      view.estimated.netProjectionReduction = null;
    }
    return view;
  }
  listArtifacts(sessionId = "", cursor = 0) {
    if (typeof sessionId !== "string" || !Number.isSafeInteger(cursor) || cursor < 0) throw Error("Invalid artifact listing");
    const entries = [...this.artifacts.values()].filter((a) => !sessionId || a.sessionId === sessionId).reverse();
    const items = entries.slice(cursor, cursor + 50).map(({ locator, ...item }) => item);
    return { items, nextCursor: cursor + items.length < entries.length ? cursor + items.length : null };
  }
  findByLocator(locator) {
    return [...this.artifacts.values()].find((a) => a.locator === locator);
  }
  async readArtifact(sessionId, id, offset, length, signal) {
    const a = this.artifacts.get(id);
    if (!a || a.sessionId !== sessionId) throw Error("Unknown artifact for this session");
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(length) || length < 4 || length > 65536) throw Error("Invalid byte range (length 4\u201365536)");
    if (signal?.aborted) throw Error("Read cancelled");
    const bytes = await this.readRange(a.locator, offset, length, signal);
    if (signal?.aborted) throw Error("Read cancelled");
    if (!(bytes instanceof Uint8Array) || bytes.length > length) throw Error("Invalid range result");
    if (bytes.length && bytes[0] >= 128 && bytes[0] < 192) throw Error("Offset is not a UTF-8 boundary");
    let text, end = bytes.length;
    for (let trim = 0; trim <= 3; trim++) {
      try {
        text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes.subarray(0, end));
        break;
      } catch (error) {
        if (trim === 3 || end === 0) throw error;
        end--;
      }
    }
    if (bytes.length && end === 0) throw Error("Invalid UTF-8 artifact");
    this.recordRecovery({ bytes: end, source: "viewer" });
    return { text, nextOffset: offset + end, eof: offset + end >= a.bytes, totalBytes: a.bytes, sessionId: a.sessionId };
  }
};

// src/selection.js
var estimateText = (text) => Math.ceil(text.length / 4);
function selectCandidate({ original, candidate, countTokens, counting = "estimated", minimumReduction = 0.2 }) {
  const basis = countTokens ? "exact" : "estimated", counter = countTokens ?? estimateText;
  if (!countTokens && counting === "exact-only") return { selected: false, basis, reason: "missing-tokenizer" };
  try {
    const originalCount = counter(original), retainedCount = counter(candidate);
    if (![originalCount, retainedCount].every((n) => Number.isSafeInteger(n) && n >= 0)) throw Error("Invalid token count");
    const selected = originalCount > 0 && retainedCount < originalCount && (basis === "exact" || retainedCount <= originalCount * (1 - minimumReduction));
    return { selected, basis, originalCount, retainedCount, reason: selected ? "selected" : "not-smaller" };
  } catch {
    return { selected: false, basis, reason: "tokenizer-failed" };
  }
}
function createCounters() {
  const entries = /* @__PURE__ */ new Map(), key = (provider, model) => JSON.stringify([provider, model]);
  return {
    register(provider, model, counter) {
      if (typeof provider !== "string" || typeof model !== "string" || typeof counter !== "function") throw Error("Invalid tokenizer registration");
      const id = key(provider, model);
      if (entries.has(id)) throw Error("Tokenizer already registered");
      entries.set(id, counter);
      return () => {
        if (entries.get(id) === counter) entries.delete(id);
      };
    },
    resolve(provider, model) {
      return entries.get(key(provider, model));
    }
  };
}

// src/codec.js
var CODEC_HEADER = "DSH-ZERO/1\n";
function encodeText(text) {
  const lines = text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g).filter(Boolean), records = [];
  let literal = "";
  const flush = () => {
    if (literal) {
      records.push([1, literal]);
      literal = "";
    }
  };
  for (let i = 0; i < lines.length; ) {
    let best = { width: 0, count: 0, gain: 0 };
    for (let width = 1; width <= 8 && i + width * 2 <= lines.length; width++) {
      let count2 = 1;
      outer: while (i + (count2 + 1) * width <= lines.length) {
        for (let j = 0; j < width; j++) if (lines[i + j] !== lines[i + count2 * width + j]) break outer;
        count2++;
      }
      if (count2 > 1) {
        const block = lines.slice(i, i + width).join(""), gain = block.length * (count2 - 1) - 16;
        if (gain > best.gain) best = { width, count: count2, gain };
      }
    }
    if (best.width) {
      flush();
      records.push([best.count, lines.slice(i, i + best.width).join("")]);
      i += best.width * best.count;
    } else literal += lines[i++];
  }
  flush();
  return CODEC_HEADER + JSON.stringify(records);
}
function decodeText(encoded, { maxBytes = 64 * 1024 * 1024 } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw Error("Invalid expansion cap");
  if (!encoded.startsWith(CODEC_HEADER)) throw Error("Unknown codec");
  const records = JSON.parse(encoded.slice(CODEC_HEADER.length));
  if (!Array.isArray(records)) throw Error("Invalid records");
  let bytes = 0;
  const output = [];
  for (const row of records) {
    if (!Array.isArray(row) || row.length !== 2 || !Number.isSafeInteger(row[0]) || row[0] < 1 || typeof row[1] !== "string" || row[1].length === 0) throw Error("Invalid codec record");
    const added = Buffer.byteLength(row[1]) * row[0];
    if (!Number.isSafeInteger(added) || added > maxBytes - bytes) throw Error("Expansion cap exceeded");
    bytes += added;
    output.push(row[1].repeat(row[0]));
  }
  return output.join("");
}

// src/policy.js
var DEFAULT_CONFIG = { mode: "safe", counting: "estimated", minimumReduction: 0.2, minimumBytes: 4096, maximumBytes: 16 * 1024 * 1024, maxArtifacts: 1e3 };
var prepared = (text) => text.includes(CODEC_HEADER) || /verbatim.*(?:saved at|copy)|\[spill:|spill locator|full.*(?:saved at|stored at)/i.test(text);
function createPolicy({ saveOriginal, record, resolveCounter, config }) {
  return async function postExecute(exec, result, next) {
    const decision = await next();
    const bypass = (reason) => {
      record({ reason, selected: false });
      return decision;
    };
    if (decision.kind !== "accept" || Object.hasOwn(decision, "value")) return decision;
    if (config.mode === "off") return decision;
    if (exec.signal.aborted) return bypass("aborted");
    if (exec.name === "read" || exec.name.startsWith("dsh_zero_")) return bypass("recovery-tool");
    if (exec.parent !== void 0) return bypass("nested-call");
    const owner = exec.agent?.session.header.id;
    if (owner === void 0) return bypass("missing-owner");
    const content = decision.content ?? result.content;
    if (content.length !== 1 || content[0].type !== "text") return bypass("unsupported-content");
    const original = content[0].text, bytes = Buffer.byteLength(original);
    if (prepared(original)) return bypass("already-projected");
    if (bytes < config.minimumBytes || bytes > config.maximumBytes) return bypass("size-limit");
    if (Buffer.from(original).toString("utf8") !== original) return bypass("invalid-unicode");
    const counter = resolveCounter(exec);
    if (config.counting === "exact-only" && !counter) return bypass("missing-tokenizer");
    try {
      const encoded = encodeText(original);
      if (encoded.length >= original.length) return bypass("not-smaller");
      if (decodeText(encoded, { maxBytes: config.maximumBytes }) !== original) return bypass("codec-mismatch");
      const artifact2 = await saveOriginal(exec, original);
      if (exec.signal.aborted) return bypass("aborted");
      const notice = `[DSH Zero: reversible [repeat count, literal text] records in original order. Full original: ${JSON.stringify(artifact2.locator)}. ${artifact2.retrievalHint}]
`;
      const candidate = notice + encoded;
      const selection = selectCandidate({ original, candidate, countTokens: counter, counting: config.counting, minimumReduction: config.minimumReduction });
      record({ ...selection, artifactId: artifact2.id, sessionId: owner, originalBytes: bytes, retainedBytes: Buffer.byteLength(candidate), candidate, exec });
      if (!selection.selected) return decision;
      return { ...decision, content: [{ ...content[0], text: candidate }] };
    } catch (error) {
      return bypass(error?.code === "ENOSPC" ? "storage-full" : "projection-failed");
    }
  };
}

// src/lean.js
var LEAN_GUIDE = "Work toward the requested outcome with targeted reads and concise progress updates. Prefer narrow searches and relevant file ranges; read complete files when needed. Batch independent reads through native DSH tools when available. Preserve unique diagnostics and retrieve full saved output whenever compressed records are insufficient. After meaningful verification passes, continue to delivery; repeat checks when new evidence warrants them. Preserve project instructions, approval boundaries, task quality, and necessary evidence.";

// src/remote.js
import { z } from "zod";
var PACKAGE = "@arzvaak/dsh-zero";
var count = z.number().int().nonnegative();
var bucket2 = z.object({ original: count, retained: count, grossReduction: z.number(), recovery: count, netProjectionReduction: z.number().nullable() });
var snapshotSchema = z.object({ scope: z.literal("host-activation"), startedAt: z.string(), selected: count, originalBytes: count, retainedBytes: count, viewerBytes: count, modelRecoveryBytes: count, estimated: bucket2, exact: bucket2, bypass: z.record(z.string(), count) });
var artifact = z.object({ id: z.string(), sessionId: z.string(), bytes: count, toolName: z.string(), createdAt: z.string() });
var page = z.object({ items: z.array(artifact), nextCursor: count.nullable() });
var chunk = z.object({ text: z.string(), nextOffset: count, eof: z.boolean(), totalBytes: count, sessionId: z.string() });
var codec = (symbol, schema) => ({ mode: "strict", typeSymbol: `${PACKAGE}#${symbol}`, create: () => schema });
var parameter = (name2, schema) => ({ name: name2, wire: name2, source: "json", codec: codec(name2, schema) });
var descriptor = (method, parameters, result, cancellation) => ({ id: `${PACKAGE}#dshZero/${method}`, service: "dshZero", namespace: "dshZero", method, invocation: { kind: "direct" }, parameters, result: codec(method + "Result", result), ...cancellation ? { cancellation: { parameter: "signal" } } : {} });
var TYPERT_REMOTE = { package: PACKAGE, descriptors: [
  descriptor("snapshot", [], snapshotSchema),
  descriptor("listArtifacts", [parameter("sessionId", z.string()), parameter("cursor", count)], page),
  descriptor("readArtifact", [parameter("sessionId", z.string()), parameter("id", z.string()), parameter("offset", count), parameter("length", count.min(4).max(65536))], chunk, true)
] };
var TYPERT = { package: PACKAGE, face: "host", schemas: [], model: { services: [], events: [], objects: [] }, invocations: TYPERT_REMOTE.descriptors };

// src/host.ts
var name = "dsh-zero";
var inject = ["tools"];
var Config = z2.object({
  mode: z2.union(["off", "safe", "lean"]).default("safe").description("Safe compresses recoverable output; Lean also adds concise working guidance."),
  counting: z2.union(["estimated", "exact-only"]).default("estimated").description("Estimated works with any model. Exact-only preserves original output unless a matching tokenizer is registered."),
  minimumReduction: z2.number().min(0).max(1).default(0.2),
  minimumBytes: z2.number().step(1).min(1).default(4096),
  maximumBytes: z2.number().step(1).min(4096).max(64 * 1024 * 1024).default(16 * 1024 * 1024),
  maxArtifacts: z2.number().step(1).min(1).max(1e4).default(1e3)
}).volatile();
async function readRange(ctx, identities, locator, offset, length, signal) {
  const fs = ctx.get("fs");
  if (!fs) throw Error("Native filesystem unavailable");
  const identity = identities.get(locator);
  if (!identity) throw Error("Unknown saved artifact");
  const target = await fs.resolve(locator, { signal });
  const info = await fs.stat(target, signal);
  if (target.targetKey !== identity.key || info?.version !== identity.version || info?.type !== "file") throw Error("Saved artifact changed or expired");
  const bytes = await fs.readByteRange(target, { offset, length }, signal);
  const after = await fs.stat(target, signal);
  if (after?.version !== identity.version) throw Error("Saved artifact changed while reading");
  return bytes;
}
function apply(ctx, config) {
  const resolved = () => config?.get?.() ?? config ?? DEFAULT_CONFIG;
  let cfg = resolved();
  if (cfg.minimumBytes > cfg.maximumBytes) throw Error("minimumBytes exceeds maximumBytes");
  const identities = /* @__PURE__ */ new Map(), pending = /* @__PURE__ */ new WeakMap(), counters = createCounters();
  const state = new ServiceState({ maxArtifacts: cfg.maxArtifacts, readRange: (...args) => readRange(ctx, identities, ...args) });
  new ZeroService(ctx, state);
  ctx.provide("dshZeroCounters", counters);
  ctx.inject(["typert"], (scope) => scope.effect(() => scope.typert.register(TYPERT), "DSH Zero Remote descriptors"));
  const resolveCounter = (exec) => {
    const header = exec.agent?.session.requestHeader?.()?.config;
    return counters.resolve(header?.provider ?? exec.agent?.options.provider, header?.model ?? exec.agent?.options.model);
  };
  const saveOriginal = async (exec, original) => {
    const store = ctx.get("spillStore"), fs = ctx.get("fs");
    if (!store || !fs) throw Error("Native spill storage or filesystem unavailable");
    const ref = await store.saveText({ owner: { sessionId: exec.agent.session.header.id }, source: { kind: "tool", toolName: exec.name, callId: exec.callId, label: "dsh-zero-original" }, suggestedName: "dsh-zero-original.txt", content: original });
    const locator = fs.processPathFromHostPath(ref.locator);
    if (!locator) throw Error("Saved output unavailable in tool execution world");
    const target = await fs.resolve(locator, { signal: exec.signal }), info = await fs.stat(target, exec.signal);
    if (info?.type !== "file" || info.size !== ref.bytes) throw Error("Original artifact could not be verified");
    identities.set(locator, { key: target.targetKey, version: info.version });
    const artifact2 = state.addArtifact({ sessionId: exec.agent.session.header.id, locator, bytes: ref.bytes, toolName: exec.name });
    for (const key of identities.keys()) if (!state.findByLocator(key)) identities.delete(key);
    return { id: artifact2.id, locator, retrievalHint: ref.retrievalHint };
  };
  const record = (entry) => {
    if (entry.selected) pending.set(entry.exec.token, entry);
    else state.record(entry);
  };
  let removePolicy = () => {
  };
  const refresh = () => {
    const nextConfig = resolved();
    if (nextConfig.minimumBytes > nextConfig.maximumBytes) throw Error("minimumBytes exceeds maximumBytes");
    cfg = nextConfig;
    removePolicy();
    removePolicy = () => {
    };
    state.maxArtifacts = cfg.maxArtifacts;
    if (cfg.mode === "off") return;
    removePolicy = ctx.on("tools/post-execute", createPolicy({ config: cfg, saveOriginal, record, resolveCounter }), { prepend: true });
  };
  refresh();
  ctx.on("loader/volatile-update", refresh);
  ctx.effect(() => () => removePolicy());
  ctx.inject(["systemPrompt"], (scope) => {
    scope.systemPrompt.section({ name: "dsh-zero:lean", order: scope.systemPrompt.getSectionOrder("DELIVERABLE_FILE_REFERENCES") + 2, text: () => cfg.mode === "lean" ? LEAN_GUIDE : "", interpolate: false });
  });
  ctx.on("tools/result", (exec, result) => {
    const entry = pending.get(exec.token);
    if (entry) {
      pending.delete(exec.token);
      if (result.content.length === 1 && result.content[0].type === "text" && result.content[0].text === entry.candidate) {
        state.record(entry);
        const a = state.artifacts.get(entry.artifactId), identity2 = a && identities.get(a.locator);
        if (identity2) {
          identity2.basis = entry.basis;
          identity2.counter = resolveCounter(exec);
        }
      } else state.record({ selected: false, reason: "superseded-projection" });
    }
    if (exec.name !== "read" || result.isError) return;
    const artifact2 = state.findByLocator(exec.arguments?.file_path);
    if (!artifact2) return;
    const text = result.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const counter = resolveCounter(exec);
    let basis = "estimated", count2 = estimateText(text);
    if (counter) {
      try {
        const value = counter(text);
        if (Number.isSafeInteger(value) && value >= 0) {
          basis = "exact";
          count2 = value;
        }
      } catch {
      }
    }
    const identity = identities.get(artifact2.locator);
    const comparable = identity?.basis === basis && (basis === "estimated" || identity.counter === counter);
    state.recordRecovery({ basis, count: count2, bytes: Buffer.byteLength(text), source: "model", comparable });
  });
}
export {
  Config,
  apply,
  inject,
  name
};
