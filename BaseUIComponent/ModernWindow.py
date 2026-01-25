import sys
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
                             QPushButton, QFrame, QSizeGrip, QGraphicsDropShadowEffect, QMainWindow, QApplication)
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QColor

# --- 核心配色方案 ---
THEMES = {
    "dark": {
        "bg_main": "#1E1E2E", "bg_content": "#1E1E2E",
        "text_main": "#D9E0EE", "text_sub": "#989DAF",
        "accent": "#96CDFB", "accent_hover": "#B3E1FF", "accent_pressed": "#89B4FA",
        "border": "#3E4255", "btn_hover": "#303446", "btn_text": "#989DAF",
        "action_text": "#1E1E2E",
    },
    "light": {
        "bg_main": "#FFFFFF", "bg_content": "#FFFFFF",
        "text_main": "#333333", "text_sub": "#666666",
        "accent": "#007AFF", "accent_hover": "#3395FF", "accent_pressed": "#0056B3",
        "border": "#E0E0E0", "btn_hover": "#F0F0F0", "btn_text": "#333333",
        "action_text": "#FFFFFF",
    }
}

class TitleBar(QWidget):
    """自定义标题栏"""
    def __init__(self, parent):
        super().__init__(parent)
        self.setFixedHeight(45)
        self.layout = QHBoxLayout(self)
        self.layout.setContentsMargins(15, 0, 10, 0)
        self.layout.setSpacing(8)

        # 标题文本
        self.title_label = QLabel("MODERN APP")
        self.title_label.setObjectName("windowTitle")
        self.title_label.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)

        self.layout.addWidget(self.title_label)
        self.layout.addStretch(1)

        # 模式切换按钮
        self.btn_mode = self.create_nav_button("☾", self.toggle_theme_click)
        self.btn_mode.setObjectName("btnMode")
        
        # 窗口控制按钮
        self.btn_min = self.create_nav_button("─", self.minimize_window)
        self.btn_max = self.create_nav_button("◻", self.toggle_maximize_restore)
        self.btn_close = self.create_nav_button("✕", self.close_window)
        self.btn_close.setObjectName("btnClose")
        self.btn_min.setObjectName("btnNav")
        self.btn_max.setObjectName("btnNav")

        self.layout.addWidget(self.btn_mode)
        self.layout.addSpacing(5)
        self.layout.addWidget(self.btn_min)
        self.layout.addWidget(self.btn_max)
        self.layout.addWidget(self.btn_close)

    def create_nav_button(self, text, slot):
        btn = QPushButton(text)
        btn.setFixedSize(36, 30)
        btn.clicked.connect(slot)
        return btn

    def toggle_theme_click(self):
        self.window().toggle_theme()
        self.btn_mode.setText("☾" if self.window().is_dark else "☀")

    def minimize_window(self):
        self.window().showMinimized()

    def toggle_maximize_restore(self):
        if self.window().isMaximized():
            self.window().showNormal()
            self.btn_max.setText("◻")
            self.window().update_style()
            self.window().layout().setContentsMargins(20, 20, 20, 20)
        else:
            self.window().showMaximized()
            self.btn_max.setText("❐")
            self.window().update_style()
            self.window().layout().setContentsMargins(0, 0, 0, 0)

    def close_window(self):
        self.window().close()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            if self.window().isMaximized(): return
            self.window().windowHandle().startSystemMove()

    def mouseDoubleClickEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.toggle_maximize_restore()


class ModernWindow(QMainWindow):
    """
    这是一个通用的现代风格窗口基类。
    使用方法：继承此类，并在子类的 __init__ 中向 self.content_layout 添加控件。
    """
    def __init__(self):
        super().__init__()
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        self.is_dark = True # 默认暗色
        
        self.init_framework()
        self.resize_and_center()

    def init_framework(self):
        # 1. 主容器
        self.container = QFrame()
        self.container.setObjectName("MainContainer")
        self.setCentralWidget(self.container)

        self.main_layout = QVBoxLayout(self.container)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(0)

        # 2. 标题栏
        self.title_bar = TitleBar(self)
        self.main_layout.addWidget(self.title_bar)

        # 3. 内容区容器 (外部引用的核心区域)
        self.content_area = QFrame()
        self.content_area.setObjectName("ContentArea")
        
        # 对外暴露的布局，外部文件直接 self.content_layout.addWidget(...)
        self.content_layout = QVBoxLayout(self.content_area)
        self.content_layout.setContentsMargins(0, 0, 0, 0) 
        self.content_layout.setSpacing(0)
        
        self.main_layout.addWidget(self.content_area)

        # 4. 底部栏 & 缩放手柄
        self.bottom_bar = QFrame()
        self.bottom_bar.setFixedHeight(20)
        self.bottom_bar.setStyleSheet("background: transparent;")
        self.bottom_layout = QHBoxLayout(self.bottom_bar)
        self.bottom_layout.setContentsMargins(0,0,0,0)
        self.bottom_layout.addStretch()
        self.size_grip = QSizeGrip(self.bottom_bar) 
        self.bottom_layout.addWidget(self.size_grip)
        self.main_layout.addWidget(self.bottom_bar)

        # 5. 阴影
        self.shadow = QGraphicsDropShadowEffect(self)
        self.shadow.setBlurRadius(25)
        self.shadow.setOffset(0, 4)
        self.container.setGraphicsEffect(self.shadow)
        
        # 6. 初始化边距和样式
        self.layout().setContentsMargins(20, 20, 20, 20)
        self.update_style()

    def set_window_title(self, title):
        """提供一个简单的接口修改标题"""
        self.title_bar.title_label.setText(title)

    def resize_and_center(self):
        screen = QApplication.primaryScreen()
        if screen:
            geo = screen.availableGeometry()
            w, h = int(geo.width() * 0.65), int(geo.height() * 0.75)
            self.resize(w, h)
            self.move(int((geo.width()-w)/2)+geo.x(), int((geo.height()-h)/2)+geo.y())

    def toggle_theme(self):
        self.is_dark = not self.is_dark
        self.update_style()

    def update_style(self):
        theme = THEMES["dark"] if self.is_dark else THEMES["light"]
        is_maximized = self.isMaximized()
        radius = "0px" if is_maximized else "12px"
        border_val = "none" if is_maximized else f"1px solid {theme['border']}"
        shadow_color = QColor(0, 0, 0, 150) if self.is_dark else QColor(0, 0, 0, 80)
        
        self.shadow.setColor(shadow_color)

        # 核心样式表
        self.container.setStyleSheet(f"""
            #MainContainer {{
                background-color: {theme['bg_main']};
                border: {border_val};
                border-radius: {radius};
            }}
            #windowTitle {{
                color: {theme['text_sub']};
                font-weight: bold;
                font-family: "Segoe UI", sans-serif;
                font-size: 13px;
                letter-spacing: 1px;
            }}
            #btnNav, #btnMode {{
                background-color: transparent;
                color: {theme['btn_text']};
                border: none;
                border-radius: 4px;
                font-size: 16px;
                font-family: "Segoe UI Symbol";
            }}
            #btnNav:hover, #btnMode:hover {{
                background-color: {theme['btn_hover']};
            }}
            #btnClose {{
                background-color: transparent;
                color: {theme['btn_text']};
                border: none;
                border-radius: 4px;
                font-size: 16px;
            }}
            #btnClose:hover {{
                background-color: #F28FAD; color: white;
            }}
            #ContentArea {{
                background-color: {theme['bg_content']};
                border-bottom-left-radius: {radius};
                border-bottom-right-radius: {radius};
            }}
            /* 以下是通用控件样式，子类可以直接用 */
            QLabel {{ color: {theme['text_main']}; }}
            #HeaderLabel {{
                color: {theme['text_main']};
                font-family: "Segoe UI", sans-serif;
                font-size: 32px;
                font-weight: bold;
            }}
            #DescLabel {{
                color: {theme['text_sub']};
                font-family: "Segoe UI", sans-serif;
                font-size: 16px;
            }}
            #ActionBtn {{
                background-color: {theme['accent']};
                color: {theme['action_text']};
                border: none; border-radius: 8px; font-weight: bold; font-size: 14px;
            }}
            #ActionBtn:hover {{ background-color: {theme['accent_hover']}; }}
            #ActionBtn:pressed {{ background-color: {theme['accent_pressed']}; margin-top: 1px; margin-left: 1px; }}
            
            #OutlineBtn {{
                background-color: transparent;
                color: {theme['accent']};
                border: 2px solid {theme['accent']};
                border-radius: 8px; font-weight: bold; font-size: 14px;
            }}
            #OutlineBtn:hover {{ background-color: {theme['accent']}1A; }}
            #OutlineBtn:pressed {{ background-color: {theme['accent']}33; }}
            
            QSizeGrip {{ background: transparent; width: 20px; height: 20px; }}
        """)