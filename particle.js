function star(x, y, radius1, radius2, npoints) {
  var angle = TWO_PI / npoints;
  var halfAngle = angle / 2.0;
  beginShape();
  for (var a = 0; a < TWO_PI; a += angle) {
    var sx = x + cos(a) * radius2;
    var sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// Child class constructor
function Particle(position, drawStar) {
  VerletParticle2D.call(this, position);

  this.drawStar = drawStar

  // Override the display method
  this.display = function () {
    noStroke();
    fill(255, 255, 0);
    if (this.drawStar) {
      star(this.x, this.y, 3, 7, 5)
    }
  }
}

// Inherit from the parent class
Particle.prototype = Object.create(VerletParticle2D.prototype);
Particle.prototype.constructor = Particle;