use std::{fs::File, sync::{Arc, mpsc::{Receiver, Sender}}};
use std::io::Read;
use anyhow::{Result, bail};
use eframe::{egui::{self, Align2, Color32, Painter, Pos2, Rect, Response, Stroke, Ui, Vec2, Widget, mutex::RwLock, widgets}, epi};
use js_sys::{Array, Uint8Array};
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "persistence", derive(serde::Deserialize, serde::Serialize))]
#[cfg_attr(feature = "persistence", serde(default))]
pub struct TemplateApp {
    #[cfg_attr(feature = "persistence", serde(skip))]
    selected_enemy: V3Enemies,
    #[cfg_attr(feature = "persistence", serde(skip))]
    selected_brush: ArenaBrush,
    #[cfg_attr(feature = "persistence", serde(skip))]
    selected_tiles: [bool; 51*51],
    #[cfg_attr(feature = "persistence", serde(skip))]
    load_spawnset: Option<Spawnset<V3Enemies>>,
    #[cfg_attr(feature = "persistence", serde(skip))]
    file_load: (Sender<Vec<u8>>, Receiver<Vec<u8>>),
    #[cfg_attr(feature = "persistence", serde(skip))]
    spawnset: SpawnsetData
}


#[wasm_bindgen]
extern "C" {
    fn save_file(s: &str, data: Uint8Array);
}

#[derive(Clone)]
pub struct SpawnsetData {
    arena: [f32; 51*51],
    initial_hand: HandLevel,
    additional_gems: String,
    disable_collection: bool,
    timer_start: String,
    shrink_start: String,
    shrink_end: String,
    shrink_rate: String,
    brightness: String,
    spawns: Vec<Spawn<V3Enemies>>,
}

impl SpawnsetData {
    pub fn try_convert_spawnset(self) -> Result<Spawnset<V3Enemies>> {
        let additional_gems: i32 = self.additional_gems.parse()?;
        let timer_start: f32 = self.timer_start.parse()?;
        let shrink_start: f32 = self.shrink_start.parse()?;
        let shrink_rate: f32 = self.shrink_rate.parse()?;
        let shrink_end: f32 = self.shrink_end.parse()?;
        let brightness: f32 = self.brightness.parse()?;

        let mut s = Spawnset::<V3Enemies> {
            header: Header {
                shrink_rate,
                shrink_start_radius: shrink_start,
                shrink_end_radius: shrink_end,
                brightness,
                ..Default::default()
            },
            arena: Arena {
                data: self.arena
            },
            spawns_header: SpawnsHeader::default(),
            spawns: self.spawns,
            settings: Some(Settings {
                initial_hand: self.initial_hand as u8 + 1,
                additional_gems,
                timer_start: Some(timer_start)
            })
        };

        s.recalculate_spawn_count();
        Ok(s)
    }
}

impl Default for TemplateApp {
    fn default() -> Self {
        Self {
            selected_enemy: V3Enemies::Empty,
            selected_brush: ArenaBrush::Select,
            selected_tiles: [false; 51*51],
            load_spawnset: None,
            file_load: std::sync::mpsc::channel(),
            spawnset: SpawnsetData {
                additional_gems: "0".into(),
                initial_hand: HandLevel::Level1,
                arena: [-1000.; 51*51],
                disable_collection: false,
                timer_start: "0.0".into(),
                shrink_start: "50.0".into(),
                shrink_end: "30.0".into(),
                shrink_rate: "0.2".into(),
                brightness: "100.0".into(),
                spawns: vec![],
            }
        }
    }
}


#[derive(PartialEq, Debug, Clone)]
enum HandLevel {
    Level1,
    Level2,
    Level3,
    Level4,
}

#[derive(PartialEq, Debug)]
pub enum ArenaBrush {
    Height(f32),
    Select,
    Deselect
}

use ddcore_rs::models::spawnset::{Arena, Header, Settings, Spawn, SpawnsHeader, Spawnset, V3Enemies};
use crate::widgets::{V3EnemySelector, selectable_brush};

impl epi::App for TemplateApp {
    fn name(&self) -> &str {
        "eframe template"
    }

    fn setup(
        &mut self,
        _ctx: &egui::CtxRef,
        _frame: &mut epi::Frame<'_>,
        _storage: Option<&dyn epi::Storage>,
    ) {
        #[cfg(feature = "persistence")]
        if let Some(storage) = _storage {
            *self = epi::get_value(storage, epi::APP_KEY).unwrap_or_default()
        }
    }

    #[cfg(feature = "persistence")]
    fn save(&mut self, storage: &mut dyn epi::Storage) {
        epi::set_value(storage, epi::APP_KEY, self);
    }

    fn max_size_points(&self) -> egui::Vec2 {
        egui::vec2(5000., 5000.)
    }

    fn update(&mut self, ctx: &egui::CtxRef, frame: &mut epi::Frame<'_>) {
        let Self {
            selected_enemy, 
            selected_brush,
            selected_tiles,
            load_spawnset,
            file_load,
            spawnset
        } = self;


        if let Ok(load_data) = file_load.1.try_recv() {
            *load_spawnset = Some(Spawnset::<V3Enemies>::deserialize(&mut &load_data[..]).unwrap());
            let s = load_spawnset.as_ref().unwrap();
            spawnset.arena = s.arena.data.clone();
            spawnset.shrink_start = format!("{}", s.header.shrink_start_radius);
            spawnset.shrink_end = format!("{}", s.header.shrink_end_radius);
            spawnset.shrink_rate = format!("{}", s.header.shrink_rate);
            spawnset.brightness = format!("{}", s.header.brightness);
            spawnset.spawns = s.spawns.clone();
            if let Some(settings) = &s.settings {
                spawnset.initial_hand = match settings.initial_hand {
                    2 => HandLevel::Level2,
                    3 => HandLevel::Level3,
                    4 => HandLevel::Level4,
                    _ => HandLevel::Level1,
                };

                spawnset.additional_gems = format!("{}", settings.additional_gems);
                if let Some(timer) = &settings.timer_start {
                    spawnset.timer_start = format!("{}", timer);
                }
            }
        }
        
        egui::TopBottomPanel::top("top_panel").show(ctx, |ui| {
            egui::menu::bar(ui, |ui| {
                egui::menu::menu(ui, "File", |ui| {
                    if ui.button("New").clicked() {
                    }

                    if ui.button("Open").clicked() {
                        let sender_clone = file_load.0.clone();
                        wasm_bindgen_futures::spawn_local(async move {
                            let s = rfd::AsyncFileDialog::new().pick_file().await.unwrap();
                            let _ = sender_clone.send(s.read().await);
                        });
                    }

                    if ui.button("Save (Download)").clicked() {
                        if let Ok(spawnset_file) = spawnset.clone().try_convert_spawnset() {
                            let mut r = Vec::new();
                            spawnset_file.serialize(&mut r);
                            let mut a = Uint8Array::new_with_length(r.len() as u32);
                            for (i, b) in r.iter().enumerate() {
                                a.set_index(i as u32, *b);
                            }
                            unsafe { save_file("survival", a) };
                        }
                    }

                    if ui.button("Replace Survival File").clicked() {

                    }

                    if ui.button("Quit").clicked() {
                        frame.quit();
                    }
                });

                ui.checkbox(&mut false, "📁 Spawnset Browser");
            });
        });

        egui::Window::new("Arena Settings").resizable(true).show(ctx, |ui| {
            egui::Grid::new("arena_settings").num_columns(2).show(ui, |ui| {
                ui.label("Shrink Start");
                ui.text_edit_singleline(&mut spawnset.shrink_start);
                ui.end_row();

                ui.label("Shrink End");
                ui.text_edit_singleline(&mut spawnset.shrink_end);
                ui.end_row();


                ui.label("Shrink Rate");
                ui.text_edit_singleline(&mut spawnset.shrink_rate);
                ui.end_row();

                ui.label("Brightness");
                ui.text_edit_singleline(&mut spawnset.brightness);
                ui.end_row();
            });

            ui.label("Arena Shrink Preview");
            ui.add(widgets::Slider::new(&mut 100., 0.0..=1000.0).show_value(false));

        });

        egui::Window::new("Settings").resizable(true).show(ctx, |ui| {
            ui.label("Hand Level");
            egui::ComboBox::from_id_source("hand_level")
                .selected_text(format!("{:?}", spawnset.initial_hand))
                .width(ui.available_width() - 8.)
                .show_ui(ui, |ui| {
                    ui.selectable_value(&mut spawnset.initial_hand, HandLevel::Level1, "Level 1");
                    ui.selectable_value(&mut spawnset.initial_hand, HandLevel::Level2, "Level 2");
                    ui.selectable_value(&mut spawnset.initial_hand, HandLevel::Level3, "Level 3");
                    ui.selectable_value(&mut spawnset.initial_hand, HandLevel::Level4, "Level 4");
            });

            ui.separator();

            ui.label("Additional Gems");
            ui.text_edit_singleline(&mut spawnset.additional_gems);
            ui.checkbox(&mut spawnset.disable_collection, "Disable Collection");

            ui.separator();

            ui.label("Timer Start");
            ui.text_edit_singleline(&mut spawnset.timer_start);
        });

    
        egui::Window::new("Arena Canvas").resizable(true).show(ctx, |ui|{
            egui::Frame::group(&ui.style()).show(ui, |ui| {
                ui.horizontal(|ui| {
                    ui.label("Tile: {0, 0}");
                    ui.label("Height: 0.00");
                });
                ui.ctx().request_repaint();
                let mouse = ui.input().pointer.interact_pos();
                let painter = Painter::new(
                    ui.ctx().clone(),
                    ui.layer_id(),
                    ui.available_rect_before_wrap(),
                );

                let scale = pixel_perfect_scale(ui.available_size(), Vec2::new(51., 51.));
                let rect = painter.clip_rect();
                let arena = Rect::from_center_size(rect.center(), Vec2::new(51. * scale as f32, 51. * scale as f32));
                let (_drag_zone, mut _response) = ui.allocate_exact_size(rect.size(), egui::Sense::drag());

                for y in 0..51 {
                    for x in 0..51 {
                        painter.rect(tile_rect(arena, x, y).expand(0.6), 0.0, tile_color(spawnset.arena[y as usize * 51 + x as usize]), Stroke::none());
                    }
                }

                if let Some(pos) = mouse {
                    if let Some((x, y)) = mouse_to_arena_tile(arena, pos) {
                        let tile = tile_rect(arena, x, y);
                        painter.text(rect.center(), Align2::CENTER_CENTER, format!("{} {}", x, y), egui::TextStyle::Body, Color32::WHITE);
                        painter.rect(tile, 0.0, Color32::TRANSPARENT, Stroke::new(0.2 * scale as f32, Color32::WHITE));

                        if ui.input().pointer.primary_down() {
                                let h = match selected_brush {
                                    ArenaBrush::Height(b) => b.clone(),
                                    ArenaBrush::Select => 0.0,
                                    ArenaBrush::Deselect => 0.0,
                                };
                                spawnset.arena[y as usize * 51 + x as usize] = h;
                        }
                    }
                }

                //painter.text(rect.center(), Align2::CENTER_CENTER, format!("{}", scale), egui::TextStyle::Body, Color32::WHITE);

                ui.expand_to_include_rect(painter.clip_rect());
            });
        });

        egui::Window::new("Brushes").resizable(true).show(ctx, |ui|{
            egui::Frame::group(&ui.style()).show(ui, |ui| {
                let scale = pixel_perfect_scale(ui.available_size(), Vec2::new(9., 7.));
                let brush_size = ui.available_size_before_wrap().x / 9.;
                ui.allocate_ui(Vec2::new(9.4 * scale as f32, 7. * scale as f32), |ui| {
                    ui.horizontal_wrapped(|ui| {
                        for i in 0..9 {
                            let h = match i {
                                0 => -1000.,
                                1 => -1.1,
                                2 => -1.,
                                3 => -0.67,
                                4 => -0.33,
                                _ => -1.25 + i as f32 * 0.25,
                            };
                            let b = ArenaBrush::Height(h);
                            selectable_brush(ui, selected_brush, b, tile_color(h), brush_size, Some(format!("{}", h)));
                        }

                        for y in 1..7 {
                            for x in 0..9 {
                                let h = (y - 1) * 9 + x + 1;
                                let b = ArenaBrush::Height(h as f32);
                                selectable_brush(ui, selected_brush, b, tile_color(h as f32), brush_size, Some(format!("{}", h)));
                            }
                        }
                    });
                });
            });

        });


        egui::Window::new("Enemy Select").resizable(true).show(ctx, |ui| {
            V3EnemySelector().ui(ui, selected_enemy);
        });

        egui::CentralPanel::default().show(ctx, |ui| {
            
        //});

/*
            ui.columns(3, |cols| {
                for (i, col) in cols.iter_mut().enumerate() {
                    match i {
                        0 => { col.heading("Spawns"); },
                        1 => { col.heading("Settings"); },
                        2 => { col.heading("Arena"); },
                        _ => {}
                    };
                }
            });
*/
        });
    }
}

fn pixel_perfect_scale(available: Vec2, ui_object_size: Vec2) -> u32 {
    if ui_object_size.x > available.x || ui_object_size.y > available.y {
        return 0;
    }
    let x_ratio = (available.x / ui_object_size.x).floor() as u32;
    let y_ratio = (available.y / ui_object_size.y).floor() as u32;
    if x_ratio > y_ratio { y_ratio } else { x_ratio }
}


fn tile_rect(arena: Rect, x: u8, y: u8) -> Rect {
    let tile_size = arena.width() / 51.;
    let top_left = Pos2::new(arena.min.x + x as f32 * tile_size, arena.min.y + y as f32 * tile_size);
    Rect::from_two_pos(
        top_left,
        Pos2::new(top_left.x + tile_size, top_left.y + tile_size)
    )
}

fn mouse_to_arena_tile(arena: Rect, mouse: Pos2) -> Option<(u8, u8)> {
    let tile_size = arena.width() / 51.;
    if !arena.contains(mouse) {
        return None;
    }

    Some((
        ((mouse.x - arena.min.x) / tile_size).clamp(0., 50.) as u8,
        ((mouse.y - arena.min.y) / tile_size).clamp(0., 50.) as u8
    ))
}

/*
float colorValue = Math.Max(0, (height - TileMin) * 12 + 64);

if (height < TileDefault)
    return Color.FromRgb((byte)(colorValue * (1 + Math.Abs(height * 0.5f))), (byte)(colorValue / 4), (byte)((height - TileMin) * 8));

return Color.FromRgb((byte)colorValue, (byte)(colorValue / 2), (byte)((height - TileMin) * 4));
*/

fn tile_color(height: f32) -> Color32 {
    if height < -1.1 {
        return Color32::BLACK;
    }
    
    if height > 54. {
        return Color32::from_rgb(0, 160, 255);
    }

    let color = ((height - 1.1) * 12. + 64.).max(0.);
    if height < 0. {
        return Color32::from_rgb( (color * (1. + (height * 0.5).abs())) as u8, (color / 4.) as u8, ((height - (-1.1)) * 8.) as u8);
    }

    let r = ovrflw(color as i32);
    let g = ovrflw((color / 2.) as i32);
    let b = ovrflw(((height - (-1.1)) * 4.) as i32);

    Color32::from_rgb(r, g, b)
}

fn ovrflw(n: i32) -> u8 {
    let mut r = 0u8;
    let mut remainder = n + 1;
    while remainder > 0 {
        if remainder > u8::MAX as i32 {
            r = r.overflowing_add(u8::MAX).0;
            remainder -= u8::MAX as i32;
        } else {
            r = r.overflowing_add(remainder as u8).0;
            remainder -= remainder;
        }
    }
    r
}
