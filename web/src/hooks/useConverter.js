/**
 * useConverter — React hook that manages the WASM converter Web Worker.
 *
 * Provides:
 *  - `wasmReady`   — boolean: WASM module has loaded and is ready
 *  - `convert`     — async function to request a conversion
 *  - `status`      — 'idle' | 'loading-wasm' | 'converting' | 'done' | 'error'
 *  - `progress`    — number 0–100
 *  - `result`      — { data: Uint8Array, mimeType: string } | null
 *  - `error`       — string | null
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export function useConverter() {
  const workerRef = useRef(null);
  const pendingRef = useRef({});

  const [wasmReady, setWasmReady] = useState(false);
  const [status, setStatus] = useState('loading-wasm');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Spawn the Web Worker
    const worker = new Worker(
      new URL('../converter.worker.js', import.meta.url),
      {
        type: 'module',
      }
    );

    worker.addEventListener('message', (event) => {
      const msg = event.data;

      switch (msg.type) {
        case 'ready':
          setWasmReady(true);
          setStatus('idle');
          break;

        case 'progress':
          setProgress(msg.percent);
          break;

        case 'result': {
          const resolve = pendingRef.current[msg.id];
          if (resolve) {
            delete pendingRef.current[msg.id];
            resolve(msg);
          }
          if (msg.ok) {
            setResult({ data: msg.data, mimeType: msg.mimeType });
            setStatus('done');
          } else {
            setError(msg.error);
            setStatus('error');
          }
          break;
        }

        case 'error': {
          const reject = pendingRef.current[msg.id];
          if (reject) {
            delete pendingRef.current[msg.id];
            reject(new Error(msg.error));
          }
          setError(msg.error);
          setStatus('error');
          break;
        }
      }
    });

    worker.addEventListener('error', (event) => {
      setError(`Worker error: ${event.message}`);
      setStatus('error');
    });

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const convert = useCallback(
    async (input, from, to, options = {}) => {
      if (!wasmReady) throw new Error('WASM not ready');
      if (!workerRef.current) throw new Error('Worker not available');

      setStatus('converting');
      setProgress(0);
      setResult(null);
      setError(null);

      const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      return new Promise((resolve, reject) => {
        pendingRef.current[id] = (msg) => {
          if (msg.ok) resolve(msg);
          else reject(new Error(msg.error));
        };

        workerRef.current.postMessage({
          type: 'convert',
          id,
          input,
          from,
          to,
          options,
        });
      });
    },
    [wasmReady]
  );

  return { wasmReady, convert, status, progress, result, error };
}
