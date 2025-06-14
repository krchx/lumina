fn main() {
    println!("cargo:rustc-link-arg=-Wl,-rpath,/usr/lib/x86_64-linux-gnu");
    tauri_build::build()
}
