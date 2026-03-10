//! Unified error type for all conversion operations.

use std::fmt;

/// Errors that can occur during file conversion.
#[derive(Debug)]
pub enum ConvertError {
    /// The requested from/to format pair is not supported.
    UnsupportedConversion { from: String, to: String },
    /// The input data could not be parsed.
    ParseError(String),
    /// The output could not be encoded.
    EncodeError(String),
    /// An I/O-like error (e.g. writing to an in-memory buffer).
    IoError(String),
}

impl fmt::Display for ConvertError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConvertError::UnsupportedConversion { from, to } => {
                write!(f, "Conversion from '{from}' to '{to}' is not supported")
            }
            ConvertError::ParseError(msg) => write!(f, "Parse error: {msg}"),
            ConvertError::EncodeError(msg) => write!(f, "Encode error: {msg}"),
            ConvertError::IoError(msg) => write!(f, "I/O error: {msg}"),
        }
    }
}
