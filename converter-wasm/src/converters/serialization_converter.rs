//! Serialization format converter: JSON ↔ YAML ↔ TOML ↔ CSV ↔ XML.
//!
//! Uses `serde_json`, `serde-saphyr`, `toml`, `csv`, and `quick-xml` — all
//! pure-Rust crates that compile to `wasm32-unknown-unknown`.

use crate::error::ConvertError;
use crate::registry::ConversionPair;
use crate::types::ConvertOptions;

const PAIRS: &[(&str, &str, &str)] = &[
    ("json", "yaml", "data"),
    ("yaml", "json", "data"),
    ("json", "toml", "data"),
    ("toml", "json", "data"),
    ("json", "csv", "data"),
    ("csv", "json", "data"),
    ("json", "xml", "data"),
    ("xml", "json", "data"),
    ("yaml", "toml", "data"),
    ("toml", "yaml", "data"),
    ("yaml", "csv", "data"),
    ("csv", "yaml", "data"),
    ("csv", "toml", "data"),
    ("toml", "csv", "data"),
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
    let src = std::str::from_utf8(input)
        .map_err(|e| ConvertError::ParseError(format!("Invalid UTF-8: {e}")))?;

    let pretty = options.pretty.unwrap_or(true);

    // First, parse input into a serde_json::Value (universal intermediate)
    let value: serde_json::Value = match from {
        "json" => serde_json::from_str(src).map_err(|e| ConvertError::ParseError(e.to_string()))?,
        "yaml" => {
            serde_saphyr::from_str(src).map_err(|e| ConvertError::ParseError(e.to_string()))?
        }
        "toml" => {
            let toml_val: toml::Value =
                toml::from_str(src).map_err(|e| ConvertError::ParseError(e.to_string()))?;
            serde_json::to_value(toml_val).map_err(|e| ConvertError::ParseError(e.to_string()))?
        }
        "csv" => csv_to_json(src)?,
        "xml" => xml_to_json(src)?,
        _ => {
            return Err(ConvertError::UnsupportedConversion {
                from: from.to_string(),
                to: to.to_string(),
            })
        }
    };

    // Then, encode to the target format
    let output = match to {
        "json" => {
            let s = if pretty {
                serde_json::to_string_pretty(&value)
                    .map_err(|e| ConvertError::EncodeError(e.to_string()))?
            } else {
                serde_json::to_string(&value)
                    .map_err(|e| ConvertError::EncodeError(e.to_string()))?
            };
            s.into_bytes()
        }
        "yaml" => {
            let s = serde_saphyr::to_string(&value)
                .map_err(|e| ConvertError::EncodeError(e.to_string()))?;
            s.into_bytes()
        }
        "toml" => {
            let toml_val: toml::Value = serde_json::from_value(value)
                .map_err(|e| ConvertError::EncodeError(e.to_string()))?;
            let s = if pretty {
                toml::to_string_pretty(&toml_val)
                    .map_err(|e| ConvertError::EncodeError(e.to_string()))?
            } else {
                toml::to_string(&toml_val).map_err(|e| ConvertError::EncodeError(e.to_string()))?
            };
            s.into_bytes()
        }
        "csv" => json_to_csv(&value)?,
        "xml" => json_to_xml(&value)?,
        _ => {
            return Err(ConvertError::UnsupportedConversion {
                from: from.to_string(),
                to: to.to_string(),
            })
        }
    };

    Ok(output)
}

/// Convert CSV text to a JSON array of objects.
fn csv_to_json(src: &str) -> Result<serde_json::Value, ConvertError> {
    let mut reader = csv::Reader::from_reader(src.as_bytes());
    let headers: Vec<String> = reader
        .headers()
        .map_err(|e| ConvertError::ParseError(e.to_string()))?
        .iter()
        .map(|h| h.to_string())
        .collect();

    let mut rows = Vec::new();
    for result in reader.records() {
        let record = result.map_err(|e| ConvertError::ParseError(e.to_string()))?;
        let obj: serde_json::Map<String, serde_json::Value> = headers
            .iter()
            .zip(record.iter())
            .map(|(k, v)| (k.clone(), serde_json::Value::String(v.to_string())))
            .collect();
        rows.push(serde_json::Value::Object(obj));
    }

    Ok(serde_json::Value::Array(rows))
}

/// Convert a JSON value to CSV text.
/// Expects a JSON array of objects with uniform keys.
fn json_to_csv(value: &serde_json::Value) -> Result<Vec<u8>, ConvertError> {
    let rows = value.as_array().ok_or_else(|| {
        ConvertError::EncodeError("JSON to CSV requires a top-level array".to_string())
    })?;

    if rows.is_empty() {
        return Ok(Vec::new());
    }

    let first = rows[0].as_object().ok_or_else(|| {
        ConvertError::EncodeError("JSON to CSV requires an array of objects".to_string())
    })?;

    let headers: Vec<String> = first.keys().cloned().collect();

    let mut buf = Vec::new();
    {
        let mut writer = csv::Writer::from_writer(&mut buf);
        writer
            .write_record(&headers)
            .map_err(|e| ConvertError::EncodeError(e.to_string()))?;

        for row in rows {
            let obj = row.as_object().ok_or_else(|| {
                ConvertError::EncodeError("Each row must be a JSON object".to_string())
            })?;
            let record: Vec<String> = headers
                .iter()
                .map(|h| {
                    obj.get(h)
                        .map(|v| match v {
                            serde_json::Value::String(s) => s.clone(),
                            other => other.to_string(),
                        })
                        .unwrap_or_default()
                })
                .collect();
            writer
                .write_record(&record)
                .map_err(|e| ConvertError::EncodeError(e.to_string()))?;
        }

        writer
            .flush()
            .map_err(|e| ConvertError::IoError(e.to_string()))?;
    }

    Ok(buf)
}

/// Convert XML text to a JSON value via quick-xml.
fn xml_to_json(src: &str) -> Result<serde_json::Value, ConvertError> {
    use quick_xml::de::from_str;
    let value: serde_json::Value =
        from_str(src).map_err(|e| ConvertError::ParseError(e.to_string()))?;
    Ok(value)
}

/// Convert a JSON value to XML via quick-xml.
fn json_to_xml(value: &serde_json::Value) -> Result<Vec<u8>, ConvertError> {
    use quick_xml::se::to_string;
    let s = to_string(value).map_err(|e| ConvertError::EncodeError(e.to_string()))?;
    Ok(s.into_bytes())
}
