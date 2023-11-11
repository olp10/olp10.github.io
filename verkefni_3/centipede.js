var canvas;
var gl;

// GRID CONSTANTS
var GRID_COLUMNS = 16;
var GRID_ROWS = 15;
var CELL_SIZE = 2;

// SCORE CONSTANTS
var SEGMENT_KILL_POINTS = 10;
var MUSHROOM_KILL_POINTS = 1;

// MUSHROOM CONSTANTS
var MUSHROOM_DEFAULT_SCALE = 0.5;
var MUSHROOM_MEDIUM_DAMAGE_SCALE = 0.4;
var MUSHROOM_LARGE_DAMAGE_SCALE = 0.3;

// COLORS
var WHITE = 0xffffff;
var RED = 0xff0000;
var GREEN = 0x00ff00;
var BLUE = 0x0000ff;
var CENTIPEDE_COLOR = 0xffff00;

// OTHER CONSTANTS
var SHOT_DELAY = 200;

// SCENE
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
var light;
var loader;

// Boolean for checking if centipede is moving to the right or left
var right = [false, false, false, false, false, false];

// OBJECTS
var gnome;
var centipede = [];
var mushrooms = [];
var bullets = [];
var leftWall;
var rightWall;

// VARYING
var fadingTextScoreMeshes = [];
var timeOfLastShot;
var start = true;
var playerScore = 0;

/**
 * Converts grid coordinates to world coordinates
 * @param {*} gridX 
 * @param {*} gridY 
 * @returns {{x: number, y: number}}
 */
function gridToWorld(gridX, gridY) {
    var worldX = (gridX - GRID_COLUMNS / 2) * CELL_SIZE + CELL_SIZE / 2;
    var worldY = (gridY - GRID_ROWS / 2) * CELL_SIZE + CELL_SIZE / 2;
    return {x: worldX, y: worldY};
}

/**
 * Converts world coordinates to grid coordinates
 * @param {*} worldX 
 * @param {*} worldY 
 * @returns {{x: number, y: number}}
 */
function worldToGrid(worldX, worldY) {
    var gridX = Math.floor(worldX / CELL_SIZE) + GRID_COLUMNS / 2;
    var gridY = Math.floor(worldY / CELL_SIZE) + GRID_ROWS / 2;
    return {x: gridX, y: gridY};
}

window.onload = function init()
{
    // 95% because needed to scroll around the page to see the whole thing
    renderer.setSize(window.innerWidth * 0.95, window.innerHeight * 0.95);
    renderer.setClearColor(WHITE, 0.2);
    document.body.appendChild( renderer.domElement );
    
    loader = new THREE.FontLoader();

    // Camera settings
    //camera.position.set(0, -GRID_ROWS - 10, 0);
    camera.position.set(0, -20, 30);
    camera.lookAt(scene.position);
    
    // Create mushrooms
    for (let i = 1; i < 14; i++) {
        var mushroom = createMushroom();
        mushrooms.push(mushroom);
        
        // Position the mushroom, one at each row i in the grid
        var position = gridToWorld((Math.floor(Math.random() * 100)) % 14, i);
        mushroom.position.set(position.x, position.y, -0.5);
        
        // scale mushroom down
        mushroom.scale.set(0.5, 0.5, 0.5);
        
        // Finally add mushroom to the scene
        scene.add(mushroom);
    }

    leftWall = createWallAtColumn(-0.4);
    rightWall = createWallAtColumn(GRID_COLUMNS-0.6);

    // Add environment to the scene
    createGround();
    createGroundBack();

    // Add the centipede and gnome to the scene
    createCentipede();
    createGnome();

    // Add event listener for arrow buttons
    window.addEventListener('keydown', function(event) {
        if ((event.key === 'w' ||event.key === 'ArrowUp') && gnome.position.y < -13) {
            let canMove = true;
            mushrooms.forEach(mushroom => {
                if (mushroom.position.x === gnome.position.x && mushroom.position.y - 1 - gnome.position.y === 1.0) {
                    canMove = false;
                }
            });
            if (canMove) gnome.position.y += 1;
        } else if ((event.key === 's' || event.key === 'ArrowDown') && gnome.position.y > -18) {
            let canMove = true;
            mushrooms.forEach(mushroom => {
                if (mushroom.position.x === gnome.position.x && gnome.position.y - mushroom.position.y - 1 === -1.0)
                    canMove = false;
            })
            if (canMove) gnome.position.y -= 1;
        } else if ((event.key === 'a' || event.key === 'ArrowLeft') && gnome.position.x > -16) {
            let canMove = true;
            mushrooms.forEach(mushroom => {
                if (mushroom.position.y - 1 === gnome.position.y && gnome.position.x - mushroom.position.x === 1.0)
                    canMove = false;
            })
            if (canMove) gnome.position.x -= 1;
        } else if ((event.key === 'd' || event.key === 'ArrowRight') && gnome.position.x < 16) {
            let canMove = true;
            mushrooms.forEach(mushroom => {
                if (mushroom.position.y - 1 === gnome.position.y && gnome.position.x - mushroom.position.x === -1.0)
                    canMove = false;
            })
            if (canMove) gnome.position.x += 1;
        } else if (event.key === ' ') {
            shoot();
        }
    });
    
    light = new THREE.DirectionalLight( WHITE, 3, 100);
    light.position.set( 10, -10, 5 );
    scene.add( light );
}

function createGround() {
    var groundSizeX = GRID_COLUMNS * CELL_SIZE;
    var groundSizeY = GRID_ROWS * CELL_SIZE;

    var groundGeometry = new THREE.PlaneGeometry(groundSizeX, groundSizeY);
    var groundMaterial = new THREE.MeshPhongMaterial({ color: 0x222222, side: THREE.DoubleSide });

    var ground = new THREE.Mesh(groundGeometry, groundMaterial);

    ground.rotation.x = -Math.PI;
    ground.position.y = 0;
    ground.position.z = -0.5;

    scene.add(ground);
}

function createGroundBack() {
    var groundSizeX = GRID_COLUMNS * CELL_SIZE;
    var groundSizeY = CELL_SIZE;

    var groundGeometry = new THREE.PlaneGeometry(groundSizeX, groundSizeY);
    var groundMaterial = new THREE.MeshPhongMaterial({ color: RED, side: THREE.DoubleSide });

    var ground = new THREE.Mesh(groundGeometry, groundMaterial);

    ground.position.y = -GRID_ROWS-1;
    ground.position.z = 0;

    scene.add(ground);
}

/**
 * Creates the centipede composed of 6 centipede segments
 */
function createCentipede() {
    var segmentGeometry = new THREE.SphereGeometry();
    var segmentMaterial = new THREE.MeshPhongMaterial( { color: CENTIPEDE_COLOR } );

    // Create 6 centipede segments
    for (let i = 0; i < 6; i++) {
        var segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        centipede.push(segment);

        // Make "body" smaller and "head" bigger
        if (i !== 0) segment.scale.set(0.5, 0.5, 0.5);
        else segment.scale.set(0.6, 0.6, 0.6);

        segment.position.set(0 + i, GRID_ROWS - 1, 0);
        scene.add(segment);
    }
    start = false;
}

function createWallAtColumn(column) {
    var wallGeometry = new THREE.BoxGeometry(0.4, GRID_ROWS * CELL_SIZE, 0.1);
    var wallMaterial = new THREE.MeshPhongMaterial({ color: RED, transparent: false, opacity: 0 });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);

    var position = gridToWorld(column, GRID_ROWS / 2);
    wall.position.set(position.x, 0, -0.05);
    scene.add(wall);

    return wall;
}

function addScore(score, item) {
    loader.load( 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_regular.typeface.json', function ( font ) {
        var txt = new THREE.TextGeometry(`+${score}`, {
            font: font,
            size: 0.5,
            height: 0.5
        });
    
        // Create a material and mesh for the text
        var txtMaterial = new THREE.MeshPhongMaterial({ color: 0xffff4d });
        var txtMesh = new THREE.Mesh(txt, txtMaterial);
        
        // Position the text above the mushroom
        txtMesh.position.set(item.position.x - 1, item.position.y + 1, item.position.z);

        if (item.position.y > 0)
            txtMesh.rotation.x = Math.PI / 2;
        txtMesh.scale.set(1.0, 1.0, 0.1);
        scene.add(txtMesh);

        fadingTextScoreMeshes.push({mesh: txtMesh, startTime: Date.now() });
    });

    playerScore += score;
}

function createGnome() {
    // Create gnome object
    var gnomeGeometry = new THREE.BoxGeometry();
    var gnomeMaterial = new THREE.MeshPhongMaterial( { color: GREEN } );
    var gnomeBody = new THREE.Mesh(gnomeGeometry, gnomeMaterial);
    gnomeBody.position.y = 1.5;

    // Hat
    var gnomeHatGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.3);
    var gnomeHatMaterial = new THREE.MeshPhongMaterial( { color: WHITE } );
    var gnomeHat = new THREE.Mesh(gnomeHatGeometry, gnomeHatMaterial);
    gnomeHat.position.y = 2.3;

    // Belly
    var gnomeBellyGeometry = new THREE.SphereGeometry(0.7, 6, 10);
    var gnomeBellyMaterial = new THREE.MeshPhongMaterial( { color: GREEN } );
    var gnomeBelly = new THREE.Mesh(gnomeBellyGeometry, gnomeBellyMaterial);
    gnomeBelly.position.y = 1.5;
    gnomeBelly.position.z = 0.0;
    gnomeBelly.scale.set(1.5, 0.7, 1);

    // Left Eye
    var gnomeLeftEyeGeometry = new THREE.SphereGeometry(0.15, 6, 10);
    var gnomeLeftEyeMaterial = new THREE.MeshPhongMaterial( { color: WHITE } );
    var gnomeLeftEye = new THREE.Mesh(gnomeLeftEyeGeometry, gnomeLeftEyeMaterial);
    gnomeLeftEye.position.x = -0.4;
    gnomeLeftEye.position.y = 1.5;
    gnomeLeftEye.position.z = 0.5;

    // Right Eye
    var gnomeRightEyeGeometry = new THREE.SphereGeometry(0.15, 6, 10);
    var gnomeRightEyeMaterial = new THREE.MeshPhongMaterial( { color: WHITE } );
    var gnomeRightEye = new THREE.Mesh(gnomeRightEyeGeometry, gnomeRightEyeMaterial);
    gnomeRightEye.position.x = 0.4;
    gnomeRightEye.position.y = 1.5;
    gnomeRightEye.position.z = 0.5;

    // Create the group of objects making the gnome
    gnome = new THREE.Group();

    // Add all objects to the group
    gnome.add(gnomeHat);
    gnome.add(gnomeBelly);
    gnome.add(gnomeBody);
    gnome.add(gnomeLeftEye);
    gnome.add(gnomeRightEye);

    // Configure gnome position/scale, and add to scene
    var gnomeGridPosition = { x: 7.5, y: 0 };
    var gnomeWorldPosition = gridToWorld(gnomeGridPosition.x, gnomeGridPosition.y);
    gnome.position.set(gnomeWorldPosition.x, gnomeWorldPosition.y, 0);
    gnome.scale.set(0.4, 0.5, 0.5);
    scene.add(gnome);
}

/**
 * Creates a mushroom object with stem and cap
 * @returns {THREE.Group}
 */
function createMushroom() {
    var stemMaterial = new THREE.MeshPhongMaterial( { color: WHITE } );
    var capMaterial = new THREE.MeshPhongMaterial( { color: 0xe60000 } );

    var stemGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = -1;

    var capGeometry = new THREE.CylinderGeometry(1, 0.5, 1, 10);
    var cap = new THREE.Mesh(capGeometry, capMaterial);

    cap.rotation.x = Math.PI / 2;
    cap.rotation.z = Math.PI;

    cap.position.y = -1;
    cap.position.z = 1;

    var mushroom = new THREE.Group();
    mushroom.health = 3;

    mushroom.add(stem);
    mushroom.add(cap);

    mushroom.rotation.x = -Math.PI / 6;

    return mushroom;
}

/**
 * 
 * @param {*} segment 
 * @param {*} mushroom 
 * @returns 
 */
function isColliding(thisItem, thatItem) {
    var dx = thisItem.position.x - thatItem.position.x;
    var dy = thisItem.position.y - thatItem.position.y;
    var dz = thisItem.position.z - thatItem.position.z;

    var distanceSquared = dx * dx + dy * dy + dz * dz;
    var radiiSum = (CELL_SIZE / 2) * (CELL_SIZE / 2);

    return distanceSquared <= radiiSum;
}


function shoot() {
    var bulletGeometry = new THREE.BoxGeometry(0.1, 0.9, 0.05);
    var bulletMaterial = new THREE.MeshPhongMaterial({ color: BLUE });

    // Delay between shots
    if (timeOfLastShot && Date.now() - timeOfLastShot < SHOT_DELAY) return;

    var bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    bullet.position.copy(gnome.position);
    //bullet.position.z += 0.5;
    bullet.velocity = new THREE.Vector3(0, 1, 0);

    scene.add(bullet);
    bullets.push(bullet);

    timeOfLastShot = Date.now();
}

function animate() {
    requestAnimationFrame( animate );
    bullets.forEach((bullet, index) => {
        bullet.position.add(bullet.velocity);

        // Remove the bullet if it goes off the screen
        if (bullet.position.y > 30 || bullet.position.y < -30) {
            scene.remove(bullet);
            bullet.geometry.dispose();
            bullet.material.dispose();
            bullets.splice(index, 1);
        }

        centipede.forEach((segment, segIndex) => {
            if (isColliding(bullet, segment)) {
                // Remove bullet
                scene.remove(bullet);
                bullet.geometry.dispose();
                bullet.material.dispose();
                bullets.splice(index, 1);

                if (segIndex > 0 && segIndex < centipede.length - 1) {
                    let newPart = centipede.splice(segIndex + 1);
                    right.splice(segIndex + 1);
                    right[segIndex] = !right[segIndex];
                    newPart.forEach((_, newPartIndex) => {
                        right.push(!right[segIndex]);
                    });
                }
                
                // Remove segment
                scene.remove(segment);
                segment.geometry.dispose();
                segment.material.dispose();
                centipede.splice(segIndex, 1);
                right.splice(segIndex, 1);

                // Add a mushroom at the location where a segment was destroyed
                var mushroom = createMushroom();
                mushroom.position.copy(segment.position);
                mushrooms.push(mushroom);
                scene.add(mushroom);

                // Points for destroying a segment
                addScore(SEGMENT_KILL_POINTS, segment);
            }
        });

        mushrooms.forEach((mushroom, mushroomIndex) => {
            if (isColliding(bullet, mushroom)) {
                // Decrease the health of the mushroom
                mushroom.health--;
                
                // Check if the mushroom is dead
                if (mushroom.health === 0) {

                    addScore(MUSHROOM_KILL_POINTS, mushroom);

                    scene.remove(mushroom);
                    mushroom.children.forEach((child) => {
                        child.geometry.dispose();
                        child.material.dispose();
                    });

                    // Remove the mushroom
                    mushrooms[mushroomIndex]._toBeRemoved = true;
                }
                switch (mushroom.health) {
                    case 2:
                        mushroom.scale.set(MUSHROOM_MEDIUM_DAMAGE_SCALE, MUSHROOM_MEDIUM_DAMAGE_SCALE, MUSHROOM_MEDIUM_DAMAGE_SCALE);
                        break;
                    case 1:
                        mushroom.scale.set(MUSHROOM_LARGE_DAMAGE_SCALE, MUSHROOM_LARGE_DAMAGE_SCALE, MUSHROOM_LARGE_DAMAGE_SCALE);
                        break;
                    default:
                        mushroom.scale.set(MUSHROOM_DEFAULT_SCALE, MUSHROOM_DEFAULT_SCALE, MUSHROOM_DEFAULT_SCALE);
                }
                scene.remove(bullet);
                bullet.children.forEach((child) => {
                    child.geometry.dispose();
                    child.material.dispose();
                });
                bullets[index]._toBeRemoved = true;
            }
        });
        bullets = bullets.filter((bullet) => !bullet._toBeRemoved);
        mushrooms = mushrooms.filter((mushroom) => !mushroom._toBeRemoved);
    });
    
    centipede.forEach((segment, i) => {
        mushrooms.forEach((mushroom) => {
            if (isColliding(segment, mushroom)) {
                right[i] = !right[i];
                segment.position.y -= 2.0;
            }
        });

        if (isColliding(segment, gnome)) {
             alert("GAME OVER");
        }

        if (segment.position.x - CELL_SIZE / 2 <= leftWall.position.x 
            || segment.position.x + CELL_SIZE / 2 >= rightWall.position.x) {
            right[i] = !right[i]; // Change direction
            segment.position.y -= 2.0; // Move down a row
        }

        if (segment.position.y < -19) {
            // Delete the segment
            scene.remove(segment);
            segment.geometry.dispose();
            segment.material.dispose();
            centipede.splice(i, 1);
            right.splice(i, 1);
        }

        right[i] ? segment.position.x += (0.2) : segment.position.x -= (0.2);
    });

    fadingTextScoreMeshes.forEach((textObj, index) => {
        var currentTime = Date.now();
        var elapsedTime = currentTime - textObj.startTime;
        var fadeDuration = 500; // Adjust the duration as needed (in milliseconds)

        // Calculate opacity based on elapsed time and fade duration
        var opacity = 1 - Math.min(1, elapsedTime / fadeDuration);

        // Update the text mesh's opacity
        textObj.mesh.material.opacity = opacity;

        if (opacity <= 0) {
            // Remove the text mesh from the scene
            scene.remove(textObj.mesh);

            // Dispose of its geometry and material
            textObj.mesh.geometry.dispose();
            textObj.mesh.material.dispose();

            // Remove it from the fadingTextMeshes array
            fadingTextScoreMeshes.splice(index, 1);
        }
    });

    if (centipede.length === 0 && ! start) {
        createCentipede();
        right = [false, false, false, false, false, false];
    }
    renderer.render(scene, camera);
}
animate();
