package in.omorablooms.staff;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OrderAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
