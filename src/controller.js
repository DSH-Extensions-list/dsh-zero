export function unwrap(result){if(!result?.ok)throw Error(result?.error?.message??'The host could not complete this request.');return result.value;}
export class ZeroController {
 constructor(remote){this.remote=remote;}
 async load(){
  const [settings,stats,artifacts]=await Promise.all([this.remote.settings.describe().then(unwrap),this.remote.dshZero.snapshot().then(unwrap),this.remote.dshZero.listArtifacts('',0).then(unwrap)]);
  const section=settings.namespaces.find(s=>['off','safe','lean'].includes(s.value?.mode)&&['estimated','exact-only'].includes(s.value?.counting));
  if(!section)throw Error('DSH Zero configuration is unavailable. Enable the plugin in this profile and reopen this page.');
  this.section=section;return{config:section.value,writable:settings.writable,stats,artifacts};
 }
 async save(mode,counting){
  if(!this.section)await this.load();if(!['off','safe','lean'].includes(mode)||!['estimated','exact-only'].includes(counting))throw Error('Choose a supported mode.');
  unwrap(await this.remote.settings.mutate(this.section.ns,[{op:'set',path:['mode'],value:mode},{op:'set',path:['counting'],value:counting}],this.section.revision));
  return this.load();
 }
 async list(cursor){return unwrap(await this.remote.dshZero.listArtifacts('',cursor));}
 async read(artifact,offset){return unwrap(await this.remote.dshZero.readArtifact(artifact.sessionId,artifact.id,offset,65536));}
}
