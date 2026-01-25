import sys
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
                             QPushButton, QFrame, QSizeGrip, QGraphicsDropShadowEffect, 
                             QMainWindow, QApplication)
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QColor, QFont

# 引入你的基类
from BaseUIComponent.ModernWindow import ModernWindow
from BaseUIComponent.NavWidget import NavigationWidget, NavButton
from BaseUIComponent.GlobalConfig import APP_THEMES

# ============================================================================
#  工具函数：获取屏幕缩放比例
# ============================================================================
def get_ui_scale():
    """
    根据屏幕分辨率计算 UI 缩放比例。
    基准以 1080p (高度 1080) 为 1.0。
    """
    screen = QApplication.primaryScreen()
    if not screen:
        return 1.0
    
    # 获取屏幕物理高度
    screen_height = screen.geometry().height()
    
    # 设定基准高度为 1080 px
    # 如果你的屏幕是 2160p (4K)，scale 就是 2.0
    # 如果你的屏幕是 1080p，scale 就是 1.0
    scale = screen_height / 1080.0
    
    # 限制最小比例，防止在极低分辨率下太小
    return max(0.8, scale)

class DashboardPage(QWidget):
    """右侧 Dashboard 内容页面"""
    def __init__(self, scale=1.0, parent=None):
        super().__init__(parent)
        self.layout = QVBoxLayout(self)
        m = int(40 * scale)
        self.layout.setContentsMargins(m, m, m, m)
        self.layout.setSpacing(int(20 * scale))

        self.lbl_title = QLabel("Dashboard")
        self.lbl_title.setObjectName("HeaderLabel")
        
        self.lbl_subtitle = QLabel("Your personal data overview")
        self.lbl_subtitle.setObjectName("DescLabel")

        self.layout.addWidget(self.lbl_title)
        self.layout.addWidget(self.lbl_subtitle)
        self.layout.addSpacing(int(10 * scale))

        # Empty State
        self.empty_state_frame = QFrame()
        self.empty_state_frame.setObjectName("EmptyState")
        self.empty_layout = QVBoxLayout(self.empty_state_frame)
        self.empty_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.icon_circle = QLabel("●")
        self.icon_circle.setObjectName("EmptyStateIcon")
        self.icon_circle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.lbl_empty_title = QLabel("No charts configured")
        self.lbl_empty_title.setObjectName("EmptyTitle") # 增加 ObjectName 方便配色
        self.lbl_empty_title.setStyleSheet(f"font-size: {int(18*scale)}px; font-weight: bold;")
        
        self.lbl_empty_desc = QLabel("Head over to the Data Studio to create your first\nvisualization.")
        self.lbl_empty_desc.setObjectName("EmptyDesc")   # 增加 ObjectName
        self.lbl_empty_desc.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.lbl_empty_desc.setStyleSheet(f"font-size: {int(14*scale)}px; margin-top: 5px;")

        self.empty_layout.addWidget(self.icon_circle)
        self.empty_layout.addSpacing(int(15 * scale))
        self.empty_layout.addWidget(self.lbl_empty_title)
        self.empty_layout.addWidget(self.lbl_empty_desc)
        
        self.layout.addWidget(self.empty_state_frame)
        self.layout.setStretch(3, 1)

class AppWindow(ModernWindow):
    def __init__(self):
        # 1. 计算缩放
        self.ui_scale = get_ui_scale()
        
        # 2. 初始化父类 (注意：父类初始化时会调用 update_style，
        #    但此时我们的 UI 还没创建，所以在 update_style 里要加判断)
        super().__init__()
        
        self.set_window_title("DataBoard")
        w, h = int(1100 * self.ui_scale), int(700 * self.ui_scale)
        self.resize(w, h)
        self.resize_and_center()

        # 3. 构建 UI 结构
        self.main_content_widget = QWidget()
        self.h_layout = QHBoxLayout(self.main_content_widget)
        self.h_layout.setContentsMargins(0, 0, 0, 0)
        self.h_layout.setSpacing(0)

        # 实例化侧边栏
        self.sidebar = NavigationWidget(scale=self.ui_scale)
        # 设置头部
        self.sidebar.setup_header(title="DataBoard", icon_text="DB")
        # 添加导航按钮
        self.sidebar.add_navigation_button("Dashboard", "▦", is_checked=True, slot=lambda: print("Dashboard clicked"))
        self.sidebar.add_navigation_button("Data Studio", "▤", slot=lambda: print("Studio clicked"))
        self.sidebar.add_navigation_button("Analytics", "📈", slot=lambda: print("Analytics clicked"))
        # 添加底部按钮
        self.sidebar.add_footer_button("Settings", "⚙", slot=lambda: print("Settings clicked"))
        self.h_layout.addWidget(self.sidebar)

        self.content_stack = QFrame()
        self.content_stack.setObjectName("ContentRight")
        self.stack_layout = QVBoxLayout(self.content_stack)
        self.stack_layout.setContentsMargins(0, 0, 0, 0)
        
        self.dashboard_page = DashboardPage(scale=self.ui_scale)
        self.stack_layout.addWidget(self.dashboard_page)
        
        self.h_layout.addWidget(self.content_stack)
        self.content_layout.addWidget(self.main_content_widget)

        # 4. 手动再刷新一次样式，因为 super().__init__ 时 UI 还没建好
        self.update_style()

    def update_style(self):
        """
        重写父类的 update_style。
        当点击标题栏的切换按钮时，这个方法会被自动调用。
        """
        # 1. 先让父类处理基础窗口样式 (边框、标题栏等)
        super().update_style()

        # 如果 UI 还没初始化完（super().__init__ 阶段），直接返回
        if not hasattr(self, 'sidebar'):
            return

        # 2. 获取当前主题颜色
        theme_key = "dark" if self.is_dark else "light"
        t = APP_THEMES[theme_key]
        s = self.ui_scale
        self.sidebar.set_theme(theme_key)

        # 3. 生成并应用动态样式表
        # 注意：这里我们只针对 AppWindow 特有的控件设置样式
        # 避免覆盖了 ModernWindow 设置的全局样式
        
        app_style = f"""
            /* 侧边栏 */
            #SideBar {{
                background-color: {t['sidebar_bg']};
                border-right: 1px solid {t['sidebar_border']};
                border-bottom-left-radius: 12px;
            }}
            
            /* Logo */
            #LogoIcon {{
                background-color: {t['active_bg']};
                color: {t['active_text']};
                border-radius: {int(8*s)}px;
                font-weight: bold;
                font-size: {int(16*s)}px;
            }}
            #LogoText {{
                color: {t['text_main']};
                font-size: {int(18*s)}px;
                font-weight: bold;
                font-family: "Segoe UI";
            }}

            /* 导航按钮 */
            NavButton {{
                background-color: transparent;
                color: {t['text_sub']};
                text-align: left;
                padding-left: {int(20*s)}px;
                border: none;
                border-radius: {int(8*s)}px;
                font-size: {int(14*s)}px;
                font-family: "Segoe UI";
            }}
            NavButton:hover {{
                background-color: {t['hover_bg']};
                color: {t['text_main']};
            }}
            NavButton:checked {{
                background-color: {t['active_bg']};
                color: {t['active_text']};
                font-weight: bold;
            }}
            
            /* 右侧内容容器 */
            #ContentRight {{
                background-color: {t['content_bg']};
                border-bottom-right-radius: 12px;
            }}
            
            /* 右侧空状态区域 */
            #EmptyState {{
                border: 2px dashed {t['empty_border']};
                border-radius: {int(16*s)}px;
                background-color: transparent; 
            }}
            #EmptyStateIcon {{
                font-size: {int(60*s)}px;
                color: {t['empty_icon']};
                background: transparent;
            }}
            #EmptyTitle {{ color: {t['empty_border']}; }} /* 稍微深一点或者复用边框色 */
            #EmptyDesc {{ color: {t['text_sub']}; }}
        """
        
        # 将新样式追加到 ModernWindow 的样式之后
        # 也可以直接 self.main_content_widget.setStyleSheet，但为了层级统一，这里叠加在主窗口上
        # 关键：由于 super().update_style() 会重置 container 的样式，
        # 我们这里选择将样式应用到 self (QMainWindow) 或者 self.container 上
        
        # 最稳妥的方式：直接追加到 self.container 现有的样式表中
        current_sheet = self.container.styleSheet()
        self.container.setStyleSheet(current_sheet + app_style)


if __name__ == "__main__":
    if hasattr(Qt.HighDpiScaleFactorRoundingPolicy, 'PassThrough'):
        QApplication.setHighDpiScaleFactorRoundingPolicy(
            Qt.HighDpiScaleFactorRoundingPolicy.PassThrough)
            
    app = QApplication(sys.argv)
    font = QFont("Segoe UI", 10)
    font.setStyleStrategy(QFont.StyleStrategy.PreferAntialias)
    app.setFont(font)

    window = AppWindow()
    window.show()
    
    sys.exit(app.exec())