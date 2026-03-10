//! Integration tests for serialization format conversions.
//!
//! These tests run on the host (not in WASM) to verify converter logic.
//! Use `wasm-bindgen-test` for browser/WASM-specific tests.

use converter_wasm::ConvertOptions;

fn opts() -> ConvertOptions {
    ConvertOptions {
        pretty: Some(true),
        ..Default::default()
    }
}

mod serialization {
    use super::*;
    use converter_wasm::converters::serialization_converter;

    #[test]
    fn json_to_yaml() {
        let input = r#"{"name":"Alice","age":30}"#.as_bytes();
        let result = serialization_converter::convert(input, "json", "yaml", &opts());
        assert!(result.is_ok(), "json->yaml failed: {:?}", result);
        let output = String::from_utf8(result.unwrap()).unwrap();
        assert!(output.contains("name") && output.contains("Alice"));
    }

    #[test]
    fn yaml_to_json() {
        let input = b"name: Bob\nage: 25\n";
        let result = serialization_converter::convert(input, "yaml", "json", &opts());
        assert!(result.is_ok(), "yaml->json failed: {:?}", result);
        let output = String::from_utf8(result.unwrap()).unwrap();
        assert!(output.contains("\"name\"") && output.contains("\"Bob\""));
    }

    #[test]
    fn json_to_toml() {
        let input = r#"{"title":"Hello","count":42}"#.as_bytes();
        let result = serialization_converter::convert(input, "json", "toml", &opts());
        assert!(result.is_ok(), "json->toml failed: {:?}", result);
        let output = String::from_utf8(result.unwrap()).unwrap();
        assert!(output.contains("title") && output.contains("Hello"));
    }

    #[test]
    fn toml_to_json() {
        let input = b"title = \"World\"\ncount = 7\n";
        let result = serialization_converter::convert(input, "toml", "json", &opts());
        assert!(result.is_ok(), "toml->json failed: {:?}", result);
        let output = String::from_utf8(result.unwrap()).unwrap();
        assert!(output.contains("\"title\"") && output.contains("\"World\""));
    }

    #[test]
    fn csv_to_json() {
        let input = b"name,age\nAlice,30\nBob,25\n";
        let result = serialization_converter::convert(input, "csv", "json", &opts());
        assert!(result.is_ok(), "csv->json failed: {:?}", result);
        let output = String::from_utf8(result.unwrap()).unwrap();
        assert!(output.contains("Alice") && output.contains("Bob"));
    }

    #[test]
    fn json_to_csv() {
        let input = r#"[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]"#.as_bytes();
        let result = serialization_converter::convert(input, "json", "csv", &opts());
        assert!(result.is_ok(), "json->csv failed: {:?}", result);
        let output = String::from_utf8(result.unwrap()).unwrap();
        assert!(output.contains("name") && output.contains("Alice"));
    }

    #[test]
    fn unsupported_pair_returns_error() {
        let result =
            serialization_converter::convert(b"data", "json", "pdf", &ConvertOptions::default());
        assert!(result.is_err());
    }
}

mod markup {
    use converter_wasm::converters::markup_converter;
    use converter_wasm::ConvertOptions;

    #[test]
    fn markdown_to_html() {
        let input = b"# Hello\n\nWorld\n";
        let result = markup_converter::convert(
            input,
            "markdown",
            "html",
            &ConvertOptions {
                gfm: Some(true),
                ..Default::default()
            },
        );
        assert!(result.is_ok(), "markdown->html failed: {:?}", result);
        let output = String::from_utf8(result.unwrap()).unwrap();
        assert!(output.contains("<h1>") && output.contains("Hello"));
    }

    #[test]
    fn markdown_commonmark() {
        let input = b"**bold** and _italic_";
        let result = markup_converter::convert(
            input,
            "md",
            "html",
            &ConvertOptions {
                gfm: Some(false),
                ..Default::default()
            },
        );
        assert!(result.is_ok());
        let output = String::from_utf8(result.unwrap()).unwrap();
        assert!(output.contains("<strong>") || output.contains("<b>"));
    }
}
