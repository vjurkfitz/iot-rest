var express     = require('express');
var bodyParser  = require('body-parser');
var mysql       = require('mysql');
var request     = require('request');
var app         = express();

var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'root',
  password        : '12345',
  database        : 'iot'
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/**
 *  Define ID parameter for all routes.
 *  Queries database to check that device exists before continuing with the function.
 *  If device with that ID doesn't exist in the database, returns error.
 */
app.param('id', function (req, res, next, id) {
  pool.query('SELECT ID, name, state FROM devices WHERE id=' + pool.escape(id), function(error, results) {
    if (error) {
      res.status(500).send(error);
      return next(error);
    };

    if ((results || []).length !== 1) {
      var err = new Error('Invalid ID');
      res.status(400).send(err);
      return next(err);
    }

    req.device = results[0];

    next();
  })
});

// ROUTES ******************************** 

/**
 *  GET devices 
 *  @return         array    Data of all devices in the DB
 */
app.get('/devices/all', function(req, res) {
  pool.query('SELECT * FROM devices', function(error, results) {
    if (error) {
      return res.status(500).send(error);
    }
    return res.status(200).send(results);
  })
})

/**
 *  GET device check 
 *  @param    id    int       Device ID
 *  @return         boolean   Whether device exists or not
 */
app.get('/devices/:id/check', function(req, res) {
  return res.status(200).send({ check: !!req.device });
})

/**
 *  GET device state 
 *  @param    id    int       Device ID
 *  @return         string    Status of the queried device
 */
app.get('/devices/:id/sensor/:sId', function(req, res) {
  if (req.device) {
    return res.status(200).send(req.device.state);
  }

  res.status(404).send('Device was not found.');
})

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
  console.log("SERVER: CREATE");
  var data  = req.body || {};
  var state = data.state || 'ACTIVE';
  var name  = data.name || 'NO_NAME';

  pool.query('INSERT INTO devices SET ?', { state: state, name: name }, function(error, results) {
    if (error) {
      return res.status(500).send(error);
    }

    request('http://localhost:3100/update-devices', function(error, response) {
      res.status(200).send('INSERTED: ' + results.insertId);
    })
  })
})

/**
 *  POST device update
 *  Updates device state. State data should be sent through request body in json format.
 *  Example: curl --request POST -d "{\"state\":\"INACTIVE\"}" localhost:3100/devices/2/update
 *  @param    id    int       ID of device that will be updated
 *  @return         string    Information about updated device: new state and affected rows
 */
app.post('/devices/:id/update', bodyParser.json({type: '*/*'}), function(req, res) {
  console.log("SERVER: UPDATE");
  var data = req.body || {};

  if (!data.state) {
    return res.status(400).send('Bad request: invalid state');
  }

  if (!req.device) {
    return res.status(404).send('Device not found');
  }

  pool.query('UPDATE devices SET state = ? WHERE ID = ?', [ data.state, req.params.id ], function(error, results) {
    if (error) {
      return res.status(500).send(error);
    }

    request('http://localhost:3100/update-devices', function(error, response) {
      res.status(200).send('Device was updated. New state: ' + data.state + '. Affected rows: ' + results.changedRows);
    })
  })
})

/**
 *  DELETE device
 *  @param    id    int       ID of device that will be deleted.
 *  @return         string    Message with information about deleted device.
 */
app.delete('/devices/:id/delete', function(req, res) {
  console.log("SERVER: DELETE");
  if (!req.device) {
    return res.status(404).send('Device not found');
  }

  pool.query('DELETE FROM devices WHERE ID = ?', [ req.params.id ], function(error, results) {
    if (error) {
      return res.status(500).send(error);
    }

    request('http://localhost:3100/update-devices', function(error, response) {
      res.status(200).send('Deleted device. ID: ' + req.params.id);
    })
  })
})

/**
 *  Start listening
 */
app.listen('3000', function() {
  console.log('App running at http://localhost:3000');
})

module.exports = app