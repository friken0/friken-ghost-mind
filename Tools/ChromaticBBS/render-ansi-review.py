"""Render the actual ANSI recipes and two authored frames for visual review.
No image model, borrowed artwork or screenshot reconstruction is involved.
Usage: python3 Tools/ChromaticBBS/render-ansi-review.py --output /tmp/ansi-review
"""
import argparse, json, math, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
base=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--rows',type=int,default=36,choices=range(8,51));parser.add_argument('--only',default='');args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
kinds=['eye','city','family','network','shipyard','mailrun','convoy','beacon','vault','engine','forge','models','source','rose','causality','return','layer-now','layer-echo','layer-archive','layer-witness','trip','serpent']
if args.only:
    selected=args.only.split(',')
    if any(k not in kinds for k in selected):parser.error('Unknown scene subject')
    kinds=selected
code='import {ansiScene} from '+json.dumps((base/'ansi-scenes.mjs').as_uri())+';console.log(JSON.stringify('+json.dumps(kinds)+'.map(kind=>ansiScene(kind,{width:80,height:'+str(args.rows)+',seed:0,stage:1}))));'
scenes=json.loads(subprocess.check_output(['node','--input-type=module','-e',code],text=True))
palette=['#000000','#aa0000','#00aa00','#aa5500','#0000aa','#aa00aa','#00aaaa','#aaaaaa','#555555','#ff5555','#55ff55','#ffff55','#5555ff','#ff55ff','#55ffff','#ffffff']
quads=' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█'
font=ImageFont.load_default()
def picture(scene,frame):
    cells=[dict(c) for c in scene['cells']]
    for t in scene['tracks']:
        cells[(t['row']-1)*80+t['column']-1].update(t['frames'][frame])
    image=Image.new('RGB',(640,args.rows*16));draw=ImageDraw.Draw(image)
    for c in cells:
        x=(c['column']-1)*8;y=(c['row']-1)*16;fg=palette[c['fg']];bg=palette[c['bg']];g=c['glyph'];draw.rectangle((x,y,x+7,y+15),fill=bg)
        if g in quads:
            mask=quads.index(g)
            for bit,(dx,dy) in enumerate([(0,0),(4,0),(0,8),(4,8)]):
                if mask&(1<<bit):draw.rectangle((x+dx,y+dy,x+dx+3,y+dy+7),fill=fg)
        else:
            # Canonical IBM-style occupancy of the three density blocks.
            threshold={'░':1,'▒':2,'▓':3}.get(g,0)
            for yy in range(16):
                for xx in range(8):
                    if ((xx+yy*2)%4)<threshold:draw.point((x+xx,y+yy),fill=fg)
    return image
links=[]
for n in range(math.ceil(len(scenes)/4)):
    group=scenes[n*4:n*4+4];sheet=Image.new('RGB',(728,len(group)*math.ceil(args.rows*8.8+34)),'#10141b');draw=ImageDraw.Draw(sheet)
    rh=math.ceil(args.rows*8.8+34)
    for row,scene in enumerate(group):
        draw.text((8,row*rh+5),scene['kind']+' / rest and frame 3',font=font,fill='#dddddd')
        rest=picture(scene,0);motion=picture(scene,3);rest.save(args.output/(scene['kind']+'-rest.png'));motion.save(args.output/(scene['kind']+'-frame3.png'));sheet.paste(rest.resize((352,round(args.rows*8.8)),Image.Resampling.NEAREST),(8,row*rh+26));sheet.paste(motion.resize((352,round(args.rows*8.8)),Image.Resampling.NEAREST),(368,row*rh+26))
    name='sheet-'+str(n+1)+'.png';sheet.save(args.output/name);links.append(name)
(args.output/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>ANSI source review</title><style>body{background:#10141b;color:#ddd;font:16px monospace}img{display:block;max-width:100%;image-rendering:pixelated;margin:1em 0}</style><h1>Actual ANSI recipes: rest and frame 3</h1>'+''.join('<a href="'+n+'"><img src="'+n+'"></a>' for n in links))
print(json.dumps({'subjects':len(scenes),'frames':len(scenes)*2,'sheets':links,'output':str(args.output)}))
