
var TrackEntry = Backbone.View.extend({

	events: {
		'click': 'add',
		'click .remove': 'remove',
		'click .play': 'play',
		'click .loading': 'pause',
		'click .pause': 'pause'
	},

	tagName: 'li',

	template: _.template(
		'<div class="control">' +
			'<button class="btn play"><i class="icon-play"></i></button>' +
			'<button class="btn loading"><i class="icon-loading"></i></button>' +
			'<button class="btn pause"><i class="icon-pause"></i></button>' +
		'</div>' +
		'<div class="meta"><em><%= title %></em> by <%= artist %></div>' +
		'<div class="side"><small class="duration"><%= TrackEntry.niceDuration(duration) %></small></div>' + 
		'<i class="remove icon-remove"></i>'), // load jQuery template

	initialize: function() {
		this.snd = null;
	},

	render: function(search) {

		this.$el.html(this.template(this.model.toJSON()));
		this.$el.attr('data-state', 'paused');

	},

	play: function(evt) {

		if (evt) evt.stopImmediatePropagation();

		// Loading state?
		this.getSoundMgr(function(snd) {

			snd.play();

		});

	},

	pause: function(evt) {

		if (evt) evt.stopImmediatePropagation();

		this.getSoundMgr(function(snd) {

			snd.stop();

		});

	},

	add: function(evt) {

		evt.stopImmediatePropagation();

		if (this.collection == App.editorView.model.get('playlist')) {

			this.$el.find('button:visible').trigger('click');

			return;
		}

		App.navigate('', {trigger: true});

		App.editorView.collection.add(this.model);
		App.searchView.reset();
	},

	remove: function(evt) {

		evt.stopImmediatePropagation();

		App.editorView.collection.remove(this.model);
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

		snd = soundManager.createSound({
			id: id,
			url: this.model.get('preview_url'),
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
	}

});

TrackEntry.niceDuration = function(duration) {
	var seconds = String(duration % 60);
	while (seconds.length < 2) {
		seconds += '0';
	}
	return '<span class="minutes">' + Math.round(duration / 60) + '</span><span class="divider">:</span><span class="seconds">' + seconds + '</span>';
}
