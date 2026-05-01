mod commands;

use commands::{file_ops::*, file_watcher::*};

pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(WatcherState::default())
        .invoke_handler(tauri::generate_handler![
            // File operations
            read_file,
            write_file,
            list_directory,
            get_file_info,
            create_file,
            create_directory,
            delete_path,
            get_home_dir,
            path_exists,
            // File watcher
            watch_file,
            unwatch_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
