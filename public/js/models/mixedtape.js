
var MixedTape = Backbone.Model.extend({

	defaults: {
		title: ''
	},

	initialize: function() {

		this.set('playlist', new PlayerTracks(this.get('playlist')));

	},

	toJSON: function() {

		var json = _.clone(this.attributes);
		json.playlist = this.get('playlist').toJSON();

		return json;
	}

});