// used by Automaton to render to canvas using different styles
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