
var TrackEntry = Backbone.View.extend({

	events: {
		'click': 'add',
		'click .play': 'play',
		'click .loading': 'pause',
		'click .pause': 'pause'
	},

	tagName: 'li',

	template: _.template(
		'<div class="pull-left">' + 
		'<button class="btn play"><i class="icon-play"></i></button>' + 
		'<button class="btn loading"><i class="icon-refresh"></i></button>' + 
		'<button class="btn pause"><i class="icon-pause"></i></button>' +
		'</div>' +
		'<div class="pull-left"><strong><%= title %></strong><%= artist %></div><div style="clear: both"></div><small class="duration"><%= duration %></small>'), // load jQuery template

	initialize: function() {
	},

	render: function(search) {

		this.$el.html(this.template(this.model.toJSON()));
		this.$el.attr('data-state', 'paused');

	},

	play: function(evt) {
		evt.stopImmediatePropagation();

		// Loading state?
		this.model.getSoundMgr(this.$el, function(snd) {

			snd.play();

		});

	},

	pause: function(evt) {

		evt.stopImmediatePropagation();

		this.model.getSoundMgr(this.$el, function(snd) {

			snd.pause();

		});

	},

	add: function(evt) {

		evt.stopImmediatePropagation();

		if (this.collection == App.editorView.collection) {
			return;
		}

		App.navigate('', {trigger: true});

		App.editorView.collection.add(this.model);
		App.searchView.reset();
	}

});
