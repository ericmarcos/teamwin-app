  745  sudo npm install -g ionic to update
  658  ionic start Teamwin
  659  cd Teamwin
  660  ionic setup sass
  661  ionic io init
  662  ionic upload
  663  ionic add ionic-service-core
  665  ionic add ngCordova
  666  ionic add ionic-service-push
  670  ionic push --ios-dev-cert
  667  ionic push --ios-prod-cert
  668  ionic push --google-api-key <google_api_key>
  758  ionic config set gcm_key <gcm_key>
  671  ionic plugin add cordova-plugin-statusbar
  673  ionic plugin add cordova-plugin-inappbrowser
  674  ionic plugin add nl.x-services.plugins.socialsharing
  677  ionic plugin add cordova-plugin-dialogs
  703  cd ..
  725  git clone https://github.com/Telerik-Verified-Plugins/Facebook.git
  659  cd Teamwin
  676  cordova -d plugin add ../Facebook --variable APP_ID="<app_id>" --variable APP_NAME="<app_name>"
  703  cd ..
  725  git clone https://github.com/Telerik-Verified-Plugins/PushNotification.git
  659  cd Teamwin
  728  cordova -d plugin add ../PushNotification
  730  ionic platform add android
  679  ionic browser add crosswalk
  edit config.xml
  add files, resources (splash&icon)
  update ionic id / api key / gcm in app.js
  681  ionic resources
  683  ionic prepare
  684  ionic build ios
  685  ionic build android
  783  ionic build android --release
  669  ionic push --production-mode=y

Problems encountered:
//https://github.com/Wizcorp/phonegap-facebook-plugin/issues/992#issuecomment-126480908
//https://github.com/Telerik-Verified-Plugins/PushNotification
//http://stackoverflow.com/questions/29956031/cordova-run-android-executes-fine-but-android-4-1-2-doesnt-start-the-app
