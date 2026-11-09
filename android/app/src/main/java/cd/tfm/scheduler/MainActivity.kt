package cd.tfm.scheduler

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // BridgeActivity initializes the Capacitor WebView runtime
        // which loads the redesigned Apple Minimal web interface
    }
}
