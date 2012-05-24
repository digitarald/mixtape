// Main Playlist, split in A and B

var Search = Backbone.View.extend({

	el: '#search',

	presets: ['Pink Floyd', 'The Beatles', 'Elton John', 'Kelly Clarkson', 'Rolling Stones', 'George Michael', 'The Clash', 'The Doors', 'Jason Mraz', 'Chuck Berry', 'Elvis Presley', 'Eric Clapton', 'Bob Dylan', 'George Strait'],

	events: {
		'focus input': 'observeStart',
		'blur input': 'observeEnd',
		'change': 'search',
		'click .back': 'back',
		'click #preset-search': 'presetSearch',
		'click #preset-reset': 'presetReset'
	},

	initialize: function() {
		_.bindAll(this, 'observe');

		this.$input = $('#input-search');
		this.$list = this.$el.find('.playlist');

		this.$noresult = this.$el.find('.no-result').hide();
		this.$intro = this.$el.find('.intro').hide();

		this.collection = new SearchTracks();
		this.collection.bind('reset', this.render, this);

		this.presetReset();

		this.on('focus', this.focus, this);
		this.on('blur', this.blur, this);

		// Not in this.events, as its a global element (FIXME)
		this.$input.parent('form').bind('submit', function(evt) {
			return false;
		});

		this.$input.bind('focus', _.bind(this.observeStart, this));
		this.$input.bind('blur', _.bind(this.observeEnd, this));
	},

	presetSearch: function(evt) {
		if (evt) evt.preventDefault();

		this.$input.val(this.preset);
		this.observe();

		this.presetReset();
	},

	presetReset: function(evt) {
		if (evt) evt.preventDefault();

		var preset;
		do {
			preset = this.presets[Math.floor(Math.random() * this.presets.length)];
		} while(preset == this.preset);
		this.preset = preset;

		this.$('#preset-search').text(this.preset);
	},

	observeStart: function() {
		this.observing = setInterval(this.observe, 250);

		this.needle = this.$input.val();
	},

	observe: function() {
		var val = this.$input.val().trim();

		if (!val.length || val == this.needle) return;

		this.needle = val;
		this.search();
	},

	observeEnd: function() {
		clearInterval(this.observing);
		this.observing = null;
	},

	render: function() {

		var $list = this.$list;
		$list.empty();

		if (!this.collection.length) {
			if (this.needle) {
				this.$noresult.show();
			} else {
				this.$intro.show();
			}
		} else {
			this.$noresult.hide();

			this.collection.forEach(function(track) {
				var view = new TrackEntry({model: track});
				view.render();
				$list.append(view.$el);
			});
		}
	},

	focus: function() {
		this.$input.addClass('span12').removeClass('span4').focus();
		this.observe();
	},

	blur: function() {
		this.$input.removeClass('span12').addClass('span4');
		this.needle = null;
	},

	search: function(needle) {

		if (this.needle == '') {
			this.$intro.show();
			return;
		}

		this.$intro.hide();

		var $el = this.$el;

		function done() {
			$el.removeClass('loading');
		}
		$el.addClass('loading');


		if (this.xhr) this.xhr.abort();
		this.xhr = this.collection.fetch({data: {q: this.needle}, success: done});
	},

	reset: function() {
		this.collection.reset();
		this.$input.val('');
	},

	back: function() {
		App.navigate('', {trigger: true});
	}

});