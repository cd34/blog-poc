angular.module('ab', []).
  config(function($routeProvider, $locationProvider) {
  $locationProvider.hashPrefix('!');
  $routeProvider.
      when('/', {templateUrl: 'partials/index.html', controller: IndexCtrl}).
      when('/post/:id/:action', {templateUrl: 'partials/post.html', controller: PostCtrl}).
      when('/settings', {templateUrl: 'partials/settings.html', controller: SettingsCtrl}).
      when('/categories', {templateUrl: 'partials/categories.html', controller: CategoryCtrl}).
      when('/tags', {templateUrl: 'partials/tags.html', controller: TagCtrl}).
      otherwise({redirectTo: '/'});
});

var base_url = 'http://cycling.cd34.com:7379/';

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

function CategoryCtrl($scope, $routeParams, $http, $window) {
  $scope.update_slug = function() {
    $scope.category.slug = slugify($scope.category.title);
  };

  var cat_url = base_url + 'LRANGE/categories/0/-1?callback=JSON_CALLBACK';
  var categories = [];
  $http.jsonp(cat_url)
    .success(function(data, status, headers, config) {
      angular.forEach(data.LRANGE.sort(), function (cat) {
        categories.push(angular.fromJson(cat));
      });
      $scope.categories = categories;
    });

  $scope.update = function(category) {
    var category_new = base_url + 'LPUSH/categories/%s?callback=JSON_CALLBACK';

    $http.jsonp(category_new.replace('%s', angular.toJson(category)))
      .success(function(data, status, headers, config) {
        $window.location.reload();
      });
  }
}

function TagCtrl($scope, $routeParams, $http) {
  var tag_url = base_url + 'LRANGE/tags/0/-1?callback=JSON_CALLBACK';
  $http.jsonp(tag_url)
    .success(function(data, status, headers, config) {
      $scope.tags = angular.fromJson(data.LRANGE);
    });
}

function SettingsCtrl($scope, $routeParams, $http, $window) {
}

function Post(title, content, author, category, tags, id, http) {
    this.id = id;
    this.title = title;
    this.content = content.replace(/\n/g, '<br>');
    this.slug = slugify(title);
    this.excerpt = '';
    this.author = author;
    this.published = new Date();
    this.category = category;
    this.tags = '';
    this.http = http;
}

Post.prototype.set = function() {
// incr post_sequence
// check posts, is sequence there (for later edit)
// create post:sequence
  var incr_url = base_url + 'INCR/post_sequence?callback=JSON_CALLBACK';
  var post_list = base_url + 'LPUSH/posts/%d?callback=JSON_CALLBACK';
  var post_url = base_url + 'SET/post:%d/%s?callback=JSON_CALLBACK';

  var post_hash = { 'id':this.id, 'title':this.title, 'slug':this.slug, 
      'excerpt':this.excerpt, 'content':this.content, 'author':this.author,
      'published':this.published, 'tags':this.tags, 'category':this.category };

  // hideous - scope issue
  var http = this.http;

  if (this.id == 0) { 
// new post
    http.jsonp(incr_url)
      .success(function(data, status, headers, config) {
        this.id = data['INCR'];
        post_hash['id'] = this.id;
console.log(post_hash);
            http.jsonp(post_url.replace('%d', this.id)
              .replace('%s', escape(angular.toJson(post_hash))))
              .success(function(data, status, headers, config) {
//  var post_url = base_url + 'SET/post:%d';
//            http.post(base_url,
//              'SET/POST:' + this.id + '/' + escape(angular.toJson(post_hash)))
//              .success(function(data, status, headers, config) {
console.log(data);
        http.jsonp(post_list.replace('%d', this.id))
          .success(function(data, status, headers, config) {
                window.location = '#!/';
              });
          });
      });
    
  } else {
// editing post
  }
}

function slugify(text) {
  text = text.replace(/\//g, '-');
  text = text.toLowerCase().replace(/[^-a-zA-Z0-9\s]+/ig, '');
  text = text.replace(/\s/gi, '-');
  text = text.replace(/-{2,}/gi, '-');
  text = text.replace(/^-+/ig, '').replace(/-+$/ig, '');
  return text;
}

function PostCtrl($scope, $routeParams, $http) {
  var cat_url = base_url + 'LRANGE/categories/0/-1?callback=JSON_CALLBACK';
  var categories = [];
  $http.jsonp(cat_url)
    .success(function(data, status, headers, config) {
      angular.forEach(data.LRANGE.sort(), function (cat) {
        categories.push(angular.fromJson(cat));
      });
      $scope.categories = categories;
    });

  if ($routeParams['action'] == 'edit') { 
  var post_url = base_url + 'GET/post:%s?callback=JSON_CALLBACK';
  $http.jsonp(post_url.replace('%s', $routeParams.id))
    .success(function(data, status, headers, config) {
      result = angular.fromJson(data.GET);
      $scope.post = result;
    });
  }

  $scope.update_slug = function() {
    $scope.post.slug = slugify($scope.post.title);
  };

  $scope.update = function(post) {
    post.author = 'cd34';
    var new_post = new Post(post.title, post.content, post.author, 
       post.category, post.tags, 0, $http);
    new_post.set();
  }

}
