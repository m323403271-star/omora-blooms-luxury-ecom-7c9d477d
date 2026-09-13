package in.omorablooms.staff;

import android.content.Intent;
import androidx.core.content.ContextCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class OrderMessagingService extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(RemoteMessage message) {
        Map<String, String> data = message.getData();
        String type = data.get("type");
        String alertId = value(data, "alertId");

        if ("STOP_ORDER_ALARM".equals(type)) {
            OrderAlarmService.stop(this, alertId);
            return;
        }
        if (!"NEW_ORDER".equals(type)) return;

        Intent intent = new Intent(this, OrderAlarmService.class);
        intent.putExtra("alertId", alertId);
        intent.putExtra("title", value(data, "title"));
        intent.putExtra("body", value(data, "body"));
        ContextCompat.startForegroundService(this, intent);
    }

    private String value(Map<String, String> data, String key) {
        String value = data.get(key);
        return value == null ? "" : value;
    }
}