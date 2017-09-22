const express = require('express'), 
app = express(),
cors = require('cors'),
fs = require('fs'),
http = require('http').Server(app),
port = 8080;

// start webserver on port 8080

var allowedOrigins = "http://localhost:* http://127.0.0.1:*";

const io = require('socket.io')(http, {
    origins: allowedOrigins,
    serveClient: false
});


http.listen(port, ()=>{
    console.log(`listening to port: ${port}`)
});

app.use(cors());

var cursorHistory = fs.createWriteStream('cursorLog.txt',{});

// event-handler for new incoming connections
io.on('connection', function (socket) {
    console.log('connection')

    socket.on('disconnect', function(){
        console.log('user disconnected');
      });
      
    socket.on('cursor_data', function (data) {
        // add received line to history 
        cursorHistory.write(`${JSON.stringify(data)}\n`)
        // send line to all clients
        io.emit('cursor_replay', { cursor: data.cursor, timestamp: data.timestamp });
    });

    socket.on('replay_data', function(data) {
        //read file into a stream buffer ~20 lines, use timestamps to schedule cursor data to be sent x10 speed
        //TODO check socketio latency, will we have to cache cursor data on appB to achieve viewable x10 speed
    });

});


