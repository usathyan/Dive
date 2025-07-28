use std::{env, fs, path::Path};

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("file_hashes.rs");

    let file_content = fs::read("../mcp-host/uv.lock").expect("Failed to read file");
    let hash_string = md5::compute(&file_content);

    // codegen
    let generated_code = format!(
        r#"
pub const UV_LOCK_MD5: &str = "{}";
"#,
        hash_string
            .to_vec()
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect::<Vec<String>>()
            .join("")
    );

    fs::write(&dest_path, generated_code).unwrap();
    println!("cargo:rerun-if-changed=../mcp-host/uv.lock");

    tauri_build::build();
}
