//! Shared types for conversion input/output.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Options that can be passed to any converter.
/// All fields are optional; converters use sensible defaults.
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ConvertOptions {
    /// JPEG quality (1–100). Defaults to 85.
    pub jpeg_quality: Option<u8>,
    /// Whether to pretty-print JSON/TOML/YAML output. Defaults to true.
    pub pretty: Option<bool>,
    /// For Markdown conversions: enable GitHub Flavored Markdown extensions.
    pub gfm: Option<bool>,
}

/// Result returned from a conversion operation.
///
/// Uses `wasm_bindgen` so it can be returned directly to JavaScript.
#[wasm_bindgen]
pub struct ConvertResult {
    ok: bool,
    data: Vec<u8>,
    error: String,
    mime_type: String,
}

#[wasm_bindgen]
impl ConvertResult {
    /// Whether the conversion succeeded.
    pub fn ok(&self) -> bool {
        self.ok
    }

    /// The converted output bytes (only valid when `ok()` is true).
    pub fn data(&self) -> Vec<u8> {
        self.data.clone()
    }

    /// The error message (only valid when `ok()` is false).
    pub fn error_message(&self) -> String {
        self.error.clone()
    }

    /// MIME type of the output (e.g. `"image/png"`, `"application/json"`).
    pub fn mime_type(&self) -> String {
        self.mime_type.clone()
    }
}

impl ConvertResult {
    pub fn success(data: Vec<u8>) -> Self {
        ConvertResult {
            ok: true,
            data,
            error: String::new(),
            mime_type: String::new(),
        }
    }

    pub fn success_with_mime(data: Vec<u8>, mime_type: &str) -> Self {
        ConvertResult {
            ok: true,
            data,
            error: String::new(),
            mime_type: mime_type.to_string(),
        }
    }

    pub fn from_error(msg: String) -> Self {
        ConvertResult {
            ok: false,
            data: Vec::new(),
            error: msg,
            mime_type: String::new(),
        }
    }
}
