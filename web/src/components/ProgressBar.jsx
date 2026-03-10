/**
 * ProgressBar — accessible progress indicator.
 */

import styles from './ProgressBar.module.css';

export function ProgressBar({ percent, label }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.header}>
        <span className={styles.label}>{label ?? 'Converting…'}</span>
        <span className={styles.percent}>{Math.round(percent)}%</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Conversion progress'}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
