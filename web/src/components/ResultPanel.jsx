/**
 * ResultPanel — shows conversion output and download button.
 */

import { useCallback } from 'react';
import { getExtension, getMimeType } from '../formats.js';
import styles from './ResultPanel.module.css';

export function ResultPanel({ result, toFormat, originalFilename, onReset }) {
  const download = useCallback(() => {
    if (!result?.data) return;

    const baseName =
      originalFilename?.replace(/\.[^.]+$/, '') ?? 'converted';
    const ext = getExtension(toFormat);
    const mime = result.mimeType || getMimeType(toFormat);

    const blob = new Blob([result.data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result, toFormat, originalFilename]);

  const isImage = toFormat && ['png', 'jpeg', 'jpg', 'webp', 'bmp', 'gif', 'ico'].includes(toFormat);
  const isText = result?.data &&
    ['html', 'json', 'yaml', 'toml', 'csv', 'xml', 'markdown', 'md'].includes(toFormat);

  let previewContent = null;
  if (isImage && result?.data) {
    const mime = getMimeType(toFormat);
    const blob = new Blob([result.data], { type: mime });
    const url = URL.createObjectURL(blob);
    previewContent = (
      <img
        src={url}
        alt="Converted image preview"
        className={styles.imagePreview}
        onLoad={() => URL.revokeObjectURL(url)}
      />
    );
  } else if (isText && result?.data) {
    const text = new TextDecoder().decode(result.data);
    previewContent = (
      <pre className={styles.textPreview}>
        <code>{text.slice(0, 2000)}{text.length > 2000 ? '\n…(truncated for preview)' : ''}</code>
      </pre>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Conversion complete</span>
        <span className={styles.size}>
          {result?.data ? `${(result.data.byteLength / 1024).toFixed(1)} KB` : ''}
        </span>
      </div>

      {previewContent && (
        <div className={styles.preview}>{previewContent}</div>
      )}

      <div className={styles.actions}>
        <button className={styles.downloadBtn} onClick={download}>
          ⬇ Download
        </button>
        <button className={styles.resetBtn} onClick={onReset}>
          Convert another file
        </button>
      </div>
    </div>
  );
}
