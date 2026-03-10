//! converter-wasm: Browser-native file converter compiled to WebAssembly.
//!
//! This crate provides a unified `Converter` trait implemented by adapters for
//! each supported file format category. All conversions operate on in-memory
//! byte slices so they work safely in `wasm32-unknown-unknown` environments.

use wasm_bindgen::prelude::*;

pub mod converters;
mod error;
mod registry;
mod types;

pub use error::ConvertError;
pub use types::{ConvertOptions, ConvertResult};

/// Initialize the WASM module (sets up panic hook for better error messages).
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Convert a file from one format to another.
///
/// # Arguments
/// * `input` - Raw bytes of the input file
/// * `from_format` - Source format identifier (e.g. `"json"`, `"png"`)
/// * `to_format` - Target format identifier (e.g. `"yaml"`, `"jpeg"`)
/// * `options_json` - Optional JSON string with conversion options (pass `"{}"` for defaults)
///
/// # Returns
/// `ConvertResult` containing the output bytes or an error message.
#[wasm_bindgen]
pub fn convert(
    input: &[u8],
    from_format: &str,
    to_format: &str,
    options_json: &str,
) -> ConvertResult {
    let options: ConvertOptions = serde_json::from_str(options_json).unwrap_or_default();
    let from = from_format.to_lowercase();
    let to = to_format.to_lowercase();

    match registry::convert(input, &from, &to, &options) {
        Ok(output) => ConvertResult::success(output),
        Err(e) => ConvertResult::from_error(e.to_string()),
    }
}

/// List all supported conversion pairs as a JSON array.
///
/// Returns a JSON string like:
/// ```json
/// [{"from": "json", "to": "yaml"}, {"from": "png", "to": "jpeg"}, ...]
/// ```
#[wasm_bindgen]
pub fn supported_conversions() -> String {
    let pairs = registry::list_conversions();
    serde_json::to_string(&pairs).unwrap_or_else(|_| "[]".to_string())
}
