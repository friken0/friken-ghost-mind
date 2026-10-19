"""Public, reviewed session projections; private seeds never enter this store.

GitHub Issues is the authenticated intake. A maintainer's approved label
admits a bounded JSON projection. Scores remain player-reported/unverified.
The workflow reads data only and never executes submitted code or HTML.
"""
from pathlib import Path
import argparse, datetime, hashlib, json, re
SCHEMA='friken.ghost.public-session.v1'
FIELDS={'schema','id','player','universe','chapter','score','turns','ending','summary','highlights','sourceEvents','contentHash','consent','synthetic'}

def validate(value):
    raw=json.dumps(value,ensure_ascii=False)
    if len(raw.encode())>24000 or not isinstance(value,dict) or set(value)!=FIELDS:
        raise ValueError('Public session fields/size')
    if value['schema']!=SCHEMA or value['consent'] is not True or type(value['synthetic']) is not bool:
        raise ValueError('Consent/schema')
    for k,limit in [('id',100),('player',32),('universe',100),('ending',200),('summary',1600)]:
        if not isinstance(value[k],str) or not 1<=len(value[k])<=limit or any(ord(c)<32 for c in value[k]):
            raise ValueError('Text '+k)
    if not re.fullmatch(r'[a-zA-Z0-9:_-]+',value['id']):raise ValueError('Session id')
    for k,lo,hi in [('chapter',1,1000000),('score',-10000,1000000),('turns',1,20)]:
        if type(value[k]) is not int or not lo<=value[k]<=hi:raise ValueError('Number '+k)
    for k,limit,length in [('highlights',5,400),('sourceEvents',20,100)]:
        if not isinstance(value[k],list) or len(value[k])>limit or any(not isinstance(x,str) or not 1<=len(x)<=length for x in value[k]):raise ValueError('List '+k)
    if not re.fullmatch('[0-9a-f]{8,64}',value['contentHash']):raise ValueError('Content hash')
    if re.search(r'FGC[12]\.|friken\.chromatic\.(state|vault)|-----BEGIN .*PRIVATE KEY|\bBearer\s+|\bsk-[A-Za-z0-9_-]{16,}|<script|\b(?:password|api[_-]?key)\s*[:=]',raw,re.I):
        raise ValueError('Private seed, credential or executable content in public projection')
    return value

def rebuild(root):
    records=[]
    for p in sorted((root/'sessions').glob('*.json')):
        record=json.loads(p.read_text());validate(record['session']);records.append(record)
    news=[dict(id=r['session']['id'],title=r['session']['ending'],summary=r['session']['summary'],player=r['session']['player'],at=r['admittedAt'],source=r['source'],synthetic=r['session']['synthetic']) for r in records]
    scores={}
    for r in records:
        s=r['session']
        if s['synthetic']:continue
        # Caller identity is the authenticated issue author plus chosen handle.
        key=r['author']+':'+s['player'];row=scores.setdefault(key,dict(player=s['player'],author=r['author'],score=0,turns=0,chapters=0,verification='player-reported / unverified'))
        row['score']+=s['score'];row['turns']+=s['turns'];row['chapters']+=1
    for name,data in [('news.json',{'schema':'friken.ghost.news.v1','entries':news[-100:]}),('scoreboard.json',{'schema':'friken.ghost.scoreboard.v1','verification':'player-reported / unverified','entries':sorted(scores.values(),key=lambda x:(-x['score'],-x['turns'],x['player']))})]:
        (root/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    return len(records)

def admit(root,session,author,source):
    validate(session)
    if not re.fullmatch('[A-Za-z0-9-]{1,39}',author) or not re.fullmatch(r'https://github.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/issues/[0-9]+',source):raise ValueError('Issue provenance')
    root.mkdir(parents=True,exist_ok=True);(root/'sessions').mkdir(exist_ok=True)
    # Same run from one authenticated author has one immutable public receipt.
    key=hashlib.sha256((author+'|'+session['id']).encode()).hexdigest();p=root/'sessions'/(key+'.json')
    if p.exists():
        old=json.loads(p.read_text())
        if old['session']!=session:raise ValueError('Conflicting immutable session receipt')
        return 'unchanged'
    record=dict(session=session,author=author,source=source,admittedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
    p.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');rebuild(root);return key

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('operation',choices=['admit-event','rebuild']);ap.add_argument('root',type=Path);ap.add_argument('--event',type=Path);args=ap.parse_args()
    if args.operation=='rebuild':print('RECORDS',rebuild(args.root))
    else:
        event=json.loads(args.event.read_text())
        if event.get('action')!='labeled' or event.get('label',{}).get('name')!='ghost-session-approved':raise ValueError('Only maintainer approval admits a public projection')
        issue=event['issue'];body=issue.get('body','')
        match=re.fullmatch(r'\s*```json\s*\n(.*?)\n```\s*',body,re.S)
        if not match:raise ValueError('Issue body must contain only one JSON fenced block')
        print(admit(args.root,json.loads(match[1]),issue['user']['login'],issue['html_url']))
