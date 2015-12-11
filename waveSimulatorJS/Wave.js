//Wave.js Solves the wave equation with input parameters.

//INITIALIZE COUNTER
var updateCount = 0;

//INITIAL CONDITIONS VARIABLES
var xInt = [0,10];			//Space interval
var tInt = [0,10];			//Time interval
var v;						//Wave speed

var N;						//Resolution of space
var dt;						//Resolution of time

var f0expression;			//Initial wave shape
var g0expression;			//Initial wave movement 

var boundary;				//Boundary conditions
var boundaryStrings = ["dir", "neu", "dn", "nd"];

//COMPUTED VARIABLES
var dx;						//Space stepsize
var x;						//Space array
var t;						//Time array

var y;						//Wave data

//PLOTLY VARIABLES
var minY;					//Y-axis minimum
var maxY;					//Y-axis maximum

var data;					//Data to plot
var layout;					//Formatting

//PARSER VARIABLES (math.js)
var scopef0;
var scopeg0;
var codef0;
var codeg0;
//-----------------------------

//ON BUTTON CLICK UDPATE ROUTINE
function update() {
	updateCount++;
	//Retrieve user inputs
	xInt[0] = parseInt(document.getElementById("xInta").value);
	xInt[1] = parseInt(document.getElementById("xIntb").value);
	tInt[1] = parseInt(document.getElementById("tIntb").value);
	v = parseFloat(document.getElementById("v").value);
	N = parseInt(document.getElementById("N").value);
	dt = parseFloat(document.getElementById("dt").value);
	var radios = document.getElementsByName("boundary");
	//Set boundary conditions based on radio button
	for (var i = 0, length = radios.length; i < length; i++) {
		if (radios[i].checked) {
			boundary = boundaryStrings[i];
			break;
		}
	}
	
	//Parse user function inputs
	f0expression = document.getElementById("f0expression").value;
	g0expression = document.getElementById("g0expression").value;
	scopef0 = {
		x: 0
	};
	scopeg0 = {
		x: 0
	};
	codef0 = math.compile(f0expression);
	codeg0 = math.compile(g0expression);
	
	//Compute relevant quantities
	dx = (xInt[1] - xInt[0])/N;
	x = linspace(xInt[0], xInt[1], dx);
	t = linspace(tInt[0], tInt[1], dt);
	y = wave();
	
	//Plotting routine
	minY = minArray2(y);
	maxY = maxArray2(y);
	data = [
		{
		x: x,
		y: y[0],
		type: 'scatter'
		}
	];
	layout = {
		title: 't = 0',
		yaxis: {
			range: [minY, maxY]
		}
	};
	animateWave(data,layout);
}
//-----------------------------

//HELPER FUNCTIONS
function linspace(start,end,step) {
	//Takes input scalars and outputs linearly spaced array.
	var intervalArray = [start];
	numberOfSteps = Math.floor( (end-start)/step );
	for (i = 1; i <= numberOfSteps; i++) {
		intervalArray[i] = start+i*step;
	}
	return intervalArray
}

function scalarMult(scalar,array) {
	//Multiplies all elements of array by scalar.
	var scaledArray = [];
	for (i = 0; i < array.length; i++) {
		scaledArray[i] = scalar*array[i];
	}
	return scaledArray
}

function wavef0(x) {
	//Outputs initial wave shape, given input array x.
	var y = [];
	for (i = 0; i < x.length; i++) {
		scopef0.x = x[i];
		y[i] = codef0.eval(scopef0);
	}
	return y
}

function waveg0(x) {
	//Outputs initial wave shape movement, given input array x.
	var y = [];
	for (i = 0; i < x.length; i++) {
		scopeg0.x = x[i];
		y[i] = codeg0.eval(scopeg0);
	}
	return y
}

function minArray2(Y) {
	//Find minimum of 2-dimensional array.
	var minY = Math.min.apply(null, Y[0]);
	for (i = 0; i < Y.length; i++) {
		m = Math.min.apply(null, Y[i]);
		if (m < minY) {
			minY = m;
		}
	}
	return minY
}

function maxArray2(Y) {
	//Find maximum of 2-dimensional array.
	var maxY = Math.max.apply(null, Y[0]);
	for (i = 0; i < Y.length; i++) {
		M = Math.max.apply(null, Y[i]);
		if (M > maxY) {
			maxY = M;
		}
	}
	return maxY
}

function animateWave(data,layout) {
	var stepsize = 10;
	var i = 0;
	if (updateCount === 1) {
		Plotly.newPlot(main, data, layout)
	} else {
		Plotly.deleteTraces(main,0)
		Plotly.newPlot(main, data, layout) // recomputing axis info
	}
	var timer = setInterval(function() {
		main.layout.title = 't = ' + (dt*i).toFixed(2);
		main.data[0].y = y[i];
		Plotly.redraw(main);
		i = i + stepsize;
		if(i > y.length) {
			clearInterval(timer);
		}
	},50)
}

function wave(){
	//Output 2-dimensional array of values for wave data.
	
	//INITIALIZING FUNCTION VALUES FOR TIME (ROW) AND SPACE (COLUMNS)
	//	STRUCTURE OF Y (ARRAY)
	//  Form is y[time][position].
	//  
	//  	< - - - - - - - - - - - position domain - - - - - - >
	//  	[-dt	f0(x) - dt*g0(x)							] ROW 0
	//  	[0		f0(x)										] ROW 1
	//	y = [dt		FOR LOOP									] ROW 2
	//  	[2dt	FOR LOOP									] ROW 3
	//		[...	...											] ROW ...

	// Initialize Array
	var y = new Array(t.length+1);			// # of rows
	for (var i = 0; i < y.length; i++) {
		y[i] = new Array(x.length);			// # of columns
	}
	
	// Prepare wave functions
	var F = wavef0(x);
	var G = scalarMult(dt,waveg0(x));

	// Define first 2 rows of data
	for (j = 0; j < x.length; j++){
		y[-1+1][j] = F[j] - G[j];
		y[0+1][j] = F[j];
	}

	//SOLVING WAVE EQUATION...
	for (i = 0+1; i < t.length; i++) {
		for (j = 0+1; j < x.length-1; j++) {
			y[i+1][j] = 2*y[i][j] - y[i-1][j] + Math.pow(v*dt/dx,2) * ( y[i][j+1]-2*y[i][j]+y[i][j-1] );
		}
		
		switch(boundary){
		case "neu":
			y[i+1][0] = y[i+1][1];
			y[i+1][N] = y[i+1][N-1];
			break;
		case "dir":
			y[i+1][0] = 0;
			y[i+1][N] = 0;
			break;
		case "dn":
			y[i+1][0] = 0;
			y[i+1][N] = y[i+1][N-1];
			break;
		case "nd":
			y[i+1][0] = y[i+1][1];
			y[i+1][N] = 0;
			break;
		}
	}	
	return y
}
//-----------------------------