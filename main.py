from framework import start_server, http_route, render_webpage, json_response, send_to_client, do_img_render
from typing import List, Dict, Any, Optional
import webbrowser, os, sys, string
import random as r
from datetime import datetime as dt
import json

path_name = "kalszterek"

BASEDIR = os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), path_name)
def refresh_path_dir():
    global BASEDIR
    BASEDIR = os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), path_name)


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
        def __init__(self, abstract: ProcessAbstract, parent_name: str, process_id: str = None, original_data = False):
            self.created_at = dt.now().strftime("%d-%m-%Y %H:%M:%S")
            self.process_id = generate_process_id() if not process_id else process_id
            self.parent_name = parent_name
            self.abstract = abstract
            self.status = "AKTÍV"
            if process_id and original_data:
                pass

            elif process_id:
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

def swap_env(folder_name):
    global path_name
    Computer.COMPUTERS.clear()
    ProcessAbstract.RUN_REQUIREMENTS.clear()
    ProcessAbstract.TEMPLATES.clear()

    path_name = folder_name
    refresh_path_dir()

load_root_config()

# [[ HTTP SECTION ]]

ADDRESS = "localhost"
PORT = 8080

@http_route("/")
def index(args):
    do_img_render('content', 'process.png')
    return render_webpage("index.html")

@http_route("/get_ws_address")
def ws_address(args):
    return json_response({"address": f"{ADDRESS}:{PORT}"})

@http_route("/get_positions")
def position(args):
    return json_response({})

@http_route("/api/refresh_computers")
def rc(args):
    for c in Computer.COMPUTERS:
        send_to_client(json.dumps({"type": "addComputer", "name": c.name,
                                   "proc": c.max_proc, "mem": c.max_mem, "uproc": c.proc, "umem": c.mem}))
        for p in c.processes:
            send_to_client(json.dumps({
                "type": "existingProcess",
                "cname": c.name,
                "name": p.abstract.name,
                "pid": p.process_id,
                "mem": p.abstract.required_memory,
                "proc": p.abstract.required_processor
            }))

    for t in ProcessAbstract.TEMPLATES:
        send_to_client(json.dumps({"type": "registerProcess", "name": t.name, "proc": t.required_processor, "mem": t.required_memory}))
    

    return json_response({"response": True})

@http_route("/api/add_to_computer")
def start_process(args):
    for c in Computer.COMPUTERS:
        if c.name == args["pcName"]:
            proc = Computer.Process(ProcessAbstract.get_process_template(args["appType"]), c.name)
            c.add_process(proc)
            proc.save()

            return json_response({"status": True, "processId": proc.process_id})

    return json_response({"status": False})

@http_route("/api/end_process")
def end_process(args):
    for c in Computer.COMPUTERS:
        if c.name == args["pcName"]:
            to_remove = []
            for i, p in enumerate(c.processes):
                if p.process_id == args["procName"]:
                    c.end_process(i)
                    to_remove.append(i)

            c.processes = [p for i, p in enumerate(c.processes) for tr in to_remove if i != tr]
            c.refresh_resources()
            return json_response({"status": True})

    return json_response({"status": False})

@http_route("/api/add_process")
def add_process(args):
    for c in Computer.COMPUTERS:
        if c.name == args["pcName"]:
            p = Computer.Process(ProcessAbstract.get_process_template(args["appType"]), c.name, args["appId"], True)

            if args["status"] == "i":
                p.swap_status()

            if not c.can_run(p.abstract):
                return json_response({"result": False})

            c.add_process(p)

            return json_response({"result": True})

    return json_response({"result": False})

@http_route("/api/swap_process")
def disable_process(args):
    for c in Computer.COMPUTERS:
        if c.name == args["pcName"]:
            for p in c.processes:
                if p.process_id == args["procId"]:
                    p.swap_status()
                    p.save()

                    return json_response({"result": True})

    return json_response({"result": False})

# webbrowser.open("http://localhost:8080")
start_server(ADDRESS, PORT)