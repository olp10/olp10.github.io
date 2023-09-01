"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 5;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.

    var vertices = [
        vec2( -1, -1 ),
        vec2( -1,  1 ),
        vec2(  1,  1 ),
        vec2(  1, -1 ),
    ];

    divideSquare( vertices[0], vertices[1], vertices[2], vertices[3],
                    NumTimesToSubdivide);

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

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};

function triangle( a, b, c )
{
    points.push( a, b, c );
}

function divideSquare( a, b, c, d, count )
{

    // check for end of recursion

    if ( count === 0 ) {
        triangle( a, b, c );
        triangle( a, c, d );
        return;
    }
    else {

        //bisect the sides
        var oneThirdAb = mix( a, b, (1/3) );
        var twoThirdAb = mix( a, b, (2/3) );
        var oneThirdBc = mix( b, c, (1/3) );
        var twoThirdBc = mix( b, c, (2/3) );
        var oneThirdCd = mix( c, d, (1/3) );
        var twoThirdCd = mix( c, d, (2/3) );
        var oneThirdAd = mix( a, d, (1/3) );
        var twoThirdAd = mix( a, d, (2/3) );

        var leftDown = vec2( oneThirdAd[0], oneThirdAb[1] );
        var rightDown = vec2( twoThirdAd[0], oneThirdAb[1] );
        var leftUp = vec2( oneThirdAd[0], twoThirdAb[1] );
        var rightUp = vec2 (twoThirdAd[0], twoThirdAb[1]);

        --count;

        divideSquare( a, oneThirdAb, leftDown, oneThirdAd, count);
        divideSquare( oneThirdAd, leftDown, rightDown, twoThirdAd, count );
        divideSquare( twoThirdAd, rightDown, twoThirdCd, d, count );
        divideSquare( rightDown, rightUp, oneThirdCd, twoThirdCd, count );
        divideSquare( rightUp, twoThirdBc, c, oneThirdCd, count );
        divideSquare( leftUp, oneThirdBc, twoThirdBc, rightUp, count );
        divideSquare( twoThirdAb, b, oneThirdBc, leftUp, count );
        divideSquare( oneThirdAb, twoThirdAb, leftUp, leftDown, count );
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
