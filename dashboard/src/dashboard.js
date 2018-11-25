(function () {

	"use strict";

	angular.module("app", [])

    // Create socket to listen to events emitted from the main app
    // Based on this article: https://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
    .factory('socket', function($rootScope){
        var socket = io.connect();
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {  
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                })
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            }
        }
    })

    .service("DataService", function ($http) {
        var self = this;

        var baseUrl = 'http://localhost:3000/devices';

        self.getDevices = function() {
            return $http.get(baseUrl + '/all').then(function(res) {
                return (res || {}).data || [];
            });
        }
    })
    
    .controller("DashboardController", function($scope, DataService, socket) {
        
        _load();

        socket.on('update-devices', _load);

        function _load() {
            DataService.getDevices().then(function(res) {
                $scope.devices = res;
            })
        }
    });
})();
