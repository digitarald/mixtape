// Main Playlist, split in A and B

var Player = Backbone.View.extend({

	el: '#player',

	events: {
		'click .play': 'playPause'
	},

	initialize: function() {
		this.$lists = [
			this.$el.find('.playList-a ul'),
			this.$el.find('.playList-b ul')
		];

		this.currentSound = null;
		this.sounds = [];
		this.soundsLoaded = false;
		this.playing = false;
		this.$songs = [];
		this.$button = this.$el.find('button.play i')
	},

	render: function() {
		var tracks = this.model.get('playlist');

		tracks.forEach(function(track) {
			var list = this.$lists[track.get('side')];
			var li = $('<li>');
			li.text(track.get('title'));
			list.append(li);
			this.$songs.push(li);
		}, this);
	},

	playPause: function(evt) {
		if (this.playing)
			this.pause();
		else
			this.play();
	},

	play: function() {
		this.playing = true;

		this.$el.addClass('playing');
		this.$button.removeClass('icon-play').addClass('icon-pause');

		if (this.currentSound) {
			this.currentSound.play();
		} else {
			var tracks = this.model.get('playlist');
			this.loadSounds(tracks);
			this.sounds[0].play();
		}
	},

	pause: function() {
		this.playing = false;
		this.$button.removeClass('icon-pause').addClass('icon-play');

		if (this.currentSound) {
			this.currentSound.pause();
		}
		this.$el.removeClass('playing');
	},

	loadSounds: function(tracks) {
		// Imediately fetch the first song.  Once that one starts playing it will
		// fetch the next song and so on...
		var self = this;
		var totalTracks = tracks.length;

		tracks.forEach(function(track, index) {
			var sound = soundManager.createSound({
				id: track.get('id'),
				url: track.get('previewurl'),
				autoLoad: false,
				autoPlay: false,
				whileloading: function(){},
				onfinish: function() {
					self.$songs[index].removeClass('playing');

					var next = index + 1;
					if (next < totalTracks)
						self.sounds[next].play();
					else {
						self.currentSound = self.sounds[0];
						self.pause();
					}
				},
				onpause: function() {},
				onplay: function() {
					self.currentSound = self.sounds[index];
					self.$el.find('.playing').removeClass('playing');
					self.$songs[index].addClass('playing');

					var next = index + 1;
					if (next < totalTracks)
						self.sounds[next].load();
				},
				onresume: function() {
					self.$songs[index].addClass('playing');
				},
				onstop: function() {
					self.$songs[index].removeClass('playing');
				},
				onload: function() {}
			});

			self.sounds.push(sound);
		});
	}
});