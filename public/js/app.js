(function() {

var app = angular.module('app', ['ngResource']);

app.controller('MainCtrl', function($scope, $resource) {
  var Group = $resource('/api' + location.pathname);
  $scope.group = Group.get(function() {
    $scope.totals = $scope.group.results.map(function(result) {
      return result.points.map(Number);
    }).reduce(function(totals, points) {
      points.forEach(function(point, i) {
        totals[i] += point;
      });
      return totals;
    });
  });
});

})();
