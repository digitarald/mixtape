
var MixedTape = Backbone.Model.extend({

	defaults: {
		title: '',
		playlist: [],
		sides: [0, 0]
	},

	initialize: function() {

		this.set('playlist', new PlayerTracks(this.get('playlist')));

	},

	toJSON: function() {

		var json = _.clone(this.attributes);
		json.playlist = this.get('playlist').toJSON();

		return json;
	},

	save: function() {

		var self = this;

		$.post('/save', {mixtape: JSON.stringify(this.toJSON())}, function(values) {
			if (values) {
				console.log('Merged', values);
				self.set(values, {silent: true});
			}
		});

	}

});