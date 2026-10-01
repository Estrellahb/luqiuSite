import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('covers', ROOT / 'scripts/optimize-anime-covers.py')
assert spec is not None and spec.loader is not None
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CoverTests(unittest.TestCase):
    def test_size_ratio_originals_and_idempotence(self):
        with tempfile.TemporaryDirectory() as temp:
            public = Path(temp)
            cover = public / 'data/covers/1.jpg'
            cover.parent.mkdir(parents=True)
            Image.new('RGB', (600, 900), 'blue').save(cover)
            original = cover.read_bytes()
            path = public / 'data/anime-data.json'
            data = dict(watching=[dict(id='1', cover='/data/covers/1.jpg', title='A')], watched=[], want=[], lastUpdate='unchanged')
            path.write_text(json.dumps(data))
            stats = module.optimize(path, public)
            result = json.loads(path.read_text())
            item = result['watching'][0]
            self.assertEqual((item['thumbnailWidth'], item['thumbnailHeight']), (280, 420))
            self.assertEqual((item['coverWidth'], item['coverHeight']), (600, 900))
            self.assertEqual(cover.read_bytes(), original)
            self.assertEqual(result['lastUpdate'], 'unchanged')
            self.assertLess(stats['thumbnailBytes'], stats['originalBytes'])
            with Image.open(public / item['thumbnail'].lstrip('/')) as image:
                self.assertEqual(image.format, 'WEBP')
            first = path.read_bytes()
            module.optimize(path, public)
            self.assertEqual(path.read_bytes(), first)

    def test_component_contract(self):
        source = (ROOT / 'src/.vuepress/components/AnimeTimeline.vue').read_text()
        for value in ['item.thumbnail || item.cover', ':width=', ':height=', 'decoding="async"', 'loading="lazy"']:
            self.assertIn(value, source)


if __name__ == '__main__':
    unittest.main()
