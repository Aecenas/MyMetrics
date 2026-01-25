from PyQt6.QtWidgets import QPushButton, QGraphicsDropShadowEffect, QWidget, QVBoxLayout, QApplication
from PyQt6.QtCore import Qt, QPointF, QRectF
from PyQt6.QtGui import (
    QPainter, QColor, QLinearGradient, QRadialGradient, 
    QBrush, QPen, QFont, QPainterPath
)

# ================= 颜色主题配置库 =================
THEMES = {
    "PURPLE": {
        "bg_start": QColor("#667EEA"),    # 柔和蓝紫
        "bg_end":   QColor("#764BA2"),    # 深紫
        "shadow":   QColor(80, 50, 180, 160),
    },
    "BLUE": {
        "bg_start": QColor("#4FACFE"),    # 浅蓝
        "bg_end":   QColor("#00F2FE"),    # 青色
        "shadow":   QColor(20, 100, 200, 160), 
    },
    "GREEN": {
        "bg_start": QColor("#43E97B"),    # 嫩绿
        "bg_end":   QColor("#38F9D7"),    # 薄荷青
        "shadow":   QColor(20, 180, 80, 160),
    },
    "ORANGE": { # 新增：夕阳橙
        "bg_start": QColor("#FF9A9E"),    # 蜜桃粉
        "bg_end":   QColor("#FECFEF"),    # 浅粉 (也可以换成暖橙色渐变)
        "shadow":   QColor(255, 100, 100, 160),
    },
    "DARK": {   # 新增：黑金科技风
        "bg_start": QColor("#434343"),
        "bg_end":   QColor("#000000"),
        "shadow":   QColor(0, 0, 0, 180),
    }
}

class FreshGlowingButton(QPushButton):
    def __init__(self, text="Button", theme="PURPLE", width=260, height=80, parent=None):
        super().__init__(text, parent)
        
        # 1. 基础尺寸与字体设置
        # 注意：为了让按压位移不被截断，我们在内部绘制时会预留空间
        # 实际控件高度最好比视觉高度大一点点，或者我们直接在绘制逻辑里控制
        self.setFixedSize(width, height + 10) 
        self.visual_height = height # 按钮的视觉高度
        
        self.setFont(QFont("Microsoft YaHei", 20, QFont.Weight.Bold))
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setMouseTracking(True)
        
        # 2. 初始化主题
        self.theme_cfg = {}
        self.set_theme(theme)
        
        # 3. 状态变量
        self.hover_pos = QPointF(0, 0)
        self.is_hovering = False
        self.is_pressed = False
        
        # 4. 阴影效果初始化
        self.shadow_effect = QGraphicsDropShadowEffect(self)
        self.setGraphicsEffect(self.shadow_effect)
        self._update_shadow_state(pressed=False)

    def set_theme(self, theme_name):
        """动态切换主题"""
        theme_name = theme_name.upper()
        if theme_name not in THEMES:
            theme_name = "PURPLE" # Fallback default
            
        self.theme_cfg = THEMES[theme_name]
        
        # 如果阴影对象已存在，更新颜色
        if hasattr(self, 'shadow_effect'):
            self.shadow_effect.setColor(self.theme_cfg['shadow'])
        self.update()

    def _update_shadow_state(self, pressed):
        """物理阴影反馈"""
        # 确保阴影颜色正确
        self.shadow_effect.setColor(self.theme_cfg['shadow'])
        
        if pressed:
            self.shadow_effect.setBlurRadius(15)
            self.shadow_effect.setYOffset(4)
        else:
            self.shadow_effect.setBlurRadius(35)
            self.shadow_effect.setYOffset(12)

    # ================= 事件处理 =================
    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.is_pressed = True
            self._update_shadow_state(True)
            self.update()
        super().mousePressEvent(event)

    def mouseReleaseEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.is_pressed = False
            self._update_shadow_state(False)
            self.update()
        super().mouseReleaseEvent(event)

    def enterEvent(self, event):
        self.is_hovering = True
        super().enterEvent(event)

    def leaveEvent(self, event):
        self.is_hovering = False
        self.update()
        super().leaveEvent(event)

    def mouseMoveEvent(self, event):
        self.hover_pos = event.position()
        self.update()
        super().mouseMoveEvent(event)

    # ================= 绘图核心逻辑 =================
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # 物理位移：按下时向下偏移 4px
        offset_y = 4 if self.is_pressed else 0
        
        # 定义按钮的主体形状 (胶囊形)
        # width来自于 setFixedSize, height 我们使用 visual_height
        rect = QRectF(0, 0 + offset_y, self.width(), self.visual_height)
        radius = self.visual_height / 2

        path = QPainterPath()
        path.addRoundedRect(rect, radius, radius)

        # A. 绘制背景
        bg_gradient = QLinearGradient(0, offset_y, self.width(), offset_y)
        bg_gradient.setColorAt(0, self.theme_cfg['bg_start'])
        bg_gradient.setColorAt(1, self.theme_cfg['bg_end'])
        painter.fillPath(path, QBrush(bg_gradient))

        # B. 绘制光晕 (鼠标跟随)
        if self.is_hovering:
            painter.save()
            painter.setClipPath(path)
            
            glow_radius = 120 
            glow = QRadialGradient(self.hover_pos, glow_radius)
            glow.setColorAt(0, QColor(255, 255, 255, 90)) 
            glow.setColorAt(0.5, QColor(255, 255, 255, 30))
            glow.setColorAt(1, QColor(255, 255, 255, 0))
            
            painter.fillPath(path, QBrush(glow))
            painter.restore()

        # C. 绘制流光边框
        border_pen = QPen()
        border_pen.setWidth(2)

        if self.is_hovering:
            border_gradient = QRadialGradient(self.hover_pos, 100)
            border_gradient.setColorAt(0, QColor(255, 255, 255, 255)) 
            border_gradient.setColorAt(1, QColor(255, 255, 255, 0))
            border_pen.setBrush(QBrush(border_gradient))
        else:
            border_pen.setColor(Qt.GlobalColor.transparent)

        painter.strokePath(path, border_pen)

        # D. 绘制文字
        painter.setPen(Qt.GlobalColor.white)
        painter.setFont(self.font())
        painter.drawText(rect, Qt.AlignmentFlag.AlignCenter, self.text())


