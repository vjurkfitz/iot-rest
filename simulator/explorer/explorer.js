(function () {

	"use strict";

	angular.module("app", [])

    .service("DataService", function ($http) {
        var self = this;

        var baseUrl = 'http://localhost:3200/devices';

        self.createDevice = function(data) {
            var url = baseUrl + "/create";
            return $http.post(url, data);
        }

        self.updateDevice = function(id, sId, data) {
            var url = baseUrl + '/' + id + '/sensors/' + sId + '/update';
            return $http.post(url, data);
        }

        self.deleteDevice = function(id) {
            var url = baseUrl + '/' + id + '/delete';
            return $http.delete(url);
        }

    })

    .filter('json', function () {
        return function (text) {
            text = text || '';
            return text.replace(/"/g, '\\"');
        };
    })
    
    .controller("ExplorerController", function($scope, DataService) {
        
        var u = 'BL"U"ULB';
        u = u.replace(/"/g, '\\"');
        console.log("u: ", u);
        $scope.responses = {};
        var baseUrl = 'http://localhost:3200/devices';

        function createDevice(data) {
            DataService.createDevice(data).then(function(res) {
                console.log("res: ", res);
                $scope.responses.create = {
                    status: res.status,
                    body: (res.data || {}).body
                };
            })
        }

        function updateDevice(id, sId, data) {
            DataService.updateDevice(id, sId, data).then(function(res) {
                $scope.responses.update = {
                    status: res.status,
                    body: (res.data || {}).body
                };
            })
        }

        function deleteDevice(id) {
            DataService.deleteDevice(id).then(function(res) {
                $scope.responses.delete = {
                    status: res.status,
                    body: (res.data || {}).body
                };
            })
        }

        $scope.actions = [
            {
                title: 'Create Device',
                fields: {
                    data: {
                        title: 'Data',
                        type: 'textarea',
                        model: ''
                    }
                },
                submit: function() {
                    var data;
                    try {
                        data = JSON.parse(this.fields.data.model);
                        createDevice(data);
                    }
                    catch(e) {
                        $scope.responses.create = 'Invalid JSON data. Error: ' + e.toString();
                    }
                },
                response: 'create',
                url: baseUrl + '/create',
                example: '{"name": "DEVICE_1", "sensors": [{"name": "SENSOR_1", "state": "ACTIVE"}, {"name": "SENSOR_2", "state": "DISABLED"}]}'
            },
            {
                title: 'Update Device',
                fields: {
                    id: {
                        title: 'Device ID',
                        type: 'text',
                        model: ''
                    },
                    sId: {
                        title: 'Sensor ID',
                        type: 'text',
                        model: ''
                    },
                    data: {
                        title: 'Data',
                        type: 'textarea',
                        model: ''
                    }
                },
                submit: function() {
                    var data, id, sId;
                    try {
                        id = this.fields.id.model;
                        sId = this.fields.sId.model;
                        data = JSON.parse(this.fields.data.model);
                        updateDevice(id, sId, data);
                    }
                    catch(e) {
                        $scope.responses.update = 'Invalid JSON data. Error: ' + e.toString();
                    }
                },
                response: 'update',
                url: baseUrl + '/:id/sensors/:sId/update',
                example: '{"state":"INACTIVE"}'
            },
            {
                title: 'Delete Device',
                fields: {
                    id: {
                        title: 'Device ID',
                        type: 'text',
                        model: ''
                    }
                },
                submit: function() {
                    var id;
                    try {
                        id = this.fields.id.model;
                        deleteDevice(id);
                    }
                    catch(e) {
                        $scope.responses.delete = 'Error: ' + e.toString();
                    }
                },
                response: 'delete',
                url: baseUrl + '/:id/delete'
            }
        ]
    });
})();
