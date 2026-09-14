package in.omorablooms.staff;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class OrderAlarmService extends Service {
    private static final String CHANNEL_ID = "omora_urgent_orders_v1";
    private static final int NOTIFICATION_ID = 7801;
    private static final String EXTRA_ALERT_ID = "alertId";
    private static volatile String activeAlertId = "";
    private static final String PREFS = "omora_order_alarm";
    private static final String PENDING_IDS = "pending_alert_ids";

    private MediaPlayer player;
    private PowerManager.WakeLock wakeLock;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable renewWakeLock = new Runnable() {
        @Override public void run() {
            acquireWakeLock();
            handler.postDelayed(this, 9 * 60 * 1000L);
        }
    };
    private final Runnable stopTestAlarm = this::stopSelf;

    public static void stop(Context context, String alertId) {
        SharedPreferences preferences = context.getSharedPreferences(PREFS, MODE_PRIVATE);
        java.util.Set<String> ids = new java.util.HashSet<>(
            preferences.getStringSet(PENDING_IDS, java.util.Collections.emptySet())
        );
        if (alertId == null || alertId.isEmpty()) ids.clear();
        else ids.remove(alertId);
        preferences.edit().putStringSet(PENDING_IDS, ids).apply();
        if (ids.isEmpty()) context.stopService(new Intent(context, OrderAlarmService.class));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        activeAlertId = intent == null ? "" : safe(intent.getStringExtra(EXTRA_ALERT_ID));
        if (!activeAlertId.isEmpty()) addPendingAlert(activeAlertId);
        String title = intent == null ? "" : safe(intent.getStringExtra("title"));
        String body = intent == null ? "" : safe(intent.getStringExtra("body"));
        boolean isTest = intent != null && intent.getBooleanExtra("test", false);
        createChannel();
        startForeground(NOTIFICATION_ID, buildNotification(title, body));
        acquireWakeLock();
        handler.removeCallbacks(renewWakeLock);
        handler.postDelayed(renewWakeLock, 9 * 60 * 1000L);
        handler.removeCallbacks(stopTestAlarm);
        if (isTest) handler.postDelayed(stopTestAlarm, 20 * 1000L);
        startSiren();
        return START_STICKY;
    }

    private Notification buildNotification(String title, String body) {
        Intent open = new Intent(this, MainActivity.class);
        open.putExtra(EXTRA_ALERT_ID, activeAlertId);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingOpen = PendingIntent.getActivity(
            this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title.isEmpty() ? "New OMORA order" : title)
            .setContentText(body.isEmpty() ? "Open the warehouse and accept this order." : body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(pendingOpen)
            .setFullScreenIntent(pendingOpen, true)
            .setOngoing(true)
            .setAutoCancel(false)
            .build();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        AudioAttributes alarmAttributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID, "Urgent new orders", NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Persistent alarm for paid orders awaiting acceptance");
        channel.setSound(null, alarmAttributes);
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 600, 200, 600, 200, 900});
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }

    private void startSiren() {
        if (player != null && player.isPlaying()) return;
        try (AssetFileDescriptor alarm = getResources().openRawResourceFd(R.raw.order_alarm)) {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
            player.setDataSource(
                alarm.getFileDescriptor(), alarm.getStartOffset(), alarm.getLength()
            );
            player.setLooping(true);
            player.setVolume(1f, 1f);
            player.prepare();
            player.start();
        } catch (Exception error) {
            if (player != null) player.release();
            player = null;
        }
    }

    private void acquireWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        PowerManager manager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = manager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "OmoraBlooms:OrderAlarm");
        wakeLock.acquire(10 * 60 * 1000L);
    }

    private String safe(String value) { return value == null ? "" : value; }

    private java.util.Set<String> pendingAlerts() {
        SharedPreferences preferences = getSharedPreferences(PREFS, MODE_PRIVATE);
        return new java.util.HashSet<>(preferences.getStringSet(PENDING_IDS, java.util.Collections.emptySet()));
    }

    private void addPendingAlert(String alertId) {
        java.util.Set<String> ids = pendingAlerts();
        ids.add(alertId);
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putStringSet(PENDING_IDS, ids).apply();
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(renewWakeLock);
        handler.removeCallbacks(stopTestAlarm);
        if (player != null) {
            player.stop();
            player.release();
            player = null;
        }
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        activeAlertId = "";
        NotificationManagerCompat.from(this).cancel(NOTIFICATION_ID);
        super.onDestroy();
    }

    @Nullable @Override public IBinder onBind(Intent intent) { return null; }
}