import {TypertRemoteService,Remote} from '@deepseek-ai/dsh-typert-protocol';
import type {Context} from '@deepseek-ai/cordis';
import type {Snapshot,ArtifactPage,ArtifactChunk} from './contracts.ts';

interface State {
 snapshot():Snapshot;
 listArtifacts(sessionId:string,cursor:number):ArtifactPage;
 readArtifact(sessionId:string,id:string,offset:number,length:number,signal?:AbortSignal):Promise<ArtifactChunk>;
}
/** Authenticated native Remote surface; only plugin-issued artifact IDs cross the wire. */
export class ZeroService extends TypertRemoteService {
 private readonly state:State;
 constructor(ctx:Context,state:State){super(ctx,'dshZero');this.state=state;}
 @Remote
 snapshot():Snapshot{return this.state.snapshot();}
 @Remote
 listArtifacts(sessionId:string,cursor:number):ArtifactPage{return this.state.listArtifacts(sessionId,cursor);}
 @Remote
 readArtifact(sessionId:string,id:string,offset:number,length:number,signal:AbortSignal):Promise<ArtifactChunk>{return this.state.readArtifact(sessionId,id,offset,length,signal);}
}
