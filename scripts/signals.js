fetch("/get_ws_address")
  .then((x) => x.json())
  .then((data) => {
    const address = data.address;
    const socket = new WebSocket(`ws://${address}`);

    socket.onopen = function () {
      document.body.dispatchEvent(new Event("serverOpen"));
    };

    socket.onmessage = function (data) {
      document.body.dispatchEvent(
        new CustomEvent("serverMessage", { detail: { message: data.data } })
      );
    };
  });

export function send_to_server(path, args, callback) {
  let str = "";
  let i = 0;
  for (const [key, value] of Object.entries(args)) {
    const str_old = JSON.parse(JSON.stringify(str));
    let newStuff = `${key}=${btoa(value)}`;
    if (i === 0) {
      str = `?${newStuff}`;
    } else {
      str = `${str_old}&${newStuff}`;
    }
    i++;
  }
  fetch(`${path}${str}`)
    .then((x) => x.json())
    .then((_data) => {
      callback(_data);
    })
    .catch((error) => {
      return error;
    });
}
