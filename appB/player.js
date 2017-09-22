document.addEventListener("DOMContentLoaded", function() {
    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame       || 
                window.webkitRequestAnimationFrame || 
                window.mozRequestAnimationFrame    || 
                window.oRequestAnimationFrame      || 
                window.msRequestAnimationFrame     ||  
                function( callback ){
                  window.setTimeout(callback, 1000 / 60);
                };
      })();

    var socket  = io('http://127.0.0.1:8080', {transports: ['websocket', 'polling', 'flashsocket']})

    socket.on('cursor_replay', function(data){
        var prev = {}
        prev.x = mouse.x;
        prev.y = mouse.y;
        prev.timestamp = mouse.timestamp;

        mouse.timestamp = data.timestamp;
        mouse.x = data.cursor.x;
        mouse.y = data.cursor.y;

        var elapsedTime = (mouse.timestamp - prev.timestamp)/1000 || 0.1;
        
        rectangles.forEach(function (a) {
          if (a.isInsidePoint(mouse.x, mouse.y)) {
              var currentSpeed = Math.sqrt(Math.pow(mouse.x - prev.x, 2) + Math.pow(mouse.y - prev.y,2))/elapsedTime;
              a.cursorAvgSpeed = (a.cursorAvgSpeed*a.cursorCount +currentSpeed)/(a.cursorCount+1) || 0;
              a.cursorSpeed = currentSpeed;
              a.cursorCount++;
          } else {
              a.cursorSpeed = 0;
          }
        });
        
        draw();
    });

    //set up the canvas
    const Width = 500;
    const Height = 500;
    var canvas = document.getElementById('myCanvas');
    canvas.width = Width;
    canvas.height = Height;

    var context = canvas.getContext('2d');

    function draw() {
        paintCanvas();
        updateTable();

        for(i = 0; i < circles.length; i++) {
            var c1 = circles[i],
                c2 = circles[i-1];
            
            circles[circles.length - 1].draw();
            
            if(mouse.x && mouse.y) {
                circles[circles.length - 1].x = mouse.x;
                circles[circles.length - 1].y = mouse.y;
                c1.draw();
            }
            
            if(i > 0) {
                c2.x += (c1.x - c2.x) * 0.6;
                c2.y += (c1.y - c2.y) * 0.6;
            }
        }
    }

    function paintCanvas() {
        context.globalCompositeOperation = "source-over";
        context.fillStyle = "black";
        context.fillRect(0, 0, Width, Height);
        drawRectangles(rectangles);
    }

    var circles = [],
        circlesCount = 10,
        mouse = {};

    function Circle() {
        this.x = Math.random() * Width;
        this.y = Math.random() * Height;
        
        this.radius = 5;
    
        this.r = Math.floor(Math.random() * 255);
        this.g = Math.floor(Math.random() * 255);
        this.b = Math.floor(Math.random() * 255);
        
        this.color = "rgb("+ this.r +", "+ this.g +", "+ this.b +")";
        
        this.draw = function() {
            context.globalCompositeOperation = "lighter";
            context.beginPath();
            context.fillStyle = this.color;
            context.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
            context.fill();
            context.closePath();
        }
    }

    // Seed the initial circle array
    for(var i = 0; i < circlesCount; i++) {
        circles.push(new Circle());
    }

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    function Rectangle(p1, p2, id) {
        this.p1 = p1;
        this.p2 = p2;
        this.id = id;
        this.cursorSpeed = 0;
        this.cursorCount = 0;
        this.cursorAvgSpeed = 0;
        this.r = Math.floor(Math.random() * 255);
        this.g = Math.floor(Math.random() * 255);
        this.b = Math.floor(Math.random() * 255);
        
        this.color = "rgb("+ this.r +", "+ this.g +", "+ this.b +")";
    }

    Rectangle.prototype.isInsidePoint = function (x, y) {
        return (this.p1.x <= x && x <= this.p2.x && this.p1.y <= y & y<=this.p2.y ||
                this.p2.x <= x && x <= this.p1.x && this.p1.y <= y & y<=this.p2.y || 
                this.p1.x <= x && x <= this.p2.x && this.p2.y <= y & y<=this.p1.y || 
                this.p2.x <= x && x <= this.p1.x && this.p2.y <= y & y<=this.p1.y 
            );
    }

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
      }

    function generateRectangles(n) {
        var rectangles = [];

        while (rectangles.length<n){
            rectangles.push(new Rectangle(new Point(getRandomInt(0,500), getRandomInt(0,500)), new Point(getRandomInt(0,500), getRandomInt(0,500)), rectangles.length)); 
        }

        return rectangles;
    }

    function drawRectangles(rectangles) {
        rectangles.forEach(function (a) {
            context.lineWidth = 1;
            context.strokeStyle = a.color;
            context.strokeRect(a.p1.x + 0.5, a.p1.y + 0.5, a.p2.x - a.p1.x - 1, a.p2.y - a.p1.y - 1);
            context.font = '14pt Calibri';
            context.fillStyle = a.color;
            context.fillText(`${a.id}`, (a.p1.x+a.p2.x)/2, (a.p1.y+a.p2.y)/2);
        });
    }

    var rectangles = generateRectangles(10);
    drawRectangles(rectangles);
    paintCanvas();

    function updateTable() {
        
        var table = document.createElement('table');
        table.id = 'results';
        var headerRow = table.insertRow(0);
        var row0col1 = headerRow.insertCell(0);
        row0col1.innerHTML = 'Region ID';
        var row0col2 = headerRow.insertCell(1);
        row0col2.innerHTML = 'CurrentSpeed (pixels/sec)';
        var row0col3 = headerRow.insertCell(2);
        row0col3.innerHTML = 'AvgSpeed (pixels/sec)';

        var rows = 1;
        rectangles.forEach(function(a){
            var row = table.insertRow(rows);
            var rowcol1= row.insertCell(0)
            rowcol1.innerHTML = a.id;
            rows++;
            var rowcol2 = row.insertCell(1);
            rowcol2.innerHTML = a.cursorSpeed;
            var rowcol3 = row.insertCell(2);
            rowcol3.innerHTML = a.cursorAvgSpeed;  
        })

        var div = document.getElementById('divTable');
        var oldTable = document.getElementById('results');
        if (oldTable){
            div.removeChild(oldTable)
        }
        div.appendChild(table);
    }

});