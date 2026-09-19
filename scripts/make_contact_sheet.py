from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "Media"
OUT = ROOT / ".preview-contact-sheet.jpg"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
TILE_W, TILE_H = 220, 250
COLS = 6


def label_for(path: Path) -> str:
    relative = path.relative_to(MEDIA)
    parent = " / ".join(relative.parts[:-1])
    name = path.stem
    label = f"{parent}\n{name}"
    return label[:74]


paths = sorted(
    (path for path in MEDIA.rglob("*") if path.suffix.lower() in EXTENSIONS),
    key=lambda path: str(path).lower(),
)
rows = (len(paths) + COLS - 1) // COLS
sheet = Image.new("RGB", (COLS * TILE_W, rows * TILE_H), "#ece9e1")
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default(size=12)

for index, path in enumerate(paths):
    x = (index % COLS) * TILE_W
    y = (index // COLS) * TILE_H
    try:
        with Image.open(path) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            image.thumbnail((TILE_W - 16, 192))
            px = x + (TILE_W - image.width) // 2
            py = y + 8 + (192 - image.height) // 2
            sheet.paste(image, (px, py))
    except Exception:
        draw.rectangle((x + 8, y + 8, x + TILE_W - 8, y + 200), fill="#d4cfc4")
    draw.text((x + 8, y + 206), label_for(path), fill="#20201d", font=font, spacing=2)

sheet.save(OUT, quality=86, optimize=True)
print(OUT)
