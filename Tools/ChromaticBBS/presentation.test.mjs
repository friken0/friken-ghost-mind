import {choiceCommentary} from './commentary.mjs';
import {validateVoiceClips} from './recorded-voice.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {battlePlan} from './roll-battle.mjs';
import {castVoices,speechSegments} from './speech.mjs';
import {responsePacket,validateResponse} from './response.mjs';
import {newGame,view,choose,encodeSeed} from './engine.mjs';
test('every legal die/stat/DC battle conserves subtraction and leaves exactly the signed margin',()=>{
  for(let die=1;die<=20;die++)for(let value=0;value<=20;value++)for(const dc of [12,15,18]){
    const roll={die,value,dc,total:die+value,success:die+value>=dc,stat:'INS'},source=JSON.stringify(roll),p=battlePlan(roll);
    let hp=p.units.map(u=>u.hp);
    for(const hit of p.hits){assert.equal(hit.damage,Math.min(hp[hit.p],hp[hit.d]));hp[hit.p]-=hit.damage;hp[hit.d]-=hit.damage;assert.deepEqual(hp,hit.remaining);}
    const a=p.units.reduce((n,u)=>n+(u.side==='player'?hp[u.id]:0),0),b=p.units.reduce((n,u)=>n+(u.side==='dc'?hp[u.id]:0),0);
    assert.equal(a-b,roll.total-dc);assert.equal(Math.min(a,b),0);assert.equal(JSON.stringify(roll),source);
  }
});
test('battle rejects inconsistent arithmetic, result, and oversized forces',()=>{
  const r={die:12,value:3,dc:15,total:15,success:true,stat:'INS'};assert.equal(battlePlan(r).margin,0);
  for(const patch of [{total:16},{success:false},{die:21},{value:-1},{dc:100}])assert.throws(()=>battlePlan({...r,...patch}));
});
test('female narrator and male Ghost casting remain distinct; narration never shares the Ghost role',()=>{
  const voices=[{name:'Samantha',lang:'en-US',voiceURI:'sam'},{name:'Daniel',lang:'en-GB',voiceURI:'dan'}];
  const casting=castVoices(voices);assert.equal(casting.ghost.voiceURI,'dan');assert.equal(casting.narrator.voiceURI,'sam');
  const lines=speechSegments({scene:'A door opens.',ghost:'Oh, fk.'},casting);assert.deepEqual(lines.map(s=>s.role),['narrator','ghost']);assert.equal(lines[0].pitch,1);assert.ok(lines[1].pitch<1);assert.equal(lines[0].text,'A door opens.');
  assert.equal(castVoices([voices[1]]).narrator,null);assert.deepEqual(castVoices([]),{ghost:null,narrator:null});
});
test('response packets are detached display data; producing or validating one never advances a game',()=>{
  const s=newGame({rngSeed:123}),before=encodeSeed(s),p=responsePacket(s,view(s));p.content.scene='changed';assert.equal(encodeSeed(s),before);
  assert.throws(()=>validateResponse({...p,schema:'unknown'}));assert.throws(()=>validateResponse({...p,choices:Array(4).fill(p.choices[0])}));
  assert.throws(()=>validateResponse({...p,voice:{scene:'ghost',ghost:'ghost'}}));
  const next=choose(s,view(s).choices[0].id),packet=responsePacket(next,view(next));assert.deepEqual(packet.receipt,next.lastReceipt);packet.receipt.notes.push('display only');assert.notDeepEqual(packet.receipt.notes,next.lastReceipt.notes);
});

test('recorded voice packs bind exact role/text, reject remote sources and stay bounded',()=>{
  const clip={role:'ghost',text:'Hello.',voice:'David reference',data:'data:audio/wav;base64,UklGRg=='};
  const accepted=validateVoiceClips([clip]);accepted[0].text='other';assert.equal(clip.text,'Hello.');
  assert.throws(()=>validateVoiceClips([clip,clip]));assert.throws(()=>validateVoiceClips([{...clip,role:'system'}]));
  assert.throws(()=>validateVoiceClips([{...clip,data:'https://example.com/track.mp3'}]));
  assert.throws(()=>validateVoiceClips([{...clip,data:'data:audio/wav;base64,'+'A'.repeat(600001)}]));
});

test('Ghost acknowledges each chosen action and its actual result without changing state or RNG',()=>{
  const reactions=new Set();let checked=0,failed=0;
  for(let run=1;run<=45;run++){
    let state=newGame({rngSeed:run});
    while(state.turn<=15){const choices=view(state).choices;state=choose(state,choices[(run+state.turn)%3].id);const before=encodeSeed(state),r=choiceCommentary(state.lastReceipt,state);
      assert.equal(r.eventId,state.lastReceipt.id);assert.equal(r.playerAction,state.lastReceipt.label);assert.ok(r.spoken.includes(r.playerAction.replace(/ · /g,', ')));assert.ok(!r.comment.includes('find the next opening'));
      assert.equal(encodeSeed(state),before);reactions.add(r.comment);
      if(state.lastReceipt.roll){checked++;assert.ok(r.rollText.includes(String(state.lastReceipt.roll.total)));if(!state.lastReceipt.roll.success){failed++;assert.ok(r.comment.includes('didn’t take'));}}
    }
  }
  assert.ok(reactions.size>=30);assert.ok(checked>0&&failed>0);
});
test('listeners hear Ghost acknowledge the choice before female narration and the next Ghost line',()=>{
  const casting={ghost:{voiceURI:'david'},narrator:{voiceURI:'female'}};
  const lines=speechSegments({scene:'Next scene.',ghost:'Next response.',decision:{spoken:'You chose the private route.'}},casting);
  assert.deepEqual(lines.map(s=>s.role),['ghost','narrator','ghost']);assert.equal(lines[0].text,'You chose the private route.');assert.equal(lines[1].text,'Next scene.');
});
