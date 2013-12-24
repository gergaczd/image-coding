var SA = SA || {};

(function(){
	"use strict";

	SA.DrawCanvas = function() {
		this.mycanvas = undefined;
		this.context = undefined;

		this.draw = p.draw.bind(this);
		this.paint = false;
		this.pointList = [];
		this._intervalId = undefined;

		this._initDraw = p._initDraw.bind(this);
		this._endDraw = p._endDraw.bind(this);
	};

	var p = SA.DrawCanvas.prototype;

	p.init = function(canvas) {
		this.mycanvas = document.getElementById(canvas);
		this.context = this.mycanvas.getContext("2d");

		this.mycanvas.addEventListener("mousedown", this._initDraw, false);
		this.mycanvas.addEventListener("mouseup", this._endDraw, false);
	};

	p._initDraw = function() {
		this.paint = true;
		this.mycanvas.addEventListener("mousemove", this.draw, false);

		this._intervalId = setInterval(this.redraw.bind(this), 30);
	};

	p._endDraw = function() {
		this.paint = false;
		this.mycanvas.removeEventListener("mousemove", this.draw, false);

		this.pointList.push({x: null, y: null});
		clearInterval(this._intervalId);
	};

	p.draw = function(e) {
		if(this.paint) {
			var mouseX = e.pageX,
				mouseY = e.pageY;
		
			this.pointList.push({x: mouseX, y: mouseY});
		}
	};

	p.redraw = function() {
		this.context.clearRect(0,0, this.mycanvas.width, this.mycanvas.height);

		this.context.strokeStyle = "#000";
		this.context.lineJoin = "round";
		this.context.lineWidth = 20;

		for (var i = 1; i < this.pointList.length; i++) {
			if(this.pointList[i].x !== null && this.pointList[i].y !== null) {
				this.context.beginPath();
				if(this.pointList[i-1].x === null && this.pointList[i-1].y === null) {
					this.context.moveTo(this.pointList[i].x-1, this.pointList[i].y-1);
				} else {
					this.context.moveTo(this.pointList[i-1].x-1, this.pointList[i-1].y);
				}
				
				this.context.lineTo(this.pointList[i].x, this.pointList[i].y);
				this.context.closePath();
				this.context.stroke();
			}
		}
	};

	p.clear = function() {
		this.context.clearRect(0,0, this.mycanvas.width, this.mycanvas.height);

		this.paint = false;
		this.pointList = [];
	};
}());


(function() {
	"use strict";

	SA.ImageProcessing = function() {
		this.inputCanvas = undefined;
		this.inputContext = undefined;

		this.noisyContext = undefined;
		this.keyContext = undefined;
		this.solutionCanvas = undefined;
		this.solutionCanvas2 = undefined;
	};

	var p = SA.ImageProcessing.prototype;

	p.setCanvas = function(canvas, noisy, key, solution) {
		this.inputCanvas = document.getElementById(canvas);
		this.inputContext = this.inputCanvas.getContext("2d");

		this.noisyContext = document.getElementById(noisy).getContext("2d");
		this.keyContext = document.getElementById(key).getContext("2d");
		this.solutionCanvas = document.getElementById(solution).getContext("2d");

		this._processCanvas();
	};

	p._processCanvas = function() {
		var start = (new Date()).getTime();
		console.log(start);
		var width = this.inputCanvas.width,
			height = this.inputCanvas.height;

		this.noisyContext.clearRect(0,0, width, height);
		this.keyContext.clearRect(0,0, width, height);
		this.solutionCanvas.clearRect(0,0, width, height);

		var pixelData = this.inputContext.getImageData(0,0,width,height).data;
	
		for (var i = 0, length = pixelData.length; i < length; i+=4) {
			var random = Math.floor(Math.random()*100) % 2,
				pixNum = i/4;

			var x = pixNum % width,
				y = Math.floor(pixNum / width);

			if(pixelData[i+3] === 255) {
				if(random === 0) {
					this.noisyContext.fillRect(x,y,1,1);
				} else {
					this.keyContext.fillRect(x,y,1,1);
				}
			} else {
				if(random === 0) {
					this.noisyContext.fillRect(x,y,1,1);
					this.keyContext.fillRect(x,y,1,1);
				}
			}
		}


		var dataURL1 = this.noisyContext.canvas.toDataURL();
		//window.open(dataURL1);
		var img1 = new Image();
		var that = this;
		img1.onload = function() {
			that.solutionCanvas.drawImage(img1,0,0);
		};

		img1.src = dataURL1;

		var dataURL2 = this.keyContext.canvas.toDataURL();
		//window.open(dataURL2);
		var img2 = new Image();
		var end;
		img2.onload = function() {
			that.solutionCanvas.drawImage(img2,0,0);
			end = (new Date()).getTime();
			console.log(end);
			console.log("Diff: " + (end-start));
		};

		img2.src = dataURL2;
	};

	p.makeNoisyBasedOnKey = function(canvas, noisy, key, output) {
		this.inputContext = document.getElementById(canvas).getContext("2d");
		this.solutionCanvas2 = document.getElementById(output).getContext("2d");
		this.noisyContext = document.getElementById(noisy).getContext("2d");
		this.keyContext = document.getElementById(key).getContext("2d");

		var width = this.inputContext.canvas.width,
			height = this.inputContext.canvas.height;

		this.solutionCanvas2.clearRect(0, 0, width, height);
		this.noisyContext.clearRect(0, 0, width, height);

		var inputData = this.inputContext.getImageData(0,0,width,height).data,
			keyData = this.keyContext.getImageData(0,0,width,height).data;

		for (var i = 0, length = inputData.length; i < length; i+=4) {
			var pixNum = i/4;

			var x = pixNum % width,
				y = Math.floor(pixNum / width);

			if(inputData[i+3] === 255) {//it is black
				if(keyData[i+3] !== 255) {
					this.noisyContext.fillRect(x,y,1,1);
				}
			} else {
				if(keyData[i+3] === 255) {
					this.noisyContext.fillRect(x,y,1,1);
				}
			}
		}

		var dataURL1 = this.noisyContext.canvas.toDataURL();
		//window.open(dataURL1);
		var img1 = new Image();
		var that = this;
		img1.onload = function() {
			that.solutionCanvas2.drawImage(img1,0,0);
		};

		img1.src = dataURL1;

		var dataURL2 = this.keyContext.canvas.toDataURL();
		//window.open(dataURL2);
		var img2 = new Image();
		var end;
		img2.onload = function() {
			that.solutionCanvas2.drawImage(img2,0,0);
		};

		img2.src = dataURL2;
	};

	p.clearCanvas = function(canvas) {
		var mycanvas = document.getElementById(canvas);
		var context = mycanvas.getContext("2d");

		context.clearRect(0,0,canvas.width, canvas.height);
	};
}());

var processor = new SA.ImageProcessing();
var drawer = new SA.DrawCanvas();

window.onload = function() {
	"use strict";
	//var noisyCanvas = document.getElementById("noisy-canvas");
	//var keyCanvas = document.getElementById("key-canvas");

	drawer.init("draw-canvas");

	var noiserBtn = document.getElementById("noiser-btn");
	var clearBtn = document.getElementById("clear-input-btn");
	var generateBtn = document.getElementById("based-key-btn");
	var generateBtn2 = document.getElementById("based2-key-btn");

	noiserBtn.addEventListener("click", function() {
		processor.setCanvas("draw-canvas", "noisy-canvas", "key-canvas", "solved-canvas");
	}, false);

	clearBtn.addEventListener("click", function(){
		drawer.clear();
	}, false);

	generateBtn.addEventListener("click", function(){
		processor.makeNoisyBasedOnKey("draw-canvas", "noisy-canvas", "key-canvas", "solved2-canvas");
	}, false);

	generateBtn2.addEventListener("click", function(){
		processor.makeNoisyBasedOnKey("draw-canvas", "noisy-canvas", "key-canvas", "solved-canvas");
	}, false);


	var ccanvas = document.getElementById("colored-canvas");
	var context = ccanvas.getContext("2d");
	var width = ccanvas.width;
	var height = ccanvas.height;

	for (var i = 0; i < width; i++) {
		for (var j = 0; j < height; j++) {
			var red = Math.floor(Math.random()*128);
			var green = Math.floor(Math.random()*128)+127;
			var blue = Math.floor(Math.random()*255);
			var alpha = Math.floor(Math.random()*255);

			context.fillStyle = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
			context.fillRect(i,j,1,1);

		}
	}

	var myColorHash = ccanvas.toDataURL();
	window.open(myColorHash);	

};