angular.module('dareyoo.controllers', [])

.controller('WinnerCtrl', function($scope, $rootScope, $state, $ionicAnalytics, conf) {
  $ionicAnalytics.track('winner');
  if(typeof analytics !== undefined) analytics.trackView("winner");

  $scope.share = function() {
    //https://github.com/Wizcorp/phonegap-facebook-plugin/blob/master/TROUBLESHOOTING.md#missing-facebookconnectplugin
    if(!window.cordova)
      facebookConnectPlugin.browserInit(conf.FACEBOOK_APP_ID);
    facebookConnectPlugin.showDialog( 
    {
        method: "feed",
        picture: 'https://s3-eu-west-1.amazonaws.com/teamwin/app_shares/winner.jpg',
        link: 'http://www.teamwinapp.com',
        name: '¡He ganado 50€ en Teamwin!',
        message: '',    
        caption: 'www.teamwinapp.com',
        description: 'Tu también puedes. Descárgate GRATIS la app y gana 50€ cada semana pronosticando los partidos de La Liga BBVA. Ya disponible en Apple Store y Google Play.'
    }, 
    function (response) {
      $ionicAnalytics.track('shared_win');
      if(typeof analytics !== undefined) analytics.trackEvent("Share", 'win', 'facebook');
    },
    function (response) {  });
  };

})
.controller('LoginCtrl', function($scope, $rootScope, $state, $http, $filter, $ionicUser, $ionicPush, $ionicPopup, $ionicAnalytics, $ionicPopup, conf) {

    $ionicAnalytics.track('login');
    if(typeof analytics !== undefined) analytics.trackView("login");

    var colors = ["#FE3B3B","#FBA02D","#39FF68","#FA08CA"];
    $scope.slideHasChanged = function(i) {
      //$scope.bg_color = colors[i];
    }
    $scope.bg_color = colors[0];
    $rootScope.width = (document.documentElement.clientWidth || window.innerWidth);
    $scope.login_error = function() {
      if($scope.loading_popup)
        $scope.loading_popup.close();
      $ionicPopup.alert({
       title: '¡Oooops!',
       template: 'No hemos podido conectarte con Facebook, por favor, inténtalo de nuevo. Disculpa las molestias...',
       cssClass: "popup-market",
       okText: 'OK',
       okType: 'base-btn',
      });
    };
    var fbLoginSuccess = function(response) {
      if (!response.authResponse){
        $scope.login_error();
        $ionicAnalytics.track('register_error', {via:'facebook'});
        if(typeof analytics !== undefined) analytics.trackException('register_error', false);
        return;
      }
      if (response.status === 'connected') {
          console.log('Facebook login succeeded', response);
          var req = {
            method: 'GET',
            url: conf.DOMAIN + 'auth/convert-token',
            headers: {
             'Authorization': 'Bearer facebook ' + response.authResponse.accessToken
            }
          }
          $http(req).success(function(resp){
            $ionicAnalytics.track('registered', {via:'facebook'});
            if(typeof analytics !== undefined) analytics.trackException('register_error', false);
            $rootScope.setAuth(resp);
            $rootScope.getAllInfo().then(function(){ $scope.state = 'push'; });
          }).error(function(){
            $scope.login_error();
          });
      } else {
          $ionicAnalytics.track('register_error', {via:'facebook'});
          if(typeof analytics !== undefined) analytics.trackException('register_error', false);
          $scope.login_error();
      }
    };
    var fbLoginError = function(response) {
      $ionicAnalytics.track('register_error', {via:'facebook'});
      if(typeof analytics !== undefined) analytics.trackException('register_error', false);
      $scope.login_error();
    };


    $scope.facebookLogin = function() {
      $scope.state = 'loading';
      $scope.loading_msg = "Calentando en la banda...";
      $scope.loading_popup = $ionicPopup.show({
        templateUrl: "templates/popup-initial-loading.html",
        cssClass: "popup-join-team",
        scope: $scope
      });
      if (!window.cordova) {
        console.log("LoginCtrl facebook browser");
        //this is for browser only
        facebookConnectPlugin.browserInit(conf.FACEBOOK_APP_ID);
      }

      facebookConnectPlugin.getLoginStatus(function(success){
        // alert(success.status);
       if(success.status === 'connected'){
          fbLoginSuccess(success);
       } else {
          //if (success.status === 'not_authorized') the user is logged in to Facebook, but has not authenticated your app
          //else The person is not logged into Facebook, so we're not sure if they are logged into this app or not.

          //this is a loader
          /*$ionicLoading.show({
            template: 'Loging in...'
          });*/

          //ask the permissions you need
          //you can learn more about FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.2
          facebookConnectPlugin.login(['email', 'user_friends'], fbLoginSuccess, fbLoginError);

        }
      });

    };
    $scope.continue = function() {
      $scope.state = 'loading';
      $scope.loading_msg = "Elaborando estrategia...";
      if(!$scope.me.ionic_id) {
        $scope.me.ionic_id = $ionicUser.generateGUID();
        if(typeof analytics !== undefined) window.analytics.setUserId($scope.me.ionic_id);
      }
      
      $ionicPush.register({
        canShowAlert: false, //Should new pushes show an alert on your screen?
        canSetBadge: true, //Should new pushes be allowed to update app icon badges?
        canPlaySound: true, //Should notifications be allowed to play a sound?
        canRunActionsOnWake: true, // Whether to run auto actions outside the app,
        onNotification: function(notification) {
          // Handle new push notifications here
          console.log(notification);
          if(notification.alert) { /// iOS notification
            if(notification.$state == 'winner') {
              $state.go(notification.$state);
            } else if(notification.alert) {
              var alertPopup = $ionicPopup.alert({
               title: 'Notificación',
               template: notification.alert,
               cssClass: "popup-market",
               okText: 'OK',
               okType: 'base-btn',
              }).then(function(res){
                console.log(res);
                $state.go(notification.$state, notification);
              });
            }
          } else if(notification.message) { /// Android notification
            if(notification.payload.payload.$state == 'winner') {
              $state.go('winner');
            } else if(notification.message) {
              var alertPopup = $ionicPopup.alert({
               title: 'Notificación',
               template: notification.message,
               cssClass: "popup-market",
               okText: 'OK',
               okType: 'base-btn',
              });/*.then(function(res){
                console.log(res);
                $state.go(notification.payload.payload.$state, JSON.parse(notification.payload.payload.$stateParams));
              });*/ // In iOS, when I perform this $state.go(...), and it's an inner screen, there's no way to go up the hierarchy
            }
          }
          return true;
        }
      }, {
        user_id: $scope.me.ionic_id,
        name: $scope.me.username,
        platform: ionic.Platform.platform(),
        device: ionic.Platform.device()
      }).then(function(deviceToken) {
        $scope.me.device_token = deviceToken;
        $scope.me.$update({}, function(){ $scope.next_screen(); });
      }, function() {
        $scope.me.$update({}, function(){ $scope.next_screen(); });
      });
      $rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
        $scope.me.device_token = data.token;
        $scope.me.$update({}, function(){ $scope.next_screen(); });
      });
    };
    $scope.next_screen = function() {
      $scope.loading_popup.close();
      $rootScope.available_teams = $filter("filter")($scope.friend_teams, function(team) {
        return team.players.length < 11;
      });
      if($rootScope.teams.length > 0) {
        $state.go('tab.play');
      } else if($rootScope.available_teams.length > 0) {
        $state.go('on-board-join-team');
      } else {
        $state.go('on-board-new-team');
      }
    };
})

.controller('OnBoardNewTeamCtrl', function($scope, $rootScope, $state, $q, $http, $ionicPopup, $ionicAnalytics, $ImageCacheFactory, blob, conf, $cordovaStatusbar, Team) {

  $ionicAnalytics.track('on_board_new_team');
  if(typeof analytics !== undefined) analytics.trackView("on_board_new_team");

  $rootScope.team = new Team();
  $scope.avatar = null;
  $rootScope.$on('event:file:selected',function(event,data){
    $scope.avatar = data;
  });
  $scope.create = function() {
    if(!$scope.avatar || !$scope.team.name) {
      var msg = 'Tienes que seleccionar una imagen para tu equipo.';
      if($scope.avatar)
        msg = 'Tienes que elegir un nombre para tu equipo.';
      var alertPopup = $ionicPopup.alert({
       title: '¡No tan rápido!',
       template: msg ,
       cssClass: "popup-market",
       okText: 'OK',
       okType: 'base-btn',
      });
    } else {
      $scope.state = 'loading';
      $scope.loading_msg = "Inscribiendo equipo...";
      $scope.loading_popup = $ionicPopup.show({
          templateUrl: "templates/popup-initial-loading.html",
          cssClass: "popup-join-team",
          scope: $scope
        });

      $scope.team.$save().$promise.then(function(res) {
        
        $scope.team.upload_avatar($scope.avatar.image).success(function(response){
          $scope.league.$enroll({team_id:$scope.team.id}, function(){
            $rootScope.getAllInfo(true).then(function(data) {
              $rootScope.team.pic = response.url;
              $ImageCacheFactory.Cache([response.url]);
              $scope.league.$enroll({team_id:$rootScope.team.id}, function(){
                $rootScope.getAllInfo(true).then(function(data) {
                  $scope.loading_popup.close();
                  $state.go('on-board-invite');
                });
              });
            });
          });
        });

      });
      
    }
  };
})

.controller('OnBoardInviteCtrl', function($rootScope, $scope, $cordovaSocialSharing, $ionicAnalytics) {

  $ionicAnalytics.track('on_board_invite');
  if(typeof analytics !== undefined) analytics.trackView("on_board_invite");

  var message = "Únete a mi equipo " + $scope.team.name + ", ¡Podemos ganar 50€ cada semana!\nPuedes descargarte la app en Google Play (play.google.com/store/apps/details?id=com.dareyoo.teamwin&referrer=shared_on_board_whatsapp) o Apple Store (appstore.com/teamwin)";
  var image = "";
  var link = "";
  $scope.shareViaFacebook = function() {
    console.log("FB share click");
    var kk = $cordovaSocialSharing.canShareVia('com.apple.social.facebook', message, null, null, null, function(e){
      $cordovaSocialSharing.shareViaFacebookWithPasteMessageHint(message, null /* img */, null /* url */, message, function() {console.log('share FB ok')}, function(errormsg){console.log("Error sharing on FB: ", errormsg)});
    }, function(e){console.log("Cant share on FB: ", e)})
    console.log(kk);
    $cordovaSocialSharing.shareViaFacebookWithPasteMessageHint(message, null /* img */, null /* url */, message, function() {console.log('share FB ok')}, function(errormsg){console.log("Error sharing on FB: ", errormsg)});
    /*$cordovaSocialSharing.canShareVia("facebook", message, image, link).then(function(result) {
      $cordovaSocialSharing.shareViaFacebook(message, image, link);
    });*/
  };
  $scope.shareViaWhatsapp = function() {
    $cordovaSocialSharing.canShareVia("whatsapp", message).then(function(result) {
      $cordovaSocialSharing.shareViaWhatsApp(message);
      $ionicAnalytics.track('shared_on_board_whatsapp');
      if(typeof analytics !== undefined) analytics.trackEvent("Share", 'on board', 'whatsapp');
    });
  };
  $scope.shareAnywhere = function(message, image, link) {
    $cordovaSocialSharing.share("", message, image, link);
  };
})

.controller('OnBoardJoinTeamCtrl', function($scope, $rootScope, $state, $q, $ionicPopup, $ionicAnalytics, $filter) {

  $ionicAnalytics.track('on_board_join_team');
  if(typeof analytics !== undefined) analytics.trackView("on_board_join_team");

  $scope.check_team = function(team) {
    $scope.team = team;
    $scope.join_popup = $ionicPopup.show({
      templateUrl: "templates/popup-join-team.html",
      cssClass: "popup-join-team",
      scope: $scope
    });
  };
  $scope.state = "init";
  $scope.cancel = function() {
    $scope.join_popup.close();
  };
  $scope.join = function(team) {
    $scope.state = "loading";
    $scope.loading_msg = "Negociando contrato...";
    team.$request_enroll({}, function(){
      $rootScope.getAllInfo(true).then(function(data) {
        $scope.state = "finish";
      });
    }, function() {
      $scope.state = "error";
    });
  };
  $scope.play = function() {
    $scope.join_popup.close();
    $state.go('tab.play');
  };
  $scope.init = function() {
    $rootScope.available_teams = $filter("filter")($scope.friend_teams, function(team) {
      return team.players.length < 11;
    });
  };
  $scope.$on('$ionicView.enter', function() {
    $scope.init();
  });
  $scope.$on('teams-loaded', function() {
    if($state.includes("on-board-join-team"))
      $scope.init();
  });
  $scope.init();
})

.controller('LeagueCtrl', function($sce, $scope, $rootScope, $state, $ionicAnalytics, $ionicScrollDelegate, $timeout, League) {
  $ionicAnalytics.track('league');
  if(typeof analytics !== undefined) analytics.trackView("league");
  $scope.show_desc = false;
  $scope.prizeDesc = function() {
    return $sce.trustAsHtml($scope.getPrizeDesc());
  };
  $scope.showDesc = function() {
    $scope.show_desc = true;
    $timeout(function(){
      $ionicScrollDelegate.resize();
    });
  };
  $scope.hideDesc = function() {
    $scope.show_desc = false;
    $ionicScrollDelegate.scrollTop();
    $timeout(function(){
      $ionicScrollDelegate.resize();
    });
  };

  $scope.isCurrentActive = function() { return $state.includes("tab.league.current") };
  $scope.isPrevActive = function() { return $state.includes("tab.league.prev") };
  $scope.canCurrent = function() {
    return $scope.league && $scope.league.leaderboard &&
      $scope.league.leaderboard.length && $scope.league.leaderboard[0].points > 0;
  };
  $scope.canPrev = function() {
    return $scope.league && $scope.league.prev_leaderboard
      && $scope.league.prev_leaderboard.length && $scope.league.prev_leaderboard[0].points > 0;
  };

  $scope.init_league = function() {
    if(!$scope.isCurrentActive() && !$scope.isPrevActive()) {
      if($scope.canCurrent())
        $state.go('tab.league.current');
      else if($scope.canPrev())
        $state.go('tab.league.prev');
    }
  };

  $scope.$on('$ionicView.enter', function() {
    $scope.init_league();
  });

  $scope.$on('leagues-loaded', function() {
    if($state.includes("tab.league"))
      $scope.init_league();
  });

  $scope.getPrizePic = function() {
    if($scope.league && $scope.league.prizes && $scope.league.prizes.length)
      return $scope.league.prizes[0].pic;
    return null;
  };
  $scope.getPrizeName = function() {
    if($scope.league && $scope.league.prizes && $scope.league.prizes.length)
      return $scope.league.prizes[0].name;
    return null;
  };
  $scope.getPrizeDesc = function() {
    if($scope.league && $scope.league.prizes && $scope.league.prizes.length)
      return $scope.league.prizes[0].description;
    return "";
  };
  $scope.init_league();
})

.controller('TeamsCtrl', function($scope, $rootScope, $state, $timeout, $filter, $ionicPopup, $ionicAnalytics) {
  $ionicAnalytics.track('teams');
  if(typeof analytics !== undefined) analytics.trackView("teams");

  $scope.isWaitingActive = function() { return $state.includes("tab.teams.waiting") };
  $scope.isCurrentActive = function() { return $state.includes("tab.teams.current") };
  $scope.isFriendsActive = function() { return $state.includes("tab.teams.friends") };

  $scope.leave = function(team, confirm, event) {
    if(confirm) {
      var leavePopup = $ionicPopup.confirm({
        title: '¿Abandonar ' + team.name + '?',
        subTitle: 'Si quieres volver a entrar el capitán tendrá que aceptarte de nuevo',
        cssClass: "popup-market",
        okText: 'SI',
        okType: 'base-btn',
        cancelText: 'NO',
        cancelType: 'cancel-popup-btn',
      });
      leavePopup.then(function(res) {
        if(res) {
          $scope.leave(team, false);
        }
      });
    } else {
      team.$leave({}, function(){
        $scope.getAllInfo(true);
      });
      $timeout(function(){
        var i = $scope.teams.indexOf(team);
        var i2 = $scope.waiting_teams.indexOf(team);
        if(i != -1)
          $scope.teams.splice(i, 1);
        else if(i2 != -1)
          $scope.waiting_teams.splice(i2, 1);
      });
    }
  };

  $scope.enroll = function(team) {
    team.$request_enroll({}, function(){
      $scope.getLeagues();
      $scope.getPools();
    });
    $timeout(function(){
      $scope.waiting_teams.splice($scope.waiting_teams.indexOf(team), 1);
      $scope.teams.push(team);
    });
  };

  $scope.dismiss = function(team) {
    team.$leave();
    $timeout(function(){
      $scope.waiting_teams.splice($scope.waiting_teams.indexOf(team), 1);
    });
  };
})

.controller('NewTeamCtrl', function($scope, $rootScope, $ionicPopup, $state, $ionicNavBarDelegate, $ionicHistory, $ionicAnalytics, Team) {
  $ionicAnalytics.track('new_team');
  if(typeof analytics !== undefined) analytics.trackView("new_team");

  $scope.back = function() {
    $ionicHistory.goBack();
  };

  $scope.team = new Team();
  $scope.avatar = null;

  $rootScope.$on('event:file:selected',function(event,data){
    $scope.avatar = data;
  });

  $scope.create = function() {
    if(!$scope.avatar || !$scope.team.name) {
      var msg = 'Tienes que seleccionar una imagen para tu equipo.';
      if($scope.avatar)
        msg = 'Tienes que elegir un nombre para tu equipo.';
      var alertPopup = $ionicPopup.alert({
       title: '¡No tan rápido!',
       template: msg ,
       cssClass: "popup-market",
       okText: 'OK',
       okType: 'base-btn',
      });
    } else {
      $scope.state = 'loading';
      $scope.loading_msg = 'Creando equipo...';
      $scope.loading_popup = $ionicPopup.show({
          templateUrl: "templates/popup-initial-loading.html",
          cssClass: "popup-join-team",
          scope: $scope
        });
      $scope.team.$save().$promise.then(function(res) {
        
        $scope.team.upload_avatar($scope.avatar.image).success(function(response){
          $scope.league.$enroll({team_id:$scope.team.id}, function(){
            $rootScope.getAllInfo(true).then(function(data) {
              $scope.loading_popup.close();
              $state.go('tab.team-detail.current', {teamId: $scope.team.id});
            })
          });
        });

      });
    }
  };
})

.controller('TeamDetailCtrl', function($scope, $rootScope, $stateParams, $state, $timeout, $ionicPopup, $ionicAnalytics, Team) {
  $ionicAnalytics.track('team_detail', {team_id: $stateParams.teamId});
  if(typeof analytics !== undefined) analytics.trackView("team_detail");

  $scope.prev_total_points = 0;
  $scope.leaderboard = [];
  $scope.prev_leaderboard = [];
  $scope.isCurrentActive = function() { return $state.includes("tab.team-detail.current") };
  $scope.isPrevActive = function() { return $state.includes("tab.team-detail.prev") };
  $scope.init_team = function() {
    var teams = $rootScope.teams.filter(function(elem){ return elem.id == $stateParams.teamId; });
    if(!teams.length)
      teams = $rootScope.waiting_teams.filter(function(elem){ return elem.id == $stateParams.teamId; });
    if(!teams.length)
      teams = $rootScope.friend_teams.filter(function(elem){ return elem.id == $stateParams.teamId; });
    if(teams.length) {
      $scope.team = teams[0];
      $scope.leaderboard = $scope.team.leagues[0].leaderboard;
      $scope.prev_leaderboard = $scope.team.leagues[0].prev_leaderboard;
      $scope.prev_total_points = $scope.team.leagues[0].prev_leaderboard.reduce(function(p, c, i, a) {
        return p + c.points;
      }, 0);
    } else {
      $scope.team = Team.get({teamId:$stateParams.teamId});
    }
    if(!$scope.isCurrentActive() && !$scope.isPrevActive())
      $state.go('tab.team-detail.current', {teamId: $stateParams.teamId});
  };
  if($scope.teams && $scope.teams.length) {
    $scope.init_team();
  }
  $rootScope.$on('teams-loaded',function(event){
    if($state.includes("tab.team-detail"))
      $scope.init_team();
  });
  $scope.canFire = function(team, player) {
    return $scope.me.id != player.id && $scope.me.id == team.captain.id;
  };
  $scope.userBelongsTeam = function() {
    if($scope.team && $scope.team.players)
      return $scope.team.players.filter(function(elem){ return elem.id == $rootScope.me.id; }).length;
    return false;
  };
  $scope.isPendingMe = function() {
    if($scope.team && $scope.team.players_pending)
      return $scope.team.players_pending.filter(function(elem){ return elem.id == $rootScope.me.id; }).length;
    return false;
  };
  $scope.isPendingCaptain = function() {
    if($scope.team && $scope.team.players_waiting_captain)
      return $scope.team.players_waiting_captain.filter(function(elem){ return elem.id == $rootScope.me.id; }).length;
    return false;
  };
  $scope.hasPendingPools = function(player) {
    return player.played < $scope.league.pools;
  };
  $scope.completedPools = function(player) {
    return Math.max(Math.round(player.played / $scope.league.pools * 100), 10);
  };
  $scope.fire = function(player, confirm) {
    if(confirm) {
      var firePopup = $ionicPopup.confirm({
        title: '¿Expulsar a ' + player.username + ' del equipo?',
        cssClass: "popup-market",
        okText: 'SI',
        okType: 'base-btn',
        cancelText: 'NO',
        cancelType: 'cancel-popup-btn',
      });
      firePopup.then(function(res) {
        if(res) {
          $scope.fire(player, false);
        }
      });
    } else {
      $scope.team.$fire({user_id: player.id}, function(){
        $rootScope.getTeams();
      });
      $timeout(function(){
        var i = $scope.leaderboard.indexOf(player);
        var i2 = $scope.team.players_waiting_captain.indexOf(player);
        if(i != -1)
          $scope.leaderboard.splice(i, 1);
        else if(i2 != -1)
          $scope.team.players_waiting_captain.splice(i2, 1);
      });
    }
    
  };
  $scope.sign = function(player) {
    if($scope.team.players < 11) {
      $timeout(function(){
        $scope.leaderboard.push(player);
        var i = $scope.team.players_waiting_captain.indexOf(player);
        if(i != -1)
            $scope.team.players_waiting_captain.splice(i, 1);
        $scope.team.$sign({user_id: player.id}, function(){
          $rootScope.getTeams();
        });
      });
    } else {
      $ionicPopup.alert({
       title: '¡Oooops!',
       template: 'Ya tienes 11 jugadores en tu equipo. Si quieres fichar otro a jugador... !tendrás que echar a alguien primero!',
       cssClass: "popup-market",
       okText: 'OK',
       okType: 'base-btn',
      });
    }
  };
  $scope.enroll = function(team) {
    $scope.team.$request_enroll({}, function(){
      var title = 'Solicitud enviada';
      var msg = 'El capitán ' + $scope.get_name($scope.team.captain) + ' tiene que aceptar la solicitud';
      if($scope.isPendingMe()) {
        title = '¡Fichado!';
        msg = 'Ya formas parte de ' + $scope.team.name;
      }
      $scope.getAllInfo(true);
      var alertPopup = $ionicPopup.alert({
       title: title,
       template: msg,
       cssClass: "popup-market",
       okText: 'OK',
       okType: 'base-btn',
      });
    });
    $timeout(function(){
      $scope.friend_teams.splice($scope.friend_teams.indexOf($scope.team), 1);
      $scope.waiting_teams.push($scope.team);
    });
  };
})

.controller('TeamMarketCtrl', function($rootScope, $scope, $timeout, $stateParams, $filter, $cordovaSocialSharing, $ionicPopup, $ionicAnalytics, Team) {
  $ionicAnalytics.track('team_market', {team_id: $stateParams.teamId});
  if(typeof analytics !== undefined) analytics.trackView("team_market");

  $scope.team = Team.get({teamId: $stateParams.teamId});
  
  $scope.shareViaFacebook = function() {
    var pkg = ionic.Platform.isIOS() ? "com.apple.social.facebook" : "com.facebook.orca";
    var message = "Únete a mi equipo " + $scope.team.name + ", ¡Podemos ganar 50€ cada semana!\nPuedes descargarte la app en Google Play (play.google.com/store/apps/details?id=com.dareyoo.teamwin) o Apple Store (appstore.com/teamwin)";
    $cordovaSocialSharing.canShareVia(pkg, message).then(function(result) {
      $cordovaSocialSharing.shareViaFacebook(message);
    }, function(res) {
      console.log("can't share!", res);
    });
  };
  $scope.shareViaWhatsapp = function() {
    var message = "Únete a mi equipo " + $scope.team.name + ", ¡Podemos ganar 50€ cada semana!\nPuedes descargarte la app en Google Play (play.google.com/store/apps/details?id=com.dareyoo.teamwin&referrer=shared_sign_whatsapp) o Apple Store (appstore.com/teamwin)";
    $cordovaSocialSharing.canShareVia("whatsapp", message).then(function(result) {
      $cordovaSocialSharing.shareViaWhatsApp(message);
      $ionicAnalytics.track('shared_sign_whatsapp');
      if(typeof analytics !== undefined) analytics.trackEvent("Share", 'market', 'whatsapp');
    }, function(res) {
      console.log("can't share! ", res);
    });
  };
  $scope.shareAnywhere = function() {
    $cordovaSocialSharing.share("", message, image, link);
  };

  $scope.get_status = function(user) {
    if($filter("filter")($scope.team.players, function(player) { return player.id == user.id; }).length > 0) {
      return 'signed';
    } else if($filter("filter")($scope.team.players_pending, function(player) { return player.id == user.id; }).length > 0) {
      return 'pending';
    } else if($filter("filter")($scope.team.players_waiting_captain, function(player) { return player.id == user.id; }).length > 0) {
      return 'pending_captain';
    } else {
      return 'available';
    }
  };

  $scope.user_click = function(user) {
    if($scope.me.id != $scope.team.captain.id) {
      var alertPopup = $ionicPopup.alert({
       title: 'Ooops...',
       template: 'Sólo el capitán del equipo puede gestionar los fichajes',
       cssClass: "popup-market",
       okText: 'OK',
       okType: 'base-btn',
      });
      return;
    }
    var status = $scope.get_status(user);
    if(status == 'available') {
      $scope.showConfirm('Fichar a ' + $scope.get_name(user), 'Se le enviará una solicitud al jugador').then(function(res) {
       if(res) {
        $timeout(function(){
          $scope.team.players_pending.push(user);
          $scope.team.$sign({user_id: user.id}, function(){
            $rootScope.getTeams();
          });
        });
       } else {
         
       }
     });
      
    } else if(status == 'pending') {
      $scope.showConfirm('Cancelar fichaje de ' + $scope.get_name(user), '¿Quieres cancelar la solicitud al jugador?').then(function(res) {
       if(res) {
        $timeout(function(){
          var i = $scope.team.players_pending.indexOf(user);
          if(i != -1)
            $scope.team.players_pending.splice(i, 1);
          $scope.team.$fire({user_id: user.id}, function(){
            $rootScope.getTeams();
          });
        });
       } else {
         
       }
     });
      
    } else if(status == 'pending_captain') {
      if($scope.team.players < 11) {
        $scope.showConfirm('Aceptar fichaje', $scope.get_name(user) + ' te ha enviado una solicitud para entrar en tu equipo ¿Quieres aceptarlo?').then(function(res) {
         if(res) {
          $timeout(function(){
            var i = $scope.team.players_waiting_captain.indexOf(user);
            if(i != -1)
              $scope.team.players_waiting_captain.splice(i, 1);
            $scope.team.players.push(user);
            $scope.team.$sign({user_id: user.id}, function(){
              $rootScope.getTeams();
            });
          });
         } else {
          $timeout(function(){
            var i = $scope.team.players_waiting_captain.indexOf(user);
            if(i != -1)
              $scope.team.players_waiting_captain.splice(i, 1);
            $scope.team.$fire({user_id: user.id}, function(){
              $rootScope.getTeams();
            });
          });
         }
       });
      } else {
        $ionicPopup.alert({
         title: '¡Oooops!',
         template: 'Ya tienes 11 jugadores en tu equipo. Si quieres fichar otro a jugador... !tendrás que echar a alguien primero!',
         cssClass: "popup-market",
         okText: 'OK',
         okType: 'base-btn',
        });
      }
    }
  };

  $scope.showConfirm = function(title, text) {
     var confirmPopup = $ionicPopup.confirm({
       title: title,
       template: text,
       cssClass: "popup-market",
       okText: 'SI',
       okType: 'base-btn',
       cancelText: 'NO',
       cancelType: 'cancel-popup-btn',
     });
     return confirmPopup;
   };
})

.controller('PlayCtrl', function($scope, $rootScope, $state, $ionicLoading, $localstorage, $ionicUser, $interval, $timeout, $filter, $ionicAnalytics, $ionicPopup, $specialOffer, Pool, User, conf) {
  $ionicAnalytics.track('play');
  if(typeof analytics !== undefined) analytics.trackView("play");

  $scope.explanation_seen = $localstorage.get('explanation_seen');
  $scope.accept_explanation = function() {
    $scope.explanation_seen = true;
    $localstorage.set('explanation_seen', true);
  };

  $scope.pool = null;
  $scope.swipe_pools = [];

  $scope.next_pool_index = 0;
  $scope.result_vibrate = false;

  $scope.getTitle = function() {
    if($scope.pool)
      $scope.title = $scope.pool.league + " - " + $scope.pool.fixture;
    else if($scope.pools && $scope.pools.length)
      $scope.title = $scope.pools[0].league + " - " + $scope.pools[0].fixture;
    else
      $scope.title = "Jugar";
  };

  $scope.init = function() {
    $scope.swipe_pools = [];
    var sp = $scope.swipeablePools();
    if(sp.length > 0) {
      $scope.swipe_pools.push(sp[0]);
      $scope.pool = sp[0];
    }
    if(sp.length > 1) {
      $scope.swipe_pools.push(sp[1]);
      $scope.next_pool_index = $scope.pools.indexOf(sp[1]);
    }
    $scope.getTitle();
    if($scope.league)
      $scope.card_style = {'background-image': 'url(' + $scope.league.pic + ')'};
    $scope.did_extra_points = $scope.getDidExtraPoints();
    $scope.just_did_extra_points = $scope.did_extra_points;
  };

  $scope.isWin = function(p) {
    return p.state == 'state_set' && p.result == p.user_result;
  };

  $scope.nWins = function(p) {
    return $filter("filter")($scope.pools, $scope.isWin).length;
  };

  $scope.isFail = function(p) {
    return p.state == 'state_set' && p.result != p.user_result && p.result != null;
  };

  $scope.swipeablePools = function(index) {
    if($scope.pools && $scope.pools.length) {
      return $filter("filter")($scope.pools, function(pool) { return pool.user_result == null && pool.state == 'state_open'; });
    }
    return [];
  };

  $scope.slideHasChanged = function(index) {
    if(index < $scope.pools.length) {
      $scope.next_pool_index = index;
      $scope.pool = $scope.pools[$scope.next_pool_index];
    }
  };

  $scope.resultTouch = function(index) {
    $scope.result_vibrate = true;
    $scope.result_vibrate_interval = $interval(function() {
      $scope.result_vibrate = false;
      $interval.cancel($scope.result_vibrate_interval);
    }, 2000);
  };

  $scope.$on('play-pool', function(event, result) {
    if(!$scope.pool) {
      $scope.pool = $scope.pools[$scope.next_pool_index];
    }
    $scope.pool.user_result = result;
    /*$scope.pool.$play({result:result}, function(result){
      $scope.pool.user_result = result;
    });*/
  });
  
  $scope.play = function(result) {
    $scope.pool.result = result;
    $scope.pool.$play({result:result});
    $scope.next_pool_index += 1;
    if($scope.next_pool_index < $scope.pools.length) {
        $scope.pool = $scope.pools[$scope.next_pool_index];
    } else {
        $scope.pool = null;
    }
  };

  $scope.cardPartialSwipe = function(amt) {
    
  };

  $scope.cardSwipedLeft = function(index) {
    $scope.pool.user_result = "1";
    $scope.pool.$play({result: "1"});
  };
  $scope.cardSwipedRight = function(index) {
    $scope.pool.user_result = "2";
    $scope.pool.$play({result: "2"});
  };

  $scope.cardSwipedUp = function(index) {
    $scope.pool.user_result = "X";
    $scope.pool.$play({result: "X"});
  };
  $scope.cardSwipedDown = function(index) {
    
  };
  $scope.cardDestroyed = function(index) {
    $ionicAnalytics.track('played');
    if(typeof analytics !== undefined) analytics.trackEvent("played", 'game');
    $timeout(function(){
      var removed_pool = $scope.swipe_pools.splice(index, 1);
      if($scope.swipe_pools.length) {
        $scope.pool = $scope.swipe_pools[0];
      } else {
        $scope.pool = null;
        $scope.getPools();
        $scope.getTeams();
      }
      $scope.addCard(removed_pool);
    });
  };

  $scope.addCard = function(removed_pool) {
    var sp = $scope.swipeablePools();
    if(sp.length > 1) {
      $scope.next_pool_index = ($scope.next_pool_index + 1) % $scope.pools.length;
      while($scope.pools[$scope.next_pool_index].user_result) {
        $scope.next_pool_index = ($scope.next_pool_index + 1) % $scope.pools.length;
      }
      $timeout(function() {
        $scope.swipe_pools.splice(0, 0, $scope.pools[$scope.next_pool_index]);
      }, 0.1);
    } else if(sp.length == 1 && $scope.swipe_pools.length == 0) {
      $timeout(function() {
        $scope.swipe_pools.splice(0,0, sp[0]);
      }, 0.1);
      $scope.pool = sp[0];
      $scope.next_pool_index = null;
    }
  };

  $scope.get_CORS_pic = function(pic) {
    return pic.replace("s3-eu-west-1", "s3");
  };

  $scope.just_did_extra_points = false;
  $scope.did_extra_points = false;
  $scope.getDidExtraPoints = function() {
    if($scope.teams && $scope.teams.length > 0) {
      var me = $filter("filter")($scope.teams[0].leagues[0].leaderboard, function(player) {
        return player.id == $scope.me.id;
      });
      if(me.length > 0)
        return me[0].extra_points;
    }
    return false;
  };
  $scope.$on('teams-loaded', function() {
    $scope.did_extra_points = $scope.getDidExtraPoints();
  });

  $scope.share = function() {
    $scope.extra.state = 'loading';
    $scope.extra.loading_msg = 'Enviando informe...';
    $scope.show_share = true;
    try {
      $scope.$apply();
    } catch(e) { console.log(e); }
    if(!window.cordova)
      facebookConnectPlugin.browserInit(conf.FACEBOOK_APP_ID);
    User.prototype.share_results().then(function(response) {
      $scope.show_share = false;
      facebookConnectPlugin.showDialog( 
      {
          method: "feed",
          picture: response.data.url,
          link: 'http://www.teamwinapp.com',
          name: 'Estos son mis pronósticos para esta jornada',
          message: '',
          caption: 'www.teamwinapp.com',
          description: '¡Haz los tuyos ahora y llévate 50€!'
      }, 
      function (response) {
        $ionicAnalytics.track('shared_fixture');
        if(typeof analytics !== undefined) analytics.trackEvent("Share", 'extra_points', 'facebook');
        $scope.league.$extra_points({type: 'extra_type_share_fb'}, function() {
          $scope.extra.state = 'end_ok';
          $scope.just_did_extra_points = true;
        }, function(){
          $scope.extra.state = 'end_error';
        });
        $scope.getTeams();
      },
      function (response) {
        $scope.extra.state = 'end_error';
      });
    });
  };

  $scope.doRate = function() {
    if($scope.extra.rate >= 3) {
      $scope.extra.state = 'loading';
      $scope.extra.loading_msg = 'Recibiendo valoración...';
      $scope.league.$extra_points({type: 'extra_type_rate', data: $scope.extra.rate});
      if (window.device.platform === 'iOS') {
        window.open($specialOffer.appStoreUrl(conf.IOS_ID));
      } else if (window.device.platform === 'Android') {
        window.open($specialOffer.googlePlayUrl(conf.ANDROID_ID));
      }
      $timeout(function(){
        $scope.league.$extra_points({type: 'extra_type_rate', data: $scope.extra.rate}, function() {
          $scope.extra.state = 'end_ok';
          $scope.just_did_extra_points = true;
          $ionicAnalytics.track('rated_app');
          if(typeof analytics !== undefined) analytics.trackEvent("Rate", 'extra_points');
        }, function(){
          $scope.extra.state = 'end_error';
        });
      }, 1000);
    } else {
      $scope.league.$extra_points({type: 'extra_type_rate', data: $scope.extra.rate}, function() {
        $scope.extra.state = 'end_ok';
        $scope.just_did_extra_points = true;
      }, function(){
        $scope.extra.state = 'end_error';
      });
    }
  };

  $scope.sendFeedback = function() {
    $scope.extra.state = 'loading';
    $scope.extra.loading_msg = 'Enviando feedback...';
    $scope.league.$extra_points({type: 'extra_type_feedback', data: $scope.extra.feedback}, function() {
      $scope.extra.state = 'end_ok';
      $scope.just_did_extra_points = true;
      $ionicAnalytics.track('sent_feedback');
      if(typeof analytics !== undefined) analytics.trackEvent("Feedback", 'extra_points');
    }, function(){
      $scope.extra.state = 'end_error';
    });
  };

  $scope.extraPoints = function() {
    $ionicAnalytics.track('extra_points');
    if(typeof analytics !== undefined) analytics.trackView("extra_points");
    $scope.extra = {};
    $scope.extra.state = 'initial';
    $scope.extra.rate = 5;
    $scope.extra.popup = $ionicPopup.show({
      templateUrl: "templates/popup-extra-points.html",
      cssClass: "popup-extra-points",
      scope: $scope
    });
  };

  $scope.cancel = function() {
    if($scope.extra.popup)
      $scope.extra.popup.close();
  };

  if($scope.pools && $scope.pools.length) {
    $scope.init();
  }

  $scope.$on('pools-loaded', function() {
    if($state.includes("tab.play"))
      $scope.init();
  });

  $scope.$on('$ionicView.enter', function() {
    $scope.init();
  });

});
