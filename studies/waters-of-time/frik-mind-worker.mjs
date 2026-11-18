import {createFrikMindInk,renderFrikMindRows} from './ansi-frik-mind.mjs?v=waters-echo-2';

const artwork=createFrikMindInk();
self.onmessage=({data:{spec,first,last,buffer}})=>{
 const started=performance.now();
 const pixels=renderFrikMindRows(artwork,spec,first,last,buffer);
 self.postMessage({first,last,pixels,ms:performance.now()-started},[pixels.buffer]);
};
