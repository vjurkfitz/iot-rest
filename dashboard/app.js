var path		= require('path');
var express   	= require('express');
var app			= express();
var server 		= require('http').Server(app);
var io 			= require('socket.io')(server);

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

io.on('connection', function (socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
	  console.log(data);
	});
});

app.get('/update-devices', function(req, res) {
	io.emit('update-devices', 'all sockets');
	res.status(200).send('Updated');
})

/**
 *  Start listening
 */
server.listen('3100', function() {
  console.log('App running at http://localhost:3100');
})

module.exports = app