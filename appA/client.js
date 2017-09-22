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

    //set up the canvas
    var canvas = document.getElementById('myCanvas');
    const Width = 500;
    const Height = 500;
    canvas.width = Width;
    canvas.height = Height;

    var context = canvas.getContext('2d');
    
    var circles = [],
        circlesCount = 10,
        mouse = {};
    
    function paintCanvas() {
        context.globalCompositeOperation = "source-over";
        context.fillStyle = "black";
        context.fillRect(0, 0, Width, Height);
    }

    function Circle() {
        this.x = Math.random() * Width;
        this.y = Math.random() * Height;
        
        this.radius = 5;
        
        //assign a random color
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

    function draw() {
        paintCanvas();
        
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

    function getMousePos(evt) {
        var rect = canvas.getBoundingClientRect();
        mouse.x =  evt.clientX - rect.left;
        mouse.y = evt.clientY - rect.top;
    }

    var moving = true;
    canvas.addEventListener('mouseout', ()=>{moving = false}, false);
    canvas.addEventListener('mouseover', ()=>{moving = true}, false);
    canvas.addEventListener('mousemove',getMousePos, false);

    var fps, fpsInterval, startTime, now, then, elapsed;
    fps = 10;

    // initialize the timer variables and start the animation
    function startAnimating(fps) {
        fpsInterval = 1000 / fps;
        then = Date.now();
        startTime = then;
        animate();
    }

    function animate(){
        requestAnimationFrame(animate);
        // calc elapsed time since last loop
        now = Date.now();
        elapsed = now - then;

        // if enough time has elapsed, draw the next frame
        if (elapsed > fpsInterval) {
            then = now - (elapsed % fpsInterval);

            //send data if mouse is moving           
            if(moving){
                draw();
                socket.emit('cursor_data', { cursor: {x: mouse.x, y: mouse.y}, timestamp: Date.now() });
            }   
        }
    }

    startAnimating(fps);
});