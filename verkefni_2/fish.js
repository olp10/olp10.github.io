var canvas;
var gl;

var NumVertices  = 15;
var NumBody = 24;
var NumTail = 3;
var NumLeftFin = 3;

var fishPositions = [];
var fishSpeedsX = [];
var fishSpeedsZ = [];
var fishSpeedsY = [];
var fishColors = [];

// Vertices of the body of the fish
var vertices = [
    // Body
    // Right side of body
    vec4( -0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2,  0.2, 0.0, 1.0 ),
	vec4(  0.2,  0.0, 0.1, 1.0 ),
	vec4( -0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2, -0.2, 0.0, 1.0 ),
	vec4(  0.2,  0.0, 0.1, 1.0 ),
    vec4( -0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2,  0.2, 0.0, 1.0 ),
	vec4(  0.2,  0.0, -0.1, 1.0 ),
	vec4( -0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2, -0.2, 0.0, 1.0 ),
	vec4(  0.2,  0.0, -0.1, 1.0 ),
    
    // Left side of body
	vec4(  0.2,  0.2, 0.0, 1.0 ),
	vec4(  0.2,  0.0, 0.1, 1.0 ),
	vec4(  0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2,  -0.2, 0.0, 1.0 ),
	vec4(  0.2,  0.0, 0.1, 1.0 ),
	vec4(  0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2,  0.2, 0.0, 1.0 ),
	vec4(  0.2,  0.0, -0.1, 1.0 ),
	vec4(  0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2,  -0.2, 0.0, 1.0 ),
	vec4(  0.2,  0.0, -0.1, 1.0 ),
	vec4(  0.5,  0.0, 0.0, 1.0 ),

	// Tail
    vec4( -0.5,  0.0, 0.0, 1.0 ),
    vec4( -0.65,  0.15, 0.0, 1.0 ),
    vec4( -0.65, -0.15, 0.0, 1.0 ),

    // Right fin
    vec4( 0.3,  0.0, 0.2, 1.0 ),
    vec4( 0.2,  0.0, 0.07, 1.0 ),
    vec4( 0.1,  0.0, 0.2, 1.0 ),

    // Left fin
    vec4( 0.2,  0.0, -0.07, 1.0 ),
    vec4( 0.3,  0.0, -0.2, 1.0 ),
    vec4( 0.1,  0.0, -0.2, 1.0 )
];

var movement = false;     // Er músarhnappur niðri?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var rotTail = 0.0;        // Snúningshorn sporðs
var incTail = 0.2;        // Breyting á snúningshorni

var rotFin = 0.0;        // Snúningshorn ugga
var incFin = 0.1;        // Breyting á snúningshorni

var zView = 2.0;          // Staðsetning áhorfanda í z-hniti

var proLoc;
var mvLoc;
var colorLoc;

var ALIGNMENT_DISTANCE = 0.5;
var COHESION_DISTANCE = 0.2;
var SEPARATION_DISTANCE = 0.1;

function initFishPositions() {
    for (var i = 0; i < 10; i++) {
        var fishX = Math.random() * 4.0 - 2.0;  // Random X position
        var fishY = Math.random() * 4.0 - 2.0;  // Random Y position
        var fishZ = Math.random() * 4.0 - 2.0;  // Random Z position
        fishPositions.push(vec3(fishX, fishY, fishZ));

        // Random swimming speeds in X, Y, and Z
        var fishSpeedX = Math.random() * 0.04 - 0.02;
        var fishSpeedY = Math.random() * 0.04 - 0.02;
        var fishSpeedZ = Math.random() * 0.08 - 0.04;

        fishSpeedsX.push(fishSpeedX);
        fishSpeedsY.push(fishSpeedY);
        fishSpeedsZ.push(fishSpeedZ);

        var randomColor = vec4(Math.random(), Math.random(), Math.random(), 1.0);
        fishColors.push(randomColor);
    }
}

function updateFishSpeeds() {
    for (var i = 0; i < 10; i++) {
        // Random swimming speeds in all directions (X, Y, and Z)
        var fishSpeedX = Math.random() * 0.04 - 0.02;  // Random speed in X
        var fishSpeedY = Math.random() * 0.04 - 0.02;  // Random speed in Y
        var fishSpeedZ = Math.random() * 0.08 - 0.04;  // Random speed in Z

        fishSpeedsX[i] = fishSpeedX;
        fishSpeedsY[i] = fishSpeedY;
        fishSpeedsZ[i] = fishSpeedZ;
    }
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );
 
    gl.enable(gl.DEPTH_TEST);

    var separationInput = document.getElementById("separation");
    separationInput.addEventListener("input", function () {
        var separationValue = parseFloat(separationInput.value);
        SEPARATION_DISTANCE = separationValue;
    });
    
    var alignmentInput = document.getElementById("alignment");
    alignmentInput.addEventListener("input", function () {
        var alignmentValue = parseFloat(alignmentInput.value);
        ALIGNMENT_DISTANCE = alignmentValue;
    });

    var cohesionInput = document.getElementById("cohesion");
    cohesionInput.addEventListener("input", function () {
        var cohesionValue = parseFloat(cohesionInput.value);
        COHESION_DISTANCE = cohesionValue;
    })
 
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "fColor" );

    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    // Setjum ofanvarpsfylki hér í upphafi
    var proj = perspective( 90.0, 1.0, 0.1, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

    // Atbur�af�ll fyrir m�s
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();
    });

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    });

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY += (e.offsetX - origX) % 360;
            spinX += (e.offsetY - origY) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });
    
    // Atburðafall fyrir lyklaborð
     window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 38:	// upp ör
                zView += 0.2;
                break;
            case 40:	// niður ör
                zView -= 0.2;
                break;
        }
     });

    // Atburðafall fyri músarhjól
    window.addEventListener("mousewheel", function(e){
        if (e.wheelDelta < 0.0) {
            zView += 0.2;
        } else {
            zView -= 0.2;
        }
    });
    
    initFishPositions();
    render();
}

function distanceBetween(vec1, vec2) {
    var dx = vec1[0] - vec2[0];
    var dy = vec1[1] - vec2[1];
    var dz = vec1[2] - vec2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function updateFlockingBehaviors() {
    for (var i = 0; i < 10; i++) {
        var currentPosition = fishPositions[i];

        var alignmentSum = vec3(0.0, 0.0, 0.0);
        var cohesionSum = vec3(0.0, 0.0, 0.0);
        var separationSum = vec3(0.0, 0.0, 0.0);
        var nearbyFishCount = 0;

        for (var j = 0; j < 10; j++) {
            if (i !== j) {
                var otherPosition = fishPositions[j];
                var distance = distanceBetween(currentPosition, otherPosition);

                if (distance < ALIGNMENT_DISTANCE) {
                    alignmentSum = add(alignmentSum, vec3(fishSpeedsX[j], fishSpeedsY[j], fishSpeedsZ[j]));
                }

                if (distance < COHESION_DISTANCE) {
                    cohesionSum = add(cohesionSum, otherPosition);
                }

                if (distance < SEPARATION_DISTANCE) {
                    var separationDirection = subtract(currentPosition, otherPosition);
                    separationSum = add(separationSum, normalize(separationDirection));
                }
            }
        }

        if (nearbyFishCount > 0) {
            alignmentSum = scale(0.1 / nearbyFishCount, alignmentSum);
            cohesionSum = scale(0.1 / nearbyFishCount, cohesionSum);
        }

        fishSpeedsX[i] = alignmentSum[0];
        fishSpeedsY[i] = alignmentSum[1];
        fishSpeedsZ[i] = alignmentSum[2];

        var newPosition = add(currentPosition, add(cohesionSum, separationSum));
        fishPositions[i] = newPosition;
    }
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateFlockingBehaviors();
    updateFishSpeeds();

    for (var i = 0; i < 10; i++) {
        var mv = lookAt(vec3(0.0, 0.0, zView), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
        mv = mult(mv, rotateX(spinX));
        mv = mult(mv, rotateY(spinY));

        rotTail += incTail;
        if (rotTail > 35.0 || rotTail < -35.0)
            incTail *= -1;

        rotFin += incFin * (Math.random() + 0.3);
        if (rotFin > 35.0 || rotFin < -35.0)
            incFin *= -1;

        gl.uniform4fv(colorLoc, fishColors[i]);

        var fishPosition = fishPositions[i];
        var fishSpeedX = fishSpeedsX[i] * Math.random() + 0.005;
        var fishSpeedZ = fishSpeedsZ[i] * Math.random() + 0.001;
        fishPosition[0] += fishSpeedX;
        //fishPosition[2] += Math.random() > 0.5 ? fishSpeedZ : -fishSpeedZ;

        if (fishPosition[0] > 2.0) {
            fishPosition[0] = -2.0;
            fishSpeedX = fishSpeedsX[i] * Math.random() + 0.02;
        }
        if (fishPosition[2] > 2.0) {
            fishPosition[2] = -2.0;
        }
        if (fishPosition[2] < -2.0) {
            fishPosition[2] = 0.0;
        }

        mv = mult(mv, translate(fishPositions[i]));
        gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
        gl.drawArrays(gl.TRIANGLES, 0, NumBody);
        
        var mv2 = mult( mv, translate ( 0.0, -0.05, 0.0 ) );
        mv2 = mult( mv2, rotateX( rotFin ) );
        mv2 = mult( mv2, translate ( 0.0, 0.0005, 0.0 ) );
        gl.uniform4fv(colorLoc, vec4(1.0, 0.0, 0.0, 1.0));
        gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
        gl.drawArrays( gl.TRIANGLES, NumBody+NumTail, 3);
        
        mv2 = mult( mv, translate ( 0.0, -0.005, 0.0 ) );
        mv2 = mult( mv2, rotateX( rotFin ) );
        mv2 = mult( mv2, translate ( 0.0, 0.0005, 0.0 ) );
        gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
        gl.drawArrays( gl.TRIANGLES, NumBody+NumTail+3, 3);

        mv = mult( mv, translate ( -0.5, 0.0, 0.0 ) );
        mv = mult( mv, rotateY( rotTail ) );
        mv = mult( mv, translate ( 0.5, 0.0, 0.0 ) );
        
        gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
        gl.drawArrays( gl.TRIANGLES, NumBody, NumTail);
    }
    requestAnimFrame( render );
}

