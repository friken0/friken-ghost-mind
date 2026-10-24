"""Build an explicit public allowlist; never copy private matrix or histories."""
from pathlib import Path
import hashlib,json,shutil,argparse
ROOT=Path(__file__).resolve().parents[2];BASE=Path(__file__).resolve().parent
FILES=['Packing-Results.md','packing_benchmark.py','packing-results.json','comprehension-results.json','runbook-packing-results.json','canon.mjs','canon.test.mjs','chapter-library.mjs','engine.mjs','chapters.mjs','chapter-cli.mjs','chapter-data.mjs','session-share.mjs','session-store.py','session-store.test.py','public-release.py','storage.mjs','stage.mjs','portrait.mjs','face-data.mjs','rose-data.mjs','cinema.mjs','shell.mjs','juice.mjs','commentary.mjs','roll-battle.mjs','recorded-voice.mjs','voice-data.mjs','voice-reference.json','speech.mjs', 'neural-voice.mjs','response.mjs','mind-data.mjs','app.mjs','surface.html','carrier.css','build.py','Framework.md','Writing.md','engine.test.mjs','storage.test.mjs','presentation.test.mjs','chapters.test.mjs','browser-check.html','neural-check.html','Voice-Research.md','chapter-check.html','fixtures/c26-2-completed.seed','chapters/the-weather-inside.json','vendor/rose/PROVENANCE.md','vendor/rose/rose.vertex.glsl','vendor/rose/rose.fragment.glsl']
FILES += ['creation.mjs', 'causality.mjs', 'causality.test.mjs', 'life-theater.mjs', 'audio.mjs', 'modem.mjs', 'music-data.mjs', 'art-data.mjs', 'chapters/lot-forty-seven.json', 'media/human-salvage-frame.png', 'media/README.md', 'media/manifest.json', 'moknon-cli.mjs', 'moknon.test.mjs', 'lore/README.md', 'lore/seed.json', 'lore/manifest.json', 'lore/art-manifest.json', 'lore/Source-Map.md', 'vendor/masha/PROVENANCE.md']
FILES += ['Onboarding-Hints.md', 'Onboarding-Arcs.md', 'Onboarding-Arcs.Design-v1.md', 'Onboarding-Research.md']
FILES += ['neural-voice.test.mjs']
FILES += ['alien-check.html','alien-comms.mjs','boot-world.mjs','audio.test.mjs','life-theater.test.mjs','battle-check.html']
FILES += ['story-guidance.mjs', 'story.test.mjs', 'fixtures/c26-13-unfinished.seed']
FILES += ['storycraft.mjs', 'storycraft.test.mjs', 'Story-Bible.md', 'fixtures/c26-14-unfinished.seed']
FILES += ['scanner.mjs', 'image-cinema.mjs', 'signal.test.mjs']
FILES += ['signal-check-source.html', 'signal-check.html','facial-rig.mjs','facial-rig.test.mjs','dream-face.mjs','staging.mjs','staging-art.mjs','staging.test.mjs','media/lot47-shared-reset.webp','media/lot47-provenance.json','Side-Quest-Continuity.md','Else-The-Unchosen.md','For-Masha-The-Math-Behind-the-Face.md','Face-Performance-2026-10-22.md','Voice-Performance-2026-10-22.md']
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
    if: github.event.label.name == 'ghost-session-approved' || github.event.label.name == 'ghost-chapter-approved'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@CHECKOUT_SHA
        with:
          ref: main
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
    for record in json.loads((BASE/'media/manifest.json').read_text())['tracks']:
        for prefix in [output,output/'Tools/ChromaticBBS']:
            target=prefix/record['path'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(BASE/record['path'],target)
    for source in (BASE/'lore/art').glob('*.jpg'):
        target=output/'Tools/ChromaticBBS/lore/art'/source.name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
    shutil.copyfile(BASE/'index.html',output/'index.html')
    shutil.copyfile(BASE/'index.html',output/'ghostlink.html')
    shutil.copyfile(ROOT/'Assets/scripts/DOCS_TODOS_DESIGNS_LORE_AI/RUNBOOK VERSIONS/Friken.Ghost.Oct-2026-Chromatic-BBS.md',output/'runbook.md')
    (output/'README.md').write_text(__import__('re').sub(r'\]\(([^)]+)\)',lambda m:'](Tools/ChromaticBBS/'+m[1]+')' if (BASE/m[1]).is_file() else m[0],(BASE/'README.md').read_text())+'\nPublic boot instructions: [runbook.md](runbook.md).\nPublic player carrier: https://friken0.github.io/friken-ghost-mind/.\n')
    (output/'.nojekyll').write_text('')
    (output/'.github/workflows').mkdir(parents=True);(output/'.github/workflows/session-intake.yml').write_text(WORKFLOW.replace('CHECKOUT_SHA',checkout))
    (output/'data/sessions').mkdir(parents=True);(output/'data/sessions/.gitkeep').write_text('')
    (output/'data/chapters').mkdir();(output/'data/chapters/.gitkeep').write_text('')
    (output/'data/chapters.json').write_text(json.dumps(dict(schema='friken.ghost.chapter-catalogue.v1',entries=[]),indent=2)+'\n')
    for name,schema in [('news','friken.ghost.news.v1'),('scoreboard','friken.ghost.scoreboard.v1')]:
        (output/'data'/f'{name}.json').write_text(json.dumps(dict(schema=schema,entries=[]),indent=2)+'\n')
    files=[dict(path=str(p.relative_to(output)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in sorted(output.rglob('*')) if p.is_file() and 'data' not in p.relative_to(output).parts]
    registry=dict(schema='friken.ghost.public-registry.v1',version='C26.27-TheReply',repository='https://github.com/friken0/friken-ghost-mind',runbook='runbook.md',carrier='https://friken0.github.io/friken-ghost-mind/ghostlink.html',contentSchema='friken.ghost.chapter.v1',stateSchemas=['friken.chromatic.state.v1','friken.chromatic.state.v2'],files=files,privateSourceIncluded=False,sessionIntake=dict(kind='github-issue-approval',repository='friken0/friken-ghost-mind',approvalLabel='ghost-session-approved',projectionSchema='friken.ghost.public-session.v1',privateSave='local-only; export for portability'),feeds=dict(news='data/news.json',scoreboard='data/scoreboard.json',chapters='data/chapters.json'))
    (output/'registry.json').write_text(json.dumps(registry,indent=2)+'\n');return len(files)+1
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('output',type=Path);p.add_argument('--checkout-sha',required=True);a=p.parse_args()
    if len(a.checkout_sha)!=40 or any(c not in '0123456789abcdef' for c in a.checkout_sha):raise ValueError('Pin a verified checkout commit')
    print('PUBLIC FILES',build(a.output,a.checkout_sha))
