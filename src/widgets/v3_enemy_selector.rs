use ddcore_rs::models::spawnset::V3Enemies;
use eframe::egui::{Color32, Response, Stroke, Ui, Vec2, Widget};

pub struct V3EnemySelector();

impl V3EnemySelector {
    pub fn ui(
        &mut self,
        ui: &mut Ui,
        selected_enemy: &mut V3Enemies
    ) {
        ui.style_mut().visuals.widgets.active.corner_radius = 0.;
        ui.style_mut().visuals.widgets.hovered.corner_radius = 0.;
        ui.style_mut().visuals.widgets.inactive.corner_radius = 0.;
        ui.style_mut().visuals.widgets.hovered.bg_stroke = Stroke::new(0.1, Color32::from_rgb(255, 255, 255));
        ui.style_mut().visuals.widgets.active.bg_stroke = Stroke::new(0.1, Color32::from_rgb(255, 255, 255));
        ui.style_mut().visuals.widgets.inactive.bg_stroke = Stroke::new(0.1, Color32::from_rgb(255, 255, 255));
        ui.style_mut().visuals.widgets.noninteractive.bg_stroke = Stroke::new(0.1, Color32::from_rgb(255, 255, 255));
        ui.style_mut().spacing.item_spacing = Vec2::new(3., 3.);

        ui.columns(3, |cols| {
            for (i, col) in cols.iter_mut().enumerate() {
                match i {
                    0 => { col.vertical_centered_justified(|ui| {
                        selectable_value(ui, selected_enemy, V3Enemies::Squid1, "Squid I");
                        selectable_value(ui, selected_enemy, V3Enemies::Squid2, "Squid II");
                        selectable_value(ui, selected_enemy, V3Enemies::Squid3, "Squid III");
                        selectable_value(ui, selected_enemy, V3Enemies::Leviathan, "Leviathan");
                    }); },
                    1 => { col.vertical_centered_justified(|ui| {
                        selectable_value(ui, selected_enemy, V3Enemies::Centipede, "Centipede");
                        selectable_value(ui, selected_enemy, V3Enemies::Gigapede, "Gigapede");
                        selectable_value(ui, selected_enemy, V3Enemies::Ghostpede, "Ghostpede");
                    }); },
                    2 => { col.vertical_centered_justified(|ui| {
                        selectable_value(ui, selected_enemy, V3Enemies::Empty, "Empty");
                        selectable_value(ui, selected_enemy, V3Enemies::Spider1, "Spider I");
                        selectable_value(ui, selected_enemy, V3Enemies::Spider2, "Spider II");
                        selectable_value(ui, selected_enemy, V3Enemies::Thorn, "Thorn");
                    }); },
                    _ => {}
                };
            }
        });
    }
}

pub fn selectable_value<Value: PartialEq>(
    ui: &mut Ui,
    current_value: &mut Value,
    selected_value: Value,
    text: impl ToString,
) -> Response {
    use crate::widgets::SelectableLabel;
    let mut response = SelectableLabel::new(*current_value == selected_value, text).ui(ui);
    if response.clicked() {
        *current_value = selected_value;
        response.mark_changed();
    }
    response
}
