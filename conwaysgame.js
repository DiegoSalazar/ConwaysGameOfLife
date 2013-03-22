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
function Automaton(canvas, w, h, unit, seed, renderOptions) {
  this.w = w;
  this.h = h;
  this.unit = unit || 10;
  this.seed = Automaton.seeds[seed];
  this.grid = [];
  this.liveCells = [];
  this.lastLiveCellNum = 0;
  this.maxPopulation = 0;
  this.renderer = new Renderer(canvas, this, renderOptions);
  
  // build grid and add cells to it
  this.traverseGrid(function(cell, x, y) {
    this.grid[x][y] = new Cell(x, y, this.dropSeed(x, y), this);    
  }, function(x) { // this callback runs first
    this.grid[x] = [];
  });
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
  'gosper' : [[2, 6],[2, 7],[3, 6],[3, 7],[12,6],[12,7],[12,8],[13,5],[13,9],[14,4],[14,10],[15,4],[15,10],
              [16,7],[17,5],[17,9],[18,6],[18,7],[18,8],[19,7],[22,4],[22,5],[22,6],[23, 4],[23,5],[23, 6],
              [24,3],[24,7],[26,2],[26,3],[26,7],[26,8],[36,4],[36,5],[37,4],[37,5]], // thanks 535480/james from stackoverflow
  'sword' : [[26,10], [26,11], [26,12], [26,13], [26,14], [26,15], [26,16], [26,18], [26,19], [26,20],
             [26,23], [26,24], [26,25], [26,30], [26,31], [26,32], [26,33], [26,34], [26,35]],
  'spaceship' : [],
  'toad' : [],
  'beacon' : [],
  'pulsar' : [],
  'lwss' : [],
  'diehard' : [[8,2], [2,3], [3,3], [3,4], [7,4], [8,4], [9,4]],
  'acorn' : [],
  'fpentomino': [[3, 2], [4, 2], [2, 3], [3, 3], [3,4]],
  // custom seeds I made!
  'rorschach': [[43, 49],[44, 49],[44, 48],[43, 48],[45, 47],[46, 48],[46, 49],[47, 49],[47, 48]]
}

Automaton.prototype = {
  traverseGrid: function(yCallback, xCallback) {
    for (var x = 0; x < this.w; x++) {
      if (typeof xCallback == 'function') 
        xCallback.call(this, x);
      for (var y = 0; y < this.h; y++)
        yCallback.call(this, this.grid[x][y], x, y);
    }
    return this;
  },
  dropSeed: function(x, y) {
    if (!this.seed) return false;
    for (var i = 0, len = this.seed.length; i < len; i++) {
      if (typeof(this.seed[i]) == 'object' && x == this.seed[i][0] && y == this.seed[i][1])
        return true;
    }
    return false;
  },
  updateOptions: function(io) {
    this.w = io.w;
    this.h = io.h;
    this.unit = io.unit;
    this.renderer.updateOptions(this, io);
    this.draw();
  },
  update: function() {
    return this.traverseGrid(function(cell, x, y) {
      cell.flagYourselfForDeathMaybe();

    }).traverseGrid(function(cell, x, y) {
      if (cell.flaggedForDeath) {
        cell.kill().flaggedForDeath = false;
      } else if (!cell.alive && cell.flaggedForRevive) {
        cell.revive().flaggedForRevive = false;
      }
    });
  },
  draw: function() {
    this.renderer.clear();
    return this.traverseGrid(function(cell, x, y) {
      if (cell.alive) this.renderer.draw(cell.update());
    });
  },
  liveCellCount: function() {
    this.lastLiveCellNum = this.liveCellNum; 
    this.liveCellNum = 0;
    this.traverseGrid(function(cell, x, y) {
      if (cell.alive) this.liveCellNum++;
    });
    return this.liveCellNum;
  },
  evolving: function() {
    return this.lastLiveCellNum != this.liveCellNum;
  },
  getOldestCell: function() {
    var cells = this.getLiveCells();
    
    for (var i = 0, len = cells.length; i < len; i++) {
      var cell = cells[i],
          age = this.oldestCell ? this.oldestCell.age : 0;
      if (cell.age > age) this.oldestCell = cell;
    }
    return this.oldestCell || {age:0};
  },
  getMaxPopulation: function(liveCellCount) {
    return this.maxPopulation = (liveCellCount > this.maxPopulation) ? liveCellCount : this.maxPopulation;
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
  getLiveCells: function() {
    this.liveCells = [];
    this.traverseGrid(function(cell, x, y) {
      if (cell.alive) this.liveCells.push(cell);
    });
    return this.liveCells;
  },
  getStats: function(cellCount) {
    var oldestCell = this.getOldestCell();
    return { 
      liveCellCount: cellCount, 
      maxPopulation: this.getMaxPopulation(cellCount),
      oldestCell:    oldestCell.age + ' <code>{x: '+ oldestCell.x +', y:'+ oldestCell.y +'}</code>',
      evolving:      this.evolving() ? 'Evolving' : 'Stabilized'
    }
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
  moveClump: function(where) {
    var cells = this.getLiveCells(), movedCells = [];
    
    for (var i = 0, len = cells.length; i < len; i++) {
      var cell = cells[i].kill();
          newX = cell.x + Automaton.adjust[where]['x'],
          newY = cell.y + Automaton.adjust[where]['y'];
      
      movedCells.push(new Cell(newX, newY, true, this));
    }
    
    return this.traverseGrid(function(cell, x, y) {
      for (var i = 0, len = movedCells.length; i < len; i++) {
        var c = movedCells[i];
        if (c.x == x && c.y == y) this.grid[x][y] = c;
      }
    }).draw();
  },
  center: function() {
    var cells = this.getLiveCells(), liveXs = [], liveYs = [], minX, maxX, minY, maxY, tx, ty;
    // get live points
    for (var i = 0, len = cells.length; i < len; i++) {
      var cell = cells[i];
      liveXs.push(cell.x);
      liveYs.push(cell.y);
    }
    
    // get boundaries
    minX = Math.min.apply(Math, liveXs); maxX = Math.max.apply(Math, liveXs);
    minY = Math.min.apply(Math, liveYs); maxY = Math.max.apply(Math, liveYs);
    
    // translate each point by
    tx = Math.floor(((minX + (this.w - maxX)) / 2) - minX);
    ty = Math.floor(((minY + (this.h - maxY)) / 2) - minY);
    
    return this.traverseGrid(function(cell, x, y) {
      for (var i = 0, len = cells.length; i < len; i++) {
        if (cells[i] == cell) {
          var newX = x + tx, newY = y + ty;
          cell.kill();
          this.grid[newX][newY] = new Cell(newX, newY, true, this);
        }
      }
    }).draw();
  },
  lineSeed: function(vertical) {
    var endPoint = Math.floor(vertical ? this.w : this.h),
        seedArray = [];
    
    for (var i = 0; i < endPoint; i++)
      seedArray.push(vertical ? [Math.floor(this.h/2), i] : [i, Math.floor(this.w/2)]);
      
    return seedArray;
  }
}

function Renderer(canvas, automaton, options) {
  this.options = $.extend({ style: 'block' }, options);
  this.automaton = automaton;
  this.increment = 0;
  this.$canvas = canvas.attr({ width: automaton.w * automaton.unit +'px', height: automaton.h * automaton.unit +'px' });
  this.canvas = this.$canvas[0];
  
  if (this.canvas.getContext) 
    this.ctx = this.canvas.getContext('2d');
  else 
    return alert('OMG This browser like totally doesn\'t support Canvas. You should like upgrade and stuff.');
}

Renderer.prototype = {
  updateOptions: function(automaton, io) {
    this.automaton = automaton;
    this.$canvas.attr({ width: automaton.w * automaton.unit +'px', height: automaton.h * automaton.unit +'px' });
    this.options.style = io.renderStyle;
  },
  clear: function() {
    var ctx = this.ctx,
        u = this.automaton.unit,
        w = this.automaton.w * u,
        h = this.automaton.h * u;
    
    // clear the entire grid
    ctx.fillStyle = 'white';
    ctx.clearRect(0, 0, w * u, h * u);
    ctx.fill();
    ctx.beginPath();
    
    // draw vertical grid lines
    for (var x = 1; x < w; x += u) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    // draw horizontal grid lines
    for (var y = 1; y < h; y += u) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = .05;
    ctx.stroke();
    ctx.closePath();
  },
  draw: function(cell) {
    this.ctx.beginPath();
    this.styles[this.options.style].call(this, cell, this.ctx, this.automaton.unit);
    this.ctx.closePath();
  },
  styles: {
    block: function(cell, ctx, unit) {
      var color = cell.lifeColor();
      
      if (cell.alive) {
        ctx.fillStyle = 'rgba('+ color[0] +', '+ color[1] +', '+ color[2] +', 1)';//'+ increment/3 +')';
        ctx.fillRect(cell.x * unit, cell.y * unit, unit, unit);
      } else {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 0.3;
        ctx.strokeRect(cell.x * unit, cell.y * unit, unit, unit);
        ctx.clearRect(cell.x * unit, cell.y * unit, unit, unit);
      }
      ctx.fill();
      ctx.stroke();
    },
    moogily: function(cell, ctx, unit) {
      var color = cell.lifeColor(),
          x = cell.x * unit + unit / 2,
          y = cell.y * unit + unit / 2;
      
      ctx.arc(x, y, unit/2, 0, Math.PI * 2, true);
      
      if (cell.alive) {
        ctx.fillStyle = 'rgba('+ rand(color[0]) +', '+ rand(color[1]) +', '+ rand(color[2]) +', '+ rand(4) +')';//'+ increment/3 +')';;
        ctx.lineWidth = rand(cell.unit/2);
        ctx.strokeStyle = 'rgba('+ color[0] +', '+ color[1] +', '+ color[2] +', '+ Math.random() +')';//'+ increment/3 +')';
      } else {
        ctx.fillStyle = 'rgba('+ color[0] +', '+ color[1] +', '+ color[2] +', .5)';//'+ increment/3 +')';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = .1;
      }
      ctx.fill();
      ctx.stroke();
    },
    fadeIn: function(cell, ctx, unit) {
      var self = this, color = cell.lifeColor();
      
      if (cell.alive) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(function() {
          ctx.fillStyle = 'rgba('+ color[0] +', '+ color[1] +', '+ color[2] +', '+ (self.increment++)/4 +')';
          ctx.fillRect(cell.x * unit, cell.y * unit, unit, unit);
          ctx.fill();
        }, 5);
      } else {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = .2;
        ctx.clearRect(cell.x * unit, cell.y * unit, unit, unit);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}
  
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

      if (this.automaton.grid[targetX] && this.automaton.grid[targetX][targetY])
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

function Storage(name, type) {
  this.name = name;
  this.storageType = type || 'cookieStore';
  this.container = Storage.types[this.storageType];
}
Storage.types = { 'cookieStore': $.cookie, 'localStore': null, 'ajax': null };

Storage.prototype = {
  save: function(name, data) {
    c_log(this.name, name, data);
    // container must have a common interface e.g. cookieStore, localstore, ajax
    this.container(name, data);
    c_log('saved', this.container(name))
    return true;
  },
  read: function(name) {
    c_log(this.name, ':read', name);
    // container must have a common interface e.g. cookieStore, localstore, ajax
    this.container(name);
    return true;
  }
}

// handles input/output for UI elements
function IO(anim) {
  var self = this;
  this.anim          = anim;
  this.toggle        = $('#toggle');
  this.liveCellCount = $('#liveCellCount');
  this.clock         = $('#clock');
  this.counter       = 0;
}
IO.inputIds = ['fps', 'w', 'h', 'unit', 'maxClumps', 'clumpSize', 'preSeed', 'renderStyle'];
IO.codeMap = { 32: 'spacebar', 37: 'left', 38: 'above', 39: 'right', 40: 'below', 67: 'c', 72: 'h', 79: 'o', 82: 'r', 83: 's', 86: 'v' };

IO.prototype = {
  state: function() {
    var iS = {}
    for (var i = 0, len = IO.inputIds.length; i < len; i++) {
      var id = IO.inputIds[i];
      if ($('#'+ id).val) 
        iS[id] = parseInt($('#'+ id).val()); 
    }
    return iS;
  },
  read: function() {
    for (var i = 0, len = IO.inputIds.length; i < len; i++) {
      var id = IO.inputIds[i], val = this.get(id);
      if (val) this[id] = isNaN(val) ? val : parseInt(val);
    }
    return this;
  },
  get: function(name) {
    return $('#'+ name).val();
  },
  renderOptions: function() {
    return {
      style: this.get('renderStyle')
    }
  },
  // display elapsed time HH:MM:SS when anim is playing
  showClock: function(playing) {
    if (playing) {
      var self = this;
      this.clockInterval = setInterval(function() {
        var now = new Date();
        self.clock.text(formattedTime(++self.counter));
      }, 1000);
    } else clearInterval(this.clockInterval);
    return this;
  },
  resetClock: function() {
    this.counter = 0;
    this.clock.text(formattedTime(0));
    return this;
  },
  outputStats: function(stats) {
    for (var id in stats) 
      if (stats.hasOwnProperty(id))
        $('#'+ id).html(stats[id]);
  }
}

// creates the gameloop and provides UI control of the automaton
function Anim(canvas_id) {
  var self = this;
  this.canvas    = $('#'+ canvas_id);
  this.playing   = false;
  this.storage   = new Storage('conways');
  this.io        = new IO(this).read();
  this.newAutomaton = function(preSeed) {
    return new Automaton(this.canvas, this.io.w, this.io.h, this.io.unit, (preSeed || this.io.preSeed), this.io.renderOptions());
  }
  this.automaton = this.newAutomaton().draw();
  this.io.anim = this; // set at the end because io needs anim.automaton
}

Anim.prototype = {
  start: function() {
    var self = this, cellCount = 0;
    
    setTimeout(function() {
      self.automaton.update().draw();
      cellCount = self.automaton.liveCellCount();
      self.io.outputStats(self.automaton.getStats(cellCount, this.playing));
      if (cellCount < 3) return self.playing = false;
      if (self.playing) setTimeout(arguments.callee, 1000 / self.io.fps);
    }, 1000 / this.io.fps);
    
    this.playing = true;
    this.io.showClock(true).toggle.text('Pause (space)');
  },
  stop: function() {
    this.playing = false;
    this.io.showClock(false).toggle.text('Play (space)');
  },
  toggle: function() {
    this.io.read();
    this.playing ? this.stop() : this.start();
  },
  reset: function() {
    this.stop();
    this.io.read().resetClock();
    this.automaton = this.newAutomaton().draw();
    this.io.liveCellCount.text(this.automaton.liveCellCount());
  },
  clear: function() {
    this.stop();
    this.io.read().resetClock();
    this.automaton = this.newAutomaton([]).draw();
    this.io.liveCellCount.text(0);
    return this;
  },
  update: function() {
    this.io.read().resetClock();
    this.automaton.updateOptions(this.io);
    this.io.liveCellCount.text(this.automaton.liveCellCount());
  },
  random: function() {
    this.stop();
    this.io.read().resetClock();
    this.automaton = this.newAutomaton([]).randomSeed(this.io.maxClumps, this.io.clumpSize).draw();
    this.io.liveCellCount.text(this.automaton.liveCellCount());
  },
  preSeed: function() {
    this.stop();
    this.io.read().resetClock();
    this.automaton = this.newAutomaton().draw();
  },
  mouseX: function() {
    return Math.floor((this.e.pageX - this.canvas.offset().left) / this.automaton.unit);
  },
  mouseY: function() {
    return Math.floor((this.e.pageY - this.canvas.offset().top) / this.automaton.unit);
  },
  toggleCell: function(e) {
    if (this.playing) { this.stop(); this.wasPlaying = true; }
    else this.wasPlaying = false;
    
    this.e = e;
    this.tracedCells = [this.automaton.getCell(this.mouseX(), this.mouseY())];
    
    var x = this.mouseX(),
        y = this.mouseY(),
        cell = this.automaton.getCell(x, y).toggle();
    
    this.automaton.draw();
    this.io.liveCellCount.text(this.automaton.liveCellCount());

    if (cell.alive) c_log(x, y);
    return this;
  },
  startCellTrace: function() {
    var self = this;
    
    this.canvas.mousemove(function(e) {
      self.e = e;
      var cell = self.automaton.getCell(self.mouseX(), self.mouseY());
      
      if (cell.notIn(self.tracedCells)) {
        cell.revive();
        self.tracedCells.push(cell);
        self.automaton.draw();
      }
    });
  },
  endCellTrace: function() {
    this.canvas.unbind('mousemove');
    this.io.liveCellCount.text(this.automaton.liveCellCount());
    if (this.wasPlaying) this.start();
  },
  line: function(vertical) { 
    var line = (vertical ? 'v' : 'h') + 'line';
    this.stop();
    Automaton.seeds[line] = this.automaton.lineSeed(vertical);
    this.automaton = this.newAutomaton(line).center().draw();
  },
  moveClump: function(where)    { this.automaton.moveClump(where); },
  center:    function()         { this.automaton.center(); },
  bindEvents: function() {
    var self = this;
    
    $(document).keydown(function(e) {
      var target = e.target.tagName.toLowerCase();
      if (target == 'input' || target == 'select') return true;
      var cmd = IO.codeMap[e.which];

      switch(cmd) {
        case 'spacebar': self.toggle(); break;
        case 's':        self.random(); break;
        case 'c':        self.clear(); break;
        case 'r':        self.reset(); break;
        case 'o':        self.center(); break;
        case 'v':        self.line(true); break;
        case 'h':        self.line(false); break;
        case 'left': case 'above': case 'right': case 'below': self.moveClump(cmd); break;
        default: return true;
      }
      return false;
    });
    
    this.io.toggle.click(function() { self.playing ? self.stop() : self.start(); });
    $('button#reset').click(function() { self.reset(); });
    $('button#clear').click(function() { self.clear(); });
    $('button#center').click(function() { self.center(); });
    $('button#random').click(function() { self.random(); });
    $('button#save').click(function() {
      self.stop();
      self.storage.save('getSeed', self.automaton.getSeed());
      self.storage.save('inputState', self.io.state());
    });
    $('button.lineBtn').click(function() { self.line($(this).hasClass('vertical')); });
    $('select#preSeed').change(function() { self.preSeed(); });
    $('select#renderStyle').change(function() { self.update(); });
    $('form#update').submit(function() { self.update(); return false; });
    $('option').click(function() { $(this).parent().blur(); });
    
    // toggle individual cells by clicking and/or click dragging
    this.canvas.mousedown(function(e) {
      self.toggleCell(e, this).startCellTrace();
    }).mouseup(function(e) {
      self.endCellTrace();
    });
    return this;
  }
}

// Initialization
$(function() {
  new Anim('grid').bindEvents();
});

// utils
function rand(num) {
  return Math.floor(Math.random(num) * num);
}

function formattedTime(secs) {
  var sec = secs % 60,
      min = ((secs - sec) / 60) % 60,
      hrs = ((secs - (sec + (min * 60))) / 3600) % 60;
  return formatTimePart(hrs) +':'+ formatTimePart(min) +':'+ formatTimePart(sec);
}

function formatTimePart(t) {
  return (t < 10) ? '0'+ t : t;
}

function c_log() {
  if (console.log) console.log(arguments);
}