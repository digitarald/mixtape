
var SearchTracks = Backbone.Collection.extend({

	model: Track,

	url: '/service/search'

});