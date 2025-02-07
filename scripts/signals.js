fetch("/get_ws_address").then(x => x.json()).then(data => {
    const address = data.address
    const socket = new WebSocket(`ws://${address}`)

    socket.onopen = function() {
        document.body.dispatchEvent(new Event("serverOpen"))
    }

    socket.onmessage = function(data) {
        document.body.dispatchEvent(new CustomEvent("serverMessage", {detail: {"message": data.data}}))
    }

});