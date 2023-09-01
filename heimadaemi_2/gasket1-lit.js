/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir hvernig hægt er að breyta lit með uniform breytu
//
//    Hjálmtýr Hafsteinsson, ágúst 2023
/////////////////////////////////////////////////////////////////
var gl;
var points = [];
var numTriangles = 100;
var colorLoc;

var triangle = [
    vec2(0,0),
    vec2(0.15, 0),
    vec2(0.5 * 0.15, 0.15)
];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    for (var i = 0; i < numTriangles; i++) {
        var offsetX = 2 * Math.random() - 1;
        var offsetY = 2 * Math.random() - 1;
        for (var j = 0; j < 3; j++) {
            points.push(vec2(triangle[j][0] + offsetX, triangle[j][1] + offsetY));
        }
    }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Find the location of the variable fColor in the shader program
    colorLoc = gl.getUniformLocation( program, "fColor" );
    
    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    for (var i = 0; i < numTriangles; i++) {
        var color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
        gl.uniform4fv(colorLoc, color);
        gl.drawArrays(gl.TRIANGLES, i * 3, 3);
    }
}
