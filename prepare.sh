ionic prepare
cp resources/android/notification/drawable-ldpi-ic_stat_notify.png platforms/android/res/drawable-ldpi/ic_stat_notify.png
cp resources/android/notification/drawable-mdpi-ic_stat_notify.png platforms/android/res/drawable-mdpi/ic_stat_notify.png
cp resources/android/notification/drawable-hdpi-ic_stat_notify.png platforms/android/res/drawable-hdpi/ic_stat_notify.png
cp resources/android/notification/drawable-xhdpi-ic_stat_notify.png platforms/android/res/drawable-xhdpi/ic_stat_notify.png
cp resources/android/notification/drawable-xxhdpi-ic_stat_notify.png platforms/android/res/drawable-xxhdpi/ic_stat_notify.png
cp resources/android/notification/drawable-xxxhdpi-ic_stat_notify.png platforms/android/res/drawable-xxxhdpi/ic_stat_notify.png
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../../android-signature/teamwin-release.keystore platforms/android/build/outputs/apk/android-x86-release-unsigned.apk teamwin
ls -la