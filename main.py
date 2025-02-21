from Tools.i18n.msgfmt import usage

from framework import start_server, http_route, render_webpage, json_response, send_to_client, do_img_render
from typing import List, Optional
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
        self.__name: str = name
        self.__rc = run_count
        self.__rp = required_processor
        self.__rm = required_memory
        self.__currently_active = 0

    @property
    def currently_active(self):
        return self.__currently_active

    @currently_active.setter
    def currently_active(self, val):
        self.__currently_active = val

        if self.__currently_active != self.run_count:
            send_to_client(json.dumps({
                "type": "logError",
                "app": self.__name.capitalize(),
                "should": self.run_count,
                "difference": self.run_count - self.__currently_active
            }))
        else:
            send_to_client(json.dumps({
                "type": "removeLog",
                "app": self.__name
            }))


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
        return next((p for p in cls.TEMPLATES if p.name == name), None)

    def stop_all_with_this_type(self):
        for c in Computer.COMPUTERS:
            if len(c.processes) <= 0: continue

            to_remove = []
            for i, p in enumerate(c.processes):
                if p.abstract.name == self.name:
                    to_remove.append(i)
                    c.end_process(i)

            c.processes = [p for i, p in enumerate(c.processes) if i not in to_remove]
            c.refresh_resources()


generate_process_id = lambda: "".join([r.choice(string.ascii_lowercase) for _ in range(6)])


class Computer:
    COMPUTERS: List[Optional["Computer"]] = []

    class Process:
        def __init__(self, abstract: ProcessAbstract, parent_name: str, process_id: str = None, original_data = False,
                     umem = -1, uproc = -1):
            self.created_at = dt.now().strftime("%d-%m-%Y %H:%M:%S")
            self.process_id = generate_process_id() if not process_id else process_id
            self.parent_name = parent_name
            self.abstract = abstract
            self.status = "AKTÍV"
            self.using_mem = umem if umem != -1 else abstract.required_memory
            self.using_proc = uproc if uproc != -1 else abstract.required_processor
            self.abstract.currently_active += 1
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
                f.write(str(self.using_proc) + "\n")
                f.write(str(self.using_mem))

        def destroy(self):
            try:
                if self.status == "AKTÍV":
                    self.abstract.currently_active -= 1

                if os.path.exists(self.path): os.remove(self.path)

            except FileNotFoundError:
                # Race condition already won
                pass

        def reallocate(self, proc, mem):
            self.using_proc = proc
            self.using_mem = mem

            for c in Computer.COMPUTERS:
                if c.name == self.parent_name:
                    c.refresh_resources()
                    c.refresh_issues()


        def swap_status(self):
            if self.status == "AKTÍV":
                self.status = "INAKTÍV"
                self.abstract.currently_active -= 1
            else:
                self.abstract.currently_active += 1
                self.status = "AKTÍV"

            Computer.refresh_issues()

        @property
        def path(self):
            return os.path.join(BASEDIR, self.parent_name, self.abstract.name + "-" + str(self.process_id))

    def __init__(self, name, processor: int, memory: int, processes: List[Process]):
        self.name = name
        self.processes = processes
        self.max_proc = processor
        self.proc = self.max_proc
        self.max_mem = memory
        self.mem = self.max_mem
        self.refresh_resources()

        type(self).COMPUTERS.append(self)

    @property
    def path(self):
        return os.path.join(BASEDIR, self.name)

    def refresh_resources(self):
        self.proc = self.max_proc - sum(p.using_proc for p in self.processes)
        self.mem = self.max_mem - sum(p.using_mem for p in self.processes)

    def add_process(self, process: Process):
        process.save()
        self.processes.append(process)
        self.refresh_resources()

    def end_process(self, process_index):
        proc = self.processes[process_index]
        proc.destroy()

    def can_run(self, process: ProcessAbstract | Process):
        if isinstance(process, ProcessAbstract):
            if self.mem >= process.required_memory and self.proc >= process.required_processor: return True

            return False
        elif isinstance(process, Computer.Process):
            if self.mem >= process.using_mem and self.proc >= process.using_proc: return True

            return False

    def can_execute(self, proc, mem, offset = (0,0)):
        if self.mem - offset[0] >= mem and self.proc - offset[1] >= proc: return True

        return False



    def save(self):
        if not os.path.exists(self.path): os.mkdir(self.path)

        with open(os.path.join(self.path, ".szamitogep_konfig"), "w", encoding="utf-8") as f:
            f.write(f"{self.max_proc}\n{self.max_mem}")


    @staticmethod
    def load_computer(name):
        try:
            with open(os.path.join(BASEDIR, name, ".szamitogep_konfig")) as f:
                data = f.read().strip().split("\n")

                processor = int(data[0])
                memory = int(data[1])
                processes = []

                for fn in os.listdir(os.path.join(BASEDIR, name)):
                    if fn.startswith("."): continue
                    template = ProcessAbstract.get_process_template(fn.split("-")[0])
                    with open(os.path.join(BASEDIR, name, fn)) as proc_file:
                        proc_data = proc_file.read().split("\n")
                        creation_date = proc_data[0]
                        status = proc_data[1]
                        cpu = int(proc_data[2])
                        mem = int(proc_data[3])

                    p = Computer.Process(template, name, fn.split("-")[1], umem=mem,
                                     uproc=cpu)

                    if status == "INAKTÍV":
                        p.swap_status()

                    p.created_at = creation_date
                    processes.append(p)
                    p.save()


                return Computer(name, processor, memory, processes)
        except ValueError as e:
            print(f"Computer load failed ({name}): {str(e)}")

    @classmethod
    def refresh_issues(cls):
        errors = set()
        for t in ProcessAbstract.TEMPLATES:
            send_to_client(json.dumps({
                "type": "clearLog"
            }))

            if t.currently_active != t.run_count:
                errors.add(json.dumps({
                    "type": "logError",
                    "difference": t.run_count - t.currently_active,
                    "app": t.name.capitalize()
                }))
        for c in Computer.COMPUTERS:
            for p in c.processes:
                if p.abstract.currently_active != p.abstract.run_count:
                    errors.add(json.dumps({
                        "type": "logError",
                        "difference": p.abstract.run_count - p.abstract.currently_active,
                        "app": p.abstract.name.capitalize()
                    }))

        for e in errors:
            send_to_client(e)


def load_root_config(do_resolve = True):
    path = os.path.join(BASEDIR, ".klaszter")

    with open(path) as f:
        data = f.read().strip().split("\n")
        parsed: List[list] = []
        for i, d in enumerate(data):
            proc_index = int(i / 4)
            if proc_index > len(parsed) - 1: parsed.append([])

            parsed[proc_index].append(d)

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
                            c.refresh_resources()
                            needToRun[t.name] -= 1
                            continue
                    for p in c.processes:
                        if p.abstract.name == t.name:
                            continue
                        if c.can_run(t) and needToRun[t.name] >= 1:
                            c.add_process(Computer.Process(t, c.name))
                            c.refresh_resources()
                            needToRun[t.name] -= 1
                            continue

        if not do_resolve: return
        for t in ProcessAbstract.TEMPLATES:
            while needToRun[t.name] >= 1:
                spread_computers()

def refresh_env():
    Computer.COMPUTERS.clear()
    ProcessAbstract.RUN_REQUIREMENTS.clear()
    ProcessAbstract.TEMPLATES.clear()
    Computer.refresh_issues()

    refresh_path_dir()

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
    if "proconly" not in args:
        for c in Computer.COMPUTERS:
            send_to_client(json.dumps({"type": "addComputer", "name": c.name,
                                       "proc": c.max_proc, "mem": c.max_mem, "uproc": c.proc, "umem": c.mem}))

            for p in c.processes:
                send_to_client(json.dumps({
                    "type": "existingProcess",
                    "cname": c.name,
                    "name": p.abstract.name,
                    "pid": p.process_id,
                    "mem": p.using_mem,
                    "proc": p.using_proc,
                    "status": p.status == "AKTÍV"
                }))
    if "pconly" not in args:
        for t in ProcessAbstract.TEMPLATES:
            send_to_client(json.dumps({"type": "registerProcess", "name": t.name, "proc": t.required_processor,
                                       "mem": t.required_memory, "rc": t.run_count}))

    Computer.refresh_issues()

    return json_response({"result": True})

@http_route("/api/end_process")
def end_process(args):
    for c in Computer.COMPUTERS:
        if c.name == args["pcName"]:
            to_remove = [p for p in c.processes if p.process_id == args["procName"]]

            for p in to_remove:
                p.destroy()

            c.processes = [p for p in c.processes if p.process_id != args["procName"]]
            c.refresh_resources()

            Computer.refresh_issues()
            return json_response({"result": True, "mem": c.max_mem, "proc": c.max_proc, "umem": c.mem, "uproc": c.proc})

    return json_response({"result": False})

@http_route("/api/add_to_computer")
def start_process(args):
    for c in Computer.COMPUTERS:
        if c.name == args["pcName"]:
            proc_template = ProcessAbstract.get_process_template(args["appType"])
            if not proc_template or not c.can_run(proc_template):
                return json_response({"result": False})

            new_process = Computer.Process(proc_template, c.name)
            c.processes.append(new_process)
            new_process.save()
            c.refresh_resources()

            Computer.refresh_issues()
            return json_response({"result": True, "processId": new_process.process_id, "mem": c.max_mem,
                                  "proc": c.max_proc, "umem": c.mem, "uproc": c.proc})


    return json_response({"result": False})

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
            c.refresh_resources()

            Computer.refresh_issues()
            return json_response({"result": True, "mem": c.max_mem, "proc": c.max_proc,
                                  "umem": c.mem, "uproc": c.proc})
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

@http_route("/api/make_computer")
def make_computer(args):
    name = args["name"]
    mem = int(args["mem"])
    proc = int(args["proc"])

    try:
        c = Computer(name, proc, mem, [])
        c.save()

        return json_response({"result": True, "mem": mem, "proc": proc})
    except Exception:
        return json_response({"result": False})


@http_route("/api/remove")
def remove(args):
    rindex = None
    for i, c in enumerate(Computer.COMPUTERS):
        if c.name == args["elementName"]:
            rindex = i
            break
    
    #Result = should remove
    if rindex is None: return json_response({"result": True, "reason": "Index out!"})


    try:
        c = Computer.COMPUTERS[rindex]
        if len(c.processes) > 0:
            return json_response({"result": False, "reason": "Close all applications"})

        for f in os.listdir(c.path):
            os.remove(os.path.join(c.path, f))

        os.rmdir(c.path)
        del Computer.COMPUTERS[rindex]

        return json_response({"result": True})
    except PermissionError:
        # Nothing can be done
        return json_response({"result": False})

@http_route("/api/kill_all_instance")
def kill_all(args):
    try:
        ProcessAbstract.get_process_template(args["processName"]).stop_all_with_this_type()
        Computer.refresh_issues()
        return json_response({"result": True})
    except FileNotFoundError:
        return json_response({"result": False})

@http_route("/api/allocate")
def allocate_resources(args):
    newProc = int(args["newProc"])
    newMem = int(args["newMem"])

    computer: Computer = [c for c in Computer.COMPUTERS if c.name == args["pcName"]][0]
    if not computer.can_execute(newProc, newMem):
        return json_response({
            "result": False
        })


    for p in computer.processes:
        if p.process_id == args["processId"]:
            if newProc == 0 or newMem == 0:
                if p.status == "AKTÍV":
                    p.swap_status()
                    p.save()

                Computer.refresh_issues()

                return json_response({
                    "result": True,
                    "action": "swap"
                })
            p.reallocate(newProc, newMem)
            p.save()
            break


    return json_response({
        "result": True,
        "uproc": computer.proc,
        "proc": computer.max_proc,
        "umem": computer.mem,
        "mem": computer.max_mem
    })


@http_route("/api/change_cluster_alloc")
def change_cluster_alloc(args):
    import copy
    with open(os.path.join(BASEDIR, ".klaszter")) as f:
        content = f.read().split("\n")

    clone = copy.deepcopy(content)
    for i, c in enumerate(content):
        if c == args["appName"]:
            proc, mem = args["proc"], args["mem"]

            clone[i+2] = proc
            clone[i+3] = mem
            break

    with open(os.path.join(BASEDIR, ".klaszter"), "w") as f:
        f.write("\n".join(clone))

    refresh_env()
    load_root_config()

    return json_response({"result": True})

@http_route("/api/change_cluster_run")
def change_cluster_count(args):
    import copy
    with open(os.path.join(BASEDIR, ".klaszter")) as f:
        content = f.read().split("\n")

    clone = copy.deepcopy(content)
    for i, c in enumerate(content):
        if c == args["appName"]:
            clone[i + 1] = args["runCount"]
            break

    with open(os.path.join(BASEDIR, ".klaszter"), "w") as f:
        f.write("\n".join(clone))

    refresh_env()
    load_root_config(False)

    Computer.refresh_issues()
    return json_response({"result": True})

if __name__ == "__main__":
    load_root_config()
    # webbrowser.open("http://localhost:8080")
    start_server(ADDRESS, PORT)
