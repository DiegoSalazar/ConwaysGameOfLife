// http://en.wikipedia.org/wiki/Conway's_Game_of_Life

// represents the grid, updates cells state and draws
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
  
  this.traverseGrid(function(cell, x, y) {
    var cell = new Cell(x, y, Cell.shouldLive(x, y, this.seed), this);    
    this.grid[x][y] = cell;
  }, function(x) {
    this.grid[x] = [];
  }).draw();
}

// helps us find a cell's neighbors
Automaton.wheres = ['aboveLeft', 'above', 'aboveRight', 'right', 'belowRight', 'below', 'belowLeft', 'left'];
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

Automaton.prototype.traverseGrid = function(yCallback, xCallback) {
  for (var x = 0; x < this.w; x++) {
    if (typeof xCallback == 'function') 
      xCallback.call(this, x);
    for (var y = 0; y < this.h; y++)
      yCallback.call(this, this.grid[x][y], x, y);
  }
  return this;
}

Automaton.prototype.getCellAdjacentTo = function(cell, where) {
  var x = cell.x + Automaton.adjust[where]['x'],
      y = cell.y + Automaton.adjust[where]['y'];
  return this.grid[x][y];
}

Automaton.prototype.update = function() {
  this.traverseGrid(function(cell, x, y) {
    cell.killYourselfMaybe();
  });
  return this;
}

Automaton.prototype.draw = function() {
  this.traverseGrid(function(cell, x, y) {
    if (cell.alive) {
      this.ctx.fillStyle = cell.lifeColor();
      this.ctx.fillRect(x * this.unit, y * this.unit, this.unit, this.unit);
    } else {
      this.ctx.clearRect(x * this.unit, y * this.unit, this.unit, this.unit);
      this.ctx.strokeStyle = this.strokeColor;
    }
  });
  return this;
}

// randomly seed clumps of cells
Automaton.prototype.randomSeed = function(maxClumps, maxClumpSize) {
  var numClumps = rand(maxClumps),
      cellCache = [],
      clumpsize;
  
  // create the clumps
  for (var i = 0; i < numClumps; i++) {
    var clumpSize = rand(maxClumpSize),
        randX = Math.floor(rand(this.w) / rand(4)),
        randY = Math.floor(rand(this.h) / rand(4)),
        cell = new Cell(randX, randY, true, this);
    
    for (var j = 0; j < clumpSize; j++) {
      cellCache.push(cell);
      
      var randWhere = Automaton.wheres[rand(Automaton.wheres.length-1)]
          newX = cell.x + Automaton.adjust[randWhere]['x'],
          newY = cell.y + Automaton.adjust[randWhere]['y'];
          newCell = new Cell(newX, newY, true, this);
      
      cell = newCell;
    }
  }
  
  // add the to the grid
  return this.traverseGrid(function(cell, x, y) {
    for (var i = 0, len = cellCache.length; i < len; i++) {
      var cell = cellCache[i];
      if (x == cell.x && y == cell.y) this.grid[x][y] = cell;
    }
  });
}

Automaton.prototype.liveCellCount = function() {
  var liveCellCount = 0;
  this.traverseGrid(function(cell, x, y) {
    if (cell.alive) liveCellCount++;
  });
  return liveCellCount;
}

// fidn a cell by the collision of a click with a cell on the coordinate space
Automaton.prototype.getCell = function(x, y) {
  return this.grid[x][y];
}

function Cell(x, y, alive, automaton) {
  this.x = x;
  this.y = y;
  this.alive = alive;
  this.automaton = automaton;
}

Cell.shouldLive = function(x, y, seed) {
  if (!seed) return false;
  
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
    //else if (num == 2 || num == 3) {}
    // 3. Any live cell with more than three live neighbours dies, as if by overcrowding.
    else if (num > 3) this.alive = false;
  } else {
    // 4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
    if (num == 3) this.alive = true;
  }
}

Cell.prototype.numLiveNeighbors = function() {
  var liveNeighborsCount = 0;
  
  for (var i = 0; i < 8; i++) {
    var targetX = this.x + Automaton.adjust[Automaton.wheres[i]]['x'],
        targetY = this.y + Automaton.adjust[Automaton.wheres[i]]['y'],
        neighbor = new Cell(0, 0, false); // default dead cell
    
    if (this.automaton.grid[targetX] && this.automaton.grid[targetX][targetY]) {
      neighbor = this.automaton.grid[targetX][targetY];
    }
    
    if (neighbor.alive) liveNeighborsCount++;
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
  var w = 35,
      h = 30,
      fps = 60,
      seed = [[0, 4], [0,5], [1,4], [1,5],
      [13,2], [12,2],  [11,3],  [10,4], [10,5], [10,6],  [11,7], [12, 8], [13,8],
      [14,5],  [15,3],  [16,4], [16,5], [16,6],  [15,7],  [17, 5],
      [34,2], [33,2], [33,3], [34,3],
      [21, 4], [22, 4], [21, 3], [22, 3], [22, 2], [21, 2],
      [23, 1],[23, 5],[25, 1],[25, 0],[25, 5],[25, 6]],//[[10, 8], [10, 9], [10, 10], [10, 11], [10, 12], [10, 13], [10, 14], [10, 15],   [11, 12], [12, 12], [13, 12]],
      interval = 0,
      canvas_id = 'grid',
      maxClumps = 30,
      clumpSize = 40,
      liveCellCounter = $('#liveCellCount'),
      automaton = new Automaton(canvas_id, w, h, seed),
      animStart = function() {
        readInputs();
        
        interval = setInterval(function() {
          automaton.update().draw();
          liveCellCounter.text(automaton.liveCellCount());
        }, 1000/fps);
      },
      animStop = function() {
        clearInterval(interval);
        interval = 0;
      };


  $('#start').click(animStart);
  $('#stop').click(animStop);
  
  $('#reset').click(function() {
    animStop();
    automaton = new Automaton(canvas_id, w, h, seed).draw();
    liveCellCounter.text(automaton.liveCellCount());
  });
  
  $('#update').submit(function() {
    readInputs();
    automaton = new Automaton(canvas_id, w, h, seed).draw();
    liveCellCounter.text(automaton.liveCellCount());
    return false;
  });
  
  $('#clear').click(function() {
    animStop();
    readInputs();
    automaton = new Automaton(canvas_id, w, h).draw();
    liveCellCounter.text(automaton.liveCellCount());
  });
  
  // randomly seed the grid
  $('#random').click(function() {
    animStop();
    readInputs();
    automaton = new Automaton(canvas_id, w, h).randomSeed(maxClumps, clumpSize).draw();
    liveCellCounter.text(automaton.liveCellCount());
  });
  
  // toggle individual cells
  $('#grid').click(function(e) {
    var canvas = $(this),
        x = Math.floor((e.pageX - canvas.offset().left) / automaton.unit);
        y = Math.floor((e.pageY - canvas.offset().top) / automaton.unit);
        cell = automaton.getCell(x, y);
    
    cell.alive = !cell.alive;
    automaton.draw();
    liveCellCounter.text(automaton.liveCellCount());
    
    if (cell.alive) c_log(x, y);
  });
  
  function readInputs() {
    fps = parseInt($('#fps').val());
    w = parseInt($('#w').val());
    h = parseInt($('#h').val());
    maxClumps = parseInt($('#maxClumps').val());
    clumpSize = parseInt($('#clumpSize').val());
  }
  readInputs();
});

function c_log() {
  if (console && console.log) console.log(arguments);
}

function rand(num) {
  return Math.floor(Math.random(num) * num);
}