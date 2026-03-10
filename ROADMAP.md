# File Converter Roadmap

A comprehensive roadmap for the browser-based file converter built with Rust + WebAssembly and React.js.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React.js UI (Main Thread)             │
│  - File selection / drag-and-drop                        │
│  - Format picker                                         │
│  - Progress display                                      │
│  - Download result                                       │
└────────────────────────┬────────────────────────────────┘
                         │ postMessage (file bytes + options)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Web Worker (Dedicated Worker)               │
│  - Hosts the WASM module                                 │
│  - Calls Rust converter functions                        │
│  - Posts progress updates back to main thread            │
└────────────────────────┬────────────────────────────────┘
                         │ WASM function calls
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Rust / WebAssembly (converter-wasm)            │
│  - Converter trait (common interface for all adapters)   │
│  - Adapters for each format category                     │
│  - wasm-pack compiled to wasm32-unknown-unknown          │
└─────────────────────────────────────────────────────────┘
```

## Rust Converter Trait

All conversion adapters implement a shared trait:

```rust
pub trait Converter {
    fn input_formats(&self) -> Vec<&'static str>;
    fn output_formats(&self) -> Vec<&'static str>;
    fn convert(
        &self,
        input: &[u8],
        from: &str,
        to: &str,
        options: &ConvertOptions,
    ) -> Result<Vec<u8>, ConvertError>;
}
```

---

## Phase 1: Proof of Concept — Text & Data Formats (Current)

Focus: formats that are trivially convertible with existing pure-Rust WASM-compatible crates.

### 1.1 Markup / Text

| From | To | Rust Crate | Status |
|------|----|-----------|--------|
| Markdown | HTML | `pulldown-cmark` 0.13 | ✅ Implemented |
| Markdown | HTML (GFM) | `comrak` 0.51 | ✅ Implemented |

### 1.2 Data Serialization

| From | To | Rust Crate | Status |
|------|----|-----------|--------|
| JSON | YAML | `serde_json` + `serde-saphyr` | ✅ Implemented |
| YAML | JSON | `serde-saphyr` + `serde_json` | ✅ Implemented |
| JSON | TOML | `serde_json` + `toml` | ✅ Implemented |
| TOML | JSON | `toml` + `serde_json` | ✅ Implemented |
| JSON | CSV | `serde_json` + `csv` | ✅ Implemented |
| CSV | JSON | `csv` + `serde_json` | ✅ Implemented |
| YAML | TOML | `serde-saphyr` + `toml` | ✅ Implemented |
| TOML | YAML | `toml` + `serde-saphyr` | ✅ Implemented |
| CSV | YAML | `csv` + `serde-saphyr` | ✅ Implemented |
| YAML | CSV | `serde-saphyr` + `csv` | ✅ Implemented |
| CSV | TOML | `csv` + `toml` | ✅ Implemented |
| TOML | CSV | `toml` + `csv` | ✅ Implemented |
| JSON | XML | `serde_json` + `quick-xml` | ✅ Implemented |
| XML | JSON | `quick-xml` + `serde_json` | ✅ Implemented |

### 1.3 Images (Phase 1)

| From | To | Rust Crate | Status |
|------|----|-----------|--------|
| PNG | JPEG | `image` 0.25 | ✅ Implemented |
| JPEG | PNG | `image` 0.25 | ✅ Implemented |
| PNG | WebP | `image` 0.25 | ✅ Implemented |
| WebP | PNG | `image` 0.25 | ✅ Implemented |
| BMP | PNG | `image` 0.25 | ✅ Implemented |
| PNG | BMP | `image` 0.25 | ✅ Implemented |
| GIF | PNG | `image` 0.25 | ✅ Implemented |
| ICO | PNG | `image` 0.25 | ✅ Implemented |
| PNG | ICO | `image` 0.25 | ✅ Implemented |
| SVG | PNG | `resvg` 0.47 (via `@resvg/resvg-wasm`) | ✅ Implemented |

---

## Phase 2: Audio Formats

Focus: decoding and re-encoding audio using pure-Rust WASM-compatible crates.

### 2.1 Audio Conversion

| From | To | Rust Crate | Status |
|------|----|-----------|--------|
| WAV | WAV (resample) | `hound` 3.5 | 📋 Planned |
| MP3 | WAV | `symphonia` 0.5 (decode) + `hound` (encode) | 📋 Planned |
| OGG/Vorbis | WAV | `symphonia` 0.5 (decode) + `hound` (encode) | 📋 Planned |
| FLAC | WAV | `symphonia` 0.5 (decode) + `hound` (encode) | 📋 Planned |
| AAC | WAV | `symphonia` 0.5 (decode) + `hound` (encode) | 📋 Planned |
| WAV | OGG/Vorbis | `hound` (decode) + `vorbis` (encode) | 🔬 Research needed |
| WAV | FLAC | `hound` (decode) + `flac` (encode) | 📋 Planned |
| MP3 | OGG | `symphonia` + `vorbis` | 🔬 Research needed |

**Notes**:
- MP3 encoding has no mature pure-Rust solution. Will use WAV as the primary lossless output target.
- OGG/Vorbis encoding is possible via `vorbis-encoder` crate (unmaintained) or custom wrappers.
- `symphonia` does not support encoding — it is a universal audio decoder only.

### 2.2 Limitations

- Audio playback in-browser will use the Web Audio API via JS (not Rust) — Rust handles only encode/decode.
- File size limits: large audio files (>100MB) may require streaming via chunked Web Worker messages.

---

## Phase 3: Documents

Focus: spreadsheet and word-processor document formats.

### 3.1 Spreadsheets

| From | To | Rust Crate | Status |
|------|----|-----------|--------|
| XLSX | CSV | `calamine` 0.34 | 📋 Planned |
| XLSX | JSON | `calamine` 0.34 + `serde_json` | 📋 Planned |
| XLS | CSV | `calamine` 0.34 | 📋 Planned |
| ODS | CSV | `calamine` 0.34 | 📋 Planned |
| CSV | XLSX | `rust_xlsxwriter` 0.94 | 📋 Planned |
| JSON | XLSX | `rust_xlsxwriter` 0.94 | 📋 Planned |

### 3.2 Word Processing

| From | To | Rust Crate | Status |
|------|----|-----------|--------|
| Markdown | DOCX | `docx-rs` 0.4 | 📋 Planned |
| Plain Text | DOCX | `docx-rs` 0.4 | 📋 Planned |

**Notes**:
- Reading existing DOCX files (to extract text or convert away from DOCX) is not supported by `docx-rs`. A separate parser crate will be evaluated in Phase 4.
- ODF/ODT support is limited — may require custom parsing.

### 3.3 PDF

| From | To | Rust Crate | Status |
|------|----|-----------|--------|
| Markdown | PDF | `printpdf` 0.9 | 🔬 Research needed |
| Plain Text | PDF | `printpdf` 0.9 | 📋 Planned |
| PDF | Images (pages) | `pdfium-render` 0.8 (via WASM Pdfium binary) | 🔬 Research needed |

**Notes**:
- `printpdf` supports WASM and creates PDFs from content but has no HTML/CSS rendering engine.
- Full PDF-to-text extraction requires either `pdfium-render` (needs a WASM Pdfium binary, ~40MB) or a JS-side `PDF.js` fallback.

---

## Phase 4: Archives

### 4.1 Compression / Archives

| From | To | Rust Crate | Status |
|------|----|-----------|--------|
| Files | ZIP | `zip` 8.2 (deflate feature) | 📋 Planned |
| ZIP | Files | `zip` 8.2 (deflate feature) | 📋 Planned |
| Files | TAR.GZ | `tar` 0.4 + `flate2` | 📋 Planned |
| TAR.GZ | Files | `tar` 0.4 + `flate2` | 📋 Planned |
| TAR | GZIP | `flate2` 1.1 | 📋 Planned |
| GZIP | Decompressed | `flate2` 1.1 | 📋 Planned |

---

## Phase 5: Video (Long Term)

Video conversion in pure Rust/WASM is not currently feasible for production use. The options are:

1. **`ffmpeg.wasm`** (JS library, Emscripten-compiled): Supports MP4, WebM, GIF, MKV, AVI, and virtually all video formats. Requires `SharedArrayBuffer` (cross-origin isolation headers). ~30MB bundle size.
2. **Pure Rust video (future)**: The Rust ecosystem lacks production-ready WASM-compatible video codec crates. AV1 (`rav1e`) and VP8/VP9 work natively but not yet in WASM environments. This is an area for future investment.

| From | To | Tool | Status |
|------|----|------|--------|
| MP4 | WebM | `ffmpeg.wasm` (JS) | 🔭 Future |
| MP4 | GIF | `ffmpeg.wasm` (JS) | 🔭 Future |
| WebM | MP4 | `ffmpeg.wasm` (JS) | 🔭 Future |
| GIF | WebP | `image` (frames) | 🔭 Future |
| Video | Audio (extract) | `symphonia` (WASM) | 📋 Planned (Phase 3) |

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| UI framework | React.js 19 |
| Build tool | Vite 6 |
| Styling | CSS Modules (mobile-first, no external deps) |
| WASM build | wasm-pack 0.14 |
| WASM interop | wasm-bindgen 0.2 |
| Worker isolation | Dedicated Web Worker (`new Worker()`) |
| Hosting | GitHub Pages (static) |
| CI/CD | GitHub Actions |
| License | Unlicense (public domain) |

## Rust Crate Versions (Phase 1 PoC)

```toml
[dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
toml = "1"
csv = "1"
pulldown-cmark = "0.13"
comrak = { version = "0.51", default-features = false }
image = { version = "0.25", default-features = false, features = ["png", "jpeg", "webp", "bmp", "gif", "ico"] }
quick-xml = { version = "0.39", features = ["serialize"] }
serde-saphyr = "0.0"

[dev-dependencies]
wasm-bindgen-test = "0.3"
```

---

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development workflow.

To add a new converter:
1. Add the Rust crate to `converter-wasm/Cargo.toml`.
2. Create a new file in `converter-wasm/src/converters/`.
3. Implement the `Converter` trait.
4. Register the converter in `converter-wasm/src/registry.rs`.
5. Rebuild with `wasm-pack build --target web`.
6. Add the new format pairs to `web/src/formats.js`.
7. Write tests in `converter-wasm/tests/` and `web/src/`.
