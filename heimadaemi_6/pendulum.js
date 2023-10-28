var gl;
var points = [];
var colorLoc;

var rectangle = [
    vec2(-0.01, 0.0),   // left bottom
    vec2(0.01, 0.0),    // right bottom
    vec2(0.01, -0.5),   // right top
    vec2(-0.01, 0.0),   // left bottom (repeat for triangle strip)
    vec2(0.01, -0.5),   // right top (repeat for triangle strip)
    vec2(-0.01, -0.5)   // left top
];

var l1 = 0.5;
var l2 = 0.5;
var theta1 = 0;
var theta2 = 0;
var omega1 = 0.01;
var omega2 = 0.02;
var maxTheta1 = Math.PI / 6;
var maxTheta2 = Math.PI / 4;
var frequency1 = 0.5;
var frequency2 = 0.75;
var speedMultiplierTopRod = 1.0;
var speedMultiplierBottomRod = 1.0;


window.onload = function init()
{
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );
    
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 12 * 2 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    colorLoc = gl.getUniformLocation(program, "fColor");
    document.getElementById("speedSliderTop").value = speedMultiplierTopRod;
    render();
};

function updateSpeedMultiplier(value, rod) {
    if (rod === "top") {
        speedMultiplierTopRod = parseFloat(value); 
        document.getElementById("speedValueTop").innerText = value; 
    } else {
        speedMultiplierBottomRod = parseFloat(value); 
        document.getElementById("speedValueBottom").innerText = value;
    }
}

function generateQuad(xStart, yStart, xEnd, yEnd, width) {
    var angle = Math.atan2(yEnd - yStart, xEnd - xStart);

    var dx = width * Math.sin(angle);
    var dy = -width * Math.cos(angle);

    return [
        vec2(xStart + dx, yStart + dy),
        vec2(xStart - dx, yStart - dy),
        vec2(xEnd + dx, yEnd + dy),

        vec2(xEnd + dx, yEnd + dy),
        vec2(xStart - dx, yStart - dy),
        vec2(xEnd - dx, yEnd - dy)
    ];
}

function computePendulumPosition(t) {
    theta1 = maxTheta1 * Math.sin((frequency1 * speedMultiplierTopRod) * t);
    theta2 = maxTheta2 * Math.sin(frequency2 * speedMultiplierBottomRod * t);

    var x1 = l1 * Math.sin(theta1);
    var y1 = -l1 * Math.cos(theta1);
    var x2 = x1 + l2 * Math.sin(theta1 + theta2);
    var y2 = y1 - l2 * Math.cos(theta1 + theta2);

    var rod1 = generateQuad(0, 0, x1, y1, 0.02);
    var rod2 = generateQuad(x1, y1, x2, y2, 0.02);

    return rod1.concat(rod2);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    var t = (new Date()).getTime() * 0.001;
    points = computePendulumPosition(t);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    gl.uniform4fv(colorLoc, vec4(0.0, 0.0, 0.0, 1.0));
    gl.drawArrays(gl.TRIANGLES, 0, 12);

    requestAnimationFrame(render);
}