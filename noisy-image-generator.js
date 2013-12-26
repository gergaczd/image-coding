var SA = SA || {};

SA.PIXEL_SIZE = 4;

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
			var element = this.mycanvas;

			var mousePos = {
				x: e.pageX - (element.offsetLeft || 0),
				y: e.pageY - (element.offsetTop || 0)
			};
		
	        while(element.offsetParent) {
	            element = element.offsetParent;
	            mousePos.x -= (element.offsetLeft || 0);
	            mousePos.y -= (element.offsetTop || 0);
	        }		

			this.pointList.push(mousePos);
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

function elementPosition(element) {
	var elementPos = {
		x: (element.offsetLeft || 0),
		y: (element.offsetTop || 0)
	};

    while(element.offsetParent) {
        element = element.offsetParent;
        elementPos.x += (element.offsetLeft || 0);
        elementPos.y += (element.offsetTop || 0);
    }

    return elementPos;
};


(function() {
	"use strict";

	SA.ImageEncoding = function() {
		this.inputCanvas = undefined;
		this.inputContext = undefined;

		this.noisyContext = undefined;
		this.keyContext = undefined;
		this.solutionCanvas = undefined;
		this.solutionCanvas2 = undefined;

		this._pixelSize = 1;

		this.isProcess = false;
	};

	var p = SA.ImageEncoding.prototype;

	p.set = function(canvas, noisy, key, solution) {
		this.inputCanvas = document.getElementById(canvas);
		this.inputContext = this.inputCanvas.getContext("2d");

		this.noisyContext = document.getElementById(noisy).getContext("2d");
		this.keyContext = document.getElementById(key).getContext("2d");
		this.solutionCanvas = document.getElementById(solution).getContext("2d");

		this._pixelSize = SA.PIXEL_SIZE || 1;
	};

	p.process = function() {
		this.isProcess = true;
		var start = (new Date()).getTime();
		console.log(start);
		var width = this.inputCanvas.width,
			height = this.inputCanvas.height;

		this.noisyContext.clearRect(0,0, width, height);
		this.keyContext.clearRect(0,0, width, height);
		this.solutionCanvas.clearRect(0,0, width, height);

		var pixelData = this.inputContext.getImageData(0,0,width,height).data;
	
		if(width%this._pixelSize !== 0 && height%this._pixelSize !== 0) {
			throw new Error("The given pixel size is incorrect");
		}

		if(width * height * 4 !== pixelData.length) {
			throw new Error("Incorrect size!");
		}

		var lengthX = width/this._pixelSize,
			lengthY = height/this._pixelSize,
			length = pixelData.length,
			row = width*4;


		var mtx = [];
		for (var y = 0; y < lengthY; y++) {
			mtx[y] = [];
			for (var x = 0; x < lengthX; x++) {
				var startPos = y*row + this._pixelSize * x * 4,
					black = 0,
					white = 0,
					currPos;

				for (var i = 0; i < this._pixelSize; i++) {
					currPos = startPos + i*row; //something is wrong...
					for (var j = 0; j < this._pixelSize; j++) {
						if(pixelData[currPos+3] === 255 && pixelData[currPos] === 0 && pixelData[currPos+1] === 0 && pixelData[currPos+2] === 0) {
							black++;
						} else {
							white++;
						}
						currPos += 4;
					}
				}

				var random = Math.floor(Math.random()*100) % 2;

				if(black > white) {
					mtx[y][x] = 1;
					if(random === 0) {
						this.noisyContext.fillRect(x*this._pixelSize,y*this._pixelSize,this._pixelSize,this._pixelSize);
					} else {
						this.keyContext.fillRect(x*this._pixelSize,y*this._pixelSize,this._pixelSize,this._pixelSize);
					}
				} else {
					mtx[y][x] = 0;
					if(random === 0) {
						this.noisyContext.fillRect(x*this._pixelSize,y*this._pixelSize,this._pixelSize,this._pixelSize);
						this.keyContext.fillRect(x*this._pixelSize,y*this._pixelSize,this._pixelSize,this._pixelSize);
					}
				}				

			}
		}
		console.log(mtx)

		var end = (new Date()).getTime();
		
		console.log(end);
		console.log("Diff: " + (end-start));
		this.isProcess = false;
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
	};

	p.clear = function(canvas) {
		var mycanvas = document.getElementById(canvas);
		var context = mycanvas.getContext("2d");

		context.clearRect(0,0,canvas.width, canvas.height);
	};
}());

(function() {
	"use strict";

	SA.ImageDecoding = function() {
		this.outputCanvas = undefined;
		this.outputContext = undefined;

		this.keyCanvas = undefined;
		this.keyContext = undefined;

		this.noisyCanvas = undefined;
		this.noisyContext = undefined;
	};

	var p = SA.ImageDecoding.prototype;

	p.set = function(output, key, noisy) {
		this.outputCanvas = document.getElementById(output);
		this.outputContext = this.outputCanvas.getContext("2d");

		this.keyCanvas = document.getElementById(key);
		this.keyContext = this.keyCanvas.getContext("2d");

		this.noisyCanvas = document.getElementById(noisy);
		this.noisyContext = this.noisyCanvas.getContext("2d");
	};

	p.process = function() {
		var start = (new Date()).getTime();
		console.log(start);
		var width = this.outputCanvas.width,
			height = this.outputCanvas.height;

		this.outputContext.clearRect(0,0, width, height);

		var keyPixels = this.keyContext.getImageData(0,0,width,height).data,
			noisyPixels = this.noisyContext.getImageData(0,0,width, height).data;

		if(keyPixels.length !== noisyPixels.length) {
			throw new Error("noisy image and key image has different size");
		}

		for (var i = 0, length = keyPixels.length; i < length; i+=4) {
			var pixNum = i/4;

			var x = pixNum % width,
				y = Math.floor(pixNum / width);

			if((keyPixels[i+3] === 255 && noisyPixels[i+3] === 0) ||
				(keyPixels[i+3] === 0 && noisyPixels[i+3] === 255)) {

				this.outputContext.fillRect(x,y,1,1);
			}
		}

		var end = (new Date()).getTime();
		
		console.log(end);
		console.log("Diff: " + (end-start));
	};
}());

var encoding = new SA.ImageEncoding();
var drawer = new SA.DrawCanvas();
var decoding = new SA.ImageDecoding();

window.onload = function() {
	"use strict";

	drawer.init("draw-canvas");

	var encodeBtn = document.getElementById("noiser-btn"),
		pxSizeInput = document.getElementById("noisy-pixel-size"),
		clearBtn = document.getElementById("clear-input-btn"),
		generateBtn = document.getElementById("based-key-btn"),
		switchLeft = document.getElementById("switch-left"),
		switchRight = document.getElementById("switch-right"),
		decodeBtn = document.getElementById("decode-button"),
		showGridBtn = document.getElementById("show-grid-btn");


	encodeBtn.addEventListener("click", function() {
		SA.PIXEL_SIZE = parseInt(pxSizeInput.value);
		encoding.set("draw-canvas", "noisy-canvas", "key-canvas", "solved-canvas");
		encoding.process();
	}, false);

	clearBtn.addEventListener("click", function(){
		drawer.clear();
	}, false);

	generateBtn.addEventListener("click", function(){
		encoding.makeNoisyBasedOnKey("draw-canvas", "noisy-canvas", "key-canvas", "solved-canvas");
	}, false);

	switchLeft.addEventListener("click", function() {
		this.className = "switcher active";
		switchRight.className = "switcher";
		
		var noisyC = document.getElementById("noisy-canvas"),
			keyC = document.getElementById("key-canvas");

		var pos = elementPosition(keyC);

		noisyC.style.position = "absolute";
		noisyC.style.top = pos.y + "px";
		noisyC.style.left = pos.x + "px";
	}, false);

	switchRight.addEventListener("click", function () {
		this.className = "switcher active";
		switchLeft.className = "switcher";

		var noisyC = document.getElementById("noisy-canvas");

		noisyC.style.position = "relative";
		noisyC.style.top = "0px";
		noisyC.style.left = "0px";
	}, false);

	decodeBtn.addEventListener("click", function() {
		decoding.set("solved-canvas", "key-canvas", "noisy-canvas");
		decoding.process();
	}, false);

	var showGrid = false;
	showGridBtn.addEventListener("click", function () {
		var gridCanvas = document.getElementById("grid-canvas");

		if(showGrid) {
			showGrid = false;
			gridCanvas.style.display = "none";
		} else {
			showGrid = true;
			gridCanvas.style.display = "block";

			var gridContext = gridCanvas.getContext("2d");

			var width = parseInt(gridCanvas.width),
				height = parseInt(gridCanvas.height);

			gridContext.clearRect(0,0,width,height);

			gridContext.lineWidth = 1;
			SA.PIXEL_SIZE = SA.PIXEL_SIZE || 1;
			for (var i = 0; i < width; i += SA.PIXEL_SIZE) {
				gridContext.beginPath();
				gridContext.moveTo(i, 0);
				gridContext.lineTo(i, height);
				gridContext.strokeStyle = "#F00";
				gridContext.stroke();
				gridContext.closePath();
			}

			for (var j = 0; j < height; j += SA.PIXEL_SIZE) {
				gridContext.beginPath();
				gridContext.moveTo(0, j);
				gridContext.lineTo(width, j);
				gridContext.strokeStyle = "#F00";
				gridContext.stroke();
				gridContext.closePath();
			}		
		}
	}, false);
};
