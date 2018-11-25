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

        self.updateDevice = function(id, data) {
            var url = baseUrl + '/' + id + '/update';
            return $http.post(url, data);
        }

        self.deleteDevice = function(id) {
            var url = baseUrl + '/' + id + '/delete';
            return $http.delete(url);
        }

    })
    
    .controller("ExplorerController", function($scope, DataService) {
        
        $scope.responses = {};

        function createDevice(data) {
            DataService.createDevice(data).then(function(res) {
                $scope.responses.create = res;
            })
        }

        function updateDevice(id, data) {
            DataService.updateDevice(id, data).then(function(res) {
                $scope.responses.update = res;
            })
        }

        function deleteDevice(id) {
            DataService.deleteDevice(id).then(function(res) {
                $scope.responses.delete = res;
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
                response: 'create'
            },
            {
                title: 'Update Device',
                fields: {
                    id: {
                        title: 'Device ID',
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
                    var data, id;
                    try {
                        id = this.fields.id.model;
                        data = JSON.parse(this.fields.data.model);
                        updateDevice(id, data);
                    }
                    catch(e) {
                        $scope.responses.update = 'Invalid JSON data. Error: ' + e.toString();
                    }
                },
                response: 'update'
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
                response: 'delete'
            }
        ]
    });
})();
