import {z} from 'zod';
export const PACKAGE='@arzvaak/dsh-zero';
const count=z.number().int().nonnegative(),bucket=z.object({original:count,retained:count,grossReduction:z.number(),recovery:count,netProjectionReduction:z.number().nullable()});
export const snapshotSchema=z.object({scope:z.literal('host-activation'),startedAt:z.string(),selected:count,originalBytes:count,retainedBytes:count,viewerBytes:count,modelRecoveryBytes:count,estimated:bucket,exact:bucket,bypass:z.record(z.string(),count)});
const artifact=z.object({id:z.string(),sessionId:z.string(),bytes:count,toolName:z.string(),createdAt:z.string()});
const page=z.object({items:z.array(artifact),nextCursor:count.nullable()});
const chunk=z.object({text:z.string(),nextOffset:count,eof:z.boolean(),totalBytes:count,sessionId:z.string()});
const codec=(symbol,schema)=>({mode:'strict',typeSymbol:`${PACKAGE}#${symbol}`,create:()=>schema});
const parameter=(name,schema)=>({name,wire:name,source:'json',codec:codec(name,schema)});
const descriptor=(method,parameters,result,cancellation)=>({id:`${PACKAGE}#dshZero/${method}`,service:'dshZero',namespace:'dshZero',method,invocation:{kind:'direct'},parameters,result:codec(method+'Result',result),...cancellation?{cancellation:{parameter:'signal'}}:{}});
export const TYPERT_REMOTE={package:PACKAGE,descriptors:[
 descriptor('snapshot',[],snapshotSchema),
 descriptor('listArtifacts',[parameter('sessionId',z.string()),parameter('cursor',count)],page),
 descriptor('readArtifact',[parameter('sessionId',z.string()),parameter('id',z.string()),parameter('offset',count),parameter('length',count.min(4).max(65536))],chunk,true),
]};
export const TYPERT={package:PACKAGE,face:'host',schemas:[],model:{services:[],events:[],objects:[]},invocations:TYPERT_REMOTE.descriptors};
