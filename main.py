from framework import start_server, http_route, render_webpage, json_response, send_to_client
from typing import List, Dict, Any, Optional
import webbrowser, os, sys, string
import random as r
from datetime import datetime as dt

BASEDIR = os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), "kalszterek")


# [[ FUNCTIONALITY SECTION ]]
class ProcessAbstract:
    TEMPLATES: List[Optional["ProcessAbstract"]] = []
    RUN_REQUIREMENTS = {}

    def __init__(self, name, run_count, required_processor, required_memory):
        self.__name = name
        self.__rc = run_count
        self.__rp = required_processor
        self.__rm = required_memory

    @property
    def name(self):
        return self.__name

    @property
    def run_count(self):
        return self.__rc

    @property
    def required_processor(self):
        return self.__rp

    @property
    def required_memory(self):
        return self.__rm

    @classmethod
    def add_process_template(cls, proc):
        cls.TEMPLATES.append(proc)

    @classmethod
    def get_process_template(cls, name):
        for p in cls.TEMPLATES:
            if p.name == name:
                return p

        return None

    def stop_all_with_this_type(self):
        for c in Computer.COMPUTERS:
            if len(c.processes) <= 0: continue

            to_remove = []
            for i, p in enumerate(c.processes):
                if p.abstract.name == self.name:
                    to_remove.append(i)
                    c.end_process(i)

            c.processes = [p for i, p in enumerate(c.processes) for tr in to_remove if i == tr]


generate_process_id = lambda: "".join([r.choice(string.ascii_lowercase) for _ in range(6)])


class Computer:
    COMPUTERS: List[Optional["Computer"]] = []

    class Process:
        def __init__(self, abstract: ProcessAbstract, parent_name: str, process_id: str = None):
            self.created_at = dt.now().strftime("%d-%m-%Y %H:%M:%S")
            self.process_id = generate_process_id() if not process_id else process_id
            self.parent_name = parent_name
            self.abstract = abstract
            self.status = "AKTÍV"
            if process_id:
                with open(self.path, encoding="utf-8") as f:
                    data = f.read().strip().split("\n")
                    self.created_at = data[0]
                    self.status = data[1]

        def save(self):
            with open(self.path, "w", encoding="utf-8") as f:
                f.write(self.created_at + "\n")
                f.write(self.status + "\n")
                f.write(str(self.abstract.required_processor) + "\n")
                f.write(str(self.abstract.required_memory))

        def destroy(self):
            os.remove(self.path)

        def swap_status(self):
            if self.status == "AKTÍV":
                self.status = "INAKTÍV"
            else:
                self.status = "AKTÍV"

        @property
        def path(self):
            return os.path.join(BASEDIR, self.parent_name, self.abstract.name + "-" + self.process_id)

    def __init__(self, name, processor: int, memory: int, processes: List[Process]):
        self.name = name
        self.processes = processes
        self.max_proc = processor
        self.proc = self.max_proc
        self.max_mem = memory
        self.mem = self.max_mem

        type(self).COMPUTERS.append(self)

    @property
    def path(self):
        return os.path.join(BASEDIR, self.name)

    def refresh_resources(self):
        self.proc = self.max_proc
        self.mem = self.max_mem
        for p in self.processes:
            self.proc -= p.abstract.required_processor
            self.mem -= p.abstract.required_memory

    def add_process(self, process: Process):
        process.save()
        self.processes.append(process)
        self.refresh_resources()

    def end_process(self, process_index):
        proc = self.processes[process_index]
        proc.destroy()

    def can_run(self, process: ProcessAbstract):
        if self.mem >= process.required_memory and self.proc >= process.required_processor: return True

        return False

    @staticmethod
    def load_computer(name):
        try:
            with open(os.path.join(BASEDIR, name, ".szamitogep_konfig")) as f:
                data = f.read().strip().split("\n")

                processor = int(data[0])
                memory = int(data[1])
                processes = []

                for f in os.listdir(os.path.join(BASEDIR, name)):
                    if f.startswith("."): continue
                    template = ProcessAbstract.get_process_template(f.split("-")[0])
                    processes.append(Computer.Process(template, name, f.split("-")[1]))

                return Computer(name, processor, memory, processes)
        except ValueError as e:
            print(f"Computer load failed ({name}): {str(e)}")


def load_root_config():
    path = os.path.join(BASEDIR, ".klaszter")

    with open(path) as f:
        data = f.read().strip().split("\n")
        parsed: List[list] = []
        for i, skibidi in enumerate(data):
            proc_index = int(i / 4)
            if proc_index > len(parsed) - 1: parsed.append([])

            parsed[proc_index].append(skibidi)

        for obj in parsed:
            name = obj[0]
            amount = int(obj[1])
            processor = int(obj[2])
            memory = int(obj[3])
            ProcessAbstract.add_process_template(ProcessAbstract(name, amount, processor, memory))

        for c in os.listdir(BASEDIR):
            if c.startswith("."): continue

            Computer.load_computer(c)

        needToRun = {}
        ProcessAbstract.RUN_REQUIREMENTS = needToRun
        for t in ProcessAbstract.TEMPLATES: needToRun[t.name] = t.run_count

        for c in Computer.COMPUTERS:
            for p in c.processes:
                if p.abstract.name in needToRun:
                    needToRun[p.abstract.name] -= 1

        def spread_computers():
            for t in ProcessAbstract.TEMPLATES:
                for c in Computer.COMPUTERS:
                    if len(c.processes) == 0:
                        if c.can_run(t) and needToRun[t.name] >= 1:
                            c.add_process(Computer.Process(t, c.name))
                            needToRun[t.name] -= 1
                            continue
                    for p in c.processes:
                        if p.abstract.name == t.name:
                            continue
                        if c.can_run(t) and needToRun[t.name] >= 1:
                            c.add_process(Computer.Process(t, c.name))
                            needToRun[t.name] -= 1
                            continue

        for t in ProcessAbstract.TEMPLATES:
            while needToRun[t.name] >= 1:
                spread_computers()


load_root_config()


# [[ HTTP SECTION ]]

ADDRESS = "localhost"
PORT = 8080

@http_route("/")
def index():
    return render_webpage("index.html")

@http_route("/get_ws_address")
def ws_address():
    return json_response({"address": f"{ADDRESS}:{PORT}"})


@http_route("/connect")
def connect_test():
    return render_webpage("connect_test.html")

@http_route("/msg")
def msg():
    send_to_client("sup")
    return json_response({"hi": "asd"})

# webbrowser.open("http://localhost:8080")
start_server(ADDRESS, PORT)