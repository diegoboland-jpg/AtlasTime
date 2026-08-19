package com.badie.kikroo;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsService;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

/** TWA launcher with a Digital Asset Links-verified postMessage channel for widget snapshots. */
public final class KikrooLauncherActivity extends Activity {
    private static final Uri ORIGIN = Uri.parse("https://atlastime-staging.onrender.com");
    private static final String READY_MESSAGE = "kikroo-widget-ready:v1";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private CustomTabsSession session;
    private boolean bound;
    private boolean launched;
    private boolean navigationFinished;
    private boolean originValidated;
    private int channelAttempts;

    private final CustomTabsCallback callback = new CustomTabsCallback() {
        @Override
        public void onRelationshipValidationResult(int relation, @NonNull Uri requestedOrigin,
                boolean result, @Nullable Bundle extras) {
            originValidated = result && ORIGIN.equals(requestedOrigin);
            requestMessageChannelWhenReady();
        }

        @Override
        public void onNavigationEvent(int navigationEvent, @Nullable Bundle extras) {
            if (navigationEvent == NAVIGATION_FINISHED) {
                navigationFinished = true;
                requestMessageChannelWhenReady();
            }
        }

        @Override
        public void onMessageChannelReady(@Nullable Bundle extras) {
            if (session != null) session.postMessage(READY_MESSAGE, null);
        }

        @Override
        public void onPostMessage(@NonNull String message, @Nullable Bundle extras) {
            boolean accepted = WidgetSnapshotStore.saveBridgeMessage(getApplicationContext(), message);
            if (session != null) {
                session.postMessage(accepted
                    ? "{\"type\":\"kikroo.widget.ack\",\"accepted\":true}"
                    : "{\"type\":\"kikroo.widget.ack\",\"accepted\":false}", null);
            }
        }
    };

    private final CustomTabsServiceConnection connection = new CustomTabsServiceConnection() {
        @Override
        public void onCustomTabsServiceConnected(@NonNull ComponentName name, @NonNull CustomTabsClient client) {
            client.warmup(0L);
            session = client.newSession(callback);
            if (session == null) {
                openBrowserFallback();
                return;
            }
            session.validateRelationship(CustomTabsService.RELATION_USE_AS_ORIGIN, ORIGIN, null);
            launchTrustedExperience();
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            session = null;
        }
    };

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        String browserPackage = CustomTabsClient.getPackageName(this, null);
        if (browserPackage == null || !CustomTabsClient.bindCustomTabsService(this, browserPackage, connection)) {
            openBrowserFallback();
            return;
        }
        bound = true;
    }

    private Uri launchUri() {
        Uri requested = getIntent().getData();
        if (requested != null && "https".equals(requested.getScheme()) && ORIGIN.getHost().equals(requested.getHost())) {
            return requested;
        }
        return ORIGIN;
    }

    private void launchTrustedExperience() {
        if (launched || session == null || isFinishing()) return;
        launched = true;
        new TrustedWebActivityIntentBuilder(launchUri())
            .build(session)
            .launchTrustedWebActivity(this);
    }

    private void requestMessageChannelWhenReady() {
        if (!originValidated || !navigationFinished || session == null || channelAttempts >= 4) return;
        channelAttempts += 1;
        long delay = channelAttempts == 1 ? 200L : 500L * channelAttempts;
        handler.postDelayed(() -> {
            if (session == null) return;
            boolean requested = session.requestPostMessageChannel(ORIGIN, ORIGIN, new Bundle());
            if (!requested) requestMessageChannelWhenReady();
        }, delay);
    }

    private void openBrowserFallback() {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, launchUri()));
        } finally {
            finish();
        }
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (bound) {
            unbindService(connection);
            bound = false;
        }
        super.onDestroy();
    }
}
