# OMORA BLOOMS Staff Android App

This Capacitor wrapper opens the production warehouse dashboard and receives high-priority Firebase data messages. A new paid order starts a native foreground alarm that loops until an authorized staff member accepts the order.

## One-time Firebase Android setup

1. In the connected Firebase project, add an Android app with package name `in.omorablooms.staff`.
2. Download its `google-services.json` and place it at `android/app/google-services.json`.
3. Do not commit that file. The Android `.gitignore` already excludes it.

The existing Firebase Messaging connector remains responsible for server-side sends. The Android configuration file only identifies the installed app to Firebase.

## Build

```bash
bun install
bunx cap sync android
cd android
./gradlew assembleDebug
```

The debug APK is created under `android/app/build/outputs/apk/debug/`. For Play Store release, configure an Android signing key and build an AAB with `./gradlew bundleRelease`.

## Staff setup

1. Install the APK and sign in with an admin or delivery-agent account.
2. Open Warehouse and tap **Turn ON native alarm**.
3. Allow notifications. On Android 14+, also allow full-screen notifications if the phone offers that setting.
4. Set battery use to **Unrestricted** and enable autostart on phones that offer it.
5. Use **Send test alert** while the app is backgrounded. Test alarms stop automatically after 20 seconds; real order alarms stop only when the matching order is accepted.

## Important limits

Android may still suppress alerts if the user force-stops the app, disables notifications, or the phone maker kills background services. Alarm volume follows the device's alarm-volume setting; apps cannot override a muted alarm stream. Publish-store review may also require explaining why full-screen and foreground alarm permissions are essential to warehouse dispatch.
