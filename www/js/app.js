// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('dareyoo', [
  'ionic',
  'ngCordova',
  'ngResource',
  'ngAnimate',
  'ngSanitize',
  'ngSpecialOffer',
  'ngStorage',
  'ionic.ion.imageCacheFactory',
  'ngCachedResource',
  'ionic.service.core',
  'ionic.service.push',
  //'ionic.service.deploy',
  'ionic.service.analytics',
  'ionic.contrib.ui.tinderCards',
  'ionic.rating',
  'dareyoo.services',
  'dareyoo.directives',
  'dareyoo.controllers'
])

.config(['$ionicAppProvider', '$resourceProvider', '$ionicConfigProvider', function($ionicAppProvider, $resourceProvider, $ionicConfigProvider) {
  // Identify app
  $ionicAppProvider.identify({
    // The App ID (from apps.ionic.io) for the server
    app_id: '0601cc1b',
    // The public API key all services will use for this app
    api_key: 'f968d2b03a3de56545c02363f9c342687b4ddf8f80172704',
    // The GCM project ID (project number) from your Google Developer Console (un-comment if used)
    gcm_id: '172312862699'
  });
  $resourceProvider.defaults.stripTrailingSlashes = false;

  //openFB.init({appId: '128967930634486'});

  //$ionicConfigProvider.backButton.text('');
}])

.run(function($rootScope, /*$ionicDeploy,*/ $ionicPlatform, $cordovaStatusbar, $http, $localstorage, $state, $q, $ionicAnalytics, $ImageCacheFactory, searchPic, conf, User, Team, Pool, League) {

  $ionicPlatform.ready(function() {

    $ionicAnalytics.register();

    // Hide the accessory bar by default
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }

    // Color the iOS status bar text to white
    if (window.StatusBar) {
      StatusBar.overlaysWebView(true);
      StatusBar.styleBlackTranslucent();
    }

    // Default update checking
    $rootScope.updateOptions = {
      interval: 2 * 60 * 1000
    };

    // Watch Ionic Deploy service for new code
    /*$ionicDeploy.watch($rootScope.updateOptions).then(function() {}, function() {}, function(hasUpdate) {
      $rootScope.lastChecked = new Date();
      console.log('WATCH RESULT', hasUpdate);
    });*/

    if(typeof analytics !== undefined) {
      analytics.startTrackerWithId("UA-40904039-2");
      //https://developers.google.com/analytics/devguides/collection/ios/v3/optional-features#idfa
      //analytics.enableAdvertisingIdCollection(true);
    }

    window.applicationPreferences.get("referrer", function(value) {
      $ionicAnalytics.track('referrer_' + value);
    });

    $rootScope.setAuth = function(auth) {
      if(auth && Object.keys(auth).length !== 0) {
        $rootScope.auth = auth;
        $localstorage.setObject('auth', auth);
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + auth.access_token;
      }
    };

    $rootScope.refreshToken = function() {
      if($rootScope.auth && $rootScope.auth.refresh_token) {
        var req = {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          url: conf.DOMAIN + 'auth/token',
          params: {
           'grant_type': 'refresh_token',
           'client_id': conf.CLIENT_ID,
           'client_secret': conf.CLIENT_SECRET,
           'refresh_token': $rootScope.auth.refresh_token,
          }
        }
        return $http(req).success(function(resp){
          $rootScope.setAuth(resp);
          return $rootScope.getAllInfo();
        }).error(function(error){
          console.log(error);
          $state.go('login');
          $rootScope.hideSplash();
        });
      } else {
        $state.go('login');
        $rootScope.hideSplash();
      }
    };

    $rootScope.getTeams = function() {
      $rootScope.teams = Team.query();
      $rootScope.waiting_teams = Team.pending();
      $rootScope.friend_teams = Team.friends();
      return $q.all([
         $rootScope.teams.$promise,
         $rootScope.waiting_teams.$promise,
         $rootScope.friend_teams.$promise
      ]).then(function(){
        var pics = searchPic($rootScope.teams)
          .concat(searchPic($rootScope.waiting_teams))
          .concat(searchPic($rootScope.friend_teams));
        return $ImageCacheFactory.Cache(pics).then(function(){
          $rootScope.$broadcast('teams-loaded');
          $rootScope.$broadcast('scroll.refreshComplete');
        });
      }, function(error) {
        return $rootScope.refreshToken();
      });
    };

    $rootScope.loading_pools = false;
    $rootScope.getPools = function() {
      $rootScope.loading_pools = true;
      $rootScope.pools = Pool.current();
      return $rootScope.pools.$promise.then(function(){
        return $ImageCacheFactory.Cache(searchPic($rootScope.pools)).then(function(){
          $rootScope.$broadcast('pools-loaded');
          $rootScope.loading_pools = false;
        });
      }, function(error) {
        return $rootScope.refreshToken();
      });
    };

    $rootScope.getLeagues = function() {
      $rootScope.league = League.get({leagueId:1});
      return $rootScope.league.$promise.then(function(){
        return $ImageCacheFactory.Cache(searchPic($rootScope.league)).then(function(){
          $rootScope.$broadcast('leagues-loaded');
          $rootScope.$broadcast('scroll.refreshComplete');
        });
      }, function(error) {
        return $rootScope.refreshToken();
      });
    };

    $rootScope.getMe = function() {
      $rootScope.me = User.me();
      return $rootScope.me.$promise.then(function(){
        if(typeof analytics !== undefined && $rootScope.me.ionic_id)
          window.analytics.setUserId($rootScope.me.ionic_id);
        return $ImageCacheFactory.Cache([$rootScope.me.pic]).then(function(){
          $rootScope.$broadcast('me-loaded');
        });
      }, function(error) {
        return $rootScope.refreshToken();
      });
    };

    $rootScope.getAllInfo = function(skip_me) {
      var all = [
         $rootScope.getTeams(),
         $rootScope.getPools(),
         $rootScope.getLeagues()
      ];
      if(!skip_me)
        all.push($rootScope.getMe());
      return $q.all(all);
    };

    $rootScope.get_name = function(user) {
      if(user)
        return user.first_name || user.username;
      return '';
    }

    $rootScope.width = (document.documentElement.clientWidth || window.innerWidth);
    
    var auth = $localstorage.getObject('auth');
    if(auth) {
      $rootScope.setAuth(auth);
      $rootScope.getMe().then(function(){
        $rootScope.hideSplash();
        return $rootScope.getAllInfo(true);
      }).then(function() {
        //$state.go('tab.play');
        $rootScope.hideSplash();
      });
    } else {
      $state.go('login');
      $rootScope.hideSplash();
    }
    
  });

  $rootScope.hideSplash = function() {
    setTimeout(function() {
      if(navigator.splashscreen)
        navigator.splashscreen.hide();
    }, 100);
  };

  /*$ionicPlatform.on("resume", function(){
    facebookConnectPlugin.getLoginStatus(function(success){
      if(success.status != 'connected'){
        $state.go('login');
      }
    });
  });*/

    // UI Router Authentication Check
  /*$rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
    if (toState.data && toState.data.authenticate) {
      facebookConnectPlugin.getLoginStatus(function(success){
        if(success.status === 'connected'){

        }else{
          event.preventDefault();
          $state.go('login');
        }
      },
      function(fail){
      });
    }
  });*/

})

.config(function($stateProvider, $urlRouterProvider, $ionicAppProvider) {
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })

  .state('on-board-new-team', {
    url: '/on-board-new-team',
    templateUrl: 'templates/on-board-new-team.html',
    controller: 'OnBoardNewTeamCtrl'
  })

  .state('on-board-invite', {
    url: '/on-board-invite',
    templateUrl: 'templates/on-board-invite.html',
    controller: 'OnBoardInviteCtrl'
  })

  .state('on-board-join-team', {
    url: '/on-board-join-team',
    templateUrl: 'templates/on-board-join-team.html',
    controller: 'OnBoardJoinTeamCtrl'
  })

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  // Each tab has its own nav history stack:

  .state('tab.league', {
    url: '/league',
    views: {
      'tab-league': {
        templateUrl: 'templates/league.html',
        controller: 'LeagueCtrl'
      }
    }
  })
    .state('tab.league.prev', {
        url: '/prev',
        views: {
          'leaderboards': {
            templateUrl: 'templates/league-prev.html'
          }
        }
      })
    .state('tab.league.current', {
        url: '/current',
        views: {
          'leaderboards': {
            templateUrl: 'templates/league-current.html'
          }
        }
      })

  .state('tab.teams', {
      url: '/teams',
      views: {
        'tab-teams': {
          templateUrl: 'templates/my-teams.html',
          controller: 'TeamsCtrl'
        }
      }
    })
    .state('tab.teams.waiting', {
        url: '/waiting',
        views: {
          'teams': {
            templateUrl: 'templates/waiting-teams.html',
          }
        }
      })
    .state('tab.teams.current', {
        url: '/current',
        views: {
          'teams': {
            templateUrl: 'templates/current-teams.html',
          }
        }
      })
    .state('tab.teams.friends', {
        url: '/friends',
        views: {
          'teams': {
            templateUrl: 'templates/friends-teams.html',
          }
        }
      })
  .state('tab.new-team', {
    url: '/new',
    views: {
      'tab-teams': {
        templateUrl: 'templates/new-team.html',
        controller: 'NewTeamCtrl'
      }
    }
  })
  .state('tab.team-detail', {
    url: '/team/:teamId',
    views: {
      'tab-teams': {
        templateUrl: 'templates/team-detail.html',
        controller: 'TeamDetailCtrl'
      }
    }
  })
    .state('tab.team-detail.current', {
      url: '/current',
      views: {
        'team-detail': {
          templateUrl: 'templates/team-detail-current.html'
        }
      }
    })
    .state('tab.team-detail.prev', {
      url: '/prev',
      views: {
        'team-detail': {
          templateUrl: 'templates/team-detail-prev.html'
        }
      }
    })
  .state('tab.market', {
    url: '/team/:teamId/market',
    views: {
      'tab-teams': {
        templateUrl: 'templates/market.html',
        controller: 'TeamMarketCtrl'
      }
    }
  })

  .state('tab.play', {
    url: '/play',
    views: {
      'tab-play': {
        templateUrl: 'templates/play.html',
        controller: 'PlayCtrl'
      }
    }
  })

  .state('winner', {
    url: '/winner',
    templateUrl: 'templates/winner.html',
    controller: 'WinnerCtrl'
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/play');

});
