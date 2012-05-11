
var Track = Backbone.Model.extend({

	getSoundMgr: function($el, cb, onprogress) {
		var snd = this.get('snd');

		if (snd) {
			cb(snd);
			return;
		}

		var self = this;

		$el.attr('data-state', 'loading');

		$.getJSON('/play/' + this.get('id'), function(data) {

			snd = soundManager.createSound({
				id: self.get('id'),
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

			self.set('snd', snd, {silent: true});

			cb(snd);
		});

		// SndMgr.ready( SndMgr.createSound(… ( this.set('snd', snd); cb(snd) )) )
	}

});