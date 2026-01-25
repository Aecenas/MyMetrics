from PyQt6.QtWidgets import QPushButton, QWidget, QFrame, QVBoxLayout, QHBoxLayout, QLabel, QButtonGroup
from PyQt6.QtCore import Qt, QSize, pyqtSignal
from PyQt6.QtGui import QColor, QFont
from BaseUIComponent.GlobalConfig import APP_THEMES

class NavButton(QPushButton):
    """左侧导航栏的自定义按钮"""
    def __init__(self, text, icon_text, scale=1.0, parent=None):
        super().__init__(parent)
        self.setCheckable(True)
        self.setAutoExclusive(True)
        self.icon_text = icon_text
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedHeight(int(45 * scale))
        self.setText(f"{icon_text}    {text}")

class HLine(QFrame):
    """自定义分割线"""
    def __init__(self, color="#DDDDDD", parent=None):
        super().__init__(parent)
        self.setFrameShape(QFrame.Shape.HLine)
        self.setFrameShadow(QFrame.Shadow.Plain)
        self.setLineWidth(1)
        # 设置分割线颜色和样式
        self.setStyleSheet(f"background-color: {color}; border: none; max-height: 1px;")

class NavigationWidget(QFrame):
    """
    左侧侧边栏类
    结构: Header -> Divider -> Navigation List (Stretch) -> Divider -> Footer
    """
    def __init__(self, scale=1.0, parent=None):
        super().__init__(parent)
        self.setObjectName("SideBar")
        self.setFixedWidth(int(240 * scale))
        self.scale = scale
        
        # 核心布局
        self.layout = QVBoxLayout(self)
        m_v, m_h = int(25 * scale), int(15 * scale)
        self.layout.setContentsMargins(m_h, m_v, m_h, m_v)
        self.layout.setSpacing(int(10 * scale))

        # 初始化三个区域容器
        self._init_header_area()
        self._init_separator_1()
        self._init_navigation_area()
        self._init_separator_2()
        self._init_footer_area()

        # 按钮组管理（用于中部导航的互斥选中）
        self.nav_group = QButtonGroup(self)
        self.nav_group.setExclusive(True)

    def _init_header_area(self):
        """初始化顶部标题区域"""
        self.header_container = QWidget()
        self.header_layout = QHBoxLayout(self.header_container)
        self.header_layout.setContentsMargins(0, 0, 0, int(10 * self.scale))
        self.layout.addWidget(self.header_container)
    def _init_separator_1(self):
        """第一条分割线"""
        self.sep1 = HLine()
        self.sep1.hide() # 默认隐藏，只有设置了Header才显示
        self.layout.addWidget(self.sep1)
    def _init_navigation_area(self):
        """初始化中部导航按钮区域"""
        self.nav_container = QWidget()
        self.nav_layout = QVBoxLayout(self.nav_container)
        self.nav_layout.setContentsMargins(0, int(10 * self.scale), 0, int(10 * self.scale))
        self.nav_layout.setSpacing(int(5 * self.scale))
        
        self.layout.addWidget(self.nav_container)
        # 弹簧，将Footer顶到底部
        self.layout.addStretch(1)
    def _init_separator_2(self):
        """第二条分割线"""
        self.sep2 = HLine()
        self.sep2.hide() # 默认隐藏，只有添加了Footer才显示
        self.layout.addWidget(self.sep2)
    def _init_footer_area(self):
        """初始化底部设置/工具区域"""
        self.footer_container = QWidget()
        self.footer_layout = QVBoxLayout(self.footer_container)
        self.footer_layout.setContentsMargins(0, int(10 * self.scale), 0, 0)
        self.footer_layout.setSpacing(int(5 * self.scale))
        self.layout.addWidget(self.footer_container)
    
    # ================= 公开接口 =================
    def setup_header(self, title, icon_text="D"):
        """
        优化后的 Header：
        1. 保留高颜值的渐变 Logo (在深/浅色下都好看)。
        2. 标题文字颜色不再写死，而是通过 set_theme 动态控制。
        """
        # 1. 清理旧控件
        while self.header_layout.count():
            item = self.header_layout.takeAt(0)
            if item.widget(): item.widget().deleteLater()

        # 布局调整：给一点呼吸感
        self.header_layout.setContentsMargins(int(5*self.scale), int(8*self.scale), 0, int(15*self.scale))
        self.header_layout.setSpacing(int(12 * self.scale))

        # --- Logo Icon (保持渐变色，这属于品牌色，通常不随主题变黑变白) ---
        logo_icon = QLabel(icon_text[:2]) 
        logo_icon.setObjectName("LogoIcon")
        logo_size = int(34 * self.scale)
        logo_icon.setFixedSize(logo_size, logo_size)
        logo_icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # 渐变色背景 + 阴影，在深色和浅色背景上都很突出
        logo_icon.setStyleSheet(f"""
            QLabel {{
                background-color: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #667eea, stop:1 #764ba2);
                color: #FFFFFF;
                border-radius: {int(8 * self.scale)}px;
                font-family: "Segoe UI", sans-serif;
                font-size: {int(13 * self.scale)}px;
                font-weight: 900;
            }}
        """)

        # --- Logo Text (标题) ---
        logo_text = QLabel(title)
        logo_text.setObjectName("LogoText") # 重要：通过 ID 设置颜色
        
        font = QFont("Segoe UI", int(14 * self.scale), QFont.Weight.Bold)
        logo_text.setFont(font)
        # 这里只设置布局属性，不设置 color
        logo_text.setStyleSheet(f"margin-top: {int(2*self.scale)}px; background: transparent;")

        self.header_layout.addWidget(logo_icon)
        self.header_layout.addWidget(logo_text)
        self.header_layout.addStretch()
        
        # 显示分割线
        if hasattr(self, 'sep1'): self.sep1.show()

    def set_theme(self, theme_name="dark"):
        """
        核心方法：应用主题颜色
        调用此方法即可一键切换侧边栏的所有颜色
        """
        theme = APP_THEMES.get(theme_name, APP_THEMES["dark"])
        
        # 1. 设置侧边栏整体背景和边框
        # 注意：这里使用 ID 选择器 #SideBar 确保只影响自身背景，不影响子控件背景
        self.setStyleSheet(f"""
            #SideBar {{
                background-color: {theme["sidebar_bg"]};
                border-right: 1px solid {theme["sidebar_border"]};
            }}
            /* 滚动条样式（如果有）也可以在这里统一定义 */
        """)

        # 2. 针对 Header 标题颜色的特定设置
        # 通过 findChild 或者直接根据 ObjectName 设置样式
        # 这里利用父控件的样式表穿透，定义子控件 #LogoText 的颜色
        title_style = f"""
            QLabel#LogoText {{
                color: {theme["text_main"]};
            }}
        """
        
        # 3. 针对分割线的颜色 (HLine)
        # 假设 HLine 是你封装的 QFrame，可以通过 setStyleSheet 修改
        # 或者如果 HLine 是 QFrame，直接定义 QFrame[frameShape="4"] (HLine的枚举值)
        sep_style = f"""
            QFrame[frameShape="4"] {{ 
                color: {theme["sidebar_border"]};
                background-color: {theme["sidebar_border"]}; 
            }}
        """
        
        # 合并额外的样式到当前的样式表中
        current_style = self.styleSheet()
        # 为了简单起见，我们直接追加或覆盖。
        # 在实际工程中，建议把所有样式放在一个大的 setStyleSheet 中
        self.setStyleSheet(self.styleSheet() + title_style + sep_style)

    def add_navigation_button(self, text, icon_text, is_checked=False, slot=None):
        """
        添加中部导航按钮
        :param text: 按钮文字
        :param icon_text: 图标文字
        :param is_checked: 是否默认选中
        :param slot: 点击时的回调函数
        :return: 创建的按钮对象
        """
        btn = NavButton(text, icon_text, self.scale)
        self.nav_layout.addWidget(btn)
        self.nav_group.addButton(btn) # 加入互斥组
        
        if is_checked:
            btn.setChecked(True)
        
        if slot:
            btn.clicked.connect(slot)
            
        return btn
    
    def add_footer_button(self, text, icon_text, slot=None):
        """添加底部功能按钮（如设置）"""
        self.sep2.show() # 显示分割线
        
        btn = NavButton(text, icon_text, self.scale)
        # 底部按钮通常不需要互斥选中状态，或者需要单独处理
        btn.setAutoExclusive(False) 
        self.footer_layout.addWidget(btn)
        
        if slot:
            btn.clicked.connect(slot)
        
        return btn