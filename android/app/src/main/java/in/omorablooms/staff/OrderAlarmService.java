package in.omorablooms.staff;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
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
    private static final String ACTION_STOP = "in.omorablooms.staff.STOP_ORDER_ALARM";
    private static final String EXTRA_ALERT_ID = "alertId";
    private static volatile String activeAlertId = "";

    private MediaPlayer player;
    private PowerManager.WakeLock wakeLock;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable renewWakeLock = new Runnable() {
        @Override public void run() {
            acquireWakeLock();
            handler.postDelayed(this, 9 * 60 * 1000L);
        }
    };

    public static void stop(Context context, String alertId) {
        Intent stopIntent = new Intent(context, OrderAlarmService.class);
        stopIntent.setAction(ACTION_STOP);
        stopIntent.putExtra(EXTRA_ALERT_ID, alertId == null ? "" : alertId);
        context.startService(stopIntent);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            String requestedId = intent.getStringExtra(EXTRA_ALERT_ID);
            if (requestedId == null || requestedId.isEmpty() || requestedId.equals(activeAlertId)) stopSelf();
            return START_NOT_STICKY;
        }

        activeAlertId = intent == null ? "" : safe(intent.getStringExtra(EXTRA_ALERT_ID));
        String title = intent == null ? "" : safe(intent.getStringExtra("title"));
        String body = intent == null ? "" : safe(intent.getStringExtra("body"));
        createChannel();
        startForeground(NOTIFICATION_ID, buildNotification(title, body));
        acquireWakeLock();
        handler.removeCallbacks(renewWakeLock);
        handler.postDelayed(renewWakeLock, 9 * 60 * 1000L);
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
        player = MediaPlayer.create(this, R.raw.order_alarm);
        if (player == null) return;
        player.setAudioAttributes(new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build());
        player.setLooping(true);
        player.setVolume(1f, 1f);
        player.start();
    }

    private void acquireWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        PowerManager manager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = manager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "OmoraBlooms:OrderAlarm");
        wakeLock.acquire(10 * 60 * 1000L);
    }

    private String safe(String value) { return value == null ? "" : value; }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(renewWakeLock);
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