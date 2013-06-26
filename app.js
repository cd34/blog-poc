var base_url = 'http://k1c2.mia.colo-cation.com:7379/';

var ab = angular.module('ab', ['ngSanitize']).
  config(function($routeProvider, $locationProvider) {
  $locationProvider.hashPrefix('!');
  $routeProvider.
      when('/', {templateUrl: 'partials/index.html', controller: IndexCtrl}).
      when('/:post/:id', {templateUrl: 'partials/post.html', controller: PostCtrl}).
      when('/categories', {templateUrl: 'partials/categories.html', controller: CategoryCtrl}).
      when('/tags', {templateUrl: 'partials/tags.html', controller: TagCtrl}).
      otherwise({redirectTo: '/'});
});

ab.factory('page', function(){
  var title = 'cycling.cd34.com';
  return {
    title: function() { return title; },
    setTitle: function(newTitle) { title = newTitle; }
  };
});

function MainCtrl($scope, page) {
  $scope.page = page;
}

function IndexCtrl($scope, $routeParams, $http) {
  var posts_url = base_url + 'LRANGE/posts/0/-1?callback=JSON_CALLBACK';
  var post_url = base_url + 'GET/post:%s?callback=JSON_CALLBACK';

  var posts = [];
  $http.jsonp(posts_url).success(function(data, status, headers, config) {
    for(loop=0;loop<data.LRANGE.length;loop++) {
      $http.jsonp(post_url.replace('%s', data.LRANGE[loop]))
        .success(function(data, status, headers, config) {
          posts.push(angular.fromJson(data.GET));
        });
    };
    $scope.posts = posts;
  });
}

function PostCtrl($scope, $routeParams, $http, page) {
  var post_url = base_url + 'GET/post:%s?callback=JSON_CALLBACK';
  $http.jsonp(post_url.replace('%s', $routeParams.id))
    .success(function(data, status, headers, config) {
      result = angular.fromJson(data.GET);
      $scope.post = result;
      page.setTitle(result.title);
    });
}

function CategoryCtrl($scope, $routeParams, $http) {
  var cat_url = base_url + 'LRANGE/categories/0/-1?callback=JSON_CALLBACK';
  var categories = [];
  $http.jsonp(cat_url)
    .success(function(data, status, headers, config) {
      angular.forEach(data.LRANGE.sort(), function (cat) {
        categories.push(angular.fromJson(cat));
      });
      $scope.categories = categories;
    });
}

function TagCtrl($scope, $routeParams, $http) {
  var tag_url = base_url + 'LRANGE/tags/0/-1?callback=JSON_CALLBACK';
  $http.jsonp(tag_url)
    .success(function(data, status, headers, config) {
      $scope.tags = angular.fromJson(data.LRANGE);
    });
}
