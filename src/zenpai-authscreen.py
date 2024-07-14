from PySide6.QtCore import QSize, Qt, QEvent, QRunnable, Slot, QThreadPool
from PySide6.QtGui import QIcon, QCursor, QDesktopServices
from PySide6.QtWidgets import (
    QApplication,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QToolButton,
    QVBoxLayout,
    QWidget,
    QTextEdit,
    QPushButton,
    QTextBrowser,
)
from titlebar import CustomTitleBar
from sys import argv
from czenpai import generate_script
from os import path as os_path
from urllib.request import urlopen
from webbrowser import open as web_open

basedir = os_path.dirname(__file__)

class Worker(QRunnable):
    def __init__(self, instruction, selected_files, running_stat, success_stat, failure_stat):
        super(Worker, self).__init__()
        self.instruction = instruction
        self.selected_files = selected_files
        self.running_stat = running_stat
        self.success_stat = success_stat
        self.failure_stat = failure_stat
    @Slot()  # QtCore.Slot
    def run(self):
        try:
            generate_script(self.instruction, self.selected_files)
        except:
            self.running_stat.setVisible(False)
            self.failure_stat.setVisible(True)
            raise
        else:
            self.running_stat.setVisible(False)
            self.success_stat.setVisible(True)

class AuthWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Zenpai Utils AI: Authentication")
        self.setMinimumSize(QSize(630, 420))
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setStyleSheet("background-color: #2D333B;")
        central_widget = QWidget()
        # This container holds the window contents, so we can style it.
        central_widget.setObjectName("Container")
        central_widget.setStyleSheet("""#Container {
            background-color: #2D333B;
        }""")
        self.title_bar = CustomTitleBar(self)

        work_space_layout = QVBoxLayout()
        work_space_layout.setContentsMargins(11, 11, 11, 11)
        color_title = QLabel("Zenpai Utils AI", self)
        color_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        color_title.setStyleSheet(
            '''QLabel {
                font-size: 32pt; 
                margin-top:10px;
                color: qlineargradient(x1: 0, y1: 0, x2: 500, y2: 0,
                                 stop: 0.0 #979797, stop: 0.4 #C55B5B
                                 stop: 0.4 #C55B5B, stop: 1.0 #979797);    
               }
            ''')
        work_space_layout.addWidget(color_title)

        space_row = QLabel()
        space_row.setFixedSize(QSize(630, 67))
        space_row.setAlignment(Qt.AlignmentFlag.AlignCenter)
        space_row.setStyleSheet(
            '''QLabel {
                font-size: 12pt; 
                color: #9D9D9D;
                margin-top:20px;
               }
            ''')
        work_space_layout.addWidget(space_row)

        signInLabel = QLabel()
        signInLabel.setAlignment(Qt.AlignmentFlag.AlignCenter)
        signInLabel.setFixedSize(QSize(570, 60))
        work_space_layout.addWidget(signInLabel)

        signInBtn = QPushButton("Sign in with Google", signInLabel)
        signInBtn.clicked.connect(self.signInBtn_clicked)
        signInBtn.setCursor(QCursor(Qt.PointingHandCursor))
        signInBtn.setStyleSheet(
            '''QPushButton {
                font-size: 12pt;
                padding: 16px 30px 14px 60px;
                margin-left: 201px;
                background-color: #ffffff;
                border: 1px solid #747775;
                border-radius: 25px;
                color: #1F1F1F;
               }
            ''')
        #work_space_layout.addWidget(signInBtn)

        signInBtnLogo = QPushButton(signInBtn)
        google_logo = QIcon()
        google_logo.addFile(os_path.join(basedir, "assets", "google_logo.svg"))
        signInBtnLogo.setIcon(google_logo)
        signInBtnLogo.setStyleSheet(
            '''QPushButton {
                font-size: 12pt; 
                color: #9D9D9D;
                margin-left:221px;
                margin-top:13px;
                padding:0px;
                border-radius:0px;
                border: none;
                background-color: #ffffff;
               }
            ''')
        signInBtnLogo.setIconSize(QSize(28, 28))

        space_row = QLabel("Don't worry. You only have to do this once.")
        space_row.setAlignment(Qt.AlignmentFlag.AlignCenter)
        space_row.setStyleSheet(
            '''QLabel {
                font-size: 12pt; 
                color: #9D9D9D;
                margin-top:1px;
               }
            ''')
        work_space_layout.addWidget(space_row)

        bottom_version = QLabel("v1.1.2")
        bottom_version.setAlignment(Qt.AlignmentFlag.AlignLeft)
        bottom_version.setStyleSheet(
            '''QLabel {
                font-size: 10pt; 
                color: #9D9D9D;
                margin-top:110px;
                margin-left: 1px;
               }
            ''')
        work_space_layout.addWidget(bottom_version)

        centra_widget_layout = QVBoxLayout()
        centra_widget_layout.setContentsMargins(0, 0, 0, 0)
        centra_widget_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        centra_widget_layout.addWidget(self.title_bar)
        centra_widget_layout.addLayout(work_space_layout)
        self.work_space_layout = work_space_layout

        central_widget.setLayout(centra_widget_layout)
        self.setCentralWidget(central_widget)

    def signInBtn_clicked(self, event):
        web_open('https://zenpai.pro/auth')

    def changeEvent(self, event):
        if event.type() == QEvent.Type.WindowStateChange:
            self.title_bar.window_state_changed(self.windowState())
        super().changeEvent(event)
        event.accept()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.initial_pos = event.position().toPoint()
        super().mousePressEvent(event)
        event.accept()

    def mouseMoveEvent(self, event):
        if self.initial_pos is not None:
            delta = event.position().toPoint() - self.initial_pos
            self.window().move(
                self.window().x() + delta.x(),
                self.window().y() + delta.y(),
            )
        super().mouseMoveEvent(event)
        event.accept()

    def mouseReleaseEvent(self, event):
        self.initial_pos = None
        super().mouseReleaseEvent(event)
        event.accept()

if __name__ == '__main__':
    app = QApplication(argv)
    window = AuthWindow()
    window.show()
    app.exec()
