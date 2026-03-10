/**
 * App — root component for the File Converter web app.
 *
 * Layout (mobile-first):
 *   Header → main card → footer
 *
 * Flow:
 *   1. User drops / selects a file
 *   2. UI detects the source format and shows available target formats
 *   3. User picks a target format and clicks "Convert"
 *   4. Web Worker runs the Rust/WASM converter — UI shows live progress
 *   5. Result is shown with a preview and download button
 */

import { useCallback, useEffect, useState } from 'react';
import { DropZone } from './components/DropZone.jsx';
import { FormatPicker } from './components/FormatPicker.jsx';
import { ProgressBar } from './components/ProgressBar.jsx';
import { ResultPanel } from './components/ResultPanel.jsx';
import { detectFormat, getTargetFormats, STATIC_PAIRS } from './formats.js';
import { useConverter } from './hooks/useConverter.js';
import styles from './App.module.css';

export default function App() {
  const { wasmReady, convert, status, progress, result, error } = useConverter();

  // File state
  const [file, setFile] = useState(null);
  const [fromFormat, setFromFormat] = useState(null);
  const [toFormat, setToFormat] = useState(null);
  const [targetFormats, setTargetFormats] = useState([]);

  // Options (JPEG quality, etc.)
  const [jpegQuality, setJpegQuality] = useState(85);

  const handleFile = useCallback((f) => {
    setFile(f);
    const fmt = detectFormat(f.name);
    setFromFormat(fmt);

    const targets = getTargetFormats(fmt, STATIC_PAIRS);
    setTargetFormats(targets);
    setToFormat(targets[0] ?? null);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file || !fromFormat || !toFormat) return;

    const bytes = await file.arrayBuffer();
    const input = new Uint8Array(bytes);
    const options = { jpeg_quality: jpegQuality };

    try {
      await convert(input, fromFormat, toFormat, options);
    } catch {
      // Error is already captured in `error` state from the hook
    }
  }, [file, fromFormat, toFormat, jpegQuality, convert]);

  const handleReset = useCallback(() => {
    setFile(null);
    setFromFormat(null);
    setToFormat(null);
    setTargetFormats([]);
  }, []);

  const isConverting = status === 'converting';
  const isDone = status === 'done';
  const isError = status === 'error';

  const showJpegQuality = toFormat === 'jpeg' || toFormat === 'jpg';

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.logo} aria-hidden="true">⇄</span>
          <h1 className={styles.title}>File Converter</h1>
          <span className={styles.badge}>On-device · Private · Free</span>
        </div>
        <p className={styles.tagline}>
          All conversions run locally in your browser via Rust + WebAssembly.
          Your files are never uploaded.
        </p>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          {/* WASM loading state */}
          {!wasmReady && (
            <div className={styles.wasmLoading} role="status" aria-live="polite">
              <span className={styles.spinner} aria-hidden="true" />
              Loading converter engine…
            </div>
          )}

          {/* Step 1: File selection */}
          {!file && !isDone && (
            <section aria-label="Select a file to convert">
              <DropZone onFile={handleFile} accept="*/*" />
            </section>
          )}

          {/* Step 2: Format selection + convert button */}
          {file && !isDone && (
            <section className={styles.convertSection} aria-label="Conversion options">
              <div className={styles.fileInfo}>
                <span className={styles.fileName} title={file.name}>
                  {file.name}
                </span>
                <span className={styles.fileSize}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  className={styles.clearBtn}
                  onClick={handleReset}
                  aria-label="Remove selected file"
                >
                  ✕
                </button>
              </div>

              <FormatPicker
                fromFormat={fromFormat}
                toFormat={toFormat}
                targetFormats={targetFormats}
                onToChange={setToFormat}
              />

              {showJpegQuality && (
                <div className={styles.qualityRow}>
                  <label className={styles.qualityLabel} htmlFor="jpeg-quality">
                    JPEG Quality: <strong>{jpegQuality}</strong>
                  </label>
                  <input
                    id="jpeg-quality"
                    type="range"
                    min={1}
                    max={100}
                    value={jpegQuality}
                    onChange={(e) => setJpegQuality(Number(e.target.value))}
                    className={styles.qualitySlider}
                  />
                </div>
              )}

              {isError && (
                <div className={styles.errorBox} role="alert">
                  <strong>Conversion failed:</strong> {error}
                </div>
              )}

              {isConverting ? (
                <ProgressBar percent={progress} label="Converting…" />
              ) : (
                <button
                  className={styles.convertBtn}
                  onClick={handleConvert}
                  disabled={!wasmReady || !toFormat || targetFormats.length === 0}
                >
                  {!wasmReady ? 'Loading engine…' : 'Convert'}
                </button>
              )}
            </section>
          )}

          {/* Step 3: Result */}
          {isDone && result && (
            <ResultPanel
              result={result}
              toFormat={toFormat}
              originalFilename={file?.name}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Supported formats info */}
        <details className={styles.formatsDetails}>
          <summary className={styles.formatsSummary}>Supported conversions</summary>
          <div className={styles.formatsGrid}>
            {STATIC_PAIRS.map((p, i) => (
              <div key={i} className={styles.formatChip}>
                <span>{p.from.toUpperCase()}</span>
                <span className={styles.arrow}>→</span>
                <span>{p.to.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </details>
      </main>

      <footer className={styles.footer}>
        <p>
          Free &amp; open source ·{' '}
          <a
            href="https://github.com/open-online-tools/file-converter"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>{' '}
          ·{' '}
          <a
            href="https://github.com/open-online-tools/file-converter/blob/main/ROADMAP.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Roadmap
          </a>
        </p>
      </footer>
    </div>
  );
}
