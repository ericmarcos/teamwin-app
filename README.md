# Project setup

```
sudo npm install -g ionic to update
ionic start Teamwin
cd Teamwin
ionic setup sass
ionic io init
ionic upload
ionic add ionic-service-core
ionic add ngCordova
ionic add ionic-service-push
ionic push --ios-dev-cert
ionic push --ios-prod-cert
ionic push --google-api-key <google_api_key>
ionic config set gcm_key <gcm_key>
ionic plugin add cordova-plugin-statusbar
ionic plugin add cordova-plugin-inappbrowser
ionic plugin add nl.x-services.plugins.socialsharing
ionic plugin add cordova-plugin-dialogs
ionic plugins add https://github.com/8zrealestate/android-referrer-plugin
ionic plugins add https://github.com/chrisekelley/AppPreferences
ionic plugin add https://github.com/danwilson/google-analytics-plugin.git
cd ..
git clone https://github.com/Telerik-Verified-Plugins/Facebook.git
cd Teamwin
cordova -d plugin add ../Facebook --variable APP_ID="<app_id>" --variable APP_NAME="<app_name>"
cd ..
git clone https://github.com/Telerik-Verified-Plugins/PushNotification.git
cd Teamwin
cordova -d plugin add ../PushNotification
ionic platform add android
ionic browser add crosswalk
(edit config.xml)
(add files, resources (splash&icon))
(update ionic id / api key / gcm in app.js)
ionic resources
ionic prepare
ionic build ios
ionic build android
ionic build android --release
ionic push --production-mode=y
```

# Problems encountered:

https://github.com/Wizcorp/phonegap-facebook-plugin/issues/992#issuecomment-126480908

https://github.com/Telerik-Verified-Plugins/PushNotification

http://stackoverflow.com/questions/29956031/cordova-run-android-executes-fine-but-android-4-1-2-doesnt-start-the-app
