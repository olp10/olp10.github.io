////////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir hvernig hægt er að láta punkta "detta niður" skjáinn
//
//    Hjálmtýr Hafsteinsson, september 2023
////////////////////////////////////////////////////////////////////
var gl;
var points = [];
var checked = 'greenland';
var numPoints = 5000;
var program;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Búa til slembipunkta á striganum
    for ( var i = 0; i < numPoints; i++ ) {
        pt = vec2( 2.0*Math.random() - 1.0, 2.0*Math.random() - 1.0 );
        points.push( pt );
    }
    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    locTime = gl.getUniformLocation( program, "time" );

    iniTime = Date.now();

    document.getElementById("greenland").addEventListener("change", function () {
        if (this.checked) {
            checked = 'greenland';
        }
    })

    document.getElementById("iceland").addEventListener("change", function() {
        if(this.checked) {
            checked = "iceland";
        }
    });
    
    gl.uniform1i( gl.getUniformLocation( program, "checked" ), 1 );
    
    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    var msek = Date.now() - iniTime;
    gl.uniform1f( locTime, msek );
    
    gl.uniform1i( gl.getUniformLocation( program, "checked" ), checked === "greenland" ? 1 : 0 );

    gl.drawArrays( gl.POINTS, 0, numPoints );

    window.requestAnimFrame(render);
}
