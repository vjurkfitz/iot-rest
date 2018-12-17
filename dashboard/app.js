var path		= require('path');
var express   	= require('express');
var app			= express();
var server 		= require('http').Server(app);
var io 			= require('socket.io')(server);

var host 		= process.env.HOST;

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// ROUTES ******************************** 
app.get('/*/*.*', function(req, res) {
	res.sendFile(path.join(__dirname + req.url));
});

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/src/dashboard.html'));
});

app.get('/config', function(req, res) {
	var config = {
		server: process.env.SERVER
	}
	res.send(config);
})

app.get('/update-devices', function(req, res) {
	io.emit('update-devices', 'all sockets');
	res.status(200).send('Updated');
})

/**
 *  Start listening
 */
server.listen('3100', function() {
  console.log('App running at http://' + host + ':3100');
})

module.exports = app