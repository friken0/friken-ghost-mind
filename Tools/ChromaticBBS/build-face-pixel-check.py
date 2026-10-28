"""Bundle only the explicit face diagnostic from exact production modules.

The normal carrier builder remains its owner. This local QA page shares its
origin and pinned voice asset cache, avoiding a second server/model download.
"""
from pathlib import Path
import json
import posixpath
import re

base = Path(__file__).resolve().parent
modules = []


def imports(source, name):
    def bind(match):
        dependency = posixpath.normpath(posixpath.join(posixpath.dirname(name), match[2]))
        names = [term.strip().replace(' as ', ': ') for term in match[1].split(',')]
        return 'const {' + ','.join(names) + '}=qaModules[' + json.dumps(dependency) + '];'
    return re.sub(r"^import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"];\s*$", bind, source, flags=re.M)


for name in ('music-data.mjs', 'modem.mjs', 'audio.mjs',
             '../InfiniEngineSite/ghost-renderer.js', 'dream-face.mjs',
             'face-data.mjs', 'neural-voice.mjs', 'face-pixel-check.mjs'):
    source = (base / name).read_text()
    exports = re.findall(r'^export (?:async )?(?:function|const|class|let) (\w+)', source, re.M)
    source = imports(source, name)
    source = re.sub(r'^export (?=(?:(?:async )?function|const|class|let)\b)', '', source, flags=re.M)
    if re.search(r'^\s*(import|export)\b', source, re.M):
        raise ValueError('Unbundled diagnostic import: ' + name)
    modules.append('qaModules[' + json.dumps(name) + ']=(()=>{\n' + source + '\nreturn {' + ','.join(exports) + '};})();')

html = (base / 'face-pixel-check-source.html').read_text()
match = re.search(r'<script type="module">([\s\S]*?)</script>', html)
if not match:
    raise ValueError('Missing diagnostic source module')
body = imports(match[1], 'face-pixel-check-source.html')
script = '<script>const qaModules={};\n' + '\n'.join(modules) + '\n' + body + '</script>'
html = html[:match.start()] + script + html[match.end():]
output = base / 'face-pixel-check.html'
output.write_text(html)
print(f'Built {output.name} ({len(html.encode())} bytes) from exact production source')
