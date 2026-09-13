package in.omorablooms.staff;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.firebase.messaging.FirebaseMessaging;

@CapacitorPlugin(
    name = "OrderAlarm",
    permissions = {
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class OrderAlarmPlugin extends Plugin {
    @PluginMethod
    public void enable(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationPermissionResult");
            return;
        }
        resolveToken(call);
    }

    @PermissionCallback
    private void notificationPermissionResult(PluginCall call) {
        if (getPermissionState("notifications") != PermissionState.GRANTED) {
            call.reject("Notification permission was not granted.");
            return;
        }
        resolveToken(call);
    }

    private void resolveToken(PluginCall call) {
        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (!task.isSuccessful() || task.getResult() == null) {
                Exception exception = task.getException();
                call.reject(exception == null ? "Firebase could not register this device." : exception.getMessage());
                return;
            }
            JSObject result = new JSObject();
            result.put("token", task.getResult());
            result.put("deviceName", Build.MANUFACTURER + " " + Build.MODEL);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void stopAlarm(PluginCall call) {
        String alertId = call.getString("alertId", "");
        OrderAlarmService.stop(getContext(), alertId);
        call.resolve();
    }
}