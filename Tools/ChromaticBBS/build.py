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
parser.add_argument('--serve', action='store_true', help='Serve this carrier on loopback with threaded neural-audio headers')
parser.add_argument('--port', type=int, default=4331)
args = parser.parse_args()
sources = []
for name in ('engine.mjs', 'canon.mjs', 'chapters.mjs', 'storage.mjs', '../InfiniEngineSite/ghost-renderer.js',
             'face-data.mjs', 'portrait.mjs', 'rose-data.mjs', 'stage.mjs',
             'cinema.mjs', 'chapter-library.mjs', 'session-share.mjs', 'chapter-data.mjs', 'commentary.mjs', 'shell.mjs', 'juice.mjs', 'roll-battle.mjs', 'recorded-voice.mjs', 'voice-data.mjs', 'neural-voice.mjs', 'speech.mjs', 'response.mjs', 'mind-data.mjs', 'app.mjs'):
    source = (base / name).read_text()
    if name == 'chapter-data.mjs' and args.chapter:
        packet = json.loads(args.chapter.read_text())
        subprocess.run(['node', str(base/'chapter-cli.mjs'), 'validate', str(args.chapter)], check=True)
        parent = args.parent.read_text().strip() if args.parent else None
        # Admission runs the same interpreter, with no artifact execution.
        with tempfile.TemporaryDirectory(prefix='chromatic-admit-') as temporary:
            subprocess.run(['node', str(base/'chapter-cli.mjs'), 'admit', str(args.chapter), str(args.parent) if args.parent else '-', str(Path(temporary)/'admitted.seed')], check=True)
        source = 'export const authoredBoot=' + json.dumps({'pack':packet,'parent':parent}, ensure_ascii=False).replace('</', '<\\/') + ';'

    exports = re.findall(r'^export (?:function|const|class|let) (\w+)', source, re.M)
    def bind_import(match):
        bindings = []
        for binding in match[1].split(','):
            terms = binding.strip().split(' as ')
            bindings.append(terms[0].strip() + (': ' + terms[1].strip() if len(terms)>1 else ''))
        dependency = posixpath.normpath(posixpath.join(posixpath.dirname(name), match[2]))
        return 'const {' + ','.join(bindings) + '} = carrierModules[' + json.dumps(dependency) + '];'
    source = re.sub(r"^import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"];\s*$", bind_import, source, flags=re.M)
    source = re.sub(r'^export (?=(?:function|const|class|let)\b)', '', source, flags=re.M)
    if re.search(r'^\s*(import|export)\b', source, re.M):
        raise ValueError(f'Unbundled module syntax in {name}')
    sources.append('carrierModules[' + json.dumps(posixpath.normpath(name)) + '] = (() => {\n' + source + '\nreturn {' + ','.join(exports) + '};\n})();')
fragment = ((base / 'surface.html').read_text() + '\n<style>\n' +
            (base / 'carrier.css').read_text() + '\n</style>\n<script>\n' +
            '(() => {\nconst carrierModules={};\n' + '\n'.join(sources) + '\n})();\n</script>\n')
document = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>Friken.Ghost · CHROMATIC BBS</title>'
            '<style>html,body{margin:0;height:100%;overflow:hidden;background:#090b17}</style></head><body>' +
            fragment + '</body></html>\n')
(base / 'index.html').write_text(document)
if args.fragment:
    args.fragment.write_text(fragment)
print(f'Built index.html ({len(document.encode())} bytes)')
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
