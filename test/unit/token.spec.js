var token = require('../../src/token');
var $ = require('jquery');
var _ = require('lodash');

describe('parseTemplate', function(){
	jasmine.DEFAULT_TIMEOUT_INTERVAL = 24 * 60 * 60 * 1000;

	beforeEach(function(){
		// withBindDefault
		$(document.body).after('<label id="hh">fileSelect</label>');


	});


	it('template2ast', function(done){
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
	});

})
