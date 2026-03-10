/**
 * Supported file format pairs and their metadata.
 *
 * Each entry describes what the converter can accept as input and what
 * output formats are available, along with human-readable labels and MIME
 * types used when offering the result for download.
 *
 * This list mirrors the pairs registered in `converter-wasm/src/registry.rs`.
 * When adding new converters to the Rust crate, update this file too.
 */

/** @typedef {{ label: string, mime: string, ext: string }} FormatMeta */
/** @typedef {{ from: string, to: string, category: string }} ConversionPair */

/** Metadata for every format the app understands. */
export const FORMAT_META = {
  // Markup
  markdown: { label: 'Markdown', mime: 'text/markdown', ext: 'md' },
  md: { label: 'Markdown', mime: 'text/markdown', ext: 'md' },
  html: { label: 'HTML', mime: 'text/html', ext: 'html' },

  // Data serialization
  json: { label: 'JSON', mime: 'application/json', ext: 'json' },
  yaml: { label: 'YAML', mime: 'application/yaml', ext: 'yaml' },
  toml: { label: 'TOML', mime: 'application/toml', ext: 'toml' },
  csv: { label: 'CSV', mime: 'text/csv', ext: 'csv' },
  xml: { label: 'XML', mime: 'application/xml', ext: 'xml' },

  // Images
  png: { label: 'PNG', mime: 'image/png', ext: 'png' },
  jpeg: { label: 'JPEG', mime: 'image/jpeg', ext: 'jpg' },
  jpg: { label: 'JPEG', mime: 'image/jpeg', ext: 'jpg' },
  webp: { label: 'WebP', mime: 'image/webp', ext: 'webp' },
  bmp: { label: 'BMP', mime: 'image/bmp', ext: 'bmp' },
  gif: { label: 'GIF', mime: 'image/gif', ext: 'gif' },
  ico: { label: 'ICO', mime: 'image/x-icon', ext: 'ico' },
};

/**
 * All supported conversion pairs.
 * Populated at runtime from the WASM module's `supported_conversions()` call,
 * but these static fallbacks allow the UI to render before WASM loads.
 *
 * @type {ConversionPair[]}
 */
export const STATIC_PAIRS = [
  // Markup
  { from: 'markdown', to: 'html', category: 'markup' },
  { from: 'md', to: 'html', category: 'markup' },

  // Data
  { from: 'json', to: 'yaml', category: 'data' },
  { from: 'yaml', to: 'json', category: 'data' },
  { from: 'json', to: 'toml', category: 'data' },
  { from: 'toml', to: 'json', category: 'data' },
  { from: 'json', to: 'csv', category: 'data' },
  { from: 'csv', to: 'json', category: 'data' },
  { from: 'json', to: 'xml', category: 'data' },
  { from: 'xml', to: 'json', category: 'data' },
  { from: 'yaml', to: 'toml', category: 'data' },
  { from: 'toml', to: 'yaml', category: 'data' },
  { from: 'yaml', to: 'csv', category: 'data' },
  { from: 'csv', to: 'yaml', category: 'data' },
  { from: 'csv', to: 'toml', category: 'data' },
  { from: 'toml', to: 'csv', category: 'data' },

  // Images
  { from: 'png', to: 'jpeg', category: 'image' },
  { from: 'png', to: 'jpg', category: 'image' },
  { from: 'jpeg', to: 'png', category: 'image' },
  { from: 'jpg', to: 'png', category: 'image' },
  { from: 'png', to: 'webp', category: 'image' },
  { from: 'webp', to: 'png', category: 'image' },
  { from: 'jpeg', to: 'webp', category: 'image' },
  { from: 'jpg', to: 'webp', category: 'image' },
  { from: 'webp', to: 'jpeg', category: 'image' },
  { from: 'webp', to: 'jpg', category: 'image' },
  { from: 'bmp', to: 'png', category: 'image' },
  { from: 'png', to: 'bmp', category: 'image' },
  { from: 'bmp', to: 'jpeg', category: 'image' },
  { from: 'jpeg', to: 'bmp', category: 'image' },
  { from: 'gif', to: 'png', category: 'image' },
  { from: 'gif', to: 'jpeg', category: 'image' },
  { from: 'ico', to: 'png', category: 'image' },
  { from: 'png', to: 'ico', category: 'image' },
];

/**
 * Detect the format of a file from its name.
 * @param {string} filename
 * @returns {string} lowercase extension without the dot
 */
export function detectFormat(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  // Normalise jpeg/jpg
  return ext === 'jpeg' ? 'jpg' : ext;
}

/**
 * Get all target formats available for a given source format.
 * @param {string} fromFormat
 * @param {ConversionPair[]} pairs
 * @returns {string[]}
 */
export function getTargetFormats(fromFormat, pairs) {
  const norm = fromFormat === 'jpeg' ? 'jpg' : fromFormat;
  return pairs
    .filter((p) => p.from === norm || p.from === fromFormat)
    .map((p) => p.to)
    .filter((t, i, arr) => arr.indexOf(t) === i); // deduplicate
}

/**
 * Get the MIME type for a format identifier.
 * @param {string} format
 * @returns {string}
 */
export function getMimeType(format) {
  return FORMAT_META[format]?.mime ?? 'application/octet-stream';
}

/**
 * Get the file extension for a format identifier.
 * @param {string} format
 * @returns {string}
 */
export function getExtension(format) {
  return FORMAT_META[format]?.ext ?? format;
}

/**
 * Get the human-readable label for a format identifier.
 * @param {string} format
 * @returns {string}
 */
export function getLabel(format) {
  return FORMAT_META[format]?.label ?? format.toUpperCase();
}
