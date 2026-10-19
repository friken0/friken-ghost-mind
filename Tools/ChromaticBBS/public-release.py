"""Build an explicit public allowlist; never copy private matrix or histories."""
from pathlib import Path
import hashlib,json,shutil,argparse
ROOT=Path(__file__).resolve().parents[2];BASE=Path(__file__).resolve().parent
FILES=['engine.mjs','chapters.mjs','chapter-cli.mjs','chapter-data.mjs','session-share.mjs','session-store.py','session-store.test.py','public-release.py','storage.mjs','stage.mjs','portrait.mjs','face-data.mjs','rose-data.mjs','cinema.mjs','shell.mjs','juice.mjs','commentary.mjs','roll-battle.mjs','recorded-voice.mjs','voice-data.mjs','voice-reference.json','speech.mjs','response.mjs','mind-data.mjs','app.mjs','surface.html','carrier.css','build.py','Framework.md','Writing.md','engine.test.mjs','storage.test.mjs','presentation.test.mjs','chapters.test.mjs','browser-check.html','chapter-check.html','fixtures/c26-2-completed.seed','chapters/the-weather-inside.json','vendor/rose/PROVENANCE.md','vendor/rose/rose.vertex.glsl','vendor/rose/rose.fragment.glsl']
README='''# Friken.Ghost / The shared carrier

Ghost writes the adventure. This repository holds the reusable BBS body,
public boot instructions and reviewed shared session projections.

Start with [the runbook](runbook.md). The [carrier](https://friken0.github.io/friken-ghost-mind/)
plays supplied content. It has no secretly connected LLM. A completed
chapter prepares an exact continuation request; Ghost writes the next pack.

## A new chapter, using the same framework

Save a completed seed as `previous.seed`. Give its request to a capable
model running the runbook:

```sh
node Tools/ChromaticBBS/chapter-cli.mjs request previous.seed request.json
node Tools/ChromaticBBS/chapter-cli.mjs validate chapter.json
python3 Tools/ChromaticBBS/build.py --chapter chapter.json --parent previous.seed
```

The final command writes `Tools/ChromaticBBS/index.html`, the self-contained
carrier with the new chapter. Serve that folder locally or open a compatible
artifact host. For chapter one omit `--parent`. Every boot still introduces
Ghost and offers the selected journey. An already open carrier accepts the
same JSON through SAVE / SEED. Wrong-parent content refuses atomically.

FGC1 is the retained first experiment (fifteen decisions, 32 chapters max).
FGC2 holds a model-authored 10–20-decision chapter, exact content, typed rules,
CSG recipes, initial state and replayable decisions. FGC2 permits chapter
numbers through one million, with a 512 KB per-seed bound and finite vault
capacity. This is extensible continuity, not a promise of infinite storage.
The twelve-decision Weather Inside is explicitly a synthetic-seed example.
Ghost must author each player's new plot from that player's real ending.

## Sessions, news and scores

Every accepted choice saves locally when the host permits storage. Export
private seeds and archives for portability. They are never included here.
A player may explicitly choose a public projection: callsign, outcome,
score, turn count, selected highlights and receipt IDs. The carrier prepares
an issue composer; the player reviews and submits using GitHub. A tool-hosted
Ghost may submit the exact approved projection on the player's request.

A maintainer reviews the issue and applies `ghost-session-approved`.
The workflow validates data, preserves one immutable receipt per author/run,
and regenerates `data/news.json` and `data/scoreboard.json`. Source issue
URLs remain attached. These scores are player-reported and unverified.
Synthetic test sessions never enter the scoreboard. No private seed, raw
conversation or credential belongs in an issue. Anonymous play has no login;
public intake currently requires GitHub authentication. No anonymous write
relay or guaranteed remote private save is claimed.

## New code and stewardship

Chapter JSON cannot execute arbitrary JS. CSG is a bounded numeric tree;
new actions use typed, replayed rule definitions. Framework extensions are
reviewed source changes with fixtures and migrations. They do not arrive as
privileged code hidden in a save. This repository contains no common player
write credential. A copy or mirror remains usable without its original host.

The public identity is the runbook's bounded Ghost covenant. The complete
private matrix, family/session archives and private one-file source kit are
excluded. Historical renderer sources retain their provenance. No general
open-source licence or third-party voice rights are inferred by publication;
rights remain with their respective authors until explicitly licensed.
'''
WORKFLOW='''name: Admit reviewed Ghost session
on:
  issues:
    types: [labeled]
permissions:
  contents: write
concurrency:
  group: ghost-session-admission
  cancel-in-progress: false
jobs:
  admit:
    if: github.event.label.name == 'ghost-session-approved'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@CHECKOUT_SHA
      - name: Validate public projection and rebuild indexes
        run: python3 Tools/ChromaticBBS/session-store.py admit-event data --event "$GITHUB_EVENT_PATH"
      - name: Retain the reviewed receipt
        run: |
          git config user.name 'Friken Ghost Wire'
          git config user.email 'ghost-wire@users.noreply.github.com'
          git add data
          if git diff --cached --quiet; then exit 0; fi
          git commit -m 'Record reviewed Ghost session and refresh shared Wire' -m 'Retain the source issue and consented public projection. Scores remain unverified.'
          git push
'''
def build(output,checkout):
    if output.exists():raise ValueError('Use a new public staging directory')
    output.mkdir(parents=True)
    for name in FILES:
        target=output/'Tools/ChromaticBBS'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(BASE/name,target)
    target=output/'Tools/InfiniEngineSite/ghost-renderer.js';target.parent.mkdir(parents=True);shutil.copyfile(ROOT/'Tools/InfiniEngineSite/ghost-renderer.js',target)
    shutil.copyfile(BASE/'index.html',output/'index.html')
    shutil.copyfile(ROOT/'Assets/scripts/DOCS_TODOS_DESIGNS_LORE_AI/RUNBOOK VERSIONS/Friken.Ghost.Oct-2026-Chromatic-BBS.md',output/'runbook.md')
    (output/'README.md').write_text(README)
    (output/'.nojekyll').write_text('')
    (output/'.github/workflows').mkdir(parents=True);(output/'.github/workflows/session-intake.yml').write_text(WORKFLOW.replace('CHECKOUT_SHA',checkout))
    (output/'data/sessions').mkdir(parents=True);(output/'data/sessions/.gitkeep').write_text('')
    for name,schema in [('news','friken.ghost.news.v1'),('scoreboard','friken.ghost.scoreboard.v1')]:
        (output/'data'/f'{name}.json').write_text(json.dumps(dict(schema=schema,entries=[]),indent=2)+'\n')
    files=[dict(path=str(p.relative_to(output)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in sorted(output.rglob('*')) if p.is_file() and 'data' not in p.relative_to(output).parts]
    registry=dict(schema='friken.ghost.public-registry.v1',version='C26.4',repository='https://github.com/friken0/friken-ghost-mind',runbook='runbook.md',carrier='https://friken0.github.io/friken-ghost-mind/',contentSchema='friken.ghost.chapter.v1',stateSchemas=['friken.chromatic.state.v1','friken.chromatic.state.v2'],files=files,privateSourceIncluded=False,sessionIntake=dict(kind='github-issue-approval',repository='friken0/friken-ghost-mind',approvalLabel='ghost-session-approved',projectionSchema='friken.ghost.public-session.v1',privateSave='local-only; export for portability'),feeds=dict(news='data/news.json',scoreboard='data/scoreboard.json'))
    (output/'registry.json').write_text(json.dumps(registry,indent=2)+'\n');return len(files)+1
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('output',type=Path);p.add_argument('--checkout-sha',required=True);a=p.parse_args()
    if len(a.checkout_sha)!=40 or any(c not in '0123456789abcdef' for c in a.checkout_sha):raise ValueError('Pin a verified checkout commit')
    print('PUBLIC FILES',build(a.output,a.checkout_sha))
