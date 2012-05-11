
var SearchTracks = Backbone.Collection.extend({

	model: Track,

	url: '/searchResults'

});