import http.server
import socketserver
from typing import Tuple
from http import HTTPStatus

import re

def http_route(path):
    def wrapper(func):
        CustomHandler.ADD_ROUTE(path, func)
        print("Registered!")

    return wrapper

def get_serverside_file(path, filename):
    def inner_response_maker():
        with open(f"{path}/{filename}", encoding="utf-8") as f:
            return f.read()

    CustomHandler.ADD_ROUTE(f"/{path}/{filename}", inner_response_maker)
    return f"/{path}/{filename}"

def log(content):
    print(content)


FUNCS = [
    get_serverside_file,
    log
]

class WebpageContent:
    def __init__(self, content):
        self.__content = content

    @property
    def content(self):
        return self.__content

    def __str__(self):
        return self.content


def render_webpage(file, **kwargs):
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


class CustomHandler(http.server.SimpleHTTPRequestHandler):
    ROUTES = {}

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



    def add_to_output(self, content):
        self.wfile.write(content.encode("utf-8"))

    def do_GET(self):
        if self.path in self.ROUTES:
            content = self.ROUTES[self.path]()
            if isinstance(content, WebpageContent):
                self.content_response()

            elif type(content) == str:
                self.plain_response(fe=self.path.rsplit(".")[1])

            self.add_to_output(str(content))
        else:
            self.content_response()
            self.add_to_output("<h1>Invalid path</h1>")

    @classmethod
    def ADD_ROUTE(cls, path, func):
        if path in cls.ROUTES:
            return

        cls.ROUTES[path] = func

def start_server(addr, port):
    my_server = socketserver.ThreadingTCPServer((addr, port), CustomHandler)

    print(f"Server started at {port}")
    my_server.serve_forever()
