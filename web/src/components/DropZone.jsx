/**
 * DropZone — file input with drag-and-drop support.
 *
 * Accepts a single file and reports it via the `onFile` callback.
 */

import { useCallback, useRef, useState } from 'react';
import styles from './DropZone.module.css';

export function DropZone({ onFile, accept }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file) => {
      if (file) onFile(file);
    },
    [onFile]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    // Reset so the same file can be re-uploaded
    e.target.value = '';
  };

  const onClick = () => inputRef.current?.click();

  return (
    <div
      className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label="Drop a file here or click to choose"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        onChange={onInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      <span className={styles.icon} aria-hidden="true">
        📂
      </span>
      <span className={styles.label}>Drop a file here</span>
      <span className={styles.sublabel}>or tap to browse</span>
    </div>
  );
}
