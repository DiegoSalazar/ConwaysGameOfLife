function Cell(x, y, alive, automaton) {
  this.x = x;
  this.y = y;
  this.alive = alive;
  this.automaton = automaton;
  this.flaggedForDeath = false;
  this.flaggedForRevive = false;
  this.age = 0;
}
// arrays of rgb values [r, g, b]
Cell.lifeColors = {
  0: [200, 200, 255], 1: [200, 200, 200], // starved dead
  2: [0,     0, 200],                     // happy alive
  3: [0,   200,   0],                     // sexy alive
  4: [200,   0,   0], 5: [180, 180, 180], // suffocated dead
  6: [200, 200,   0], 7: [0,   200, 200], // smooshed dead
  8: [0,     0,   0]                      // fucking dead
}

Cell.prototype = {
  // this is where the magic happens
  flagYourselfForDeathMaybe: function(grid) {
    var num = this.numLiveNeighbors();

    if (this.alive) {
      // 1. Any live cell with fewer than two live neighbours dies, as if caused by under-population.
      if (num < 2) this.flaggedForDeath = true;
      // 2. Any live cell with two or three live neighbours lives on to the next generation.
      // so we do nothing here.
      // 3. Any live cell with more than three live neighbours dies, as if by overcrowding.
      else if (num > 3) this.flaggedForDeath = true;
    } else {
      // 4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
      var r = 3;
      //if (cell.age) r = rand(3) < 3 ? 3 : 2;
      if (num == r) this.flaggedForRevive = true;
    }
  },
  update: function() {
    if (this.alive) this.age++;
    return this;
  },
  numLiveNeighbors: function() {
    var liveNeighborsCount = 0;

    for (var i = 0; i < 8; i++) {
      var targetX = this.x + Automaton.adjust[Automaton.wheres[i]]['x'],
          targetY = this.y + Automaton.adjust[Automaton.wheres[i]]['y'],
          alive = false;
          
      // closed universe
      if (targetX > this.automaton.w) targetX = 0;
      if (targetX < 0) targetX = this.automaton.w;
      if (targetY > this.automaton.h) targetY = 0;
      if (targetY < 0) targetY = this.automaton.h;

      if (this.automaton.grid[targetX][targetY])
        alive = this.automaton.grid[targetX][targetY].alive;
        
      if (alive) liveNeighborsCount++;
    }

    return liveNeighborsCount;
  },
  notIn: function(array) {
    for (var i = 0, len = array.length; i < len; i++) {
      var cell = array[i];
      if (this.x == cell.x && this.y == cell.y) return false;
    }
    return true;
  },
  lifeColor: function() { return Cell.lifeColors[this.numLiveNeighbors()]; },
  toggle:    function() { this.alive = !this.alive; return this; },
  revive:    function() { this.alive = true; return this; },
  kill:      function() { this.alive = false; this.age = 0; return this; }
}
