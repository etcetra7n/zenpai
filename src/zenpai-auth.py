from PySide6.QtCore import QSize, Qt, QEvent, QRunnable, Slot, QThreadPool, Signal, QObject
from PySide6.QtGui import QIcon, QCursor
from PySide6.QtWidgets import (
    QApplication,
    QLabel,
    QMainWindow,
    QVBoxLayout,
    QWidget,
    QPushButton,
)
from titlebar import CustomTitleBar
from sys import argv
from sys import exit as sys_exit
from os import path as os_path
from webbrowser import open as web_open
from secrets import choice
from requests import get as requests_get
from requests import exceptions as req_exceptions
import string
from time import sleep
from pathlib import Path
from json import load as json_load
from json import dump as json_dump

basedir = os_path.dirname(__file__)
signed_in = False

def generate_temp_id(n=20):
    characters = string.ascii_letters + string.digits
    key = ''.join(choice(characters) for _ in range(n))
    return key

class WorkerSignals(QObject):
    signin_success = Signal(str)
    signin_error = Signal(str)

class Worker(QRunnable):
    def __init__(self, tempId):
        super(Worker, self).__init__()
        self.tempId = tempId
        self.signals = WorkerSignals()

    @Slot()
    def run(self):
        url = "http://localhost:8888/.netlify/functions/processTempId"
        data = {'temp_id': self.tempId}
        auth_email = ""
        try:
            for _ in range(150):
                sleep(1)
                response = requests_get(url, json=data, timeout=20)
                response.raise_for_status()
                if response.status_code == 200:
                    auth_email = response.json()['email']
                    with open(os_path.join(basedir, '.auth_details'), 'w') as f:
                        json_dump(response.json(), f, indent=2)
                    break;
            else:
                print("Reached maximum number of tries")
            signed_in = True
            self.signals.signin_success.emit(auth_email)

        except req_exceptions.Timeout:
            print("Request timed out")
            self.signals.signin_error.emit("timeout")

        except req_exceptions.RequestException as e:
            print(f"Request error: {e}")
            self.signals.signin_error.emit("request_err")

class AuthWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Zenpai Authentication")
        self.setMinimumSize(QSize(630, 420))
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setStyleSheet("background-color: #2D333B;")
        central_widget = QWidget()
        central_widget.setObjectName("Container")
        central_widget.setStyleSheet("""#Container {
            background-color: #2D333B;
        }""")
        self.title_bar = CustomTitleBar(self)

        work_space_layout = QVBoxLayout()
        work_space_layout.setContentsMargins(11, 11, 11, 11)
        color_title = QLabel("Zenpai Assistant", self)
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

        self.space_row = QLabel()
        self.space_row.setFixedSize(QSize(630, 67))
        self.space_row.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.space_row.setStyleSheet(
            '''QLabel {
                font-size: 12pt; 
                color: #9D9D9D;
                margin-top:20px;
               }
            ''')
        work_space_layout.addWidget(self.space_row)

        self.signInLabel = QLabel()
        self.signInLabel.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.signInLabel.setFixedSize(QSize(570, 60))
        work_space_layout.addWidget(self.signInLabel)

        self.signInBtn = QPushButton("Sign in with Google", self.signInLabel)
        self.signInBtn.clicked.connect(self.signInBtn_clicked)
        self.signInBtn.setCursor(QCursor(Qt.PointingHandCursor))
        self.signInBtn.setStyleSheet(
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

        signInBtnLogo = QPushButton(self.signInBtn)
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

        self.bottom_label = QLabel("Don't worry. You only have to do this once.")
        self.bottom_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.bottom_label.setStyleSheet(
            '''QLabel {
                font-size: 12pt; 
                color: #9D9D9D;
                margin-top:1px;
               }
            ''')
        work_space_layout.addWidget(self.bottom_label)

        self.bottom_version = QLabel("v1.1.2")
        self.bottom_version.setAlignment(Qt.AlignmentFlag.AlignLeft)
        self.bottom_version.setStyleSheet(
            '''QLabel {
                font-size: 10pt; 
                color: #9D9D9D;
                margin-top:110px;
                margin-left: 1px;
               }
            ''')
        work_space_layout.addWidget(self.bottom_version)

        centra_widget_layout = QVBoxLayout()
        centra_widget_layout.setContentsMargins(0, 0, 0, 0)
        centra_widget_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        centra_widget_layout.addWidget(self.title_bar)
        centra_widget_layout.addLayout(work_space_layout)
        self.work_space_layout = work_space_layout

        central_widget.setLayout(centra_widget_layout)
        self.setCentralWidget(central_widget)
        self.threadpool = QThreadPool()

        auth_file = Path(os_path.join(basedir, ".auth_details"))
        if (auth_file.is_file()):
            auth = {}
            with open('.auth_details', 'r') as f:
                auth = json_load(f)
            self.show_signin_success(auth['email'])

    def signInBtn_clicked(self, event):
        tempId = generate_temp_id()
        web_open('http://localhost:5000/auth?tempId='+tempId)
        worker = Worker(tempId)
        worker.signals.signin_success.connect(self.show_signin_success)
        self.threadpool.start(worker)

    def show_signin_success(self, auth_email):
        #status_label = QLabel()
        #status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        #status_label.setFixedSize(QSize(570, 60))
        #self.work_space_layout.addWidget(status_label)

        self.status_msg = QPushButton("You are signed in as "+auth_email)
        self.status_msg.setStyleSheet(
            '''QPushButton {
                font-size: 12pt;
                border: none;
                color: #9D9D9D
               }
            ''')
        #padding: 16px 30px 10px 60px;
        success_icon = QIcon()
        success_icon.addFile(os_path.join(basedir, "assets", "success.png"))
        self.status_msg.setIcon(success_icon)
        self.signInBtn.setVisible(False)
        self.bottom_label.setVisible(False)
        self.space_row.setVisible(False)
        self.bottom_version.setVisible(False)
        self.work_space_layout.addWidget(self.status_msg)

        '''
        transform = QTransform()

        # Applying transformations
        transform.translate(50, 20)  # Translate by (50, 20)
        transform.rotate(45)          # Rotate by 45 degrees
        transform.scale(2, 2)         # Scale by a factor of 2 in both x and y directions

        # Applying the transformation to a widget
        widget.setTransform(transform)
        '''

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

    def closeEvent(self, event):
        #self.threadpool.started()
        event.accept() # let the window close

if __name__ == '__main__':
    app = QApplication(argv)
    window = AuthWindow()
    window.show()
    sys_exit(app.exec())
