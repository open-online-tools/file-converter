//! Registry of all available converters.
//!
//! Add new converters here by implementing the `Converter` trait and
//! registering the supported `(from, to)` pairs.

use crate::converters::{image_converter, markup_converter, serialization_converter};
use crate::error::ConvertError;
use crate::types::ConvertOptions;
use serde::Serialize;

/// A supported conversion pair.
#[derive(Debug, Serialize)]
pub struct ConversionPair {
    pub from: &'static str,
    pub to: &'static str,
    pub category: &'static str,
}

/// List all supported (from, to) format pairs.
pub fn list_conversions() -> Vec<ConversionPair> {
    let mut pairs = Vec::new();

    // Markup
    pairs.extend(markup_converter::supported_pairs());

    // Serialization / data formats
    pairs.extend(serialization_converter::supported_pairs());

    // Image formats
    pairs.extend(image_converter::supported_pairs());

    pairs
}

/// Dispatch a conversion request to the appropriate converter module.
pub fn convert(
    input: &[u8],
    from: &str,
    to: &str,
    options: &ConvertOptions,
) -> Result<Vec<u8>, ConvertError> {
    // Markup
    if markup_converter::can_convert(from, to) {
        return markup_converter::convert(input, from, to, options);
    }

    // Serialization / data formats
    if serialization_converter::can_convert(from, to) {
        return serialization_converter::convert(input, from, to, options);
    }

    // Image formats
    if image_converter::can_convert(from, to) {
        return image_converter::convert(input, from, to, options);
    }

    Err(ConvertError::UnsupportedConversion {
        from: from.to_string(),
        to: to.to_string(),
    })
}
