from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "public" / "icons"
SOURCE = ICONS / "kikroo-logo.png"


def fitted_logo(size: int, coverage: float) -> Image.Image:
    source = Image.open(SOURCE).convert("RGBA")
    bounds = source.getbbox()
    if bounds is None:
        raise RuntimeError("Kikroo logo has no visible pixels")
    source = source.crop(bounds)
    limit = round(size * coverage)
    source.thumbnail((limit, limit), Image.Resampling.LANCZOS)
    return source


def create_icon(path: Path, size: int, background: str, coverage: float) -> None:
    canvas = Image.new("RGBA", (size, size), background)
    logo = fitted_logo(size, coverage)
    position = ((size - logo.width) // 2, (size - logo.height) // 2)
    canvas.alpha_composite(logo, position)
    canvas.convert("RGB").save(path, optimize=True)


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    create_icon(ICONS / "kikroo-icon-192.png", 192, "#F8FAFC", 0.84)
    create_icon(ICONS / "kikroo-icon-512.png", 512, "#F8FAFC", 0.84)
    create_icon(ICONS / "kikroo-icon-maskable-512.png", 512, "#041F3D", 0.64)
    create_icon(ICONS / "kikroo-apple-touch-icon.png", 180, "#F8FAFC", 0.82)


if __name__ == "__main__":
    main()
