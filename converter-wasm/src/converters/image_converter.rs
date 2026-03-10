//! Image format converter: PNG ↔ JPEG ↔ WebP ↔ BMP ↔ GIF ↔ ICO.
//!
//! Uses the `image` crate 0.25 with `default-features = false` to avoid
//! pulling in `rayon` (threading) which is unavailable on WASM.
//! All operations use in-memory buffers via `load_from_memory` / `write_to`.

use crate::error::ConvertError;
use crate::registry::ConversionPair;
use crate::types::ConvertOptions;
use image::{ImageFormat, ImageReader};
use std::io::Cursor;

const PAIRS: &[(&str, &str, &str)] = &[
    ("png", "jpeg", "image"),
    ("png", "jpg", "image"),
    ("jpeg", "png", "image"),
    ("jpg", "png", "image"),
    ("png", "webp", "image"),
    ("webp", "png", "image"),
    ("jpeg", "webp", "image"),
    ("jpg", "webp", "image"),
    ("webp", "jpeg", "image"),
    ("webp", "jpg", "image"),
    ("bmp", "png", "image"),
    ("png", "bmp", "image"),
    ("bmp", "jpeg", "image"),
    ("jpeg", "bmp", "image"),
    ("gif", "png", "image"),
    ("gif", "jpeg", "image"),
    ("ico", "png", "image"),
    ("png", "ico", "image"),
];

pub fn can_convert(from: &str, to: &str) -> bool {
    PAIRS.iter().any(|(f, t, _)| *f == from && *t == to)
}

pub fn supported_pairs() -> Vec<ConversionPair> {
    PAIRS
        .iter()
        .map(|(from, to, category)| ConversionPair { from, to, category })
        .collect()
}

pub fn convert(
    input: &[u8],
    from: &str,
    to: &str,
    options: &ConvertOptions,
) -> Result<Vec<u8>, ConvertError> {
    // Decode input image from raw bytes
    let reader = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| ConvertError::ParseError(format!("Could not detect image format: {e}")))?;

    let img = reader
        .decode()
        .map_err(|e| ConvertError::ParseError(format!("Image decode failed for '{from}': {e}")))?;

    // Determine output format
    let out_format = format_from_str(to)?;

    // Encode output image to an in-memory buffer
    let mut buf: Vec<u8> = Vec::new();
    let mut cursor = Cursor::new(&mut buf);

    if out_format == ImageFormat::Jpeg {
        // For JPEG, apply quality setting
        let quality = options.jpeg_quality.unwrap_or(85);
        let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut cursor, quality);
        img.write_with_encoder(encoder)
            .map_err(|e| ConvertError::EncodeError(format!("JPEG encode failed: {e}")))?;
    } else {
        img.write_to(&mut cursor, out_format).map_err(|e| {
            ConvertError::EncodeError(format!("Image encode to '{to}' failed: {e}"))
        })?;
    }

    Ok(buf)
}

/// Map a format string to an `image::ImageFormat`.
fn format_from_str(fmt: &str) -> Result<ImageFormat, ConvertError> {
    match fmt {
        "png" => Ok(ImageFormat::Png),
        "jpeg" | "jpg" => Ok(ImageFormat::Jpeg),
        "webp" => Ok(ImageFormat::WebP),
        "bmp" => Ok(ImageFormat::Bmp),
        "gif" => Ok(ImageFormat::Gif),
        "ico" => Ok(ImageFormat::Ico),
        "tiff" | "tif" => Ok(ImageFormat::Tiff),
        other => Err(ConvertError::UnsupportedConversion {
            from: other.to_string(),
            to: other.to_string(),
        }),
    }
}
