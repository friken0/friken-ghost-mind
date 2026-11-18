// The browser worker passes this signed integer into the shared C# composer.
import {mountScorePlayer} from './infinigen/score-player.mjs?v=score-windows-1';

export function mountFrikStudyScore(audio, stage, status, {ensemble=false}={}) {
  const player = mountScorePlayer(audio, (state,arrangement) => {
    stage.dataset.scoreState = state;
    if(arrangement){
      stage.dataset.scoreSeconds=String(arrangement.seconds);
      stage.dataset.scoreComposeMs=arrangement.composeMs.toFixed(1);
      stage.dataset.scoreRenderMs=arrangement.renderMs.toFixed(1);
      stage.dataset.scoreTracks=String(arrangement.tracks);
      stage.dataset.scoreNotes=String(arrangement.notes);
      stage.dataset.scoreFirstMs=arrangement.firstMs.toFixed(1);
      stage.dataset.scoreUnderruns=String(arrangement.underruns);
    }
    status(state);
  });
  const seed=crypto.getRandomValues(new Int32Array(1))[0]&0x7fffffff;
  const source={race:'FrikBridge',seed,ensemble};
  stage.dataset.scoreSeed=String(seed);
  return {
    prepare:()=>player.prepare(source).catch(error=>{stage.dataset.scoreState=error.message;status(error.message);}),
    play:()=>player.play(source,{gain:1}),
    stop:player.stop,
  };
}
