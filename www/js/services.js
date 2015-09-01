angular.module('dareyoo.services', [])

//http://learn.ionicframework.com/formulas/localstorage/
.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}])

.factory('blob', function() {
    //http://stackoverflow.com/questions/18550151/posting-base64-data-javascript-jquery
    //http://pastebin.com/1E2FAM5K
    return function dataURLToBlob(dataURL) {
      var BASE64_MARKER = ';base64,';
      if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = parts[1];
        return new Blob([raw], {type: contentType});
      } else {
        var parts = dataURL.split(BASE64_MARKER);
        var contentType = parts[0].split(':')[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;
 
        var uInt8Array = new Uint8Array(rawLength);
 
        for (var i = 0; i < rawLength; ++i) {
         uInt8Array[i] = raw.charCodeAt(i);
       }
       return new Blob([uInt8Array], {type: contentType});
     }
   };
})

.factory('searchPic', function() {
    return function searchPic(root) {
      var img = [];
      for (var i in root) {
        if (root[i] !== null) {
          if(typeof(root[i])=="object" && i.indexOf("_") != 0 && i.indexOf("$") != 0) {
            img.push(searchPic(root[i]));
          } else if(typeof(root[i])=="string" &&
              (root[i].indexOf(".jpg", this.length - ".jpg".length) !== -1 ||
               root[i].indexOf(".jpeg", this.length - ".jpeg".length) !== -1 ||
               root[i].indexOf(".png", this.length - ".png".length) !== -1 ||
               root[i].indexOf(".gif", this.length - ".gif".length) !== -1 )) {
            img.push(root[i]);
          }
        }
      }
      return [].concat.apply([], img);
   };
})

.factory('conf', function() {
  return {
    //DOMAIN: 'http://127.0.0.1:8000/',
    //BASE_URL: 'http://127.0.0.1:8000/api/',
    DOMAIN: 'http://www.teamwinapp.com/',
    BASE_URL: 'http://www.teamwinapp.com/api/',
    CLIENT_ID: 'Wx8RAZQaAWbHbOraq7tNY6aBWS4OEL3hSiRnMXnk',
    CLIENT_SECRET: 'GCb24E6bbWjOb1Yz8jjJ5mbPUValFll3b47XTv0sLdxtTejRPW2qKWcC1OgBHUTWL5u8qeiNP6318LfQiusyqUXIWx42TH3Ol5RJ4Uz2g0m7dlimyB6skSIhJegu3kuh',
    FACEBOOK_APP_ID: '1039296369414133',
    //FACEBOOK_APP_ID: '128967930634486',
    IOS_ID: '1023751394',
    ANDROID_ID: 'com.dareyoo.teamwin',
    APP_VERSION: '1.0.0',
    extra_action: function(url, action, method, isArray, req, resp) {
      return {
        method: method || 'POST',
        url: url + action + '/',
        isArray: isArray || false,
        transformRequest: req || function (data) { return null; },
        transformResponse: resp || function (data) { return null; }
      }
    },
  };
})

.factory('User', function($resource, $http, conf, blob) {
  var url = conf.BASE_URL + 'users/:userId/';
  var User = $resource(url, {userId: '@id'}, {
    me: {method:'GET', isArray:false, url: conf.BASE_URL + 'users/me/'},
    update: {method:'POST', isArray:false, url: conf.BASE_URL + 'users/me/'},
    add_friend: conf.extra_action(url, 'add_friend'),
    match: conf.extra_action(url, 'match', 'GET', false, null, function(data){return JSON.parse(data);})
   });
  User.prototype.get_name = function() {
    return this.first_name || this.username;
  };
  User.prototype.share_results = function() {
    var list = document.getElementsByClassName("hide-share-img")[0];
    document.body.appendChild(list);
    return html2canvas(document.getElementsByClassName("canvas")[0], {
      allowTaint: false,
      useCORS: true,
      background: "#2c2c30",
      width: 1220,
      height: 620
    }).then(function(c) {
      var fd = new FormData();
      var b = blob(c.toDataURL());
      fd.append("results", b, "results");
      //conf.BASE_URL = "http://127.0.0.1:8000/api/";
      var req = $http.post(conf.BASE_URL + 'users/share_results/', fd, {
          headers: {'Content-Type': undefined},
          transformRequest: angular.identity
      });
      return req;
    });
    
  };
  return User;
}) 

.factory('Team', function($resource, $http, blob, conf) {
  var url = conf.BASE_URL + 'teams/:teamId/';
  
  var Team = $resource(url, {teamId: '@id'}, {
    request_enroll: conf.extra_action(url, 'request_enroll'),
    leave: conf.extra_action(url, 'leave'),
    sign: conf.extra_action(url, 'sign'),
    fire: conf.extra_action(url, 'fire'),
    friends: {method:'GET', isArray:true, params:{friends:true}},
    pending: {method:'GET', isArray:true, params:{pending:true}},
    search: {method:'GET', isArray:true, url: conf.BASE_URL + 'teams/search/'}
   });

  Team.prototype.upload_avatar = function(image) {
    var fd = new FormData();
    var b = blob(image);
    fd.append("avatar", b, "avatar");
    var req = $http.post(conf.BASE_URL + 'teams/' + this.id + "/upload_avatar/", fd, {
        headers: {'Content-Type': undefined},
        transformRequest: angular.identity
    });
    return req;
  };

  return Team;
})

.factory('Pool', function($resource, conf) {
  var url = conf.BASE_URL + 'pools/:poolId/';
  return $resource(url, {poolId: '@id'}, {
    pending: {method:'GET', isArray:true, params:{pending:true}},
    current: {method:'GET', isArray:true, params:{current:true}},
    play: conf.extra_action(url, 'play'),
    set: conf.extra_action(url, 'set')
   });
})

.factory('League', function($resource, conf) {
  var url = conf.BASE_URL + 'leagues/:leagueId/';
  return $resource(url, {leagueId: '@id'}, {
    enroll: conf.extra_action(url, 'enroll'),
    leave: conf.extra_action(url, 'leave'),
    extra_points: conf.extra_action(url, 'extra_points')
   });
});
