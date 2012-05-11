// Main Playlist, split in A and B

var Search = Backbone.View.extend({

	el: '#search',

	events: {
		'change': 'search',
		'click .back': 'back'
	},

	initialize: function() {
		this.$input = this.$el.find('input');
		this.$list = this.$el.find('.playlist');
		this.collection = new SearchTracks();
		this.collection.bind('reset', this.render, this);
	},

	render: function() {
		var list = this.$list;
		list.empty();
		this.collection.forEach(function(track) {
			var view = new TrackEntry({model: track});
			view.render();
			list.append(view.$el);
		});
	},

	focus: function() {
		this.$input.focus();
	},

	search: function(evt) {
		var self = this;
		function done() {
			self.$el.removeClass('loading');
		}
		self.$el.addClass('loading');

		var needle = this.$input.val();
		if (needle == '') {
			done();
			self.collection.reset();
			return;
		}
		this.collection.fetch({data: { q: needle }, success: done});
	},

	reset: function() {
		this.collection.reset();
		this.$input.val('');
	},

	back: function() {
		App.navigate('', {trigger: true});
	}

});