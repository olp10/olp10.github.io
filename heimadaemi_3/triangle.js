///////////////////////////////////////////////////////////////////
//    Color changing triangle
//
//    Ólafur Pálsson, september 2023
///////////////////////////////////////////////////////////////////
var gl;
var points;
var locColor;
var locTime, iniTime;
var lastChange = 0;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    var vertices = new Float32Array([-1, -1, 0, 1, 1, -1]);

    //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW );

    // Associate shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Get the uniform locations for the color and set random color
    locColor = gl.getUniformLocation( program, "rcolor" );
    gl.uniform4fv( locColor, [Math.random(), Math.random(), Math.random(), 1.0] );

    // Get the uniform location for the time
    locTime = gl.getUniformLocation( program, "time" );
    iniTime = Date.now();

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    // Get milliseconds since the program started
    var msek = Date.now() - iniTime;
    gl.uniform1f( locTime, msek );

    // Check if time since the color was last changed is more than 1 second
    if (msek - lastChange >= 1000) {
        var col = vec4(Math.random(), Math.random(), Math.random(), 1.0);
        gl.uniform4fv( locColor, flatten(col));

        // Update lastChange variable to current time
        lastChange = msek;
    }

    gl.drawArrays( gl.TRIANGLES, 0, 3 );

    window.requestAnimationFrame(render);
}
