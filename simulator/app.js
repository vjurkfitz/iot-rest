var path		= require('path');
var express   	= require('express');
var request 	= require('request');
var bodyParser 	= require('body-parser');
var app			= express();

const API 		= process.env.IOT_SERVER + '/devices';

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

/**
 *  Define ID parameter for all routes.
 *  Queries with server to check that device exists before continuing with the function.
 *  If device with that ID doesn't exist in the server, returns error.
 */
app.param('id', function (req, res, next, id) {
	var url = API + '/' + id + '/check';
	request(url, { json: true }, function(error, response, body) {
		if (error) {
			res.status(500).send(error);
			return next(error);
		}

		if (!(body || {}).check) {
			var err = new Error('Device not found');
			res.status(404).send(err);
			return next(err);
		}

		next();
	})
});

/**
 *  Define sID parameter for all routes.
 *  Queries with server to check that sensor exists before continuing with the function.
 *  If sensor with that ID doesn't exist in the server, returns error.
 */
app.param('sId', function (req, res, next, sId) {
	var url = API + '/sensors/' + sId + '/check';
	request(url, { json: true }, function(error, response, body) {
		if (error) {
			res.status(500).send(error);
			return next(error);
		}

		if (!(body || {}).check) {
			var err = new Error('Sensor not found');
			res.status(404).send(err);
			return next(err);
		}

		next();
	})
});

// ROUTES ******************************** 
/**
 *  POST create device
 *  Data should be sent through request body in json format.
 *  Example: curl --request POST -d "{\"name\":\"DEVICE-1\",\"state\":\"ACTIVE\"}" localhost:3100/devices/create
 *  Accepted params: 
 *    state:  string    - Device state. Default: ACTIVE 
 *    name:   string    - Device name. Default: NO_NAME
 * 
 *  @return         int     ID of inserted device
 */
app.post('/devices/create', bodyParser.json({type: '*/*'}), function(req, res) {
	var url = API + '/create';

	request.post(url, { form: JSON.stringify(req.body) }, function(error, response) {
		if (error) {
			return res.status(500).send(error);
		}
		res.status(200).send(response);
	})
})

/**
 *  POST sensor update
 *  Updates sensor state. State data should be sent through request body in json format.
 *  Example: curl --request POST -d "{\"state\":\"INACTIVE\"}" localhost:3100/devices/2/update
 *  @param		id		int		ID of device that will be updated
 * 	@param 		sId		int		ID of sensor that will be updated
 *  @return				string	Information about updated sensor: new state and affected rows
 */
app.post('/devices/:id/sensors/:sId/update', bodyParser.json({type: '*/*'}), function(req, res) {
	var url = API + '/' + req.params.id + '/sensors/' + req.params.sId + '/update';
	request.post(url, { form: JSON.stringify(req.body) }, function(error, response) {
		if (error) {
			return res.status(500).send(error);
		}
		res.status(200).send(response);
	})
})

/**
 *  DELETE device
 *  @param    id    int       ID of device that will be deleted.
 *  @return         string    Message with information about deleted device.
 */
app.delete('/devices/:id/delete', function(req, res) {
	var url = API + '/' + req.params.id + '/delete';
	request.delete(url, function(error, response) {
		if (error) {
			return res.status(500).send(error);
		}
		res.status(200).send(response);
	})
})

app.get('/*/*.*', function(req, res) {
	res.sendFile(path.join(__dirname + req.url));
});

app.get('/explorer', function(req, res) {
	res.sendFile(path.join(__dirname + '/explorer/explorer.html'));
});
  
/**
 *  Start listening
 */
app.listen('3200', function() {
  console.log('App running at http://' + process.env.HOST + ':3200');
})

module.exports = app