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
function Automaton(canvas_id, w, h, unit, seed, color) {   
  this.w = w;
  this.h = h;
  this.unit = unit || 10;
  this.seed = Automaton.seeds[seed];
  this.grid = [];
  this.strokeColor = color || 'black';
  this.canvas = $('#'+ canvas_id).attr({ width: w * this.unit +'px', height: h * this.unit +'px' })[0];
  
  if (this.canvas.getContext) this.ctx = this.canvas.getContext('2d');
  else return alert('OMG This browser like totally doesn\'t support Canvas. You should like upgrade and stuff.');
  
  // build grid and add cells to the it
  this.traverseGrid(function(cell, x, y) {
    this.grid[x][y] = new Cell(x, y, this.dropSeed(x, y), this);    
  }, function(x) { // this callback runs first
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
  'acorn' : [],
  // custom seeds by diego!
  'rorschach': [[43, 49],[44, 49],[44, 48],[43, 48],[45, 47],[46, 48],[46, 49],[47, 49],[47, 48]]
}

Automaton.prototype = {
  dropSeed: function(x, y) {
    if (!this.seed) return false;
    for (var i = 0, len = this.seed.length; i < len; i++) {
      if (typeof(this.seed[i]) == 'object' && x == this.seed[i][0] && y == this.seed[i][1])
        return true;
    }
    return false;
  },
  traverseGrid: function(yCallback, xCallback) {
    for (var x = 0; x < this.w; x++) {
      if (typeof xCallback == 'function') 
        xCallback.call(this, x);
      for (var y = 0; y < this.h; y++)
        yCallback.call(this, this.grid[x][y], x, y);
    }
    return this;
  },
  getCellAdjacentTo: function(cell, where) {
    var x = cell.x + Automaton.adjust[where]['x'],
        y = cell.y + Automaton.adjust[where]['y'];
    return this.grid[x][y];
  },
  update: function() {
    this.traverseGrid(function(cell, x, y) {
      cell.flagYourselfForDeathMaybe();

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
  },
  draw: function() {
    this.traverseGrid(function(cell, x, y) {
      cell.draw();
    });
    return this;
  },
  // randomly seed clumps of cells
  randomSeed: function(maxClumps, maxClumpSize) {
    var numClumps = rand(maxClumps), cells = [];

    // create the clumps
    for (var i = 0; i < numClumps; i++) {
      var clumpSize = rand(maxClumpSize),
          randX = Math.floor(rand(this.w) / rand(4)),
          randY = Math.floor(rand(this.h) / rand(4)),
          cell = new Cell(randX, randY, true, this);

      // add cells to the clump
      for (var j = 0; j < clumpSize; j++) {
        cells.push(cell);
        var where = Automaton.wheres[rand(Automaton.wheres.length-1)]
            x = cell.x + Automaton.adjust[where]['x'],
            y = cell.y + Automaton.adjust[where]['y'];

        cell = new Cell(x, y, true, this);
      }
    }

    // add the cells to the grid and return *this*
    return this.traverseGrid(function(cell, x, y) {
      for (var i = 0, len = cells.length; i < len; i++) {
        var cell = cells[i];
        if (x == cell.x && y == cell.y) 
          this.grid[x][y] = cell;
      }
    });
  },
  liveCellCount: function() {
    var liveCellCount = 0;
    this.traverseGrid(function(cell, x, y) {
      if (cell.alive) liveCellCount++;
    });
    return liveCellCount;
  },
  // find a cell by the collision of a click with a cell on the coordinate space
  getCell: function(x, y) {
    return this.grid[x][y];
  },
  // return a seed array from the state of the grid
  getSeed: function() {
    var seed = [];
    this.traverseGrid(function(cell, x, y) {
      if (cell.alive) seed.push([x, y]);
    });
    return seed;
  },
  moveClump: function(direction) {
    var cells = [];
    
    this.traverseGrid(function(cell, x, y) {
      var newX = cell.x += Automaton.adjust[direction]['x'],
          newY = cell.y += Automaton.adjust[direction]['y'];
      
      this.grid[x][y] = null;
      
    }).traverseGrid(function(cell, x, y) {
      for (var i = 0, len = cells.length; i < len; i++) {
        var cell = cells[i]
        if (x == cell.x && y == cell.y)
          this.grid[x][y] = cell;
      }
    }).draw();
  }
}

function Cell(x, y, alive, automaton) {
  this.x = x;
  this.y = y;
  this.alive = alive;
  this.automaton = automaton;
  this.ctx = automaton.ctx;
  this.unit = automaton.unit;
  this.flaggedForDeath = false;
  this.flaggedForRevive = false;
}

Cell.prototype = {
  draw: function() {
    if (this.alive) {
      this.fadeIn();
    } else {
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 0.3;
      this.ctx.strokeRect(this.x * this.unit, this.y * this.unit, this.unit, this.unit);
      this.ctx.clearRect(this.x * this.unit, this.y * this.unit, this.unit, this.unit);
    }
  },
  fadeIn: function() {
    var self = this, increment = 0, color = this.lifeColor();
    //clearInterval(this.fadeInterval);

    //this.fadeInterval = setInterval(function() {
      self.ctx.fillStyle = 'rgba('+ color[0] +', '+ color[1] +', '+ color[2] +', 1)';//'+ increment/3 +')';
      self.ctx.fillRect(self.x * self.unit, self.y * self.unit, self.unit, self.unit);
      increment++;
    //}, 5);
  },
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
      if (num == 3) this.flaggedForRevive = true;
    }
  },
  numLiveNeighbors: function() {
    var liveNeighborsCount = 0;

    for (var i = 0; i < 8; i++) {
      var targetX = this.x + Automaton.adjust[Automaton.wheres[i]]['x'],
          targetY = this.y + Automaton.adjust[Automaton.wheres[i]]['y'],
          alive = false;

      if (this.automaton.grid[targetX] && this.automaton.grid[targetX][targetY])
        alive = this.automaton.grid[targetX][targetY].alive;
      if (alive) liveNeighborsCount++;
    }

    return liveNeighborsCount;
  },
  lifeColor: function() {
    return Cell.lifeColors[this.numLiveNeighbors()];
  }
}

// arrays of rgb values [r, g, b]
Cell.lifeColors = {
  0: [200, 200, 255], 1: [200, 200, 200], // starved dead
  2: [0, 0, 200],                         // happy alive
  3: [0, 200, 0],                         // sexy alive
  4: [200, 0, 0],   5: [180, 180, 180],   // suffocated dead
  6: [200, 200, 0], 7: [0, 200, 200],     // smooshed dead
  8: [0, 0, 0]                            // fucking dead
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

Storage.prototype = {
  save: function(name, data) {
    c_log(name, data);
    this.container(name, data);
    return true;
  },
  read: function(name) {
    c_log('read', name);
    this.container(name);
    return true;
  }
}

function Inputs(anim) {
  this.anim = anim;
}
Inputs.names = ['fps', 'w', 'h', 'unit', 'maxClumps', 'clumpSize', 'preSeed'];
Inputs.codeMap = { 32: 'spacebar', 37: 'left', 38: 'above', 39: 'right', 40: 'below', 67: 'c', 82: 'r', 83: 's' };

Inputs.prototype = {
  state: function() {
    var iS = {}
    for (var i = 0, len = Inputs.names.length; i < len; i++) {
      var name = Inputs.names[i];
      if ($('#'+ name).val) 
        iS[name] = parseInt($('#'+ name).val()); 
    }
    return iS;
  },
  read: function() {
    for (var i = 0, len = Inputs.names.length; i < len; i++) {
      var name = Inputs.names[i],
          val = this.get(name);
      if (val) this[name] = isNaN(val) ? val : parseInt(val);
    }

    return this;
  },
  get: function(name) {
    return $('#'+ name).val();
  },
  bindKeyboard: function() {
    var self = this;
    $(document).keyup(function(e) {
      var cmd = Inputs.codeMap[e.which];

      switch(cmd) {
        case 'spacebar':
          self.anim.toggle();
          e.preventDefault();
          break;
        case 's':
          self.anim.random();
          break;
        case 'c':
          self.anim.clear();
          break;
        case 'r':
          self.anim.reset();
          break;
        case 'left': case 'above': case 'right': case 'below':
          self.anim.moveClump(cmd);
          e.preventDefault();
          break;
      }
      return false;
    });
  }
}

function Anim(canvas_id) {
  this.canvas_id = canvas_id;
  this.interval = 0;
  this.playing = false;
  this.inputs = new Inputs(this).read();
  this.automaton = new Automaton(this.canvas_id, this.inputs.w, this.inputs.h, this.inputs.unit, this.inputs.preSeed),
  this.liveCellCounter = $('#liveCellCount');
}

Anim.prototype = {
  start: function() {
    var self = this, cellCount = 0;
    
    this.interval = setInterval(function() {
      self.automaton.update().draw();
      cellCount = self.automaton.liveCellCount();
      self.liveCellCounter.text(cellCount);
      if (cellCount == 0) this.stop();
    }, 1000 / this.fps);
    
    this.playing = true;
  },
  stop: function() {
    clearInterval(this.interval);
    this.interval = 0;
    this.playing = false;
  },
  toggle: function() {
    this.inputs.read();
    this.playing ? this.stop() : this.start();
  },
  reset: function() {
    this.stop();
    this.inputs.read();
    this.automaton = new Automaton(this.canvas_id, this.inputs.w, this.inputs.h, this.inputs.unit, this.inputs.preSeed).draw();
    this.liveCellCounter.text(this.automaton.liveCellCount());
  },
  clear: function() {
    this.stop();
    this.inputs.read();
    this.automaton = new Automaton(this.canvas_id, this.inputs.w, this.inputs.h, this.inputs.unit).draw();
    this.liveCellCounter.text(this.automaton.liveCellCount());
  },
  update: function() {
    this.inputs.read();
    this.automaton = new Automaton(this.canvas_id, this.inputs.w, this.inputs.h, this.inputs.unit, this.inputs.preSeed).draw();
    this.liveCellCounter.text(this.automaton.liveCellCount());
  },
  random: function() {
    this.stop();
    this.inputs.read();
    this.automaton = new Automaton(this.canvas_id, this.inputs.w, this.inputs.h, this.inputs.unit)
                         .randomSeed(this.inputs.maxClumps, this.inputs.clumpSize).draw();
    this.liveCellCounter.text(this.automaton.liveCellCount());
  },
  preSeed: function() {
    this.stop();
    this.inputs.read();
    this.automaton = new Automaton(this.canvas_id, this.inputs.w, this.inputs.h, this.inputs.unit, this.inputs.preSeed).draw();
  },
  toggleCell: function(e, canvas) {
    var canvas = $(canvas),
        x = Math.floor((e.pageX - canvas.offset().left) / this.automaton.unit);
        y = Math.floor((e.pageY - canvas.offset().top) / this.automaton.unit);
        cell = this.automaton.getCell(x, y);

    cell.alive = !cell.alive;
    this.automaton.draw();
    this.liveCellCounter.text(this.automaton.liveCellCount());

    if (cell.alive) c_log(x, y);
  },
  moveClump: function(direction) {
    this.automaton.moveClump(direction);
  }
}

$(function() {
  var canvas_id = 'grid',
      storage   = new Storage('conways'),
      anim      = new Anim(canvas_id);
  
  $('#start').click(function() { anim.start(); });
  $('#stop').click(function() { anim.stop(); });
  
  $('#reset').click(function() {
    anim.reset();
  });
  
  $('#update').submit(function() {
    anim.update();
    return false;
  });
  
  $('#clear').click(function() {
    anim.clear();
  });
  
  // randomly seed the grid
  $('#random').click(function() {
    anim.random();
  });
  
  $('#save').click(function() {
    anim.stop();
    storage.save('getSeed', anim.automaton.getSeed());
    storage.save('inputState', anim.inputs.state());
  });
  
  $('#preSeed').change(function() {
    anim.preSeed();
  });
  
  // toggle individual cells
  $('#grid').click(function(e) {
    anim.toggleCell(e, this);
  });
  
  anim.inputs.bindKeyboard();
});

function c_log() {
  if (console.log) console.log(arguments);
}

function rand(num) {
  return Math.floor(Math.random(num) * num);
}