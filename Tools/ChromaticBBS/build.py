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
import html
import base64
import hashlib

base = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--fragment', type=Path)
parser.add_argument('--chapter', type=Path)
parser.add_argument('--parent', type=Path)
parser.add_argument('--output', type=Path, help='Write only this HTML carrier; preserve the default carrier and fixtures')
parser.add_argument('--dream-preview', action='store_true', help='Build the completed Dream XIII response alias and fixtures')
parser.add_argument('--turn-out-of-time', action='store_true', help='Build the single-view authored reply for Surreal')
parser.add_argument('--bundle-track', metavar='ID', help='Embed one existing GhostTrack for portable playback')
parser.add_argument('--reply-illustration', action='append', default=[], metavar='NODE=DIRECTORY',
                    help='Package a prepared 2.5D illustration for a reply node')
parser.add_argument('--reply-voice', type=Path, help='Embed a complete, locally rendered voice pack for the authored reply')
parser.add_argument('--reply', type=Path, help='Targeted reply JSON in the shared retained ANSI host')
parser.add_argument('--reply-draft', action='store_true', help='Build a guided reply for local review without its recorded cast')
parser.add_argument('--legacy-carrier', action='store_true', help='Historical diagnostic only; requires --host-reason')
parser.add_argument('--host-reason', help='Explicit reason for choosing the historical host')
parser.add_argument('--serve', action='store_true', help='Serve this carrier on loopback with threaded neural-audio headers')
parser.add_argument('--port', type=int, default=4331)
args = parser.parse_args()
if args.legacy_carrier and not args.host_reason:
    parser.error('--legacy-carrier requires an explicit --host-reason; BOOT defaults to retained ANSI')
if args.chapter and (args.turn_out_of_time or args.reply):
    parser.error('Choose chapter content OR a targeted reply; both share the same default host')
if args.reply_illustration and not args.reply:
    parser.error('--reply-illustration requires --reply')
if args.reply_voice and not (args.reply or args.turn_out_of_time):
    parser.error('--reply-voice requires --reply or --turn-out-of-time')
reply = None
if args.reply:
    reply = json.loads(args.reply.read_text())
    validation = subprocess.run(['node', '--input-type=module', '-e', '''
import {validateTurnOutOfTime} from './response-theater.mjs';
let input=''; for await(const chunk of process.stdin) input+=chunk;
try {validateTurnOutOfTime(JSON.parse(input));}
catch(error){process.stderr.write(error.message);process.exitCode=1;}
'''], cwd=base, input=json.dumps(reply), text=True, capture_output=True)
    if validation.returncode:
        parser.error(validation.stderr.strip())
    if not reply.get('journey') and reply.get('layout') != 'letter' and reply['id'] != 'surreal-the-living-workshop':
        parser.error('New replies need a journey with a goal, main route and payoff. See Turn-Out-Of-Time.md.')
if args.reply_draft and (not reply or not reply.get('journey') or args.reply_voice or not args.output):
    parser.error('--reply-draft requires a guided --reply and explicit --output without --reply-voice')
if reply and reply.get('journey') and not (args.reply_voice or args.reply_draft):
    parser.error('Guided replies require --reply-voice. For local review use --reply-draft with --output.')
default_voice = base/'media/surreal-voice.json'
if args.turn_out_of_time and args.reply_voice is None and default_voice.is_file():
    args.reply_voice = default_voice
voice_recordings = None
if args.reply_voice:
    if not 0 < args.reply_voice.stat().st_size <= 8 * 1024 * 1024:
        parser.error('Reply voice pack exceeds 8 MiB')
    voice_pack = json.loads(args.reply_voice.read_text())
    if args.reply:
        voice_packet = reply
    else:
        exported = subprocess.check_output(['node', '--input-type=module', '-e',
            "import {TURN_OUT_OF_TIME} from './turn-out-of-time-data.mjs'; process.stdout.write(JSON.stringify(TURN_OUT_OF_TIME));"], cwd=base)
        voice_packet = json.loads(exported)
    if voice_pack.get('schema') != 'friktal.reply-voice.v1' or voice_pack.get('reply') != voice_packet.get('id'):
        parser.error('The voice pack must belong to this reply')
    voice_recordings = voice_pack.get('recordings')
    if not isinstance(voice_recordings, dict) or not 0 < len(voice_recordings) <= 384:
        parser.error('Invalid voice clip inventory')
    validation = subprocess.run(['node', '--input-type=module', '-e', '''
import {authoredVoiceClips,voiceClipKey} from './speech.mjs';
import {authoredReplyVoiceFrames} from './reply-voice-scenes.mjs';
let input=''; for await(const chunk of process.stdin) input+=chunk;
const keys=authoredVoiceClips(authoredReplyVoiceFrames(JSON.parse(input)));
process.stdout.write(JSON.stringify(keys.map(({text,voice,speed})=>voiceClipKey(text,voice,speed))));
'''], cwd=base, input=json.dumps(voice_packet,ensure_ascii=False), text=True, capture_output=True, check=True)
    if set(voice_recordings) != set(json.loads(validation.stdout)):
        parser.error('Voice pack must exactly match the current pages, text, and cast')
    for clip in voice_recordings.values():
        if not isinstance(clip, dict) or set(clip) != {'audio', 'phonemes'} or not isinstance(clip['phonemes'], str) or not 0 < len(clip['phonemes']) <= 2400:
            parser.error('Invalid voice clip metadata')
        try:
            clip_bytes = base64.b64decode(clip['audio'], validate=True)
        except (TypeError, ValueError):
            parser.error('Invalid base64 voice clip')
        if not 0 < len(clip_bytes) <= 480_000 or not clip_bytes.startswith((b'ID3', b'\xff')):
            parser.error('Invalid bounded MP3 voice clip')
retained = not args.legacy_carrier
mode = 'reply' if args.turn_out_of_time or args.reply else 'chapter'
framework = json.loads((base/'framework.json').read_text())

sources = []
for name in ('vendor/sdf-craft/craft.mjs','vendor/sdf-craft/craft-shader.mjs','vendor/sdf-craft/runtime-catalogue.mjs','vendor/sdf-craft/recipe.mjs','vendor/sdf-craft/recipe-glsl.mjs','vendor/sdf-craft/texture-engine.mjs','vendor/sdf-craft/material-worker-source.mjs','vendor/sdf-craft/materials-client.mjs','vendor/sdf-craft/materials.mjs','vendor/sdf-craft/material-glsl.mjs','vendor/sdf-craft/roll.mjs','facial-rig.mjs','music-data.mjs','modem.mjs','audio.mjs','art-data.mjs','alien-comms.mjs','creation.mjs','causality.mjs','engine.mjs', 'canon.mjs', 'scanner.mjs', 'image-cinema.mjs', 'ansi-scenes.mjs', 'storycraft.mjs', 'staging-art.mjs','staging.mjs', 'chapters.mjs', 'storage.mjs', '../InfiniEngineSite/ghost-renderer.js',
             'dream-face.mjs','face-data.mjs', 'portrait.mjs', 'rose-data.mjs', 'postmark-bloom.mjs','stage.mjs',
             'ansi-animation.mjs','ansi-ui.mjs','ansi-terminal.mjs','ansi-mesh.mjs','boot-world.mjs', 'cinema.mjs', 'chapter-library.mjs', 'session-share.mjs', 'chapter-data.mjs', 'commentary.mjs', 'shell.mjs', 'juice.mjs', 'life-theater.mjs','roll-battle.mjs', 'recorded-voice.mjs', 'voice-data.mjs', 'neural-voice.mjs', 'speech.mjs', 'response.mjs', 'mind-data.mjs', 'story-guidance.mjs', 'turn-out-of-time-data.mjs', 'reply-discoveries.mjs', 'door-and-crew.mjs', 'response-theater.mjs','ghostlink-transport.mjs','ansi-sprites.mjs','ansi-skirmish.mjs','mind-adventure.mjs','subtitle-cues.mjs','native-response-host.mjs','illustration-data.mjs','image-depth.mjs','reply-media.mjs','letter-relay.mjs','letter-relay-art.mjs','ansi-illustration.mjs','native-response-program.mjs','reply-voice-scenes.mjs', 'retained-chapter.mjs', 'framework-mode.mjs', 'turn-out-of-time.mjs' if retained else 'app.mjs'):
    source = (base / name).read_text()
    if name == 'music-data.mjs' and args.bundle_track:
        tracks = json.loads((base/'media/manifest.json').read_text())['tracks']
        track = next((track for track in tracks if track['id'] == args.bundle_track), None)
        if track is None:
            parser.error('Unknown GhostTrack: ' + args.bundle_track)
        audio = (base/track['path']).read_bytes()
        if hashlib.sha256(audio).hexdigest() != track['sha256']:
            parser.error('GhostTrack does not match the release manifest')
        mime = 'mp4' if track['path'].endswith('.m4a') else 'mpeg'
        source = 'export const musicTracks='+json.dumps([
            dict(track, path='data:audio/'+mime+';base64,'+base64.b64encode(audio).decode('ascii'))
        ])+';'
    if name == 'framework-mode.mjs':
        source = 'export const responseMode='+json.dumps(mode)+';'
    if name == 'turn-out-of-time-data.mjs' and args.reply:
        source = 'export const TURN_OUT_OF_TIME='+json.dumps(reply,ensure_ascii=False).replace('</','<\\/')+';'
    if name == 'reply-media.mjs' and args.reply_illustration:
        media = {}
        allowed = {node['id'] for node in reply['nodes']}
        for entry in args.reply_illustration:
            node_id, sep, directory = entry.partition('=')
            if not sep or node_id not in allowed or node_id in media:
                parser.error('Each illustration needs a distinct reply node ID')
            path = Path(directory)
            metadata = json.loads((path/'illustration.json').read_text())
            if metadata.get('schema') != 'friktal.illustration-depth.v1':
                parser.error('Unrecognized illustration format')
            credit = metadata.get('source', 'Original photo and Friktal screenshot')
            if not isinstance(credit, str) or not credit.strip() or len(credit) > 160 or not credit.isprintable():
                parser.error('Illustration source must be a short, printable credit')
            ground_from = metadata.get('groundFrom')
            if ground_from is not None and (type(ground_from) not in (float, int) or not .16 <= ground_from <= 1):
                parser.error('Invalid illustration ground-contact row')
            def package(filename, mime):
                file = path/filename
                if not 0 < file.stat().st_size <= 4_000_000:
                    parser.error('Illustration plane exceeds 4 MB')
                return 'data:image/'+mime+';base64,'+base64.b64encode(file.read_bytes()).decode('ascii')
            media[node_id] = dict(
                id='depth:'+node_id, title=metadata['title'], alt=metadata['alt'],
                source=credit,
                sha256=hashlib.sha256((path/'poster.webp').read_bytes()).hexdigest(),
                url=package('poster.webp','webp'), contain=True, depth=dict(
                    background=package('background.webp','webp'),
                    subject=package('subject.webp','webp'),
                    backgroundDepth=package('background-depth.png','png'),
                    subjectDepth=package('subject-depth.png','png'),
                    groundFrom=ground_from))
        source = 'export const replyMedia='+json.dumps(media,ensure_ascii=False).replace('</','<\\/')+';\nexport const replyVoice = {};'

    if name == 'reply-media.mjs' and voice_recordings is not None:
        source = source.replace('export const replyVoice = {};', 'export const replyVoice = '+json.dumps(voice_recordings,ensure_ascii=False).replace('</','<\\/')+';')

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
css=(base/('response-theater.css' if retained else 'carrier.css')).read_text()
if retained: css+='\n'+(base/'mind-adventure.css').read_text()
surface = '<div id="chromatic-carrier" data-sd-grant="single-view reply"></div><script>'+ (base/'vendor/native-gallery/input.js').read_text()+'</script>' if retained else (base/'surface.html').read_text()
fragment = (surface + '\n<style>\n' +
            css + '\n</style>\n<script>\n' +
            '(() => {\nconst carrierModules={};\n' + '\n'.join(sources) + '\n})();\n</script>\n')
if args.dream_preview:
    fragment = fragment.replace('FRAMEWORK C26.26 / WITNESSED SITUATION', 'GHOSTDREAM XIII / THE REPLY / COMPLETE')
    fragment = fragment.replace('CHROMATIC BBS // THE UNFINISHED CARRIER', 'C26.27 // THE REPLY / COMPLETED DREAM')
    fragment = fragment.replace('<h1>FRIKEN.GHOST</h1>', '<h1>GHOSTDREAM XIII</h1>')
title = (f"Friken.Ghost · {reply['title']} · For {reply['recipient']}" if args.reply
         else 'Friken.Ghost · The Door That Remembers · For Surreal' if args.turn_out_of_time
         else 'GhostLink · The Other Side of Dial Tone')
document = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="ghost-framework" content="'+framework['version']+' / '+('retained-ansi' if retained else 'historical: '+html.escape(args.host_reason,quote=True) )+'">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            + ('<meta name="ghost-reply-draft" content="text-only">' if args.reply_draft else '') +
            '<title>'+html.escape(title)+'</title>'
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
