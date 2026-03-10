/**
 * FormatPicker — dropdowns for selecting source and target formats.
 */

import { getLabel } from '../formats.js';
import styles from './FormatPicker.module.css';

export function FormatPicker({ fromFormat, toFormat, targetFormats, onToChange }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="from-format">
          From
        </label>
        <div className={styles.staticBadge} id="from-format">
          {getLabel(fromFormat)}
        </div>
      </div>

      <span className={styles.arrow} aria-hidden="true">
        →
      </span>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="to-format">
          To
        </label>
        {targetFormats.length === 0 ? (
          <div className={styles.noFormats}>No conversions available</div>
        ) : (
          <select
            id="to-format"
            className={styles.select}
            value={toFormat ?? ''}
            onChange={(e) => onToChange(e.target.value)}
          >
            {targetFormats.map((fmt) => (
              <option key={fmt} value={fmt}>
                {getLabel(fmt)}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
