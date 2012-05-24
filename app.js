var async = require('async');
var express = require('express');
var util = require('util');
var jade = require('jade');
var stylus = require('stylus');
var nib = require('nib');
var request = require('request');
var qs = require('querystring');
var sdigital = require('7digital-api');
var echonest = require('echonest');

// Redis

// if (process.env.REDISTOGO_URL) {
//	rtg = require('url').parse(process.env.REDISTOGO_URL);
//	redis = require('redis').createClient(rtg.port, rtg.hostname);
//	redis.auth(rtg.auth.split(':')[1]);
// } else {
//	redis = require('redis').createClient();
// }

// MongoDB

// mongoose = require('mongoose');
// mongoose.connect(process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://localhost/app');

// Echonest

echonest = new echonest.Echonest({
	api_key: process.env.EN_KEY
});

// 7digital

var api = sdigital.configure({
	consumerkey: process.env.SDIGITAL_KEY,
	consumersecret: process.env.SDIGITAL_SECRET,
	format: 'json'
});
var tracks = new api.Tracks();

// Usergrid

var OAuth2 = require('oauth').OAuth2;

var apigUrl = 'http://api.usergrid.com/' + process.env.APIG_APP + '/';
var apig = new OAuth2(process.env.APIG_ID, process.env.APIG_SECRET, apigUrl, 'token', 'token');

var apigToken;

apig.getOAuthAccessToken('', {
	grant_type: 'client_credentials'
}, function(err, access_token) {

	apigToken = access_token;

});

// Configure express

app = module.exports = express.createServer();

app.configure(function() {

  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());

  app.use(express.session({secret: process.env.SESSION_SECRET || 'secret123'}));

  app.use(app.router);

  // Stylus
  app.use(stylus.middleware({
    src: __dirname + '/public',
    compile: function(str, path) {
      var compiler;
      compiler = stylus(str);
      compiler.set('filename', path);
      compiler.set('compress', false);
      compiler.use(nib());
      return compiler;
    }
  }, app.helpers({
    _: require('underscore')
  })));

  app.use(express.static(__dirname + '/public'));

});

app.configure('development', function() {

  app.set('view options', {
    pretty: true
  });
  app.use(express.static(__dirname + '/public', {
    maxAge: 31557600000
  }));

  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));

});

app.configure('production', function() {

  return app.use(express.errorHandler());

});


// In memory cache for fast search

var cache = {
	search: {}
};

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function() {
	console.log('Listening on %d', port);
});


// Components

var index = function index(req, res) {

	res.render('index.jade', {
		title: 'Mixtape',
		env: {
			FB_ID: process.env.FB_ID,
			facebook_id: req.session.facebook_id || null,
			mixtape: req.session.mixtape || null
		}
	});

};

var saveMixtape = function(req, res, model) {

	request.post(apigUrl + 'mixtapes?' + qs.stringify({
		access_token: req.session.access_token
	}), {
		body: JSON.stringify(model),
		headers: {
			'content-type': 'application/json'
		}
	}, function(err, r, data) {

		data = JSON.parse(data);

		if (!data || !data.entities) {
			res.json(null);
		} else {
			var id = data.entities[0].uuid;

			// Update also in session
			model.id = id;

			res.json({id: id});
		}

	});

};

app.get('/', index);

app.get('/search', index);
app.get('/publish', index);
app.get('/player', index);
app.get('/mix/:id', index);

app.post('/login', function(req, res) {

	request.get(apigUrl + 'auth/facebook?' + qs.stringify({
		fb_access_token: req.body.token || null
	}), function(err, r, data) {

		data = JSON.parse(data);

		req.session.access_token = data.access_token;
		req.session.user_id = data.user.uuid;
		req.session.facebook_id = data.user.facebook.id;

		var url = apigUrl + 'users/' + req.session.user_id + '?' + qs.stringify({
			access_token: req.session.access_token
		});

		request.put(url, {
			body: JSON.stringify({
				activated: true
			}),
			headers: {
				'content-type': 'application/json'
			}
		}, function(err, r, data) {

			data = JSON.parse(data);

			if (req.session.mixtape) {
				saveMixtape(req, res, req.session.mixtape);
			} else {
				res.json(true);
			}

		});

	});

});


app.post('/save', function(req, res) {

	var model = JSON.parse(req.body.mixtape);

	req.session.mixtape = model;

	if (req.session.access_token) {
		saveMixtape(req, res, model);
	} else {
		res.json({});
	}

});

app.get('/play/:id', function play(req, res) {

	tracks.getPreview({trackId: req.params.id}, function(err, data) {

		var url = data.url || null;

		res.json({url: url});

	});

});


app.get('/service/search', function search(req, res) {

	var query = (req.param('q') || '').trim();
	var start = Number(req.param('s') || 0);

	if (!query.length) {
		res.json([]);
		return;
	}

	console.log('QUERY: %s', query);

	var cache_key = JSON.stringify([query, start]);

	var cachehit = cache.search[cache_key] || null;
	if (cachehit) {
		res.json(cachehit);
		return;
	}

	echonest.song.search({
		bucket: ['id:7digital-US', 'tracks', 'audio_summary'],
		limit: 'true',
		results: 25,
		start: start,
		combined: query,
		sort: 'song_hotttnesss-desc' // for better results, hits first
	}, function(err, data) {

		var idents = [];

		data = (data.songs || []).map(function(song) {

			var release_id = Number(song.tracks[0].foreign_release_id.match(/\d+$/)[0]);

			// Remove duplicates
			var ident = JSON.stringify([song.artist_name, song.title]).toLowerCase();
			if (ident in idents) {
				return null;
			}
			idents[ident] = true;

			return {
				id: song.id,
				artist: song.artist_name,
				title: song.title,
				preview_url: song.tracks[0].preview_url || null,
				image: song.tracks[0].release_image || null,
				duration: Math.round(song.audio_summary.duration),
				release_id: release_id,
				url: 'http://m.7digital.com/releases/' + release_id + '?partner=' + process.env.SIGITAL_PARTNER
			};
		}).filter(function(song) {
			return song;
		});

		cache.search[cache_key] = data;

		res.json(data);

	});

	return;

	// // 7digital track search API

	// tracks.search({q: query}, function(err, data) {

	//	data = data.searchResults.searchResult || []; // JSON, XML style

	//	var partner_id;

	//	data = data.map(function(track) {

	//		track = track.track;

	//		// Generate buy URL for mobile
	//		if (!partner_id && track.url) {
	//			partner_id = track.url.match(/partner=(\d+)/)[1]
	//		}
	//		var url = track.url;
	//		if (partner_id) {
	//			url = 'http://m.7digital.com/releases/' + track.release.id + '?partner=' + partner_id
	//		}

	//		// Nice duration
	//		var duration = +track.duration;

	//		return {
	//			id: +track.id,
	//			artist: track.artist.name,
	//			artist_id: +track.artist.id,
	//			title: track.title,
	//			release: track.release.title,
	//			release_id: +track.release.id,
	//			duration: duration,
	//			url: url,
	//			image: track.release.image || null
	//		};
	//	}).filter(function(track) {
	//		return track.duration < 1800
	//	});

	//	cache.search[query] = data;

	//	res.json(data);

	// });

});


app.post('/sms', function search(req, res) {

	var sms = req.params.sms;

	var body = qs.stringify({
		client_id: process.env.ATNT_ID,
		client_secret: process.env.ATNT_SECRET,
		grant_type: 'client_credentials',
		scope: 'SMS'
	});

	console.log(body);

	request.post({
		url: 'https://api.att.com/oauth/token',
		body: body
	}, function(err, r, data) {
		console.log(r, data);
	});

});

app.get('/channel', function(req, res) {

	res.setHeader('Cache-Control', 'public, max-age=' + (31557600000 / 1000)); // 1y
	res.send('<script src="//connect.facebook.net/en_US/all.js"></script>');

});

app.get('/manifest.webapp', function(req, res) {

	res.send(JSON.stringify({
		version: '0.1',
		name: 'Mixtape Stories',
		description: 'Every mix tape is a story. Put them together and they become the soundtrack of your life.',
		icons: {
			'256': '/img/icon-256.png'
		}
	}), {
		'Content-Type': 'application/x-web-app-manifest+json'
	});

});

