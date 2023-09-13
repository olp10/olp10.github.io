/********************************************************************
 * Creator          : Ólafur Pálsson - 2023
 * File name        : frogger.js
 * Description      : A simple frogger game made as an assignment in
                      a Computer Graphics course
/********************************************************************/

// WebGL context
var gl;

// Object variables
var cars = [];
var carPoints = [];
var colorLoc;
var frog;
var points = [];
var roads = [];
var sidewalks = [];

// Boolean for indicating the direction of the frog
var returning = false;
var score = 0;

/**
 * Initializes the positions of the roads
 */
function makeRoads() {
    // Bottom left, top left, top right, bottom right
    var road1 = new Float32Array([-1, (3/7), -1, (5/7), 1, (5/7), 1, (3/7)]);
    var road2 = new Float32Array([-1, (1/7), -1, (3/7), 1, (3/7), 1, (1/7)]);
    var road3 = new Float32Array([-1, -(1/7), -1, (1/7), 1, (1/7), 1, -(1/7)]);
    var road4 = new Float32Array([-1, -(3/7), -1, -(1/7), 1, (-1/7), 1, -(3/7)]);
    var road5 = new Float32Array([-1, -(5/7), -1, -(3/7), 1, -(3/7), 1, -(5/7)]);
    
    roads = [ road1, road2, road3, road4, road5 ];

    // Add the road points to the points array
    for (let i = 0; i < roads.length; i++) {
        for (let j = 0; j < roads[i].length; j++) {
            points.push(roads[i][j]);
        }
    }
}

/**
 * Initializes the positions of the sidewalks
 */
function makeSidewalks() {
    /* Sidewalk initialization */
    var sidewalkBottom = new Float32Array([-1, -1, -1, -(5/7), 1, -(5/7), 1, -1]);
    var sidewalkTop = new Float32Array([-1, (5/7), -1, 1, 1, 1, 1, (5/7)]);

    sidewalks = [ sidewalkBottom, sidewalkTop ];

    // Add the sidewalk points to the points array
    for (let i = 0; i < sidewalks.length; i++) {
        for (let j = 0; j < sidewalks[i].length; j++) {
            points.push(sidewalks[i][j]);
        }
    }
    /* Sidewalk initialization end */
}

/**
 * Initializes the positions of the frog
 */
function makeFrog() {
    /* Frog initialization */
    frog = [
        vec2(0, -(12/14)),
        vec2((1/14), -(13/14)),
        vec2(-(1/14), -(13/14)),
    ]
}

/**
 * Initializes the positions of the cars
 */
function makeCars() {
    var car1 = [ // Actually third down from top
    vec2(-(11/7), -(1/14)),
    vec2(-(11/7), (1/14)),
    vec2(-(9/7), (1/14)),
    vec2(-(9/7), -(1/14))
    ]
    var car2 = [ // Fourth down from top
        vec2(-(4/7), -(5/14)),
        vec2(-(4/7), -(3/14)),
        vec2(-(2/7), -(3/14)),
        vec2(-(2/7), -(5/14))
    ]
    var car3 = [ // Bottom car
        vec2(-1, -(9/14)),
        vec2(-1, (-7/14)),
        vec2(-(5/7), (-7/14)),
        vec2(-(5/7), -(9/14))
    ]
    var car4 = [ // Top car
        vec2(-(5/7), (3/14)),
        vec2(-(5/7), (5/14)),
        vec2(-(3/7), (5/14)),
        vec2(-(3/7), (3/14))
    ]
    var car5 = [ // Second from top
        vec2(-(3/7), (7/14)),
        vec2(-(3/7), (9/14)),
        vec2(-(1/7), (9/14)),
        vec2(-(1/7), (7/14))
    ]

    cars = [ car1, car2, car3, car4, car5 ];

    // Add random colors to the cars and add the car points to the carPoints array
    for (let i = 0; i < cars.length; i++) {
        cars[i].color = [Math.random(), Math.random(), Math.random(), 1.0];
        for (let j = 0; j < cars[i].length; j++) {
            carPoints.push(cars[i][j]);
        }
    }
}

/**
 * Helper function for setting frog position 
 */
function setFrogPosition(a, b, c, d, e, f) {
    frog[0][0] = a;
    frog[0][1] = b;
    frog[1][0] = c;
    frog[1][1] = d;
    frog[2][0] = e;
    frog[2][1] = f;
}

/**
 * Initializes the WebGL context and sets up the necessary objects and shaders.
 */
window.onload = function init()
{
    // Get the canvas element from our HTML document
    var canvas = document.getElementById( "gl-canvas" );

    // Create a webgl context for the canvas
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Create the objects
    makeFrog();
    makeSidewalks();
    makeRoads();
    makeCars();

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the frog data into the GPU
    var frogBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, frogBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(frog), gl.STATIC_DRAW );

    // Load the sidewalk into the GPU
    var layoutBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, layoutBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var carsBuffer = gl.createBuffer()
    gl.bindBuffer( gl.ARRAY_BUFFER, carsBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(carPoints), gl.STATIC_DRAW );

    // Associate shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    colorLoc = gl.getUniformLocation( program, "fColor" );

    // Listen for keyboard events
    window.addEventListener('keydown', function(e) {
        
        // Movement variables
        var xmove = 0.0;
        var ymove = 0.0;

        // Move the frog based on key
        switch (e.key) {
            case 'ArrowLeft':
                xmove = -(1/7);
                break;
            case 'ArrowRight':
                xmove = (1/7);
                break;
            case 'ArrowUp':
                ymove += (2/7);	
                break;
            case 'ArrowDown':
                ymove -= (2/7);
                break;
            default:
                break;
        }

        // Check if at end of sceen on X axis
        if (frog[2][0] + xmove < -1 || frog[1][0] + xmove > 1) {
            xmove = 0.0;
        } else {
            for (let i = 0; i < 3; i++) {
                frog[i][0] += xmove;
            }
        }

        // Check if at end of screen on Y axis
        if (frog[2][1] + ymove < -1 || frog[0][1] + ymove > 1) {
            ymove = 0.0;
        } else {
            for (let i = 0; i < 3; i++) {
                frog[i][1] += ymove;
            }
        }

        // Clear the movement so it doesn't add up
        xmove = ymove = 0.0;

        // Update the frog
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(frog));
    })

    render(frogBuffer, layoutBuffer, carsBuffer, vPosition);
};

/**
 * Renders the game scene by drawing the sidewalks, roads, cars, frog, and handling collisions.
 *
 * @param {WebGLBuffer} frogBuffer - the buffer containing the vertices of the frog
 * @param {WebGLBuffer} sidewalkBuffer - the buffer containing the vertices of the sidewalks
 * @param {WebGLBuffer} carsBuffer - the buffer containing the vertices of the cars
 * @param {WebGLAttribLocation} vPosition - the attribute location for the vertex position
 */
function render(frogBuffer, sidewalkBuffer, carsBuffer, vPosition) {
    gl.clear( gl.COLOR_BUFFER_BIT );

    // Draw sidewalk
    gl.bindBuffer( gl.ARRAY_BUFFER, sidewalkBuffer );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    gl.uniform4fv(colorLoc, [0.7, 0.7, 0.7, 1.0]);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4 );
    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4 );
    
    // Draw roads
    gl.bindBuffer( gl.ARRAY_BUFFER, sidewalkBuffer );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    gl.uniform4fv(colorLoc, [0.3, 0.3, 0.3, 1.0]);

    for (let i = 0; i < roads.length; i++) {
        // Start at 8 because sidewalk in 0-7
        gl.drawArrays(gl.TRIANGLE_FAN, 8 + i * 4, 4);
    }

    /* Cars */
    gl.bindBuffer( gl.ARRAY_BUFFER, carsBuffer );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    gl.uniform4fv(colorLoc, [1.0, 0.0, 0.0, 1.0]);

    for (let i = 0; i < cars.length; i++) {
        // Randomize speed
        var rnd = Math.random() * (0.03 - 0.0005) + 0.0005;
        for (let j = 0; j < cars[i].length; j++) {
            cars[i][j][0] += rnd;

            // Check if the car has reached the end of the screen, if so reset position
            var rand = Math.random();
            if (cars[i][j][0] >= 1.0) {
                // Set interval until respawn
                cars[i][0][0] = -1.0 - rand; // reset to starting position
                cars[i][1][0] = -1.0 - rand;
                cars[i][2][0] = -0.75 - rand;
                cars[i][3][0] = -0.75 - rand;
            }
        }
    }

    gl.bufferData( gl.ARRAY_BUFFER, flatten(carPoints), gl.STATIC_DRAW );

    // Draw the cars
    for (let i = 0; i < cars.length; i++) {
        gl.uniform4fv(colorLoc, cars[i].color);
        gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4);
    }

    /* The frog */
    gl.bindBuffer( gl.ARRAY_BUFFER, frogBuffer );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    gl.uniform4fv(colorLoc, [0.0, 1.0, 0.0, 1.0]); // Green color for frog
    gl.drawArrays(gl.TRIANGLES, 0, 3 );

    // Collision test
    for (let i = 0; i < cars.length; i++) {
        for (let j = 0; j < cars[i].length; j++) {
            var frogX = frog[0][0];
            var frogY = frog[0][1];
            var carX = cars[i][j][0];
            var carY = cars[i][j][1];
            var dist = Math.sqrt(Math.pow(frogX - carX, 2) + Math.pow(frogY - carY, 2));

            // Reset frog position to start if hit by car
            if (dist < 0.1) {
                if (returning) {
                    setFrogPosition(0, (11/14), -(1/14), (12/14), (1/14), (12/14));
                } else {
                    setFrogPosition(0, -(12/14), (1/14), -(13/14), -(1/14), -(13/14));
                }

                // Update the frog
                gl.bufferData( gl.ARRAY_BUFFER, flatten(frog), gl.STATIC_DRAW );
            }
        }
    }
    
    // Check if frog has crossed the roads
    if (frog[0][1] >= (12/14) || (frog[0][1] <= -(12/14) && returning)) {
        if (returning) {
            setFrogPosition(0, -(12/14), (1/14), -(13/14), -(1/14), -(13/14));
        } else {
            setFrogPosition(0, (11/14), -(1/14), (12/14), (1/14), (12/14));
        }
        returning = !returning;
        score += 1;

        gl.bufferData( gl.ARRAY_BUFFER, flatten(frog), gl.STATIC_DRAW );
    }
    
    // Update score text
    document.getElementById("score").innerHTML = "Score: " + score;
    window.requestAnimFrame(() => 
        render (
            frogBuffer, 
            sidewalkBuffer,
            carsBuffer,
            vPosition
        )
    );
}