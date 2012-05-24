
// Main Playlist, split in A and B

var Editor = Backbone.View.extend({

	el: '#mixtape',

	events: {
		'click .search': 'routeSearch',
		'click .publish': 'publish',
		'change input': 'updateModel'
	},


	model: new MixedTape(),

	initialize: function() {

		_.bindAll(this);

		this.collection = this.model.get('playlist');
		this.collection.bind('add', this.update, this);
		this.collection.bind('remove', this.update, this);

		this.model.bind('change', this.updateView, this);

		this.$sides = [
			this.$('.side-a .playlist'),
			this.$('.side-b .playlist')
		];
		this.$blanks = [
			this.$('.side-a .empty'),
			this.$('.side-b .empty')
		];

		this.$publish = this.$el.find('.publish');
	},

	updateModel: function() {

		var val = this.$('input').val();
		this.model.set('title', val);

	},

	updateView: function() {

		this.$('input').val(this.model.get('title'));

	},

	render: function() {

		this.$sides[0].html('');
		this.$sides[1].html('');

		this.$blanks[0].hide();
		this.$blanks[1].hide();

		var self = this;
		var side = -1;

		this.collection.each(function(track) {

			var view = new TrackEntry({model: track});
			view.render();

			self.$sides[track.get('side')].append(view.$el);

		});

		// Update duration for sides
		var sides = this.model.get('sides');

		this.$('.side-a .playlist-duration span').html(TrackEntry.niceDuration(1800 - sides[0]));
		this.$('.side-b .playlist-duration span').html(TrackEntry.niceDuration(1800 - sides[1]));

		if (!sides[0]) {
			this.$blanks[0].show();
		}
		if (!sides[1]) {
			this.$blanks[1].show();
		}

		if (this.collection.length) {
			this.$publish.removeClass('disabled');
		} else {
			this.$publish.addClass('disabled');
		}

	},

	update: function(track) {

		var duration = 0, side = 0, sides = [0, 0];

		this.collection.reset(this.collection.filter(function(track) {

			duration += Number(track.get('duration'));

			if (duration > 1800) {
				duration = Number(track.get('duration'));
				side += 1;
			}
			if (side > 1) {
				return null;
			}

			sides[side] = duration;

			track.set('side', side, {silent: true});

			return true;

		}, this), {silent: true});

		this.model.set('sides', sides, {silent: true});

		this.model.save();

		this.render();

	},

	routeSearch: function(evt) {

		if (!this.activated) {
			this.activated = true;
			// $('header').animate({height: 0, opacity: 0});
		}

		App.navigate('search', {trigger: true});

	},

	publish: function() {

		App.login(function(err, user) {

			if (user) {
				App.navigate('publish', {trigger: true});
			}

		});

	}

});