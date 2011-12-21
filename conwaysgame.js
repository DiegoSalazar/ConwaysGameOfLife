// http://en.wikipedia.org/wiki/Conway's_Game_of_Life

$.cookie = function() {
  function get(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    
    for (var i=0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  }
  
  function set(name,value,days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    } else {var expires = "";}
    
    document.cookie = name+"="+value+expires+"; path=/";
  }
  
  function xdelete(name) {
    set(name, null, -1);
  }
  
  if (arguments.length == 1) {
    return get(arguments[0]);
    
  } else if (arguments[1] == null) {
    xdelete(arguments[0]);
    
  } else {
    set(arguments[0], arguments[1], arguments[2]);
  }
}  

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
// http://en.wikipedia.org/wiki/Conway's_Game_of_Life
Automaton.seeds = {
  'gosper' : [[2,6],[2,7],[3,6],[3,7],[12,6],[12,7],[12,8],[13,5],[13,9],[14,4],[14,10],[15,4],[15,10],
              [16,7],[17,5],[17,9],[18,6],[18,7],[18,8],[19,7],[22,4],[22,5],[22,6],[23,4],[23,5],[23,6],[24,3],[24,7],
              [26,2],[26,3],[26,7],[26,8],[36,4],[36,5],[37,4],[37,5]], // thanks 535480/james from stackoverflow
  'sword' : [[26,10], [26,11], [26,12], [26,13], [26,14], [26,15], [26,16], [26,18], [26,19], [26,20],
             [26,23], [26,24], [26,25], [26,30], [26,31], [26,32], [26,33], [26,34], [26,35]],
  'spaceship' : [],
  'toad' : [],
  'beacon' : [],
  'pulsar' : [],
  'lwss' : [],
  'diehard' : [],
  'acorn' : []
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

// return a seed array
Automaton.prototype.getSeed = function() {
  var seed = [];
  this.traverseGrid(function(cell, x, y) {
    if (cell.alive) seed.push([x, y]);
  });
  return seed;
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

function Storage(name) {
  this.name = name;
  this.container = function() {
    var storageType = 'cookieStore',
        types = { 'cookieStore': $.cookie };
    
    return types[storageType];
  }
  return this;
}

Storage.prototype.save = function(name, data) {
  c_log(name, data);
  this.container(name, data);
  return true;
}

Storage.prototype.read = function(name) {
  c_log('read', name);
  this.container(name);
  return true;
}

function Inputs() {
  this.names = ['fps', 'w', 'h', 'maxClumps', 'clumpSize'];
}

Inputs.prototype.state = function() {
  var iS = {}
  for (var i = 0, len = Inputs.length; i < len; i++) {
    var name = Inputs[i];
    if ($('#'+ name).val) 
      iS[name] = parseInt($('#'+ name).val()); 
  }
  return iS;
}

Inputs.prototype.read = function() {
  fps = parseInt($('#fps').val());
  w = parseInt($('#w').val());
  h = parseInt($('#h').val());
  seed = $('#preSeed').val();
  maxClumps = parseInt($('#maxClumps').val());
  clumpSize = parseInt($('#clumpSize').val());
}

Inputs.prototype.get = function(name) {
  return $('#'+ name).val();
}

function Anim(inputs, automaton) {
  this.interval = 0;
  this.inputs = inputs;
  this.automaton = automaton;
  this.liveCellCounter = $('#liveCellCount');
}

Anim.prototype.start = function() {
  var self = this;
  this.interval = setInterval(function() {
    self.automaton.update().draw();
    self.liveCellCounter.text(self.automaton.liveCellCount());
  }, 1000/self.inputs.get('fps'));
},

Anim.prototype.stop = function() {
  clearInterval(this.interval);
  this.interval = 0;
}

$(function() {
  var inputs    = new Inputs(),
      w         = inputs.get('w') || 40,
      h         = inputs.get('h') || 30,
      canvas_id = inputs.get('canvas_id') || 'grid',
      maxClumps = inputs.get('maxClumps') || 30,
      clumpSize = inputs.get('clumpSize') || 40,
      fps       = inputs.get('fps') || 10,
      seed      = Automaton.seeds[inputs.get('preSeed')],
      storage   = new Storage('conways'),
      automaton = new Automaton(canvas_id, inputs.get('w'), inputs.get('h'), seed),
      anim      = new Anim(inputs, automaton);
      
  $('#start').click(function() { anim.start(); });
  $('#stop').click(function() { anim.stop(); });
  
  $('#reset').click(function() {
    anim.stop();
    anim.automaton = new Automaton(canvas_id, inputs.get('w'), inputs.get('h'), seed).draw();
    anim.liveCellCounter.text(anim.automaton.liveCellCount());
  });
  
  $('#update').submit(function() {
    inputs.read();
    anim.automaton = new Automaton(canvas_id, inputs.get('w'), inputs.get('h'), seed).draw();
    anim.liveCellCounter.text(anim.automaton.liveCellCount());
    return false;
  });
  
  $('#clear').click(function() {
    anim.stop();
    inputs.read();
    anim.automaton = new Automaton(canvas_id, inputs.get('w'), inputs.get('h')).draw();
    anim.liveCellCounter.text(anim.automaton.liveCellCount());
  });
  
  // randomly seed the grid
  $('#random').click(function() {
    anim.stop();
    inputs.read();
    anim.automaton = new Automaton(canvas_id, inputs.get('w'), inputs.get('h'))
                              .randomSeed(inputs.get('maxClumps'), inputs.get('clumpSize'))
                              .draw();
    anim.liveCellCounter.text(anim.automaton.liveCellCount());
  });
  
  $('#save').click(function() {
    anim.stop();
    inputs.read();
    storage.save('getSeed', anim.automaton.getSeed());
    storage.save('inputState', inputs.state());
  });
  
  $('#preSeed').change(function() {
    anim.stop();
    storage.save('preSeed', Automaton.seeds[$('#preSeed').val()]);
    seed = Automaton.seeds[inputs.get('preSeed')];
    anim.automaton = new Automaton(canvas_id, inputs.get('w'), inputs.get('h'), seed).draw();
  });
  
  // toggle individual cells
  $('#grid').click(function(e) {
    var canvas = $(this),
        x = Math.floor((e.pageX - canvas.offset().left) / anim.automaton.unit);
        y = Math.floor((e.pageY - canvas.offset().top) / anim.automaton.unit);
        cell = automaton.getCell(x, y);
    
    cell.alive = !cell.alive;
    anim.automaton.draw();
    anim.liveCellCounter.text(anim.automaton.liveCellCount());
    
    if (cell.alive) c_log(x, y);
  });
  
  
  inputs.read();
});

function c_log() {
  if (console.log) console.log(arguments);
}

function rand(num) {
  return Math.floor(Math.random(num) * num);
}