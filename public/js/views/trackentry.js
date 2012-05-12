
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
		'<button class="btn loading"><i class="icon-loading"></i></button>' +
		'<button class="btn pause"><i class="icon-pause"></i></button>' +
		'</div>' +
		'<div class="pull-left"><strong><%= title %></strong><%= artist %></div><div style="clear: both"></div><small class="duration"><%= duration %></small>'), // load jQuery template

	initialize: function() {
		this.snd = null;
	},

	render: function(search) {

		this.$el.html(this.template(this.model.toJSON()));
		this.$el.attr('data-state', 'paused');

	},

	play: function(evt) {
		evt.stopImmediatePropagation();

		// Loading state?
		this.getSoundMgr(function(snd) {

			snd.play();

		});

	},

	pause: function(evt) {

		evt.stopImmediatePropagation();

		this.getSoundMgr(function(snd) {

			snd.pause();

		});

	},

	add: function(evt) {

		evt.stopImmediatePropagation();

		if (this.collection == App.editorView.model.get('playlist')) {
			return;
		}

		App.navigate('', {trigger: true});

		App.editorView.collection.add(this.model);
		App.searchView.reset();
	},

	getSoundMgr: function(cb, onprogress) {
		var snd = this.snd;

		if (snd) {
			cb(snd);
			return;
		}

		var self = this;

		$el = this.$el;
		$el.attr('data-state', 'loading');

		var id = this.model.get('id');

		$.getJSON('/play/' + id, function(data) {

			snd = soundManager.createSound({
				id: id,
				url: data.url,
				whileloading: onprogress || function(){},
				onfinish: function() {
					App.setSnd(null);
					$el.attr('data-state', 'paused');
				},
				onpause: function() {
					App.setSnd(null);
					$el.attr('data-state', 'paused');
				},
				onplay: function() {
					App.setSnd(snd);
					$el.attr('data-state', 'playing');
				},
				onresume: function() {
					App.setSnd(snd);
					$el.attr('data-state', 'playing');
				},
				onstop: function() {
					App.setSnd(null);
					$el.attr('data-state', 'paused');
				}
			});

			self.snd = snd;

			cb(snd);
		});
	}

});
