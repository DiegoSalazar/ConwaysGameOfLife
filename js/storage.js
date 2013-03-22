// TODO: incomplete implementation
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