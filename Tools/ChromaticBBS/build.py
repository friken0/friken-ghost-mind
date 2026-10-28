"""Package the authored specimen as one offline HTML file and chat fragment.

Game code and art are self-contained. Shared-Wire reads occur only through
the explicit public-feed control; no model or write credential is bundled.
The canonical editable sources stay beside this script.
"""
from pathlib import Path
import argparse
import re
import json
import subprocess
import tempfile
import posixpath

base = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--fragment', type=Path)
parser.add_argument('--chapter', type=Path)
parser.add_argument('--parent', type=Path)
parser.add_argument('--output', type=Path, help='Write only this HTML carrier; preserve the default carrier and fixtures')
parser.add_argument('--dream-preview', action='store_true', help='Build the completed Dream XIII response alias and fixtures')
parser.add_argument('--turn-out-of-time', action='store_true', help='Build the single-view authored reply for Surreal')
parser.add_argument('--serve', action='store_true', help='Serve this carrier on loopback with threaded neural-audio headers')
parser.add_argument('--port', type=int, default=4331)
args = parser.parse_args()
sources = []
for name in ('vendor/sdf-craft/craft.mjs','vendor/sdf-craft/craft-shader.mjs','vendor/sdf-craft/runtime-catalogue.mjs','vendor/sdf-craft/recipe.mjs','vendor/sdf-craft/recipe-glsl.mjs','vendor/sdf-craft/texture-engine.mjs','vendor/sdf-craft/material-worker-source.mjs','vendor/sdf-craft/materials-client.mjs','vendor/sdf-craft/materials.mjs','vendor/sdf-craft/material-glsl.mjs','vendor/sdf-craft/roll.mjs','facial-rig.mjs','music-data.mjs','modem.mjs','audio.mjs','art-data.mjs','alien-comms.mjs','creation.mjs','causality.mjs','engine.mjs', 'canon.mjs', 'scanner.mjs', 'image-cinema.mjs', 'storycraft.mjs', 'staging-art.mjs','staging.mjs', 'chapters.mjs', 'storage.mjs', '../InfiniEngineSite/ghost-renderer.js',
             'dream-face.mjs','face-data.mjs', 'portrait.mjs', 'rose-data.mjs', 'stage.mjs',
             'ansi-animation.mjs','ansi-ui.mjs','ansi-scenes.mjs','ansi-terminal.mjs','ansi-mesh.mjs','boot-world.mjs', 'cinema.mjs', 'chapter-library.mjs', 'session-share.mjs', 'chapter-data.mjs', 'commentary.mjs', 'shell.mjs', 'juice.mjs', 'life-theater.mjs','roll-battle.mjs', 'recorded-voice.mjs', 'voice-data.mjs', 'neural-voice.mjs', 'speech.mjs', 'response.mjs', 'mind-data.mjs', 'story-guidance.mjs', 'turn-out-of-time-data.mjs', 'reply-discoveries.mjs', 'door-and-crew.mjs', 'response-theater.mjs','ghostlink-transport.mjs','ansi-sprites.mjs','ansi-skirmish.mjs','mind-adventure.mjs','subtitle-cues.mjs','native-response-host.mjs','illustration-data.mjs','ansi-illustration.mjs','native-response-program.mjs', 'turn-out-of-time.mjs' if args.turn_out_of_time else 'app.mjs'):
    source = (base / name).read_text()
    if name == 'chapter-data.mjs' and args.chapter:
        packet = json.loads(args.chapter.read_text())
        subprocess.run(['node', str(base/'chapter-cli.mjs'), 'validate', str(args.chapter)], check=True)
        parent = args.parent.read_text().strip() if args.parent else None
        # Admission runs the same interpreter, with no artifact execution.
        with tempfile.TemporaryDirectory(prefix='chromatic-admit-') as temporary:
            subprocess.run(['node', str(base/'chapter-cli.mjs'), 'admit', str(args.chapter), str(args.parent) if args.parent else '-', str(Path(temporary)/'admitted.seed')], check=True)
        source = 'export const authoredBoot=' + json.dumps({'pack':packet,'parent':parent}, ensure_ascii=False).replace('</', '<\\/') + ';'

    exports = re.findall(r'^export (?:async )?(?:function|const|class|let) (\w+)', source, re.M)
    def bind_import(match):
        bindings = []
        for binding in match[1].split(','):
            terms = binding.strip().split(' as ')
            bindings.append(terms[0].strip() + (': ' + terms[1].strip() if len(terms)>1 else ''))
        dependency = posixpath.normpath(posixpath.join(posixpath.dirname(name), match[2].split('?', 1)[0]))
        return 'const {' + ','.join(bindings) + '} = carrierModules[' + json.dumps(dependency) + '];'
    source = re.sub(r"^import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"];\s*$", bind_import, source, flags=re.M)
    source = re.sub(r'^export (?=(?:(?:async )?function|const|class|let)\b)', '', source, flags=re.M)
    if re.search(r'^\s*(import|export)\b', source, re.M):
        raise ValueError(f'Unbundled module syntax in {name}')
    sources.append('carrierModules[' + json.dumps(posixpath.normpath(name)) + '] = (() => {\n' + source + '\nreturn {' + ','.join(exports) + '};\n})();')
css=(base/('response-theater.css' if args.turn_out_of_time else 'carrier.css')).read_text()
if args.turn_out_of_time: css+='\n'+(base/'mind-adventure.css').read_text()
surface = '<div id="chromatic-carrier" data-sd-grant="single-view reply"></div><script>'+ (base/'vendor/native-gallery/input.js').read_text()+'</script>' if args.turn_out_of_time else (base/'surface.html').read_text()
fragment = (surface + '\n<style>\n' +
            css + '\n</style>\n<script>\n' +
            '(() => {\nconst carrierModules={};\n' + '\n'.join(sources) + '\n})();\n</script>\n')
if args.dream_preview:
    fragment = fragment.replace('FRAMEWORK C26.26 / WITNESSED SITUATION', 'GHOSTDREAM XIII / THE REPLY / COMPLETE')
    fragment = fragment.replace('CHROMATIC BBS // THE UNFINISHED CARRIER', 'C26.27 // THE REPLY / COMPLETED DREAM')
    fragment = fragment.replace('<h1>FRIKEN.GHOST</h1>', '<h1>GHOSTDREAM XIII</h1>')
document = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>'+('Friken.Ghost · The Door That Remembers · For Surreal' if args.turn_out_of_time else 'GhostLink · The Other Side of Dial Tone')+'</title>'
            '<style>html,body{margin:0;height:100%;overflow:hidden;background:#090b17}</style></head><body>' +
            fragment + '</body></html>\n')
# Isolated synthetic-signal fixture uses the exact same retained renderer and
# audio modules. It cannot depend on an unserved parent-directory module URL.
fixture=(base/'signal-check-source.html').read_text()
match=re.search(r'<script type="module">([\s\S]*)</script>',fixture)
if match and not args.output and not args.turn_out_of_time:
    body=match[1]
    body=re.sub(r"^import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"];",lambda m:'const {'+m[1]+'}=carrierModules['+json.dumps(posixpath.normpath(m[2]))+'];',body,flags=re.M)
    included=('dream-face.mjs','image-cinema.mjs','art-data.mjs','facial-rig.mjs','music-data.mjs','modem.mjs','audio.mjs','../InfiniEngineSite/ghost-renderer.js','face-data.mjs','portrait.mjs')
    modules=[source for source in sources if any(source.startswith('carrierModules['+json.dumps(n)+'] =') for n in included)]
    fixture=fixture[:match.start()]+'<script>const carrierModules={};\n'+'\n'.join(modules)+'\n'+body+'</script>'+fixture[match.end():]
    fixture = fixture.replace("portrait.setVersion('v19.0')", "portrait.setVersion('v20.0')")
    (base/('dream-signal-check.html' if args.dream_preview else 'signal-check.html')).write_text(fixture)
# Focused real-model benchmark, assembled from production owners. No game app.
if args.dream_preview and not args.output and not args.turn_out_of_time:
    bench=(base/'voice-render-bench-source.html').read_text()
    bench_match=re.search(r'<script type="module">([\s\S]*)</script>',bench)
    body=re.sub(r"^import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"];",lambda m:'const {'+m[1]+'}=carrierModules['+json.dumps(posixpath.normpath(m[2]))+'];',bench_match[1],flags=re.M)
    names=('dream-face.mjs','facial-rig.mjs','music-data.mjs','modem.mjs','audio.mjs','../InfiniEngineSite/ghost-renderer.js','face-data.mjs','portrait.mjs','neural-voice.mjs')
    modules=[source for source in sources if any(source.startswith('carrierModules['+json.dumps(n)+'] =') for n in names)]
    bench=bench[:bench_match.start()]+'<script>const carrierModules={};\n'+'\n'.join(modules)+'\n'+body+'</script>'+bench[bench_match.end():]
    (base/'voice-render-bench.html').write_text(bench)

output = args.output or base / ('surreal-the-door-that-remembers.html' if args.turn_out_of_time else 'dream-the-reply.html' if args.dream_preview else 'index.html')
# Refuse to replace a working preview with a syntactically invalid bundle.
subprocess.run(['node', '--check'], input='(() => {\nconst carrierModules={};\n'+'\n'.join(sources)+'\n})();', text=True, capture_output=True, check=True)
output.write_text(document)
if args.fragment:
    args.fragment.write_text(fragment)
print(f'Built {output.name} ({len(document.encode())} bytes)')
if args.serve:
    from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
    from functools import partial
    class CarrierHandler(SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
            self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
            self.send_header('Cache-Control', 'no-cache')
            super().end_headers()
        def log_message(self, *args):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(CarrierHandler, directory=str(base)))
    print(f'Carrier http://127.0.0.1:{args.port}/ (loopback, threaded neural audio)', flush=True)
    server.serve_forever()
