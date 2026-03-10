//! Markup format converter: Markdown → HTML.
//!
//! Uses `pulldown-cmark` for CommonMark and `comrak` for GitHub Flavored
//! Markdown. Both crates are pure Rust and compile to `wasm32-unknown-unknown`.

use crate::error::ConvertError;
use crate::registry::ConversionPair;
use crate::types::ConvertOptions;

const PAIRS: &[(&str, &str, &str)] = &[("markdown", "html", "markup"), ("md", "html", "markup")];

/// Returns true if this module handles the given format pair.
pub fn can_convert(from: &str, to: &str) -> bool {
    PAIRS.iter().any(|(f, t, _)| *f == from && *t == to)
}

/// List supported conversion pairs for this module.
pub fn supported_pairs() -> Vec<ConversionPair> {
    PAIRS
        .iter()
        .map(|(from, to, category)| ConversionPair { from, to, category })
        .collect()
}

/// Convert Markdown bytes to HTML bytes.
pub fn convert(
    input: &[u8],
    _from: &str,
    _to: &str,
    options: &ConvertOptions,
) -> Result<Vec<u8>, ConvertError> {
    let src = std::str::from_utf8(input)
        .map_err(|e| ConvertError::ParseError(format!("Invalid UTF-8: {e}")))?;

    let use_gfm = options.gfm.unwrap_or(true);

    let html = if use_gfm {
        markdown_to_html_gfm(src)
    } else {
        markdown_to_html_commonmark(src)
    };

    Ok(html.into_bytes())
}

/// Convert Markdown to HTML using comrak (GitHub Flavored Markdown).
fn markdown_to_html_gfm(src: &str) -> String {
    let mut options = comrak::Options::default();
    // Extension options
    options.extension.strikethrough = true;
    options.extension.tagfilter = true;
    options.extension.table = true;
    options.extension.autolink = true;
    options.extension.tasklist = true;
    // Render options — comrak 0.51 uses `unsafe` (not `unsafe_`)
    options.render.github_pre_lang = true;
    options.render.r#unsafe = true;

    comrak::markdown_to_html(src, &options)
}

/// Convert Markdown to HTML using pulldown-cmark (CommonMark).
fn markdown_to_html_commonmark(src: &str) -> String {
    use pulldown_cmark::{html, Options, Parser};

    let mut opts = Options::empty();
    opts.insert(Options::ENABLE_TABLES);
    opts.insert(Options::ENABLE_FOOTNOTES);
    opts.insert(Options::ENABLE_STRIKETHROUGH);
    opts.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(src, opts);
    let mut output = String::new();
    html::push_html(&mut output, parser);
    output
}
