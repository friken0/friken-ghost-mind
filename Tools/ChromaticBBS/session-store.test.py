import importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('wire',Path(__file__).with_name('session-store.py'));wire=importlib.util.module_from_spec(spec);spec.loader.exec_module(wire)
def sample():return dict(schema=wire.SCHEMA,id='synthetic-qa',player='TestDiver',universe='qa',chapter=2,score=100,turns=12,ending='A synthetic test sky',summary='Synthetic integration fixture; no real player session.',highlights=['QA admission'],sourceEvents=['qa:t01'],contentHash='12345678',consent=True,synthetic=True)
class StoreTests(unittest.TestCase):
 def test_consent_and_seeds(self):
  s=sample();s['consent']=False
  with self.assertRaises(ValueError):wire.validate(s)
  s=sample();s['summary']='FGC2.fake.12345678'
  with self.assertRaises(ValueError):wire.validate(s)
 def test_append_dedupe_conflict_and_news(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);s=sample();wire.admit(root,s,'friken0','https://github.com/friken0/friken-ghost-mind/issues/1');self.assertEqual(wire.admit(root,s,'friken0','https://github.com/friken0/friken-ghost-mind/issues/1'),'unchanged');self.assertEqual(len(json.loads((root/'news.json').read_text())['entries']),1);self.assertEqual(json.loads((root/'scoreboard.json').read_text())['entries'],[]);s['score']=1000
   with self.assertRaises(ValueError):wire.admit(root,s,'friken0','https://github.com/friken0/friken-ghost-mind/issues/1')
 def test_score_is_cumulative_and_explicitly_unverified(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);s=sample();s['synthetic']=False;wire.admit(root,s,'friken0','https://github.com/friken0/friken-ghost-mind/issues/1');s['id']='qa-second';wire.admit(root,s,'friken0','https://github.com/friken0/friken-ghost-mind/issues/2');row=json.loads((root/'scoreboard.json').read_text())['entries'][0];self.assertEqual((row['score'],row['turns'],row['chapters']),(200,24,2));self.assertIn('unverified',row['verification'])
if __name__=='__main__':unittest.main()
