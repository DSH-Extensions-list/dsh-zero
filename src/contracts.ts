export interface SavingsBucket { original:number; retained:number; grossReduction:number; recovery:number; netProjectionReduction:number|null }
export interface Snapshot { scope:'host-activation'; startedAt:string; selected:number; originalBytes:number; retainedBytes:number; viewerBytes:number; modelRecoveryBytes:number; estimated:SavingsBucket; exact:SavingsBucket; bypass:Record<string,number> }
export interface ArtifactInfo { id:string; sessionId:string; bytes:number; toolName:string; createdAt:string }
export interface ArtifactPage { items:ArtifactInfo[]; nextCursor:number|null }
export interface ArtifactChunk { text:string; nextOffset:number; eof:boolean; totalBytes:number; sessionId:string }
