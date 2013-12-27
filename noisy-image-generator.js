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

	p.loadText = function(text) {
		this.clear();
		this.context.fillStyle = "#000";
		this.context.font = "22pt Arial Black";
		this.context.textAlign = "left";
		this.context.textBaseline = "top";

		var parsedText = text.split(" "),
			textArray = [],
			j = 0;

		textArray[0] = "";
		for (var i = 0; i < parsedText.length; i++) {
			if(this.context.measureText(textArray[j] + parsedText[i] + " ").width >= this.mycanvas.width) {
				j++;
				textArray[j] = "";
			}
			textArray[j] += parsedText[i] + " ";
		}

		for (var i = 0; i < textArray.length; i++) {
			this.context.fillText(textArray[i], 0, i*24);
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

		this._pixelSize = 1;

		this.isProcess = false;
	};

	var p = SA.ImageEncoding.prototype;

	p.set = function(canvas, noisy, key) {
		this.inputCanvas = document.getElementById(canvas);
		this.inputContext = this.inputCanvas.getContext("2d");

		this.noisyContext = document.getElementById(noisy).getContext("2d");
		this.keyContext = document.getElementById(key).getContext("2d");

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

		var pixelData = this.inputContext.getImageData(0,0,width,height).data;
	
		if(width%this._pixelSize !== 0 && height%this._pixelSize !== 0) {
			throw new Error("The given pixel size is incorrect");
		}

		if(width * height * 4 !== pixelData.length) {
			throw new Error("Incorrect size!");
		}

		var lengthX = width/this._pixelSize, //how many pixel per row
			lengthY = height/this._pixelSize, //how many pixel per col
			row = width*4;


		for (var y = 0; y < lengthY; y++) {//cols
			for (var x = 0; x < lengthX; x++) {//rows
				var startPos = y*this._pixelSize*row + this._pixelSize * x * 4,
					black = 0,
					white = 0,
					currPos;

				for (var i = 0; i < this._pixelSize; i++) {
					currPos = startPos + i*row;
					for (var j = 0; j < this._pixelSize; j++) {
						if(pixelData[currPos+3] !== 0 && pixelData[currPos] === 0 && pixelData[currPos+1] === 0 && pixelData[currPos+2] === 0) {
							black++;
						} else {
							white++;
						}
						currPos += 4;
					}
				}

				var random = Math.floor(Math.random()*100) % 2;

				if(black > white) {
					if(random === 0) {
						this.noisyContext.fillRect(x*this._pixelSize,y*this._pixelSize,this._pixelSize,this._pixelSize);
					} else {
						this.keyContext.fillRect(x*this._pixelSize,y*this._pixelSize,this._pixelSize,this._pixelSize);
					}
				} else {
					if(random === 0) {
						this.noisyContext.fillRect(x*this._pixelSize,y*this._pixelSize,this._pixelSize,this._pixelSize);
						this.keyContext.fillRect(x*this._pixelSize,y*this._pixelSize,this._pixelSize,this._pixelSize);
					}
				}				

			}
		}
		var end = (new Date()).getTime();
		
		console.log(end);
		console.log("Diff: " + (end-start));

		SA.encTimeLog.value = end-start;
		this.isProcess = false;
	};

	//TODO: generalize
	p.processWithKey = function() {
		this.isProcess = true;
		var start = (new Date()).getTime();
		console.log(start);

		var width = this.inputCanvas.width,
			height = this.inputCanvas.height;


		var lengthX = width/this._pixelSize, //how many pixel per row
			lengthY = height/this._pixelSize, //how many pixel per col
			row = width*4;


		this.noisyContext.clearRect(0,0, width, height);

		var inputData = this.inputContext.getImageData(0,0,width,height).data,
			keyData = this.keyContext.getImageData(0,0,width,height).data;

		if(width%this._pixelSize !== 0 && height%this._pixelSize !== 0) {
			throw new Error("The given pixel size is incorrect");
		}

		if(width * height * 4 !== inputData.length) {
			throw new Error("Incorrect size!");
		}

		for (var y = 0; y < lengthY; y++) {//cols
			for (var x = 0; x < lengthX; x++) {//rows
				var startPos = y*this._pixelSize*row + this._pixelSize * x * 4,
					black = 0,
					white = 0,
					currPos;

				for (var i = 0; i < this._pixelSize; i++) {
					currPos = startPos + i*row;
					for (var j = 0; j < this._pixelSize; j++) {
						if(inputData[currPos+3] !== 0 && inputData[currPos] === 0 && inputData[currPos+1] === 0 && inputData[currPos+2] === 0) {
							black++;
						} else {
							white++;
						}
						currPos += 4;
					}
				}

				if(black > white) {
					if(keyData[startPos+3] !== 255) {
						this.noisyContext.fillRect(x*this._pixelSize,y*this._pixelSize,this._pixelSize,this._pixelSize);
					}
				} else {
					if(keyData[startPos+3] !== 0 && keyData[startPos] === 0 && keyData[startPos+1] === 0 && keyData[startPos+2] === 0) {
						this.noisyContext.fillRect(x*this._pixelSize,y*this._pixelSize,this._pixelSize,this._pixelSize);
					}
				}
			}
		}


		var end = (new Date()).getTime();
		
		console.log(end);
		console.log("Diff: " + (end-start));

		SA.encTimeLog.value = end-start;
		this.isProcess = false;		
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
		SA.decTimeLog.value = end-start;
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
		showGridBtn = document.getElementById("show-grid-btn"),

		loadText = document.getElementById("load-text-btn"),

		inputSave = document.getElementById("input-save"),
		keySave = document.getElementById("key-save"),
		noisySave = document.getElementById("noisy-save"),
		outputSave = document.getElementById("output-save"),

		inputImg = document.getElementById("input-image-box"),
		keyImg = document.getElementById("load-key-box");

	SA.decTimeLog = document.getElementById("dec-time");
	SA.encTimeLog = document.getElementById("enc-time");

	pxSizeInput.addEventListener("change", function() {
		if(!isNaN(parseInt(this.value))) {
			SA.PIXEL_SIZE = parseInt(this.value);
		}
	}, false);

	encodeBtn.addEventListener("click", function() {
		encoding.set("draw-canvas", "noisy-canvas", "key-canvas");
		encoding.process();
	}, false);

	clearBtn.addEventListener("click", function(){
		drawer.clear();
	}, false);

	generateBtn.addEventListener("click", function(){
		encoding.set("draw-canvas", "noisy-canvas", "key-canvas");
		encoding.processWithKey();
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
			console.log(SA.PIXEL_SIZE)
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


	//Saving images
	inputSave.addEventListener("click", function() {
		var dataURL = document.getElementById("draw-canvas").toDataURL();
		window.open(dataURL);
	},false);

	keySave.addEventListener("click", function() {
		var dataURL = document.getElementById("key-canvas").toDataURL();
		window.open(dataURL);
	}, false);

	noisySave.addEventListener("click", function() {
		var dataURL = document.getElementById("noisy-canvas").toDataURL();
		window.open(dataURL);
	}, false);

	outputSave.addEventListener("click", function() {
		var dataURL = document.getElementById("solved-canvas").toDataURL();
		window.open(dataURL);
	}, false);

	inputImg.addEventListener("change", function() {
		if(this.files.length !== 0) {		
			var canvas = document.getElementById("draw-canvas"),
				context = canvas.getContext("2d"),
				img = new Image();

			context.clearRect(0,0,canvas.width, canvas.height);

			img.onload = function(e) {
				context.drawImage(this, 0, 0);
				//window.URL.revokeObjectURL(this.src);
			};
			img.src = window.URL.createObjectURL(this.files[0]);

			this.files = [];
			this.value = null;
		}
	}, false);

	keyImg.addEventListener("change", function() {
		if(this.files.length !== 0) {		
			var canvas = document.getElementById("key-canvas"),
				context = canvas.getContext("2d"),
				img = new Image();

			context.clearRect(0,0,canvas.width, canvas.height);

			img.onload = function(e) {
				context.drawImage(this, 0, 0);
				//window.URL.revokeObjectURL(this.src);
			};
			img.src = window.URL.createObjectURL(this.files[0]);

			this.files = [];
			this.value = null;
		}
	}, false);

	loadText.addEventListener("click", function() {
		var input = document.getElementById("input-text-box");
		drawer.loadText(input.value);
	}, false);
};