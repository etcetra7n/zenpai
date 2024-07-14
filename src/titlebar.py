from PySide6.QtCore import QSize, Qt
from PySide6.QtGui import QIcon
from PySide6.QtWidgets import (
    QHBoxLayout,
    QLabel,
    QToolButton,
    QWidget,
)
from os import path as os_path

basedir = os_path.dirname(__file__)

class CustomTitleBar(QWidget):
    def __init__(self, parent):
        super().__init__(parent)
        # self.setAutoFillBackground(True) # <-- remove
        self.initial_pos = None
        title_bar_layout = QHBoxLayout(self)
        title_bar_layout.setContentsMargins(1, 1, 1, 1)
        title_bar_layout.setSpacing(2)
        self.title = QLabel(f"{self.__class__.__name__}", self)
        self.title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.title.setStyleSheet(
            """
        QLabel {
        font-size: 10pt; 
        margin-left: 10px;
        margin-top:8px;
        color: #dddddd;
        }
        """
        )
        
        self.title.setAlignment(Qt.AlignmentFlag.AlignLeft)
        if title := parent.windowTitle():
            self.title.setText(title)
        title_bar_layout.addWidget(self.title)

        # Min button
        self.min_button = QToolButton(self)
        min_icon = QIcon(os_path.join(basedir, "assets", "min.svg"))
        #min_icon.addFile()
        self.min_button.setIcon(min_icon)
        self.min_button.clicked.connect(self.window().showMinimized)

        # Max button
        self.max_button = QToolButton(self)
        max_icon = QIcon(os_path.join(basedir, "assets", "max.svg"))
        #max_icon.addFile()
        self.max_button.setIcon(max_icon)
        self.max_button.clicked.connect(self.window().showMaximized)

        # Close button
        self.close_button = QToolButton(self)
        close_icon = QIcon()
        close_icon.addFile(os_path.join(basedir, "assets", "close.svg")) # Close has only a single state.
        self.close_button.setIcon(close_icon)
        self.close_button.clicked.connect(self.window().close)

        # Normal button
        self.normal_button = QToolButton(self)
        normal_icon = QIcon()
        normal_icon.addFile(os_path.join(basedir, "assets", "normal.svg"))
        self.normal_button.setIcon(normal_icon)
        self.normal_button.clicked.connect(self.window().showNormal)
        self.normal_button.setVisible(False)

        buttons = [
            self.min_button,
            self.normal_button,
            self.max_button,
            self.close_button
        ]
        for button in buttons:
            button.setFocusPolicy(Qt.FocusPolicy.NoFocus)
            button.setFixedSize(QSize(45, 45))
            button.setStyleSheet(
                """ QToolButton {
                     border: none;
                     padding: 15px;
                    }
                    QToolButton:hover {
                     background: #444444;
                    }
                """
            )
            title_bar_layout.addWidget(button)
            self.close_button.setStyleSheet(
                """ QToolButton {
                     border: none;
                     padding: 13px;
                    }
                    QToolButton:hover {
                     background: #c92828;
                    }
                """
            )
    def window_state_changed(self, state):
        if state == Qt.WindowState.WindowMaximized:
            self.normal_button.setVisible(True)
            self.max_button.setVisible(False)
        else:
            self.normal_button.setVisible(False)
            self.max_button.setVisible(True)
            