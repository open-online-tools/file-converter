/**
 * Dedicated Web Worker for running Rust/WASM file conversions.
 *
 * Runs the WASM module in a worker thread so the main React UI never freezes,
 * even for large files or CPU-intensive conversions.
 *
 * Message protocol
 * ────────────────
 * Incoming (from main thread):
 *   { type: 'convert', id: string, input: Uint8Array, from: string, to: string, options: object }
 *
 * Outgoing (to main thread):
 *   { type: 'ready' }                    — WASM module loaded and ready
 *   { type: 'progress', id, percent }    — progress update (0–100)
 *   { type: 'result', id, ok, data, error, mimeType }  — conversion finished
 *   { type: 'error', id, error }         — unexpected worker error
 */

let wasmModule = null;
let wasmReady = false;

/**
 * Load and initialise the WASM module.
 * The path is relative to the worker file location when served from Vite.
 */
async function loadWasm() {
  try {
    // Dynamic import of the wasm-pack generated ES module
    const wasm = await import('./wasm/converter_wasm.js');
    await wasm.default(); // calls the wasm-bindgen initialiser
    wasm.init(); // calls our #[wasm_bindgen(start)] fn
    wasmModule = wasm;
    wasmReady = true;
    self.postMessage({ type: 'ready' });
  } catch (err) {
    self.postMessage({
      type: 'error',
      id: null,
      error: `Failed to load WASM module: ${err.message}`,
    });
  }
}

self.addEventListener('message', async (event) => {
  const { type, id, input, from, to, options } = event.data;

  if (type !== 'convert') return;

  if (!wasmReady) {
    self.postMessage({
      type: 'error',
      id,
      error: 'WASM module is not yet ready. Please wait.',
    });
    return;
  }

  try {
    // Report that conversion has started
    self.postMessage({ type: 'progress', id, percent: 0 });

    const optionsJson = JSON.stringify(options ?? {});

    // Run the Rust conversion synchronously within the worker
    const result = wasmModule.convert(input, from, to, optionsJson);

    self.postMessage({ type: 'progress', id, percent: 90 });

    if (result.ok()) {
      const data = result.data();
      const mimeType = result.mime_type();
      self.postMessage({ type: 'progress', id, percent: 100 });
      self.postMessage({
        type: 'result',
        id,
        ok: true,
        data,
        mimeType,
        error: null,
      });
    } else {
      self.postMessage({
        type: 'result',
        id,
        ok: false,
        data: null,
        mimeType: null,
        error: result.error_message(),
      });
    }
  } catch (err) {
    self.postMessage({
      type: 'error',
      id,
      error: `Unexpected error during conversion: ${err.message}`,
    });
  }
});

// Load WASM immediately when the worker starts
loadWasm();
