// src/remote.js
import { z } from "zod";
var PACKAGE = "@arzvaak/dsh-zero";
var count = z.number().int().nonnegative();
var bucket = z.object({ original: count, retained: count, grossReduction: z.number(), recovery: count, netProjectionReduction: z.number().nullable() });
var snapshotSchema = z.object({ scope: z.literal("host-activation"), startedAt: z.string(), selected: count, originalBytes: count, retainedBytes: count, viewerBytes: count, modelRecoveryBytes: count, estimated: bucket, exact: bucket, bypass: z.record(z.string(), count) });
var artifact = z.object({ id: z.string(), sessionId: z.string(), bytes: count, toolName: z.string(), createdAt: z.string() });
var page = z.object({ items: z.array(artifact), nextCursor: count.nullable() });
var chunk = z.object({ text: z.string(), nextOffset: count, eof: z.boolean(), totalBytes: count, sessionId: z.string() });
var codec = (symbol, schema) => ({ mode: "strict", typeSymbol: `${PACKAGE}#${symbol}`, create: () => schema });
var parameter = (name, schema) => ({ name, wire: name, source: "json", codec: codec(name, schema) });
var descriptor = (method, parameters, result, cancellation) => ({ id: `${PACKAGE}#dshZero/${method}`, service: "dshZero", namespace: "dshZero", method, invocation: { kind: "direct" }, parameters, result: codec(method + "Result", result), ...cancellation ? { cancellation: { parameter: "signal" } } : {} });
var TYPERT_REMOTE = { package: PACKAGE, descriptors: [
  descriptor("snapshot", [], snapshotSchema),
  descriptor("listArtifacts", [parameter("sessionId", z.string()), parameter("cursor", count)], page),
  descriptor("readArtifact", [parameter("sessionId", z.string()), parameter("id", z.string()), parameter("offset", count), parameter("length", count.min(4).max(65536))], chunk, true)
] };
var TYPERT = { package: PACKAGE, face: "host", schemas: [], model: { services: [], events: [], objects: [] }, invocations: TYPERT_REMOTE.descriptors };
export {
  PACKAGE,
  TYPERT,
  TYPERT_REMOTE,
  snapshotSchema
};
