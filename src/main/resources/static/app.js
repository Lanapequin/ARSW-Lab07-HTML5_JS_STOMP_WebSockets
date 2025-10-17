let app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }
        toString() {
            return `Point(${this.x}, ${this.y})`;
        }
    }
    
    let stompClient = null;
    let drawingId = null;

    let addPointToCanvas = function (point) {
        let canvas = document.getElementById("canvas");
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    
    let getMousePosition = function (evt) {
        let canvas = document.getElementById("canvas");
        let rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    let connectAndSubscribe = function () {
        let newId = document.getElementById("drawingId").value;
        if (!newId) {
            alert("Por favor ingrese un ID de dibujo");
            return;
        }

        if (stompClient !== null) {
            stompClient.disconnect();
            console.log("Desconectado del WebSocket anterior");
        }

        let canvas = document.getElementById("canvas");
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawingId = newId;

        console.info('Connecting to WS...');
        let socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe(`/topic/newpoint.${drawingId}`, function (eventbody) {
                let theObject = JSON.parse(eventbody.body);
                addPointToCanvas(theObject);
            });stompClient.send(`/topic/newpoint.${drawingId}`, {}, JSON.stringify(pt));
        });
    };

    return {
        init: function () {
            document.getElementById("connectBtn").addEventListener("click", function () {
                connectAndSubscribe();

                let canvas = document.getElementById("canvas");
                canvas.addEventListener("click", function (evt) {
                    let pos = getMousePosition(evt);
                    app.publishPoint(pos.x, pos.y);
                });
            });
        },

        publishPoint: function(px,py) {
            if (!stompClient || !drawingId) {
                alert("Debe conectarse primero");
                return;
            }

            let pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);

            stompClient.send(`/topic/newpoint.${drawingId}`, {}, JSON.stringify(pt));
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }
    };
})();

document.addEventListener("DOMContentLoaded", function () {
    app.init();
});