
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
		this.collection.bind('add', this.add, this);

		this.model.bind('change', this.updateView, this);

		this.$lists = [
			this.$('.playlistA'),
			this.$('.playlistB')
		];

	},

	updateModel: function() {

		var val = this.$('input').val();
		this.model.set('title', val);

	},

	updateView: function() {

		this.$('input').val(this.model.get('title'));

	},

	render: function() {

		this.$lists[0].html('');
		this.$lists[1].html('');

		var self = this;
		var side = -1;

		this.collection.each(function(track) {

			var view = new TrackEntry({model: track});
			view.render();

			self.$lists[track.get('side')].append(view.$el);

		});


	},

	add: function(track) {

		var duration = 0, side = 0, sides = [0, 0];

		this.collection.reset(this.collection.filter(function(track) {

			sides[side] = duration;

			duration += Number(track.get('duration'));

			if (duration > 1800) {
				duration = Number(track.get('duration'));
				side += 1;
			}
			if (side > 1) {
				return null;
			}

			track.set('side', side, {silent: true});

			return true;

		}, this), {silent: true});

		this.model.set('sides', sides, {silent: true});

		this.render();

	},

	routeSearch: function(evt) {

		if (!this.activated) {
			this.activated = true;
			$('.page-header').animate({height: 0, opacity: 0});
		}


		App.navigate('search', {trigger: true});

	},

	publish: function() {

		var model = this.model;

		var login = function(response) {

			if (response.status === 'connected') {
				var uid = response.authResponse.userID;
				var accessToken = response.authResponse.accessToken;

				$.post('/login', {accessToken: accessToken, mixtape: model.toJSON()}, function(data) {

					console.log('Saved');

				});

				App.navigate('publish', {trigger: true});

			} else if (response.status === 'not_authorized') {
				alert('Sorry, you need to authenticate!')
			} else {
				alert('Sorry, try again!')
			}
		};

		FB.getLoginStatus(function(response) {

			if (response.status === 'connected') {

				login(response);

			} else {

				FB.login(function() {
					FB.getLoginStatus(function(response) {

						login(response);

					});
				});

			}

		});

	}

});