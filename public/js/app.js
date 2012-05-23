
(function(undefined) {

var Application = Backbone.Router.extend({

	routes: {
		'': 'editor', // matches http://example.com/#anything-here
		'search': 'search',
		'player': 'player',
		'publish': 'publish'
	},

	initialize: function() {

		// Can't disable flash, as we play MP3
		soundManager.url = '/img/soundmanager2.swf';
		soundManager.debugMode = false;

		// Facebook

		window.fbAsyncInit = this.fbInit;

		(function(d){
			var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
			if (d.getElementById(id)) {return;}
			js = d.createElement('script'); js.id = id; js.async = true;
			js.src = "//connect.facebook.net/en_US/all.js";
			ref.parentNode.insertBefore(js, ref);
		 }(document));


		// Views

		this.currentView = null;

		this.publishView = new Publish();
		this.editorView = new Editor({model: new MixedTape(env.mixtape || {
				playlist: []
			})
		});
		this.searchView = new Search();

		this.playerView = new Player({model: env.mixtape || new MixedTape({
				to: 'to',
				from: 'from',
				title: 'title',
				playlist: [
					{
						id: 3766427,
						title: 'Human',
						artist: 'The Killers',
						side: 0,
						previewurl: 'http://previews.7digital.com/clips/826/3766427.clip.mp3'
					},
					{
						id: 15465040,
						title: 'Smells like teen Spirit',
						artist: 'Nirvana',
						side: 1,
						previewurl: 'http://previews.7digital.com/clips/826/15465040.clip.mp3'
					}
				]
			})
		});

		this.editorView.$el.hide();
		this.searchView.$el.hide();
		this.publishView.$el.hide();
		this.playerView.$el.hide();

		this.container = $('#main');

		$(document.body).on('focus', '#input-search', function(evt) {
			App.navigate('search', {trigger: true});
		});

		setTimeout(function() {
			Backbone.history.start({pushState: true});
		}, 10);

	},

	fbInit: function() {

		FB.init({
			appId: env.FB_ID,
			channelUrl: '/channel',
			status: true,
			cookie: true // enable cookies to allow the server to access the session
		});

		FB.Event.subscribe('auth.statusChange', function(response) {

			if (response.authResponse) {

				FB.api('/me', function(me){

					App.user = {
						uid: response.authResponse.userID,
						token: response.authResponse.accessToken,
						me: me
					};

					if (env.facebook_id != App.user.uid) {
						$.post('/login', {token: App.user.token});
					}

					App.trigger('login', App.user);

					$('#status-logged-in').text(App.user.me.name);

				});

			} else if (App.user) {

				$.post('/logout', function() {
					App.refresh();
				});

				App.trigger('logout');

				App.user = null;
			}

		});

		$(document.body).addClass('fb-loaded');

	},

	login: function(cb) {

		if (App.user) {
			cb(null, App.user);
		} else {
			FB.login(function() {
				cb(null, App.user || null);
			});
		}

	},

	changeView: function(to) {

		if (this.currentView) {
			this.currentView.$el.hide();
			this.currentView.trigger('blur');

			$(document.body).removeClass('view-' + (this.currentView.$el.attr('id') || ''));
		}

		to.render(this.container);

		$(document.body).addClass('view-' + (to.$el.attr('id') || ''));
		to.trigger('focus');

		to.$el.fadeIn();
		to.$el.show();

		this.currentView = to;
	},

	search: function() {

		this.changeView(this.searchView);

	},

	editor: function() {

		this.changeView(this.editorView);

	},

	publish: function() {

		this.changeView(this.publishView);

	},

	player: function() {

		this.changeView(this.playerView);

	},

	setSnd: function(snd) {
		if (this.snd) {
			this.snd.pause();
		}
		this.snd = snd;
	}

});

window.App = new Application();

}).call(this);

