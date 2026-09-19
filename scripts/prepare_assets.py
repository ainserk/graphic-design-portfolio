from __future__ import annotations

import json
import re
import shutil
import subprocess
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "Media"
ASSETS = ROOT / "assets"
IMAGE_OUT = ASSETS / "work"
VIDEO_OUT = ASSETS / "motion"
DATA_OUT = ASSETS / "portfolio-data.js"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

CATEGORY_RULES = [
    ("images/social media posting", "campaigns", "Social Campaigns"),
    ("images/ecommerce poster beg kuning", "campaigns", "E-commerce Campaigns"),
    ("images/poster", "campaigns", "Campaign Posters"),
    ("images/label sticker bottle", "branding", "Packaging Design"),
    ("assignment/branding logo packaging", "branding", "Brand Identity"),
    ("images/merchandise", "branding", "Merchandise"),
    ("images/menu", "print", "Menu Design"),
    ("images/tv menu", "print", "Digital Menus"),
    ("images/bunting", "print", "Bunting"),
    ("images/tray paper", "print", "Print Collateral"),
    ("images/durian notes", "print", "Editorial Notes"),
    ("images/wedding card freelance", "print", "Wedding Stationery"),
    ("images/photography", "photography", "Photography"),
    ("images/wedding photo", "photography", "Wedding Photography"),
    ("assignment/assgn poster", "illustration", "Illustration & Posters"),
    ("assignment/typo", "illustration", "Typography"),
    ("assignment", "illustration", "Design Studies"),
    ("images/generate", "experimental", "AI Experiments"),
]

FEATURED = [
    "A1_GDC406_ILLUSTRATION VISUAL _2025580413_AIN NADHIRAH MD AZRIM.png",
    "photo_2026-09-19_18-29-24.jpg",
    "masjid selat.jpg",
    "LABEL STICKER 500ML DGV-03.png",
    "Wedding Invitation Card - Belah zati design 2-01.png",
    "DIY Christmas Box 1_2025-01.png",
]

VIDEO_JOBS = [
    {
        "source": "videos/awareness/EG-0002 3 TIPS MEMBAJA (ARIF).mp4",
        "slug": "awareness-tips",
        "title": "Awareness — 3 Tips Membaja",
        "type": "Awareness Content",
        "orientation": "portrait",
    },
    {
        "source": "videos/engagement/EG-0007 ROCK THAT BODY TREND (CAPTION).mp4",
        "slug": "engagement-trend",
        "title": "Trend-led Engagement",
        "type": "Social Engagement",
        "orientation": "portrait",
    },
    {
        "source": "videos/product focus/SV-0002 MADAM & DATO CUCI KARAT PASU.mp4",
        "slug": "product-focus",
        "title": "Product in Action",
        "type": "Product Focus",
        "orientation": "portrait",
    },
    {
        "source": "videos/hardsell video/BC-0026 PAYAH NAK JAGA POKOK KAT RUMAH CTA.mp4",
        "slug": "performance-ad",
        "title": "Home Gardening CTA",
        "type": "Performance Creative",
        "orientation": "portrait",
    },
    {
        "source": "videos/Ugc video/BC-0005 EDUCATE CARA PENYEDIAAN (18L) .mp4",
        "slug": "ugc-education",
        "title": "Educational UGC",
        "type": "UGC Direction",
        "orientation": "portrait",
    },
    {
        "source": "videos/video generate/video ai boss.mp4",
        "slug": "ai-motion",
        "title": "AI-assisted Visual Story",
        "type": "Creative Experiment",
        "orientation": "portrait",
    },
    {
        "source": "videos/video editing/Sejenak Video_GDC 451 Video Design.mp4",
        "slug": "sejenak-film",
        "title": "Sejenak",
        "type": "Video Editing",
        "orientation": "landscape",
        "crf": "32",
    },
]


def slugify(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    return slug or "work"


def classify(path: Path) -> tuple[str, str]:
    relative = path.relative_to(MEDIA).as_posix().lower()
    for prefix, key, label in CATEGORY_RULES:
        if relative.startswith(prefix.lower()):
            return key, label
    return "illustration", "Design Studies"


def friendly_title(path: Path, label: str, number: int) -> str:
    stem = path.stem.strip()
    if stem.lower().startswith("photo_") or re.fullmatch(r"(?:img|dsc)[_ -]?\d+.*", stem, re.I):
        return f"{label} {number:02d}"
    title = re.sub(r"[_-]+", " ", stem)
    title = re.sub(r"\s+", " ", title).strip()
    return title[:72]


def convert_images() -> list[dict]:
    IMAGE_OUT.mkdir(parents=True, exist_ok=True)
    source_paths = sorted(
        (path for path in MEDIA.rglob("*") if path.suffix.lower() in IMAGE_EXTENSIONS),
        key=lambda path: (0 if path.name in FEATURED else 1, str(path).lower()),
    )
    counters: dict[str, int] = {}
    items = []
    for index, source in enumerate(source_paths, start=1):
        category, label = classify(source)
        counters[label] = counters.get(label, 0) + 1
        slug = f"{index:03d}-{slugify(source.stem)[:52]}"
        destination = IMAGE_OUT / f"{slug}.webp"
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image)
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "transparency" in image.info else "RGB")
            image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
            image.save(destination, "WEBP", quality=82, method=6)
            width, height = image.size
        items.append(
            {
                "src": f"assets/work/{destination.name}",
                "title": friendly_title(source, label, counters[label]),
                "category": category,
                "categoryLabel": label,
                "width": width,
                "height": height,
                "featured": source.name in FEATURED,
            }
        )
        print(f"image {index:03d}/{len(source_paths)} {source.name}")
    return items


def find_ffmpeg() -> str | None:
    found = shutil.which("ffmpeg")
    if found:
        return found
    package_root = Path.home() / "AppData/Local/Microsoft/WinGet/Packages"
    matches = list(package_root.glob("Gyan.FFmpeg.Shared_*/**/ffmpeg.exe"))
    return str(matches[0]) if matches else None


def convert_videos(ffmpeg: str) -> list[dict]:
    VIDEO_OUT.mkdir(parents=True, exist_ok=True)
    items = []
    for index, job in enumerate(VIDEO_JOBS, start=1):
        source = MEDIA / job["source"]
        destination = VIDEO_OUT / f"{job['slug']}.mp4"
        poster = VIDEO_OUT / f"{job['slug']}.jpg"
        scale = "scale=-2:1280" if job["orientation"] == "portrait" else "scale=1280:-2"
        if not destination.exists():
            command = [
                ffmpeg,
                "-y",
                "-i",
                str(source),
                "-vf",
                f"{scale}:flags=lanczos,fps=30",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-preset",
                "medium",
                "-crf",
                job.get("crf", "29"),
                "-c:a",
                "aac",
                "-b:a",
                "96k",
                "-movflags",
                "+faststart",
                str(destination),
            ]
            subprocess.run(command, check=True)
        if not poster.exists():
            subprocess.run(
                [
                    ffmpeg,
                    "-y",
                    "-ss",
                    "1",
                    "-i",
                    str(destination),
                    "-frames:v",
                    "1",
                    "-vf",
                    "scale=640:-2",
                    "-q:v",
                    "3",
                    str(poster),
                ],
                check=True,
            )
        items.append(
            {
                "src": f"assets/motion/{destination.name}",
                "poster": f"assets/motion/{poster.name}",
                "title": job["title"],
                "type": job["type"],
                "orientation": job["orientation"],
            }
        )
        print(f"video {index:02d}/{len(VIDEO_JOBS)} {job['title']}")
    return items


def main() -> None:
    images = convert_images()
    ffmpeg = find_ffmpeg()
    videos = convert_videos(ffmpeg) if ffmpeg else []
    payload = json.dumps({"images": images, "videos": videos}, ensure_ascii=False, separators=(",", ":"))
    DATA_OUT.write_text(f"window.PORTFOLIO_DATA={payload};\n", encoding="utf-8")
    print(f"wrote {DATA_OUT}")


if __name__ == "__main__":
    main()
