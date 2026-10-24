import {storyAudit} from './storycraft.mjs';
import {validateChapterRelease} from './chapter-library.mjs';
/** Code-host entry point used by BOOT: validate before mounting content. */
import fs from 'node:fs';
import {validateChapter,decodePlaySeed,encodePlaySeed,createChapter,chapterRequest,canonicalData,sdfBounds} from './chapters.mjs';
import {sha256} from './canon.mjs';
const [op,input,parent,output]=process.argv.slice(2);
const read=p=>fs.readFileSync(p,'utf8').trim();
if(op==='artifact'){
 const pack=validateChapter(JSON.parse(read(input))),scene=pack.scenes.find(s=>s.id===parent);
 if(!scene)throw Error('No such scene in the validated chapter.');
 console.log(JSON.stringify({schema:'friken.ghost.artifact-recipe.v1',
  id:pack.id+'/'+scene.id,format:'chromatic-csg-v1',
  source:{chapterId:pack.id,sceneId:scene.id,chapterPackSha256:sha256(canonicalData(pack))},
  recipe:scene.artifact,bounds:sdfBounds(scene.artifact),nativeAdapter:'not-implemented'},null,2));
}
else if(op==='audit'){const pack=validateChapter(JSON.parse(read(input)));console.log(JSON.stringify(storyAudit(pack),null,2));}
else if(op==='request')fs.writeFileSync(parent,JSON.stringify(chapterRequest(decodePlaySeed(read(input)),{repository:'https://github.com/friken0/friken-ghost-mind',manifest:'https://raw.githubusercontent.com/friken0/friken-ghost-mind/main/registry.json'}),null,2)+'\n');
else if(op==='validate-release'){validateChapterRelease(JSON.parse(read(input)));console.log('VALID public chapter');}
else if(op==='validate'){validateChapter(JSON.parse(read(input)));console.log('VALID chapter pack');}
else if(op==='admit'){const pack=JSON.parse(read(input)),state=createChapter(pack,parent==='-'?null:decodePlaySeed(read(parent)));fs.writeFileSync(output,encodePlaySeed(state)+'\n');console.log('ADMITTED',pack.id,'chapter',state.chapter);}
else throw Error('Usage: artifact CHAPTER.json SCENE_ID | audit CHAPTER.json | request SEED_FILE OUTPUT.json | validate CHAPTER.json | admit CHAPTER.json PARENT.seed|- OUTPUT.seed');
