ionic prepare
cp resources/android/notification/drawable-ldpi-ic_stat_notify.png platforms/android/res/drawable-ldpi/ic_stat_notify.png
cp resources/android/notification/drawable-mdpi-ic_stat_notify.png platforms/android/res/drawable-mdpi/ic_stat_notify.png
cp resources/android/notification/drawable-hdpi-ic_stat_notify.png platforms/android/res/drawable-hdpi/ic_stat_notify.png
cp resources/android/notification/drawable-xhdpi-ic_stat_notify.png platforms/android/res/drawable-xhdpi/ic_stat_notify.png
cp resources/android/notification/drawable-xxhdpi-ic_stat_notify.png platforms/android/res/drawable-xxhdpi/ic_stat_notify.png
cp resources/android/notification/drawable-xxxhdpi-ic_stat_notify.png platforms/android/res/drawable-xxxhdpi/ic_stat_notify.png
ionic build ios
ionic build android
ionic build android --release
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../../android-signature/teamwin-release.keystore platforms/android/build/outputs/apk/android-x86-release-unsigned.apk teamwin
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../../android-signature/teamwin-release.keystore platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk teamwin
rm platforms/android/build/outputs/apk/teamwin-x86.apk
rm platforms/android/build/outputs/apk/teamwin-armv7.apk
/Users/eric/Documents/android_sdk/sdk/build-tools/21.1.2/zipalign -v 4 platforms/android/build/outputs/apk/android-x86-release-unsigned.apk platforms/android/build/outputs/apk/teamwin-x86.apk
/Users/eric/Documents/android_sdk/sdk/build-tools/21.1.2/zipalign -v 4 platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk platforms/android/build/outputs/apk/teamwin-armv7.apk