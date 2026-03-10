import { describe, it, expect } from 'vitest';
import {
  detectFormat,
  getTargetFormats,
  getMimeType,
  getExtension,
  getLabel,
  STATIC_PAIRS,
} from '../formats.js';

describe('detectFormat', () => {
  it('detects json extension', () => {
    expect(detectFormat('data.json')).toBe('json');
  });

  it('detects png extension', () => {
    expect(detectFormat('photo.png')).toBe('png');
  });

  it('normalises jpeg to jpg', () => {
    expect(detectFormat('image.jpeg')).toBe('jpg');
  });

  it('handles uppercase extension', () => {
    expect(detectFormat('file.PNG')).toBe('png');
  });

  it('handles file with multiple dots', () => {
    expect(detectFormat('my.backup.tar.gz')).toBe('gz');
  });

  it('handles markdown .md extension', () => {
    expect(detectFormat('README.md')).toBe('md');
  });
});

describe('getTargetFormats', () => {
  it('returns target formats for json', () => {
    const targets = getTargetFormats('json', STATIC_PAIRS);
    expect(targets).toContain('yaml');
    expect(targets).toContain('toml');
    expect(targets).toContain('csv');
    expect(targets).toContain('xml');
  });

  it('returns target formats for png', () => {
    const targets = getTargetFormats('png', STATIC_PAIRS);
    expect(targets).toContain('jpeg');
    expect(targets).toContain('webp');
    expect(targets).toContain('bmp');
    expect(targets).toContain('ico');
  });

  it('returns empty array for unknown format', () => {
    expect(getTargetFormats('unknown-format', STATIC_PAIRS)).toHaveLength(0);
  });

  it('deduplicates targets', () => {
    const targets = getTargetFormats('json', STATIC_PAIRS);
    const unique = [...new Set(targets)];
    expect(targets).toHaveLength(unique.length);
  });
});

describe('getMimeType', () => {
  it('returns correct MIME for json', () => {
    expect(getMimeType('json')).toBe('application/json');
  });

  it('returns correct MIME for png', () => {
    expect(getMimeType('png')).toBe('image/png');
  });

  it('returns octet-stream for unknown format', () => {
    expect(getMimeType('unknown')).toBe('application/octet-stream');
  });
});

describe('getExtension', () => {
  it('returns ext for jpeg', () => {
    expect(getExtension('jpeg')).toBe('jpg');
  });

  it('returns ext for yaml', () => {
    expect(getExtension('yaml')).toBe('yaml');
  });

  it('falls back to format name for unknown', () => {
    expect(getExtension('foo')).toBe('foo');
  });
});

describe('getLabel', () => {
  it('returns human label for png', () => {
    expect(getLabel('png')).toBe('PNG');
  });

  it('returns human label for json', () => {
    expect(getLabel('json')).toBe('JSON');
  });

  it('returns uppercased format for unknown', () => {
    expect(getLabel('xyz')).toBe('XYZ');
  });
});

describe('STATIC_PAIRS', () => {
  it('contains at least one markup pair', () => {
    expect(STATIC_PAIRS.some((p) => p.category === 'markup')).toBe(true);
  });

  it('contains at least one data pair', () => {
    expect(STATIC_PAIRS.some((p) => p.category === 'data')).toBe(true);
  });

  it('contains at least one image pair', () => {
    expect(STATIC_PAIRS.some((p) => p.category === 'image')).toBe(true);
  });

  it('all pairs have from, to, and category fields', () => {
    for (const pair of STATIC_PAIRS) {
      expect(pair).toHaveProperty('from');
      expect(pair).toHaveProperty('to');
      expect(pair).toHaveProperty('category');
    }
  });
});
