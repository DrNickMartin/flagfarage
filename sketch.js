var flag; //1200 800
var farage;
var socket;
var count;

var physics = new VerletPhysics2D();

var particles = [];
var springs = [];
var right = true;

var poleBase, poleVec, poleTop;
var locked = false;
var AR = 1200.0 / 800.0;
var s;
var resx = 41;
var resy = Math.floor(resx / AR);
var l, xoff, yoff, zoff, flagw, flagh;
let avenir;

function preload() {
    avenir = loadFont('Avenir.otf');
}

var starList = [
    [20, 5],
    [20 - 4, 7],
    [20 + 4, 7],
    [20 + 7, 10],
    [20 - 7, 10],
    [20 - 8, 13],
    [20 + 8, 13],
    [20 + 7, 16],
    [20 - 7, 16],
    [20 + 4, 19],
    [20 - 4, 19],
    [20, 21],
];

function setup() {
    // Setup canvas
    createCanvas(windowWidth, windowHeight, P2D);

    socket = io();
    s = width / 100;

    xoff = 0;
    zoff = 100;
    yoff = 10000;

    socket.on('set_count', function(new_count) {
        count = new_count;
    });

    //physics.addBehavior(new GravityBehavior(new Vec2D(0, 0.1)));

    // Load images
    farage = loadImage('farage.jpg');
    farage.resize(width, height);

    // Setup pole
    l = height * 0.85;
    poleBase = createVector(width * 0.25, height, 0);
    poleVec = createVector(0.0, -1.0);
    poleTop = createVector(poleBase.x + poleVec.x * l, poleBase.y + poleVec.y * l);

    flagw = s * resx;
    flagh = s * resy;

    resx = flagw / s;
    resy = flagh / s;

    for (let i = 0; i < resx; i++) {
        particles[i] = [];
        for (let j = 0; j < resy; j++) {
            var draw_star = false;
            starList.forEach(ele => {
                if (ele[0] == i && ele[1] == j) {
                    draw_star = true;
                }
            });
            var p = new Particle(new Vec2D(poleTop.x + i * s, poleTop.y + j * s), draw_star);
            if (i == 0) {
                p.lock();
            }
            particles[i][j] = p;
            physics.addParticle(p);
        }
    }

    for (var i = 0; i < resx; i++) {
        for (var j = 0; j < resy; j++) {

            var stiffness = 0.75;

            if (i > 0 && j == 0) {
                physics.addSpring(new VerletSpring2D(particles[i][j], particles[i - 1][j], s, stiffness * 2));
            }

            if (j > 0 && i > 0) {
                physics.addSpring(new VerletSpring2D(particles[i][j], particles[i][j - 1], s, stiffness * 2));
                physics.addSpring(new VerletSpring2D(particles[i][j], particles[i - 1][j], s, stiffness * 2));
            }
        }
    }
}

function draw() {

    background(farage);
    physics.update();

    strokeWeight(2);
    noStroke(20);
    fill(20);
    textSize(20);
    textFont(avenir);
    text(`Farage has been waved at ${count} times`, 10, 25);

    noStroke();
    fill(20, 20, 255);
    for (let j = 0; j < resy - 1; j++) {
        beginShape(TRIANGLE_STRIP);
        for (let i = 0; i < resx; i++) {
            var x1 = particles[i][j].x;
            var y1 = particles[i][j].y;
            var u = map(i, 0, resx - 1, 0, 1);
            var v1 = map(j, 0, resy - 1, 0, 1);
            vertex(x1, y1, u, v1);
            var x2 = particles[i][j + 1].x;
            var y2 = particles[i][j + 1].y;
            var v2 = map(j + 1, 0, resy - 1, 0, 1);
            vertex(x2, y2, u, v2);
        }
        endShape();
    }

    for (var i = 0; i < resx; i++) {
        for (var j = 0; j < resy; j++) {
            particles[i][j].display();
            var windx = map(noise(xoff, yoff, zoff), 0, 1, 2, 3);
            var windy = map(noise(xoff, yoff, zoff), 0, 0.1, 0, -0.1);
            var wind = new Vec2D(windx, windy);
            particles[i][j].addForce(wind);
            yoff += 0.1;
        }
        xoff += 0.1;
    }
    zoff += 0.1;

    if (xoff > 1000000) {
        xoff = 0;
    }
    if (yoff > 1000000) {
        yoff = 0;
    }
    if (zoff > 1000000) {
        zoff = 0;
    }

    strokeWeight(10);
    stroke(200);
    poleTop.x = poleBase.x + poleVec.x * l;
    poleTop.y = poleBase.y + poleVec.y * l;
    line(poleBase.x, poleBase.y, poleTop.x, poleTop.y);

}

function mouseDragged() {
    // Get vecotor
    var relX = mouseX - poleBase.x;

    if ((mouseX > poleBase.x) && !right ) {
        socket.emit('inc_count');
        console.log("waved");
    } else if ((mouseX < poleBase.x) && right ) {
        socket.emit('inc_count');
        console.log("waved");
    }

    var mousePos = createVector(mouseX, mouseY);
    poleVec = mousePos.sub(poleBase);
    poleVec.normalize();

    //Move flag pole points:
    for (let j = 0; j < resy; j++) {
        var lp = dist(poleBase.x, poleBase.y, particles[0][j].x, particles[0][j].y);

        particles[0][j].x = poleBase.x + poleVec.x * lp;
        particles[0][j].y = poleBase.y + poleVec.y * lp;
    }

    right = mouseX > poleBase.x;
}