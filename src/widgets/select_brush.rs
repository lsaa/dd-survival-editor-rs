use eframe::egui::*;

#[derive(Debug)]
pub struct SelectableBrush {
    selected: bool,
    color: Color32,
    size: f32,
}

impl SelectableBrush {
    #[allow(clippy::needless_pass_by_value)]
    pub fn new(selected: bool, color: Color32, size: f32) -> Self {
        Self {
            selected,
            color,
            size
        }
    }
}

impl Widget for SelectableBrush {
    fn ui(self, ui: &mut Ui) -> Response {
        let Self {
            selected,
            color,
            size
        } = self;

        ui.style_mut().spacing.item_spacing = Vec2::new(0., 0.);
        let (rect, response) = ui.allocate_exact_size(Vec2::new(size, size), Sense::click());
        ui.painter().rect(rect, 0.0, color, Stroke::new(0.755, Color32::BLACK));
        if selected {
            ui.painter().rect(rect.shrink(1.5), 0.0, Color32::TRANSPARENT, Stroke::new(3., Color32::BLUE));
        }

        response
    }
}

pub fn selectable_brush<Value: PartialEq, T: ToString>(
    ui: &mut Ui,
    current_value: &mut Value,
    selected_value: Value,
    color: Color32,
    size: f32,
    tooltip: Option<T>
) -> Response {
    let mut response = SelectableBrush::new(*current_value == selected_value, color, size).ui(ui);
    if let Some(tooltip) = tooltip {
        response = response.on_hover_text(tooltip.to_string());
    }
    if response.clicked() {
        *current_value = selected_value;
        response.mark_changed();
    }
    response
}
