// The browser worker passes this signed integer into the shared C# composer.
import {mountScorePlayer} from './infinigen/score-player.mjs?v=ensemble-1';

export function mountFrikStudyScore(audio, stage, status, {ensemble=false}={}) {
  const player = mountScorePlayer(audio, (state,arrangement) => {
    stage.dataset.scoreState = state;
    if(arrangement){
      stage.dataset.scoreTracks=String(arrangement.tracks);
      stage.dataset.scoreNotes=String(arrangement.notes);
    }
    status(state);
  });
  let previous;
  return {
    play() {
      let seed = crypto.getRandomValues(new Int32Array(1))[0] & 0x7fffffff;
      if (seed === previous) seed = (seed + 1) & 0x7fffffff;
      previous = seed;
      delete stage.dataset.scoreTracks;delete stage.dataset.scoreNotes;
      stage.dataset.scoreSeed = String(seed);
      return player.play({race: 'FrikBridge', seed, ensemble}, {gain: .9, targetRms: .12});
    },
    stop: player.stop,
  };
}
