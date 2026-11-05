# Handwriting fonts

The app bundles two SIL Open Font License 1.1 fonts from the Google Fonts repository:

- Allura Regular: https://github.com/google/fonts/tree/main/ofl/allura
- Nanum Pen Script Regular: https://github.com/google/fonts/tree/main/ofl/nanumpenscript

Downloaded 2026-11-05 from the corresponding `raw.githubusercontent.com/google/fonts/main/ofl/` paths. FontTools changed the container from TTF to WOFF for smaller offline delivery; glyph outlines, character maps and font names were retained. CSS family aliases are Ainsworth Script and Ainsworth Korean. No external font service is used at runtime.

Copyright notices and full licenses are in `public/fonts/Allura-OFL.txt` and `public/fonts/NanumPenScript-OFL.txt`. The review builder also embeds both notices and licenses in the HTML's `ainsworth-font-licenses` JSON element beside the embedded font data. The static-site package includes the license text files.
