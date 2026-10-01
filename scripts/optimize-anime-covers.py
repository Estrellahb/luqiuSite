"""Generate versioned 280px list covers; keep originals and collection order."""
import hashlib
import io
import json
import os
from pathlib import Path
from PIL import Image, ImageOps


def optimize(data_path, public_dir):
    data_path, public_dir = Path(data_path), Path(public_dir)
    data = json.loads(data_path.read_text())
    output_dir = public_dir / 'data/covers/thumbs'
    output_dir.mkdir(parents=True, exist_ok=True)
    original_bytes = optimized_bytes = count = 0
    for status in ('watching', 'watched', 'want'):
        for item in data[status]:
            cover = item.get('cover', '')
            if not cover.startswith('/data/covers/'):
                continue
            source = (public_dir / cover.lstrip('/')).resolve()
            if not source.is_relative_to(public_dir.resolve()) or not source.is_file():
                raise ValueError(f'Missing or unsafe local cover: {cover}')
            with Image.open(source) as image:
                image = ImageOps.exif_transpose(image).convert('RGB')
                width, height = image.size
                target_width = min(280, width)
                image = image.resize((target_width, max(1, round(height * target_width / width))), Image.Resampling.LANCZOS)
                buffer = io.BytesIO()
                image.save(buffer, format='WEBP', quality=82, method=6)
                payload = buffer.getvalue()
                digest = hashlib.sha256(payload).hexdigest()[:12]
                filename = f'{source.stem}-{digest}.webp'
                target = output_dir / filename
                if not target.exists():
                    target.write_bytes(payload)
                item.update(coverWidth=width, coverHeight=height,
                            thumbnail=f'/data/covers/thumbs/{filename}',
                            thumbnailWidth=image.width, thumbnailHeight=image.height)
                original_bytes += source.stat().st_size
                optimized_bytes += len(payload)
                count += 1
    temp = data_path.with_suffix('.json.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    os.replace(temp, data_path)
    return dict(count=count, originalBytes=original_bytes, thumbnailBytes=optimized_bytes,
                reductionPercent=round((1 - optimized_bytes / original_bytes) * 100, 1) if original_bytes else 0)


if __name__ == '__main__':
    import argparse
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=Path, default=root / 'src/.vuepress/public/data/anime-data.json')
    parser.add_argument('--public', type=Path, default=root / 'src/.vuepress/public')
    args = parser.parse_args()
    print(json.dumps(optimize(args.data, args.public)))
