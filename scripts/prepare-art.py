"""Encode original ImageGen source plates as deployment-sized WebP (no redrawing)."""
from pathlib import Path
from PIL import Image
import json
source=Path('/workspace/design/ainsworth-storybook')
output=Path(__file__).resolve().parent.parent/'public/art'
output.mkdir(parents=True,exist_ok=True)
files={n:source/'production'/f'{n}.png' for n in ['hall','owlery','bedroom','library','conservatory','mystery','atelier','attic','map','wood','paper','rain','collectibles','fern','portrait','journal']}
files.update({'drawing':source/'drawing-room-day.png','drawing-night':source/'drawing-room-night.png','miso':source/'miso-pose-atlas.png','owl':source/'owl-pose-atlas.png','objects':source/'desk-object-atlas.png','effects':source/'fire-candle-steam-atlas.png'})
manifest={}
for name,path in files.items():
 if not path.exists(): raise SystemExit(f'Missing source art: {path}')
 with Image.open(path) as im:
  im.save(output/f'{name}.webp','WEBP',quality=88,method=6,exact=True)
  manifest[name]={'source':str(path),'size':im.size,'bytes':(output/f'{name}.webp').stat().st_size}
(output.parent.parent/'docs/art-provenance.json').write_text(json.dumps(manifest,indent=2))
print('Encoded',len(manifest),'original art assets;',sum(m['bytes'] for m in manifest.values()),'bytes total')
