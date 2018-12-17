var express     = require('express');
var bodyParser  = require('body-parser');
var mysql       = require('mysql');
var request     = require('request');
var app         = express();

var host        = process.env.HOST;

var dbHost      = process.env.DB_HOSTNAME;
var dbUser      = process.env.DB_USERNAME;
var dbPassword  = process.env.DB_PASSWORD;
var db          = process.env.DB_DATABASE;
var dashUrl     = process.env.IOT_DASHBOARD_URL;

var pool = mysql.createPool({
  connectionLimit : 10,
  host            : dbHost,
  user            : dbUser,
  password        : dbPassword,
  database        : db
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
  pool.query('SELECT ID, name FROM devices WHERE ID = ' + pool.escape(id), function(error, results) {
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

/**
 *  Define sId parameter for all routes.
 *  Queries database to check that sensor exists before continuing with the function.
 *  If a sensor with that ID doesn't exist in the database, returns error.
 */
app.param('sId', function (req, res, next, sId) {
  pool.query('SELECT ID, name, state, deviceId FROM sensors WHERE ID =' + pool.escape(sId), function(error, results) {
    if (error) {
      res.status(500).send(error);
      return next(error);
    };

    if ((results || []).length !== 1) {
      var err = new Error('Invalid sensor ID');
      res.status(400).send(err);
      return next(err);
    }

    req.sensor = results[0];

    next();
  })
});

// ROUTES ******************************** 

/**
 *  GET devices 
 *  @return         array    Data of all devices in the DB
 */
app.get('/devices/all', function(req, res) {
  var sql = "SELECT d.ID, d.name, GROUP_CONCAT(CONCAT(s.ID, '|', s.name, '|', s.state)) AS sensors " +
            "FROM devices d LEFT JOIN sensors s ON d.ID = s.deviceId " +
            "GROUP BY d.ID, d.name " +
            "ORDER BY s.modified DESC";
  
  pool.query(sql, function(error, results) {
    if (error) {
      return res.status(500).send(error);
    }

    results = results.reduce(function(arr, curr) {
      if (!curr.sensors) {
          curr.sensors = [];
      }
      else {
          var s = curr.sensors.split(',').reduce(function(sArr, sCurr) {
              var split = sCurr.split('|') || [];
              sArr.push({
                  ID: split[0] || '',
                  name: split[1] || '',
                  state: split[2] || ''
              })

              return sArr;
          }, []);

          curr.sensors = s;
      }
      arr.push(curr);
      return arr;
    }, []);

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
 *  GET sensor check 
 *  @param    id    int       Device ID
 *  @param    sId   int       Sensor ID
 *  @return         boolean   Whether sensor exists or not
 */
app.get('/devices/sensors/:sId/check', function(req, res) {
  return res.status(200).send({ check: !!req.sensor });
})

/**
 *  GET device state 
 *  @param    id    int       Device ID
 *  @return         string    Status of the queried device
 */
app.get('/devices/:id/sensor/:sId', function(req, res) {
  if (req.sensor) {
    return res.status(200).send(req.sensor.state);
  }

  res.status(404).send('Sensor was not found.');
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
  var data      = req.body || {};
  var name      = data.name || 'NO_NAME';
  var sensors   = data.sensors || [];

  pool.query('INSERT INTO devices SET ?', { name: name }, function(error, results) {
    if (error) {
      return res.status(500).send(error);
    }

    var deviceId = results.insertId;
    var toAddSensors = sensors.reduce(function(arr, curr) {
      arr.push([ curr.name, curr.state, deviceId ]);
      return arr;
    }, [])

    pool.query('INSERT INTO sensors (name, state, deviceId) VALUES ?', [toAddSensors], function(error, results2) {
      if (error) {
        return res.status(500).send(error);
      }

      request(dashUrl + '/update-devices', function(error, response) {
        res.status(200).send('INSERTED: ' + deviceId);
      })
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
app.post('/devices/:id/sensors/:sId/update', bodyParser.json({type: '*/*'}), function(req, res) {
  var data = req.body || {};

  if (!data.state) {
    return res.status(400).send('Bad request: invalid state');
  }

  if (!req.device) {
    return res.status(404).send('Device not found');
  }

  pool.query('UPDATE sensors SET state = ? WHERE ID = ?', [ data.state, req.params.sId ], function(error, results) {
    if (error) {
      return res.status(500).send(error);
    }

    request(dashUrl + '/update-devices', function(error, response) {
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
  if (!req.device) {
    return res.status(404).send('Device not found');
  }

  pool.query('DELETE FROM devices WHERE ID = ?', [ req.params.id ], function(error, results) {
    if (error) {
      return res.status(500).send(error);
    }

    request(dashUrl + '/update-devices', function(error, response) {
      res.status(200).send('Deleted device. ID: ' + req.params.id);
    })
  })
})

/**
 *  Start listening
 */
app.listen('3000', function() {
  console.log('App running at http://' + host + ':3000');
})

module.exports = app