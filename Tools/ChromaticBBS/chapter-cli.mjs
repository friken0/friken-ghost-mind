/** Code-host entry point used by BOOT: validate before mounting content. */
import fs from 'node:fs';
import {validateChapter,decodePlaySeed,encodePlaySeed,createChapter,chapterRequest} from './chapters.mjs';
const [op,input,parent,output]=process.argv.slice(2);
const read=p=>fs.readFileSync(p,'utf8').trim();
if(op==='request')fs.writeFileSync(parent,JSON.stringify(chapterRequest(decodePlaySeed(read(input)),{repository:'https://github.com/friken0/friken-ghost-mind',manifest:'https://raw.githubusercontent.com/friken0/friken-ghost-mind/main/registry.json'}),null,2)+'\n');
else if(op==='validate'){validateChapter(JSON.parse(read(input)));console.log('VALID chapter pack');}
else if(op==='admit'){const pack=JSON.parse(read(input)),state=createChapter(pack,parent==='-'?null:decodePlaySeed(read(parent)));fs.writeFileSync(output,encodePlaySeed(state)+'\n');console.log('ADMITTED',pack.id,'chapter',state.chapter);}
else throw Error('Usage: request SEED_FILE OUTPUT.json | validate CHAPTER.json | admit CHAPTER.json PARENT.seed|- OUTPUT.seed');
