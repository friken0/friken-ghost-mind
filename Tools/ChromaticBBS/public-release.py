"""Build an explicit public allowlist; never copy private matrix or histories."""
from pathlib import Path
import hashlib,json,shutil,argparse
ROOT=Path(__file__).resolve().parents[2];BASE=Path(__file__).resolve().parent
FILES=['Packing-Results.md','packing_benchmark.py','packing-results.json','comprehension-results.json','runbook-packing-results.json','canon.mjs','canon.test.mjs','chapter-library.mjs','engine.mjs','chapters.mjs','chapter-cli.mjs','chapter-data.mjs','session-share.mjs','session-store.py','session-store.test.py','public-release.py','storage.mjs','stage.mjs','portrait.mjs','face-data.mjs','rose-data.mjs','cinema.mjs','shell.mjs','juice.mjs','commentary.mjs','roll-battle.mjs','recorded-voice.mjs','voice-data.mjs','voice-reference.json','speech.mjs', 'neural-voice.mjs','response.mjs','mind-data.mjs','app.mjs','surface.html','carrier.css','build.py','Framework.md','Writing.md','engine.test.mjs','storage.test.mjs','presentation.test.mjs','chapters.test.mjs','browser-check.html','neural-check.html','Voice-Research.md','chapter-check.html','fixtures/c26-2-completed.seed','chapters/the-weather-inside.json','vendor/rose/PROVENANCE.md','vendor/rose/rose.vertex.glsl','vendor/rose/rose.fragment.glsl']
FILES += ['creation.mjs', 'causality.mjs', 'causality.test.mjs', 'life-theater.mjs', 'audio.mjs', 'modem.mjs', 'music-data.mjs', 'art-data.mjs', 'chapters/lot-forty-seven.json', 'media/README.md', 'media/manifest.json', 'moknon-cli.mjs', 'moknon.test.mjs', 'lore/README.md', 'lore/seed.json', 'lore/manifest.json', 'lore/art-manifest.json', 'lore/Source-Map.md', 'vendor/masha/PROVENANCE.md']
FILES += ['Onboarding-Hints.md', 'Onboarding-Arcs.md', 'Onboarding-Arcs.Design-v1.md', 'Onboarding-Research.md']
FILES += ['neural-voice.test.mjs']
FILES += ['alien-check.html','alien-comms.mjs','boot-world.mjs','audio.test.mjs','life-theater.test.mjs','battle-check.html']
FILES += ['story-guidance.mjs', 'story.test.mjs', 'fixtures/c26-13-unfinished.seed']
FILES += ['storycraft.mjs', 'storycraft.test.mjs', 'Story-Bible.md', 'fixtures/c26-14-unfinished.seed']
FILES += ['scanner.mjs', 'image-cinema.mjs', 'signal.test.mjs']
FILES += ['signal-check-source.html', 'signal-check.html','facial-rig.mjs','facial-rig.test.mjs','dream-face.mjs','staging.mjs','staging-art.mjs','staging.test.mjs','Side-Quest-Continuity.md','Else-The-Unchosen.md','For-Masha-The-Math-Behind-the-Face.md','Face-Performance-2026-10-22.md','Voice-Performance-2026-10-22.md']
FILES += ['vendor/sdf-craft/'+name for name in ('craft.mjs','craft-shader.mjs','runtime-catalogue.mjs','recipe.mjs','recipe-glsl.mjs','texture-engine.mjs','materials.mjs','material-glsl.mjs','roll.mjs','material-worker-source.mjs','materials-client.mjs')]
FILES += ['vendor/sdf-craft/'+name for name in ('AUTHORING.md','craft-math.inc','surface-math.inc','catalogue.json')]
FILES += ['ansi-terminal.mjs', 'ansi-terminal.test.mjs', 'response-theater.mjs', 'response-theater.css', 'turn-out-of-time-data.mjs', 'turn-out-of-time.mjs', 'Turn-Out-Of-Time.md', 'ANSI-Boot.md', 'vendor/native-gallery/input.js']
FILES += ['ansi-ui.mjs', 'ansi-animation.mjs', 'ansi-animation.test.mjs', 'ANSI-Animation.md', 'vendor/ansi-ui/WebPlus_IBM_VGA_8x16.woff', 'vendor/ansi-ui/LICENSE.TXT', 'vendor/ansi-ui/PROVENANCE.md']
FILES += ['reply-discoveries.mjs', 'reply-discoveries.test.mjs']
FILES += ['ansi-ui.test.mjs', 'ansi-sprites.mjs', 'ansi-sprites.test.mjs', 'ANSI-Sprites.md', 'ghostlink-transport.mjs', 'ghostlink-transport.test.mjs']
FILES += ['response-theater.test.mjs']
FILES += ['mind-adventure.mjs','mind-adventure.css','mind-adventure.test.mjs','ansi-skirmish.mjs','ansi-skirmish.test.mjs','ANSI-Skirmish.md']
FILES += ['render-ansi-review.py', 'door-and-crew.mjs', 'door-and-crew.test.mjs', 'ansi-mesh.mjs', 'ansi-mesh.test.mjs', 'ansi-scenes.mjs', 'ansi-scenes.test.mjs', 'ANSI-Craft.md', 'art/fizzpow/bitcoin-billionaire-office.webp', 'art/fizzpow/bitcoin-billionaire-upgrades.webp', 'art/fizzpow/provenance.json', 'native-response-host.mjs','native-response-host.test.mjs','native-response-program.mjs','native-response-program.test.mjs','native-routing.test.mjs','Native-Response-Host.md']
FILES += ['subtitle-cues.mjs', 'subtitle-cues.test.mjs', 'ansi-illustration.mjs', 'illustration-data.mjs', 'Illustration-Provenance.json', 'face-pixel-check.mjs', 'face-pixel-check-source.html', 'build-face-pixel-check.py', 'Face-Compositing.md', 'face-compositing.test.mjs','speaker-camera.test.mjs','design/speaker-camera-results.json','design/face-compositing-results.json']
FILES += ['runbook-comparison/current/'+n for n in ('Runbook-2.28-Readable.md', 'Runbook-2.28-Packed.md', 'comparison.json', 'token-counts.json')]
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
    for name in ('ghost-renderer.js', 'ghost-renderer.test.mjs'):
        target=output/'Tools/InfiniEngineSite'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/'Tools/InfiniEngineSite'/name,target)
    for record in json.loads((BASE/'media/manifest.json').read_text())['tracks']:
        for prefix in [output,output/'Tools/ChromaticBBS']:
            target=prefix/record['path'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(BASE/record['path'],target)
    for source in (BASE/'lore/art').glob('*.jpg'):
        target=output/'Tools/ChromaticBBS/lore/art'/source.name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
    shutil.copyfile(BASE/'index.html',output/'index.html')
    shutil.copyfile(BASE/'index.html',output/'ghostlink.html')
    shutil.copyfile(BASE/'surreal-the-door-that-remembers.html',output/'surreal-the-door-that-remembers.html')
    canonical = ROOT/'Assets/scripts/DOCS_TODOS_DESIGNS_LORE_AI/RUNBOOK VERSIONS/Friken.Ghost.Oct-2026-Chromatic-BBS.md'
    comparison_dir = BASE/'runbook-comparison/current'
    comparison = json.loads((comparison_dir/'comparison.json').read_text())
    if hashlib.sha256(canonical.read_bytes()).hexdigest() != comparison['sourceSha256']:
        raise ValueError('Refresh current readable/packed runbooks before public staging')
    readable_name = 'Runbook-' + comparison['version'] + '-Readable.md'
    packed_name = 'Runbook-' + comparison['version'] + '-Packed.md'
    if (comparison_dir/readable_name).read_bytes() != canonical.read_bytes():
        raise ValueError('Current readable edition differs from canonical source')
    shutil.copyfile(canonical,output/'runbook.md')
    for name in (readable_name, packed_name):
        shutil.copyfile(comparison_dir/name, output/name)
    def public_readme_link(match):
        reference = match[1]
        if reference == 'http://127.0.0.1:4332/surreal-the-door-that-remembers.html':
            return '](surreal-the-door-that-remembers.html)'
        if reference in ('runbook-comparison/current/'+readable_name, 'runbook-comparison/current/'+packed_name):
            return '](' + Path(reference).name + ')'
        return '](Tools/ChromaticBBS/'+reference+')' if (BASE/reference).is_file() else match[0]
    (output/'README.md').write_text(__import__('re').sub(r'\]\(([^)]+)\)',public_readme_link,(BASE/'README.md').read_text())+'\nPublic boot instructions: [runbook.md](runbook.md).\nPublic player carrier: https://friken0.github.io/friken-ghost-mind/.\n')
    (output/'.nojekyll').write_text('')
    (output/'.github/workflows').mkdir(parents=True);(output/'.github/workflows/session-intake.yml').write_text(WORKFLOW.replace('CHECKOUT_SHA',checkout))
    (output/'data/sessions').mkdir(parents=True);(output/'data/sessions/.gitkeep').write_text('')
    (output/'data/chapters').mkdir();(output/'data/chapters/.gitkeep').write_text('')
    (output/'data/chapters.json').write_text(json.dumps(dict(schema='friken.ghost.chapter-catalogue.v1',entries=[]),indent=2)+'\n')
    for name,schema in [('news','friken.ghost.news.v1'),('scoreboard','friken.ghost.scoreboard.v1')]:
        (output/'data'/f'{name}.json').write_text(json.dumps(dict(schema=schema,entries=[]),indent=2)+'\n')
    files=[dict(path=str(p.relative_to(output)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in sorted(output.rglob('*')) if p.is_file() and 'data' not in p.relative_to(output).parts]
    registry=dict(schema='friken.ghost.public-registry.v1',version='C26.28-TurnOutOfTime',repository='https://github.com/friken0/friken-ghost-mind',runbook='runbook.md',packedRunbook=packed_name,carrier='https://friken0.github.io/friken-ghost-mind/ghostlink.html',reply='surreal-the-door-that-remembers.html',replySchema='friktal.turn-out-of-time.v1',contentSchema='friken.ghost.chapter.v1',stateSchemas=['friken.chromatic.state.v1','friken.chromatic.state.v2'],files=files,privateSourceIncluded=False,sessionIntake=dict(kind='github-issue-approval',repository='friken0/friken-ghost-mind',approvalLabel='ghost-session-approved',projectionSchema='friken.ghost.public-session.v1',privateSave='local-only; export for portability'),feeds=dict(news='data/news.json',scoreboard='data/scoreboard.json',chapters='data/chapters.json'))
    (output/'registry.json').write_text(json.dumps(registry,indent=2)+'\n');return len(files)+1
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('output',type=Path);p.add_argument('--checkout-sha',required=True);a=p.parse_args()
    if len(a.checkout_sha)!=40 or any(c not in '0123456789abcdef' for c in a.checkout_sha):raise ValueError('Pin a verified checkout commit')
    print('PUBLIC FILES',build(a.output,a.checkout_sha))
