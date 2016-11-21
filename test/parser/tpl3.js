Easy.widget.define({
  name: 'testw',
  tpl: '<a href="#"><%= s%></a>'
});

var t = new Easy.widget.testw({
  parent: '#pp',
  data: {s:'链接'},
  onupdate: function(data) {

  }
});