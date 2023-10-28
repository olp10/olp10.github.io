var canvas;
var gl;

var numVertices = 36;

var points = [];
var normals = [];

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var matrixLoc;
var normalMatrixLoc;

var mv = mat4();

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    colorCube();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
    var lightPos = gl.getUniformLocation(program, "lightPosition");
    gl.uniform4fv(lightPos, flatten(lightPosition));

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    if (vColor === -1) {
        console.error("vColor attribute not found in shader");
        return;
    }
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    if (vPosition === -1) {
        console.error("vPosition attribute not found in shader");
        return;
    }
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    if (vNormal === -1) {
        console.error("vNormal attribute not found in shader");
        return;
    }
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    matrixLoc = gl.getUniformLocation(program, "rotation");
    if (matrixLoc === -1) {
        console.error("rotation uniform not found in shader");
        return;
    }
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    canvas.addEventListener("mousedown", function (e) {
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();
    });

    canvas.addEventListener("mouseup", function (e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            spinY = (spinY + (origX - e.offsetX)) % 360;
            spinX = (spinX + (origY - e.offsetY)) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });

    render();
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d) {
    var vertices = [
        vec3(-0.5, -0.5, 0.5),
        vec3(-0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, -0.5, 0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5, 0.5, -0.5),
        vec3(0.5, 0.5, -0.5),
        vec3(0.5, -0.5, -0.5)
    ];

    var indices = [a, b, c, a, c, d];
    var n = normalize(cross(subtract(vertices[b], vertices[a]), subtract(vertices[c], vertices[b])));

    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        normals.push(n);
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    var nMatrix = normalMatrix(mv, true);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(nMatrix));

    drawObject(mv, vec3(-0.3, -0.35, 0.20), vec3(0.1, 0.6, 0.1));
    drawObject(mv, vec3(0.3, -0.35, 0.20), vec3(0.1, 0.6, 0.1));
    drawObject(mv, vec3(0.3, -0.35, -0.20), vec3(0.1, 0.6, 0.1));
    drawObject(mv, vec3(-0.3, -0.35, -0.20), vec3(0.1, 0.6, 0.1));
    drawObject(mv, vec3(0, 0, 0), vec3(0.7, 0.1, 0.5));

    requestAnimFrame(render);
}

function drawObject(baseMatrix, translation, scaleFactors) {
    var mv1 = mult(baseMatrix, translate(...translation));
    mv1 = mult(mv1, scalem(...scaleFactors));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}
