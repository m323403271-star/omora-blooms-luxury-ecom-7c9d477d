# Native Android Order Alarm

## Goal
Create a downloadable Android wrapper for the existing staff dashboard. New paid orders will send high-priority Firebase messages that start a loud, looping native alarm even when the browser is closed. The alarm stops only after the order is accepted.

## Implementation
- Add authenticated native-device registration for admins and delivery agents, stored separately from browser push subscriptions.
- Send high-priority, data-only Firebase messages for new orders and stop messages when an order is accepted.
- Add Capacitor Android configuration and a native Firebase receiver.
- Add an Android foreground alarm service with a high-importance notification channel, vibration, wake lock, bundled siren, and warehouse deep link.
- Bridge the website to native push registration and stop the local alarm after a successful acceptance.
- Keep the existing browser push and open-dashboard siren as fallbacks.
- Add setup documentation for generating the Android project, adding Firebase's Android configuration file, testing, and producing an APK/AAB.

## Security and Reliability
- Only authenticated staff roles may register native device tokens or accept alerts.
- Device tokens are never exposed publicly and stale Firebase tokens are removed after permanent delivery failures.
- Android notification permission is requested from a staff action.
- Alarm playback uses a foreground service and stops on accepted-order synchronization; a safety timeout prevents an indefinite device wake lock.
- Android and device-maker battery policies can affect delivery, so setup will document notification, full-screen alert, battery, and autostart permissions.

## Validation
- Apply and inspect the database migration and access policies.
- Run focused type checks/tests through the project harness.
- Verify the staff dashboard still loads and browser fallback remains functional.
- Verify the Android project configuration and native source references are internally consistent.
