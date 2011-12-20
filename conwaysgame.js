// http://en.wikipedia.org/wiki/Conway's_Game_of_Life

// represents the grid, manages time ticks and draws updates
function Automaton(canvas_id, w, h, seed, color) {   
  this.w = w;
  this.h = h;
  this.unit = 10;
  this.seed = seed || false,
  this.grid = [],
  this.strokeColor = color || 'black',
  this.canvas = $('#'+ canvas_id).attr({ width: w*10 +'px', height: h*10 +'px' })[0];
  
  if (this.canvas.getContext) this.ctx = this.canvas.getContext('2d');
  else return alert('OMG This browser like totally doesn\'t support Canvas. You should like upgrade and stuff.');
  
  for (var x = 0; x < this.w; x++) {
    var bx = x == 0 ? x : x * this.unit;
    this.grid[x] = [];
    
    for (y = 0; y < this.h; y++) {
      var by = y == 0 ? y : y * this.unit,
          cell = new Cell(x, y, Cell.shouldLive(x, y, this.seed), this);
          
      this.grid[x][y] = cell;
      if (cell.alive) {
        this.ctx.fillStyle = cell.lifeColor();
        this.ctx.fillRect(bx, by, this.unit, this.unit);
      }
    }
  }
}

// helps us find a cell's neighbors
Automaton.stepDirs = ['aboveLeft', 'above', 'aboveRight', 'right', 'belowRight', 'below', 'belowLeft', 'left'];
Automaton.adjust = {
  'aboveLeft':  { x: -1, y: -1 },
  'above':      { x:  0, y: -1 },    
  'aboveRight': { x:  1, y: -1 },
  'right':      { x:  1, y:  0 },
  'belowRight': { x:  1, y:  1 },    
  'below':      { x:  0, y:  1 },
  'belowLeft':  { x: -1, y:  1 },
  'left':       { x: -1, y:  0 }
}

Automaton.prototype.getCellAdjacentTo = function(cell, where) {
  var x = cell.x + Automaton.adjust[where]['x'],
      y = cell.y + Automaton.adjust[where]['y'];
  return this.grid[x][y];
}

Automaton.prototype.update = function() {
  for (var x = 0; x < this.w; x++) {
    for (var y = 0; y < this.h; y++) {
      this.grid[x][y].killYourselfMaybe();
    }
  }
}

Automaton.prototype.draw = function() {
  for (var x = 0; x < this.w; x++) {
    var bx = x == 0 ? x : x * this.unit;
    
    for (var y = 0; y < this.h; y++) {
      var by = y == 0 ? y : y * this.unit;
          cell = this.grid[x][y];
      
      if (cell.alive) {
        this.ctx.fillStyle = cell.lifeColor();
        this.ctx.fillRect(bx, by, this.unit, this.unit);
      } else {
        this.ctx.clearRect(bx, by, this.unit, this.unit);
      }
    }
  }
}

// fidn a cell by the collision of a click with a cell on the coordinate space
Automaton.prototype.findCell = function(x, y) {
  return this.grid[x][y];
  
  for (var x = 0; x < this.w; x++) {
    for (var y = 0; y < this.h; y++) {
      if (cx+1 >= x && cx <= x + this.unit && cy+1 >= y && cy <= y + this.unit)
        return this.grid[x][y];
    }
  }
}

function Cell(x, y, alive, automaton) {
  this.x = x;
  this.y = y;
  this.alive = alive;
  this.automaton = automaton;
}

Cell.shouldLive = function(x, y, seed, automaton) {
  for (var i = 0, len = seed.length; i < len; i++) {
    if (typeof(seed[i]) == 'object' && x == seed[i][0] && y == seed[i][1])
      return true;
  }
  return false;
}

// this is where the magic happens
Cell.prototype.killYourselfMaybe = function(grid) {
  var num = this.numLiveNeighbors();
  
  if (this.alive) {
    // 1. Any live cell with fewer than two live neighbours dies, as if caused by under-population.
    if (num < 2) this.alive = false;
    // 2. Any live cell with two or three live neighbours lives on to the next generation.
    if (num == 2 || num == 3) {}
    // 3. Any live cell with more than three live neighbours dies, as if by overcrowding.
    if (num > 3) this.alive = false;
  } else {
    // 4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
    this.alive = num == 3 ? true : false;
  }
}

Cell.prototype.numLiveNeighbors = function() {
  var liveNeighborsCount = 0;
  
  for (var i = 0; i < 8; i++) {
    var targetX = this.x + Automaton.adjust[Automaton.stepDirs[i]]['x'],
        targetY = this.y + Automaton.adjust[Automaton.stepDirs[i]]['y'],
        neighbor = new Cell(0, 0, false); // default dead cell
    
    if (this.automaton.grid[targetX] && this.automaton.grid[targetX][targetY]) {
      neighbor = this.automaton.grid[targetX][targetY];
    }
    
    neighbor.alive ? liveNeighborsCount++ : null;
  }
  
  return liveNeighborsCount;
}

Cell.lifeColors = {
  0: '#ffffff', 1: '#999999', // starved dead
  2: '#000099',               // happy alive
  3: '#009900',               // sexy alive
  4: '#990000', 5: '#cccccc', // suffocated dead
  6: '#999900', 7: '#009999', // smooshed dead
  8: '#000000'                // fucking dead
}

Cell.prototype.lifeColor = function() {
  return Cell.lifeColors[this.numLiveNeighbors()];
}

$(function() {
  var w = 50,
      h = 50,
      fps = 20,
      seed = [[10, 8], [10, 9], [10, 10], [10, 11], [10, 12], [10, 13], [10, 14], [10, 15],   [11, 12], [12, 12], [13, 12]],
      interval = 0,
      automaton = new Automaton('grid', w, h, seed),
      anim_start = function() {
        interval = setInterval(function () {
          automaton.update();
          automaton.draw();
        }, 1000/fps);
      },
      anim_stop = function() {
        clearInterval(interval);
      };


  $('#start').click(anim_start);
  $('#stop').click(anim_stop);
  
  $('#reset').click(function() {
    anim_stop();
    automaton = new Automaton('grid', w, h, seed); 
    automaton.draw();
  });
  
  $('#update').submit(function() {
    fps = parseInt($('#fps').val());
    w = parseInt($('#w').val());
    h = parseInt($('#h').val());
    automaton = new Automaton('grid', w, h, seed);
    automaton.update();
    automaton.draw();
    return false;
  })
  
  $('#grid').click(function(e) {
    var canvas = $(this),
        x = Math.floor((e.pageX - canvas.offset().left) / automaton.unit);
        y = Math.floor((e.pageY - canvas.offset().top) / automaton.unit);
        cell = automaton.findCell(x, y);
    
    cell.alive = !cell.alive;
    automaton.draw();
    c_log(x, y);
  });
});

function c_log() {
  if (console && console.log) console.log(arguments); 
}