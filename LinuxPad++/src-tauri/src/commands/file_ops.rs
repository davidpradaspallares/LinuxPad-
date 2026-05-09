use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Component, PathBuf};
use std::time::SystemTime;

fn validate_path(path: &str) -> Result<PathBuf, String> {
    let p = PathBuf::from(path);
    if p.components().any(|c| c == Component::ParentDir) {
        return Err(format!("Invalid path '{}': parent directory traversal not allowed", path));
    }
    Ok(p)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub size: u64,
    pub modified: Option<u64>,
    pub encoding: String,
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    let p = validate_path(&path)?;
    fs::read_to_string(&p).map_err(|e| format!("Failed to read '{}': {}", path, e))
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    let p = validate_path(&path)?;
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }
    fs::write(&p, content).map_err(|e| format!("Failed to write '{}': {}", path, e))
}

#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let p = validate_path(&path)?;
    let read_dir = fs::read_dir(&p)
        .map_err(|e| format!("Failed to read directory '{}': {}", path, e))?;

    let mut entries: Vec<FileEntry> = read_dir
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let metadata = entry.metadata().ok()?;
            let modified = metadata
                .modified()
                .ok()
                .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
                .map(|d| d.as_secs());

            Some(FileEntry {
                name: entry.file_name().to_string_lossy().to_string(),
                path: entry.path().to_string_lossy().to_string(),
                is_dir: metadata.is_dir(),
                size: metadata.len(),
                modified,
            })
        })
        .collect();

    // Directories first, then alphabetical
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

#[tauri::command]
pub async fn get_file_info(path: String) -> Result<FileInfo, String> {
    let p = validate_path(&path)?;
    let metadata = fs::metadata(&p)
        .map_err(|e| format!("Failed to get info for '{}': {}", path, e))?;

    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    Ok(FileInfo {
        path,
        size: metadata.len(),
        modified,
        encoding: "UTF-8".to_string(),
    })
}

#[tauri::command]
pub async fn create_file(path: String) -> Result<(), String> {
    let p = validate_path(&path)?;
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }
    fs::File::create(&p)
        .map(|_| ())
        .map_err(|e| format!("Failed to create '{}': {}", path, e))
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    let p = validate_path(&path)?;
    fs::create_dir_all(&p)
        .map_err(|e| format!("Failed to create directory '{}': {}", path, e))
}

#[tauri::command]
pub async fn delete_path(path: String) -> Result<(), String> {
    let p = validate_path(&path)?;
    if p.is_dir() {
        fs::remove_dir_all(&p).map_err(|e| format!("Failed to delete directory: {}", e))
    } else {
        fs::remove_file(&p).map_err(|e| format!("Failed to delete file: {}", e))
    }
}

#[tauri::command]
pub async fn get_home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine home directory".to_string())
}

#[tauri::command]
pub async fn path_exists(path: String) -> bool {
    match validate_path(&path) {
        Ok(p) => p.exists(),
        Err(_) => false,
    }
}

#[tauri::command]
pub async fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    let old = validate_path(&old_path)?;
    let new = validate_path(&new_path)?;
    fs::rename(&old, &new)
        .map_err(|e| format!("Failed to rename '{}': {}", old_path, e))
}
