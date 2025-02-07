import base64
import hashlib
import http.server
import socketserver
from typing import Tuple
from http import HTTPStatus
import json

import re

def http_route(path):
    def wrapper(func):
        CustomHandler.ADD_ROUTE(path, func)

    return wrapper

WS_MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

IMG_FILETYPES = ["png"]
class ImgContent:
    def __init__(self, content):
        self.__content = content

    @property
    def content(self):
        return self.__content

def do_img_render(path, filename):
    def inner_response_maker():
        with open(f"{path}/{filename}", "rb") as f:
            return ImgContent(f.read())

    CustomHandler.ADD_ROUTE(f"/{path}/{filename}", inner_response_maker)
    return f"/{path}/{filename}"

def get_serverside_file(path, filename: str):
    for tpe in IMG_FILETYPES:
        if filename.endswith(tpe):
            return do_img_render(path, filename)
    def inner_response_maker():
        with open(f"{path}/{filename}", encoding="utf-8") as f:
            return f.read()

    CustomHandler.ADD_ROUTE(f"/{path}/{filename}", inner_response_maker)
    return f"/{path}/{filename}"

def log(content):
    print(content)

def add_signals(*args):
    return f"<script src=\"{get_serverside_file('scripts', 'signals.js')}\" defer></script>"

FUNCS = [
    get_serverside_file,
    log,
    add_signals
]

class WebpageContent:
    def __init__(self, content):
        self.__content = content

    @property
    def content(self):
        return self.__content

    def __str__(self):
        return self.content



def render_webpage(file: str, **kwargs):
    with open(f"html/{file}", encoding="utf-8") as f:
        content = f.read()

        for k, v in kwargs.items():
            content = content.replace("{{ <chr> }}".replace("<chr>", k), v)

        for func in FUNCS:
            func_name = func.__name__
            finds = re.findall("((\{){2}\ ŁŁ\((.)+\ (\}){2})+".replace("ŁŁ", func_name), content, re.MULTILINE)
            for find in finds:
                call_full: str = find[0][3:-3]
                call = call_full.replace(func_name, "").replace("(", "").replace(")", "")
                args = [arg.replace("\"", "").replace("'", "").strip() for arg in call.split(",")]
                res = func(*args)
                if not res:
                    res = ""

                content = content.replace("{{ <chr> }}".replace("<chr>", call_full), res)

        return WebpageContent(content)

class JsonContent:
    def __init__(self, content):
        self.__content = content

    def __str__(self):
        return json.dumps(self.__content)

def json_response(content):
    return JsonContent(content)


class CustomHandler(http.server.SimpleHTTPRequestHandler):
    ROUTES = {}
    CLIENT = None

    def __init__(self, request: bytes, client_address: Tuple[str, int], server: socketserver.BaseServer):
        super().__init__(request, client_address, server)

    def content_response(self, status = HTTPStatus.OK):
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()

    def json_response(self, status = HTTPStatus.OK):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()

    def plain_response(self, status = HTTPStatus.OK, fe = "plain"):
        self.send_response(status)
        self.send_header("Content-Type", f"text/{fe}")
        self.end_headers()

    def img_response(self, status=HTTPStatus.OK, fe="png"):
        self.send_response(status)
        self.send_header("Content-Type", f"image/{fe}")
        self.end_headers()

    def add_to_output(self, content):
        self.wfile.write(content.encode("utf-8"))

    def websocket_keepalive(self):
        while True:
            data = type(self).CLIENT.recv(1024)
            if not data:
                break

            send_to_client("Keep")


    def do_GET(self):
        if "Upgrade" in self.headers and self.headers["Upgrade"].lower() == "websocket":
            key = self.headers.get("Sec-WebSocket-Key", "")
            response_key = base64.b64encode(hashlib.sha1((key + WS_MAGIC_STRING).encode()).digest()).decode()

            self.send_response(101)
            self.send_header("Upgrade", "websocket")
            self.send_header("Connection", "Upgrade")
            self.send_header("Sec-WebSocket-Accept", response_key)
            self.end_headers()

            type(self).CLIENT = self.request

            self.websocket_keepalive()
            return

        if self.path in self.ROUTES:
            content = self.ROUTES[self.path]()
            if isinstance(content, WebpageContent):
                self.content_response()

            elif type(content) == str:
                self.plain_response(fe=self.path.rsplit(".")[1])
            elif isinstance(content, ImgContent):
                self.img_response(fe=self.path.rsplit(".")[1])
                self.wfile.write(content.content)
                return
            elif isinstance(content, JsonContent):
                self.json_response()
            self.add_to_output(str(content))
        else:
            self.content_response()
            self.add_to_output("<h1>Invalid path</h1>")

    @classmethod
    def ADD_ROUTE(cls, path, func):
        if path in cls.ROUTES:
            return

        cls.ROUTES[path] = func

def send_to_client(content):
    if not CustomHandler.CLIENT:
        return

    msg = content.encode("utf-8")
    length = len(msg)

    if length < 126:
        header = bytes([129, length])
    elif length < 65536:
        header = bytes([129, 126]) + length.to_bytes(2, "big")
    else:
        header = bytes([129, 127]) + length.to_bytes(8, "big")

    CustomHandler.CLIENT.send(header + msg)

def start_server(addr, port):
    my_server = socketserver.ThreadingTCPServer((addr, port), CustomHandler)

    print(f"Server started at {port}")
    my_server.serve_forever()
