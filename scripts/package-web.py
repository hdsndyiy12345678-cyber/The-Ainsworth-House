"""Package only the built static site, never the source checkout or browser records."""
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
import re

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUTPUT = ROOT / "release"
KNOWN = {"index.html", "sw.js", "manifest.webmanifest", "crest.svg", "icon-192.png", "icon-512.png", "_headers"}
files = sorted(p for p in DIST.rglob("*") if p.is_file() or p.is_symlink())
if not DIST.is_dir():
    raise SystemExit("Build the app before packaging.")
for file in files:
    relative = file.relative_to(DIST).as_posix()
    if file.is_symlink() or not file.resolve().is_relative_to(DIST.resolve()):
        raise SystemExit(f"Refusing to package a symlink: {relative}")
    if relative not in KNOWN and not re.fullmatch(r"assets/[A-Za-z0-9_-]+\.(css|js)", relative):
        raise SystemExit(f"Unexpected build file; review before packaging: {relative}")
missing = KNOWN - {p.relative_to(DIST).as_posix() for p in files}
if missing:
    raise SystemExit(f"Missing deployment files: {sorted(missing)}")
worker = (DIST / "sw.js").read_text()
match = re.search(r"const FILES=(\[.*?\]);", worker)
if not match:
    raise SystemExit("Cannot verify offline cache manifest.")
for url in json.loads(match.group(1)):
    if url in ("/_headers", "/_redirects") or not (DIST / url.lstrip("/")).is_file():
        raise SystemExit(f"Unservable URL in offline manifest: {url}")
OUTPUT.mkdir(exist_ok=True)
archive = OUTPUT / "ainsworth-house-web.zip"
with ZipFile(archive, "w", compression=ZIP_DEFLATED, compresslevel=9) as z:
    for file in files:
        z.write(file, file.relative_to(DIST).as_posix())
with ZipFile(archive) as z:
    if z.testzip() is not None or "index.html" not in z.namelist():
        raise SystemExit("Archive verification failed.")
checksum = sha256(archive.read_bytes()).hexdigest()
(OUTPUT / "ainsworth-house-web.sha256").write_text(f"{checksum}  {archive.name}\n")
print(f"Ready: {archive.relative_to(ROOT)} ({archive.stat().st_size:,} bytes, {len(files)} files)")
print(f"SHA-256: {checksum}")
print("Prepared locally only. No upload or publication performed.")
