from framework import start_server, http_route, render_webpage
import webbrowser


@http_route("/")
def index():
    return render_webpage("index.html")

# webbrowser.open("http://localhost:8080")
start_server("localhost", 8080)