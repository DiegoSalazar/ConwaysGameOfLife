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
    this.grid[x][y] = new Cell(x, y, Cell.shouldLive(x, y, this.seed), this);    
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
    cell.flagYourselfForDeath();
    
  }).traverseGrid(function(cell, x, y) {
    if (cell.flaggedForDeath) {
      cell.alive = false;
      cell.flaggedForDeath = false;
    } else if (!cell.alive && cell.flaggedForRevive) {
      cell.alive = true;
      cell.flaggedForRevive = false;
    }
  });
  return this;
}

Automaton.prototype.draw = function() {
  this.traverseGrid(function(cell, x, y) {
    if (cell.alive) {
      this.ctx.fillStyle = cell.lifeColor();
      this.ctx.fillRect(x * this.unit, y * this.unit, this.unit, this.unit);
    } else {
      this.ctx.fillRect(x * this.unit, y * this.unit, this.unit, this.unit);
      this.ctx.clearRect(x * this.unit, y * this.unit, this.unit, this.unit);
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
  this.flaggedForDeath = false;
  this.flaggedForRevive = false;
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
Cell.prototype.flagYourselfForDeath = function(grid) {
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
    if (num == 3) this.flaggedForRevive = true;
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
  var w = 40,
      h = 30,
      fps = 10,
      // Gosper's Glider Gun
      seed = [[2,6],[2,7],[3,6],[3,7],[12,6],[12,7],[12,8],[13,5],[13,9],[14,4],[14,10],[15,4],[15,10],
      [16,7],[17,5],[17,9],[18,6],[18,7],[18,8],[19,7],[22,4],[22,5],[22,6],[23,4],[23,5],[23,6],[24,3],[24,7],
      [26,2],[26,3],[26,7],[26,8],[36,4],[36,5],[37,4],[37,5]],
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