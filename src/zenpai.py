from PySide6.QtCore import QSize, Qt, QEvent, QRunnable, Slot, QThreadPool
from PySide6.QtGui import QIcon, QCursor
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
)
from titlebar import CustomTitleBar
from sys import argv
from czenpai import generate_script
from os import path as os_path
from pathlib import Path
from subprocess import check_call
from auth import zenpai_auth
from os.path import basename

basedir = os_path.dirname(__file__)

try:
    from ctypes import windll  # Only exists on Windows.
    myappid = 'pro.zenpai.1'
    windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except ImportError:
    pass

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

class MainWindow(QMainWindow):
    def __init__(self, selected_files):
        super().__init__()
        self.selected_files = selected_files
        self.setWindowTitle("Zenpai Assistant")
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
        color_title = QLabel("Zenpai Assistant", self)
        color_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        color_title.setStyleSheet(
            '''QLabel {
                font-size: 20pt; 
                margin-top:10px;
                color: qlineargradient(x1: 0, y1: 0, x2: 500, y2: 0,
                                 stop: 0.0 #979797, stop: 0.4 #C55B5B
                                 stop: 0.4 #C55B5B, stop: 1.0 #979797);    
               }
            ''')
        work_space_layout.addWidget(color_title)

        #file_full_paths = (str(selected_files)[1:-1]).replace("'", '')
        file_paths = [basename(file) for file in selected_files]
        file_paths_str = (str(file_paths)[1:-1]).replace("'", '')
        if len(file_paths_str)>65:
            file_paths_str = file_paths_str[:65]+"..."
        files_list = QLabel(file_paths_str, self)
        files_list.setAlignment(Qt.AlignmentFlag.AlignLeft)
        files_list.setStyleSheet(
            '''QLabel {
                font-size: 12pt; 
                margin-top:10px;
                padding-left: 60px;
                color: #A5A5A5;    
               }
            ''')
        work_space_layout.addWidget(files_list)

        info_row = QWidget()
        info_row.setFixedSize(QSize(630, 40))
        work_space_layout.addWidget(info_row)

        prompt_txt = QLabel("Describe what to do with these files: ", info_row)
        prompt_txt.setAlignment(Qt.AlignmentFlag.AlignLeft)
        prompt_txt.setStyleSheet(
            '''QLabel {
                font-size: 12pt; 
                margin-top:15px;
                margin-left: 60px;
                color: #DDDDDD;    
               }
            ''')
        #work_space_layout.addWidget(prompt_txt)

        file_num = QLabel(f"{len(selected_files)} files selected.", info_row)
        file_num.setAlignment(Qt.AlignmentFlag.AlignRight)
        file_num.setStyleSheet(
            '''QLabel {
                font-size: 11pt; 
                margin-top:15px;
                margin-left: 460px;
                color: #9D9D9D;    
               }
            ''')
        #work_space_layout.addWidget(file_num)

        input_box_container = QWidget()
        #input_box_container.setContentsMargins(50, 20, 50, 20)
        input_box_container.setFixedSize(QSize(630, 120))
        input_box_container.setStyleSheet(
            '''QTextEdit {
                margin-left: 45px;
                margin-right: 45px;
                background-color: #22272E;
                border: 1px solid #686868;
                border-radius: 13px;
                padding: 1px;
               }
            ''')

        work_space_layout.addWidget(input_box_container)

        self.input_field = QTextEdit("", parent=input_box_container)
        #(630, 392)
        self.input_field.setContentsMargins(0, 0, 0, 0)
        self.input_field.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.input_field.setFixedSize(QSize(630, 120))
        self.input_field.setPlaceholderText("ex: Convert this image to pdf") 
        self.input_field.setStyleSheet(
            '''QTextEdit {
                background-color: #22272E;
                font-size: 12pt; 
                margin-top:3px;
                color: #DDDDDD;
                border: 1px solid #686868;
                border-radius: 13px;
                padding: 15px;

               }
            ''')
        #22272E;
        #work_space_layout.addWidget(input_field)
        btn_row = QWidget()
        btn_row.setFixedSize(QSize(630, 78))
        btn_row.setStyleSheet(
            '''QWidget {
                margin-left: 60px;
               }
            ''')

        work_space_layout.addWidget(btn_row)

        self.status_running = QPushButton(" Running", btn_row)
        self.status_running.setStyleSheet(
            '''QPushButton {
                font-size: 12pt; 
                margin-top:5px;
                margin-left: 60px;
                color: #9D9D9D;
                border: none;
               }
            ''')
        loading_icon = QIcon()
        loading_icon.addFile(os_path.join(basedir, "assets", "loading.png"))
        self.status_running.setIcon(loading_icon)
        self.status_running.setVisible(False)

        self.status_success = QPushButton(" Success", btn_row)
        self.status_success.setStyleSheet(
            '''QPushButton {
                font-size: 12pt; 
                margin-top:5px;
                margin-left: 60px;
                color: #9D9D9D;
                border: none;
               }
            ''')
        success_icon = QIcon()
        success_icon.addFile(os_path.join(basedir, "assets", "success.png"))

        self.status_success.setIcon(success_icon)
        self.status_success.setVisible(False)

        self.status_failure = QPushButton(" Oops, that did't work", btn_row)
        self.status_failure.setStyleSheet(
            '''QPushButton {
                font-size: 12pt; 
                margin-top:5px;
                margin-left: 60px;
                color: #9D9D9D;
                border: none;
               }
            ''')
        failure_icon = QIcon()
        failure_icon.addFile(os_path.join(basedir, "assets", "failure.png"))

        self.status_failure.setIcon(failure_icon)
        self.status_failure.setVisible(False)

        run_btn = QPushButton(" Run", btn_row)
        run_btn.setContentsMargins(0, 0, 0, 0)
        run_btn.setCursor(QCursor(Qt.PointingHandCursor))

        send_icon = QIcon()
        send_icon.addFile(os_path.join(basedir, "assets", "send.svg"))
        run_btn.setIcon(send_icon)

        run_btn.clicked.connect(self.run_btn_clicked)
        run_btn.setStyleSheet(
            '''QPushButton {
                background-color: #C15959;
                font-size: 14pt; 
                color: #F9F9F9;
                margin-right: auto;
                margin-left: 460px;
                margin-top:10px;
                border-style: outset;
                border-radius: 10px;
                padding: 6px 14px 8px 20px;
               }
               
               QPushButton:hover {
                background-color: #B85050;
               }
            ''')
        #347D39;
        self.run_btn = run_btn
        self.send_icon = send_icon

        centra_widget_layout = QVBoxLayout()
        centra_widget_layout.setContentsMargins(0, 0, 0, 0)
        centra_widget_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        centra_widget_layout.addWidget(self.title_bar)
        centra_widget_layout.addLayout(work_space_layout)
        self.work_space_layout = work_space_layout

        central_widget.setLayout(centra_widget_layout)
        self.setCentralWidget(central_widget)
        self.threadpool = QThreadPool()

    def run_btn_clicked(self):
        instruction = self.input_field.toPlainText()
        self.status_failure.setVisible(False)
        self.status_success.setVisible(False)
        self.status_running.setVisible(True)
        self.status_running.repaint()

        worker = Worker(instruction, self.selected_files, self.status_running, self.status_success, self.status_failure)
        self.threadpool.start(worker)

    def keyPressEvent(self, event):
        if event.key() == Qt.Key_Enter:
            self.run_btn_clicked()
        if event.key() == Qt.Key_Return:
            self.run_btn_clicked()

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
    auth_file = Path(os_path.join(basedir, ".auth_details"))
    if not (auth_file.is_file()):
        print("You are not signed in.")
        zenpai_auth()
    else:
        if len(argv)>=2:
            app = QApplication(argv)
            app.setWindowIcon(QIcon(os_path.join(basedir, "assets", "icon.ico")))
            window = MainWindow(argv[1:])
            window.show()
            app.exec()
        else:
            print("No files given")
