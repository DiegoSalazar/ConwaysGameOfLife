// represents the grid, updates cells states and draws
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