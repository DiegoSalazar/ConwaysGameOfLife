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