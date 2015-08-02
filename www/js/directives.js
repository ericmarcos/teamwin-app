angular.module('dareyoo.directives', [])
.directive('noScroll', function() {
  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
      // Disable touchmove to fix an Android issue
      $element.find('*').on('touchmove', function(e) {
        e.preventDefault();
      });
    }
  }
})
.directive('stopEvent', function () {
  function stopEvent(e) {
    e.stopPropagation();
  }
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      element.bind(attr.stopEvent, stopEvent);
    }
  };
})
.directive('teamAvatar', function() {
  return {
    restrict: 'E',
    scope: {
      team: '=',
    },
    templateUrl: 'templates/directives/team-avatar.html'
  }
})
.directive('playBtn', function ($animate) {
 return {
  restrict: 'E',
  scope: {
    caption: '=',
    enabled: '=?'
  },
  link: function(scope,elem,attrs){
    elem.on('click', function () {
      //scope.animating = true;
      scope.active = angular.element(elem[0].getElementsByClassName('play-btn-active')[0]);
        /*var self = angular.element(this);*/
        //var a = $animate.addClass(active, 'animated zoomIn', function(){console.log("finish");});
        
        //console.log("yayaya", $animate);
        
    });
  },
  controller: function($scope, $interval, $rootScope) {
    if(!angular.isDefined($scope.enabled))
      $scope.enabled = true;
    $scope.startTouch = function() {
      if($scope.enabled) {
        $scope.animating = true;
        $scope.playing = $interval(function() {
          $rootScope.$broadcast('play-pool', $scope.caption);
          $scope.endTouch();
        }, 1000);
      }
    };
    $scope.endTouch = function() {
      if($scope.enabled) {
        $scope.animating = false;
        if (angular.isDefined($scope.playing)) {
          $interval.cancel($scope.playing);
          $scope.playing = undefined;
        }
      }
    };
  },
  templateUrl: 'templates/directives/play-btn.html'
 }
})

.directive('browseFile',['$rootScope',function($rootScope){
    return {
        scope:{

        },
        replace:true,
        restrict:'AE',
        link:function(scope,elem,attrs){

            scope.working = false;
            scope.browseFile = function(){
                document.getElementById('browseBtn').click();
            }
            

            angular.element(document.getElementById('browseBtn')).on('change',function(e){
               scope.working = true;
               var file = e.target.files[0];

               angular.element(document.getElementById('browseBtn')).val('');

               var fileReader = new FileReader();

               fileReader.onload = function(event){
                   var tmp_img = new Image();
                    tmp_img.src = event.target.result;
                    tmp_img.onload = function() {
                      var canvas = document.createElement('canvas');
                      canvas.width = 200;
                      canvas.height = 200;
                      var ctx = canvas.getContext('2d');
                      ctx.fillStyle = "#FFFFFF";
                      ctx.fillRect(0,0,200,200);
                      var w = tmp_img.width;
                      var h = tmp_img.height;
                      if(w > h) {
                        ctx.drawImage(tmp_img, (w - h) / 2, 0, h, h, 0, 0, 200, 200);
                      } else {
                        ctx.drawImage(tmp_img, 0, (h - w) / 2, w, w, 0, 0, 200, 200);
                      }
                      scope.img_src = canvas.toDataURL();
                      scope.working = false;
                      scope.$apply();
                      $rootScope.$broadcast('event:file:selected', {image: scope.img_src});
                    };
               }
               fileReader.readAsDataURL(file);
               
            });

        },
        templateUrl:'templates/directives/browse-file.html'
    }
}]);