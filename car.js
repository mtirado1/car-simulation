
car = {
	maxTurningAngle: 30, // limite de giro
	width: 10,	// ancho del carro
	height: 20,	// altura del carro
	s: [270, 0], // posicion x,y
	v: 1,	// velocidad (magnitud)
	h: 0,	 // direccion real del carro
	angle: 0 // angulo de giro de las ruedas
}

var c = document.getElementById("canvas");
const ctx = c.getContext('2d');
xCenter = c.width/2;
yCenter = c.height/2;

function drawLine(c, x1, y1, x2, y2) {
	c.beginPath();
	c.strokeStyle = "#ff0000";
	c.moveTo(x1-car.s[0], -y1+car.s[1]);
	c.lineTo(x2-car.s[0], -y2+car.s[1]);
	c.stroke();
}

function drawArc(c, x, y, r, s, e) {
	c.beginPath();
	c.strokeStyle = "#ff0000";
	c.arc(x-car.s[0], -y+car.s[1], r, s * 2 * Math.PI, e * 2 * Math.PI);
	c.stroke();
}

var tY = document.getElementById("nY").value*1;
var tX = document.getElementById("nX").value*1;
var tW = document.getElementById("nW").value*1;
var tR = document.getElementById("nR").value*1;

car.s[0] = tX + tR + tW; // start of track

var err_P = 0, err_I = 0, err_D = 0;
var time = 0;
var samp = 0;
function screen() {
	ctx.fillStyle="#ffffff";
	ctx.fillRect(0, 0, c.width, c.height);

	ctx.fillStyle = "#0000ff";
	ctx.fillRect(xCenter -0.5 * car.width, yCenter -0.5 * car.height, car.width, car.height);

	// draw lanes
	ctx.save();
	ctx.translate(xCenter, yCenter);
	ctx.rotate(car.h);
	
	drawLine(ctx, -tR, 0, -tR, tY);
	drawLine(ctx, -tR-tW, 0, -tR-tW, tY);
	drawLine(ctx, tX + tR, 0, tX + tR, tY);
	drawLine(ctx, tX + tR + tW, 0, tX + tR + tW, tY);
	drawLine(ctx, 0, -tR, tX, -tR);
	drawLine(ctx, 0, -tR - tW, tX, -tR -tW);
	drawLine(ctx, 0, tY+tR, tX, tY+tR);
	drawLine(ctx, 0, tY+tR+tW, tX, tY+tR+tW);

	drawArc(ctx, 0,  0,  tR,      0.25, 0.5);
	drawArc(ctx, 0,  0,  tR + tW, 0.25, 0.5);
	drawArc(ctx, 0,  tY, tR,      0.5,  0.75);
	drawArc(ctx, 0,  tY, tR + tW, 0.5,  0.75);
	drawArc(ctx, tX, 0,  tR,      0,    0.25);
	drawArc(ctx, tX, 0,  tR + tW, 0,    0.25);
	drawArc(ctx, tX, tY, tR,      0.75, 1);
	drawArc(ctx, tX, tY, tR + tW, 0.75, 1);
	
	ctx.restore();
	var vision = ctx.getImageData(xCenter-30, yCenter-30, 60, 20)
	
	var accX = 0;
	var avgCount = 0;
	
	// algoritmo de vision: escanea los puntos rojos y promedia su posición
	for (var iy = 0; iy < vision.height; iy++) {
		for (var ix = 0; ix < vision.width; ix++) {
			var red   = vision.data[4 * (ix + vision.width*iy)];
			var green = vision.data[4 * (ix + vision.width*iy) + 1];
			var blue  = vision.data[4 * (ix + vision.width*iy) + 2];
			if(green != 255 && blue != 255) {
				accX += ix;
				avgCount ++;
			}
		}
	}
	if (avgCount > 0) {
		accX /= avgCount;
		ctx.beginPath();
		ctx.fillStyle = "#0000ff";
		ctx.arc(xCenter + accX - 30, yCenter - car.height/2 - 10, 2, 0, Math.PI * 2)
		ctx.fill();
	}	
	ctx.beginPath();
	ctx.strokeStyle = "#00ff00";
	ctx.rect(xCenter -30, yCenter -car.height/2 - 20 , 60, 20);
	ctx.stroke();

	// simulate movement
	var turningRadius = car.height/Math.tan(car.angle * Math.PI/180);
	var v = [-Math.sin(car.h), Math.cos(car.h)];	
	car.v = document.getElementById("speed").value * 2;
	car.s[0] += car.v * v[0] / 60;
	car.s[1] += car.v * v[1] / 60;
	
	// angulo generado
	car.h += (car.v/60)  / turningRadius;
	
	var sampling_time = document.getElementById("sampling").value / 100;
	var err = (accX - 30);
	var gain_P = document.getElementById("gain-p").value*1;
	var gain_I = document.getElementById("gain-i").value*1;
	var gain_D = document.getElementById("gain-d").value*1;

	ctx.font = "14px Monospace";
	ctx.fillStyle = "#333333";
	ctx.fillText("Giro: " + car.angle.toFixed(2) + "°", 5, c.height - 75);
	ctx.fillText("Tiempo: " + time.toFixed(1) + " s", 5, c.height - 60);
	ctx.fillText("Tiempo de muestreo: " + sampling_time.toFixed(3) + " s", 5, c.height - 45);
	ctx.fillText("Error: " + err.toFixed(1) + " cm", 5, c.height - 30);
	ctx.fillText("Velocidad: " + car.v.toFixed(1) + " cm/s", 5, c.height - 15);

	// control
	err_D = err - err_P;
	err_P = err;
	err_I += err/60;
	
	time += 1/60;	
	samp += 1/60;
	
	if(samp >= sampling_time) {
		samp = 0;
		car.angle = -gain_P * err_P -gain_I * err_I -gain_D * err_D;
		car.angle = Math.min(Math.max(-car.maxTurningAngle, car.angle), car.maxTurningAngle);
	}
	requestAnimationFrame(screen);
}

screen();
