use std::collections::HashMap;
use std::fs::create_dir_all;
use std::sync::Arc;

use std::sync::Mutex;
use futures::executor::block_on;
use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_store::StoreExt;
use tokio::sync::mpsc;

use crate::event::MCPInstallParam;
use crate::event::{EMIT_MCP_INSTALL, EMIT_OAP_LOGOUT, EMIT_OAP_REFRESH};
use crate::state::oap::OAPState;
use crate::state::AppState;

mod command;
mod configs;
mod dependency;
mod event;
mod host;
mod mcp;
mod process;
mod oap;
mod shared;
mod state;
mod tray;
mod util;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let host_handle = Arc::new(Mutex::new(None::<host::HostProcess>));
    let host_handle_clone = host_handle.clone();

    let log_level = if cfg!(debug_assertions) {
        log::LevelFilter::Debug
    } else {
        log::LevelFilter::Info
    };

    tauri::async_runtime::set(tokio::runtime::Handle::current());
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd: String| {
            log::info!(
                "single instance, {}, {argv:?}, {cwd}",
                app.package_info().name
            );
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Folder {
                        path: shared::PROJECT_DIRS.log.clone(),
                        file_name: Some("main-tauri".to_string()),
                    },
                ))
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepOne)
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .level(log_level)
                .max_file_size(1024 * 100)
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .on_window_event(move |window, event| {
            match event {
                WindowEvent::Destroyed => {
                    if let Ok(mut host_handle) = host_handle.lock() {
                        if let Some(mut host) = host_handle.take() {
                            log::info!("destroying host");
                            host.destroy();
                        }
                    }
                }
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    let app_handle = window.app_handle();
                    let settings = app_handle.state::<AppState>();

                    if settings.get_minimize_to_tray() {
                        // if minimize to tray, hide the window
                        api.prevent_close();
                        if let Err(e) = window.hide() {
                            log::warn!("Failed to hide window: {}", e);
                        } else {
                            log::info!("Window minimized to tray");
                        }
                    } else {
                        // if not minimize to tray, close the window and clean up the host
                        if let Ok(mut host_handle) = host_handle.lock() {
                            if let Some(mut host) = host_handle.take() {
                                log::info!("Window closing, cleaning up host");
                                host.destroy();
                            }
                        }
                    }
                }
                _ => {}
            }
        })
        .setup(move |app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            let app_handle = app.handle();

            let store = app.store("oap.json")?;
            // register oap listener
            let _app_handle = app_handle.clone();
            let oap_state: anyhow::Result<OAPState> = block_on(async move {
                let oap_state = OAPState::new(_app_handle.clone(), store);
                oap_state.on_recv_ws_event(move |event| {
                    let _ = match event {
                        oap::OAPWebSocketHandlerEvent::Disconnect => {
                            _app_handle.emit(EMIT_OAP_LOGOUT, "")
                        },
                        oap::OAPWebSocketHandlerEvent::Refresh => {
                            _app_handle.emit(EMIT_OAP_REFRESH, "")
                        },
                    };
                }).await;

                Ok(oap_state)
            });

            let oap_state = Arc::new(oap_state?);
            app.manage(oap_state.clone());

            // deep link
            let _app_handle = app_handle.clone();
            let deep_link_handler = move |urls: Vec<url::Url>| {
                let url = urls.first().cloned();
                if let Some(url) = url {
                    let host = url.host_str();

                    match host {
                        Some("signin") => {
                            let path = url.path();
                            let token = &path[1..].to_string();

                            if token.len() < 4 {
                                log::warn!("invalid oap login token: {:?}", &token);
                                return;
                            }

                            let _oap_state = oap_state.clone();
                            let _token = token.clone();
                            tauri::async_runtime::spawn(async move {
                                let _ = _oap_state.login(_token).await;
                            });

                            log::info!("oap login via deep link: {:?}*******", &token[..4]);
                        }
                        Some("refresh") => {
                            let _ = _app_handle.emit(EMIT_OAP_REFRESH, "");
                            log::info!("oap refresh via deep link");
                        }
                        Some("mcp.install") => {
                            log::info!("oap mcp install via deep link: {:?}", &url);
                            let Some(query) = url.query() else {
                                log::warn!("invalid oap mcp apply url: {:?}", &url);
                                return;
                            };

                            let query_map: HashMap<String, String> = query.split('&').filter_map(|pair| {
                                let (key, value) = pair.split_once('=')?;
                                Some((key.to_string(), value.to_string()))
                            }).collect();

                            let Some(name) = query_map.get("name") else {
                                log::warn!("missing mcp name");
                                return;
                            };

                            let Some(config) = query_map.get("config") else {
                                log::warn!("missing mcp config");
                                return;
                            };

                            let _ = _app_handle.emit(EMIT_MCP_INSTALL, MCPInstallParam {
                                name: name.clone(),
                                config: config.clone(),
                            });
                        }
                        _ => {
                            log::warn!("unknown deep link url: {:?}", &url);
                        }
                    }
                }
            };

            let deep_link = app.deep_link();
            let _app_handle = app_handle.clone();
            let _deep_link_handler = deep_link_handler.clone();
            deep_link.on_open_url(move |event| {
                if let Some(window) = _app_handle.get_webview_window("main") {
                    let _ = window.set_focus();
                }

                _deep_link_handler(event.urls());
            });

            if let Ok(Some(urls)) = deep_link.get_current() {
                log::info!("deep link open from cli: {:?}", &urls);
                deep_link_handler(urls);
            }

            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            {
                deep_link.register_all()?;
            }

            // system tray
            tray::init_system_tray(app)?;

            // replace old bus file with empty file
            create_dir_all(&shared::PROJECT_DIRS.bus.parent().unwrap())?;
            if let Err(e) = std::fs::write(&shared::PROJECT_DIRS.bus, "") {
                log::warn!("failed to replace bus file: {e}");
            }

            // dependency downloader
            let (tx, rx) = mpsc::channel(20);
            app.manage(state::DownloadDependencyState {
                rx: Mutex::new(Some(rx)),
            });

            let host_dir = app
                .path()
                .resolve("resources/mcp-host", tauri::path::BaseDirectory::Resource)?;
            log::info!("host dir: {}", host_dir.display());

            let prebuilt_dir = app
                .path()
                .resolve("resources/prebuilt", tauri::path::BaseDirectory::Resource)?;

            // init mcp host services
            tauri::async_runtime::spawn(async move {
                if let Err(e) = upgrade_from_electron().await {
                    log::error!("failed to upgrade from electron: {e}");
                }

                let script_dir = shared::PROJECT_DIRS.script.clone();
                if !script_dir.join("package.json").exists() {
                    let _ = tokio::fs::create_dir_all(&script_dir).await;
                    if let Err(e) = util::copy_dir(&prebuilt_dir.join("scripts"), &script_dir).await
                    {
                        tx.send(state::DownloadDependencyEvent::Error(format!(
                            "failed to copy prebuilt to script: {e}"
                        )))
                        .await
                        .unwrap();
                        log::error!("failed to copy prebuilt to script: {e}");
                    }
                }

                let mut host = host::HostProcess::new(host_dir.clone());
                if let Err(e) = host.prepare().await {
                    tx.send(state::DownloadDependencyEvent::Error(format!(
                        "failed to prepare host: {e}"
                    )))
                    .await
                    .unwrap();
                    log::error!("failed to prepare host: {e}");
                }

                let downloader = dependency::DependencyDownloader::new(tx.clone(), host_dir);
                if let Err(e) = downloader.start().await {
                    tx.send(state::DownloadDependencyEvent::Error(format!(
                        "failed to start dependency downloader: {e}"
                    )))
                    .await
                    .unwrap();
                    log::error!("failed to start dependency downloader: {e}");
                }

                if let Err(e) = host.spawn().await {
                    tx.send(state::DownloadDependencyEvent::Error(format!(
                        "failed to start host: {e}"
                    )))
                    .await
                    .unwrap();
                    log::error!("failed to start host: {e}");
                }

                if let Ok(mut host_handle) = host_handle_clone.lock() {
                    *host_handle = Some(host);
                }
            });

            // global state
            let store = app.store("preferences.json")?;
            let state = state::AppState { store };
            app.manage(state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            command::start_recv_download_dependency_log,
            command::copy_image,
            command::download_image,
            // llm
            command::llm::llm_openai_model_list,
            command::llm::llm_anthropic_model_list,
            command::llm::llm_ollama_model_list,
            command::llm::llm_openai_compatible_model_list,
            command::llm::llm_bedrock_model_list,
            command::llm::llm_mistralai_model_list,
            command::llm::llm_google_genai_model_list,
            // system
            command::system::system_get_minimize_to_tray,
            command::system::system_set_minimize_to_tray,
            // host
            command::host::host_refresh_config,
            // oap
            command::oap::oap_set_host,
            command::oap::oap_login,
            command::oap::oap_logout,
            command::oap::oap_get_mcp_servers,
            command::oap::oap_search_mcp_server,
            command::oap::oap_apply_mcp_server,
            command::oap::oap_get_me,
            command::oap::oap_get_usage,
            command::oap::open_oap_login_page,
            command::oap::oap_get_token,
            command::oap::oap_get_model_description,
        ])
        .append_invoke_initialization_script(include_str!("../../shared/preload.js"))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn upgrade_from_electron() -> anyhow::Result<()> {
    let tauri_flag_file = shared::PROJECT_DIRS.root.join(".tauri");
    if tauri_flag_file.exists() {
        return Ok(());
    }

    // set tauri flag file
    tokio::fs::write(tauri_flag_file, "").await?;
    log::info!("upgrading from electron");

    // ready to upgrade
    let alias_file = shared::PROJECT_DIRS.config.join(host::COMMAND_ALIAS_FILE);
    if alias_file.exists() {
        tokio::fs::remove_file(alias_file).await?;
    }

    log::info!("upgrade from electron done");
    Ok(())
}
