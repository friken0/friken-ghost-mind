/* One admitted read-only board. A displayed .exe command is the web dialer's
 * command language; it never executes a shell or fetches caller-supplied code. */
export const ghostBoard=Object.freeze({id:'greater-mind',repository:'https://github.com/friken0/friken-ghost-mind',manifest:'https://raw.githubusercontent.com/friken0/friken-ghost-mind/main/registry.json',schema:'friken.ghost.public-registry.v1'});
export async function readGhostBoard({fetch:request=globalThis.fetch,timeoutMs=8000}={}){
 if(typeof request!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw Error('A bounded board transport is required');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);let reader;
 try{
  const response=await request(ghostBoard.manifest,{credentials:'omit',cache:'no-cache',signal:controller.signal});if(!response.ok)throw Error('Public board HTTP '+response.status);
  const limit=1024*1024;let text='';
  if(response.body?.getReader){reader=response.body.getReader();const decoder=new TextDecoder();let bytes=0;for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>limit)throw Error('Board manifest exceeds 1 MB');text+=decoder.decode(part.value,{stream:true});}text+=decoder.decode();}
  else{text=await response.text();if(new TextEncoder().encode(text).length>limit)throw Error('Board manifest exceeds 1 MB');}
  const registry=JSON.parse(text);if(registry.schema!==ghostBoard.schema||typeof registry.version!=='string'||registry.version.length>80||/[\x00-\x1f\x7f]/.test(registry.version)||!Array.isArray(registry.files)||registry.files.length>512)throw Error('Public board manifest is not an admitted registry');
  return {mode:'public-read',repository:ghostBoard.repository,version:registry.version,files:registry.files.length};
 }finally{clearTimeout(timer);reader?.releaseLock();}
}
