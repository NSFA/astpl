Easy.widget.define({
	name: 'test',
	tpl: '<div> \
          <a data-action="ss"><%= b["c"] %>----<%= a %></a> \
        </div>',
  config: {
  	s: function() {
  		this.data.a = 'hahahaha';
  	}
  }
}).$delegate('click', {
  ss: function(node, evt) {
    alert(node.innerHTML);
  }
});

var test = new Easy.widget.test({
  parent: '#hh',
  data: {a:'b',b:{a:'a',b:'b',c:'c'}},
  onupdate: function(data) {

  }
});