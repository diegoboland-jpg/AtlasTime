package com.badie.kikroo;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public final class KikrooWidgetProvider extends AppWidgetProvider {
    private static final String ACTION_PREVIOUS = "com.badie.kikroo.widget.PREVIOUS_30";
    private static final String ACTION_NOW = "com.badie.kikroo.widget.NOW";
    private static final String ACTION_NEXT = "com.badie.kikroo.widget.NEXT_30";
    private static final int[] ENTRY_IDS = {
        R.id.widget_entry_1, R.id.widget_entry_2, R.id.widget_entry_3,
        R.id.widget_entry_4, R.id.widget_entry_5, R.id.widget_entry_6,
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) manager.updateAppWidget(id, render(context, id));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (ACTION_PREVIOUS.equals(action) || ACTION_NOW.equals(action) || ACTION_NEXT.equals(action)) {
            JSONObject snapshot = WidgetSnapshotStore.read(context);
            if (snapshot != null) {
                try {
                    Date current = ACTION_NOW.equals(action)
                        ? new Date()
                        : WidgetSnapshotStore.parseDate(snapshot.getString("selectedAt"));
                    if (ACTION_PREVIOUS.equals(action)) current = new Date(current.getTime() - 30 * 60_000L);
                    if (ACTION_NEXT.equals(action)) current = new Date(current.getTime() + 30 * 60_000L);
                    WidgetSnapshotStore.updateSelectedAt(context, current);
                } catch (JSONException | ParseException ignored) {
                    // A malformed stored value is rendered as the safe empty state.
                }
            }
            updateAll(context);
            return;
        }
        super.onReceive(context, intent);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, KikrooWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(provider);
        for (int id : ids) manager.updateAppWidget(id, render(context, id));
    }

    private static RemoteViews render(Context context, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.kikroo_widget);
        JSONObject snapshot = WidgetSnapshotStore.read(context);
        bindActions(context, views, widgetId);
        if (snapshot == null) {
            views.setTextViewText(R.id.widget_group, "Kikroo");
            views.setTextViewText(R.id.widget_status, "Open Kikroo to set up your time widget");
            hideEntries(views, 0);
            return views;
        }

        try {
            JSONObject group = snapshot.getJSONObject("group");
            Date selectedAt = WidgetSnapshotStore.parseDate(snapshot.getString("selectedAt"));
            views.setTextViewText(R.id.widget_group, group.optString("label", "Kikroo"));
            views.setTextViewText(R.id.widget_selected, format(selectedAt, "UTC") + " UTC");
            bindFreshness(views, snapshot);
            JSONArray entries = snapshot.getJSONArray("entries");
            for (int index = 0; index < ENTRY_IDS.length; index += 1) {
                int viewId = ENTRY_IDS[index];
                if (index >= entries.length()) {
                    views.setViewVisibility(viewId, View.GONE);
                    continue;
                }
                JSONObject entry = entries.getJSONObject(index);
                String label = entry.optString("label", "Time " + (index + 1));
                String time = format(selectedAt, entry.getString("timeZone"));
                views.setTextViewText(viewId, label + "  " + time);
                views.setViewVisibility(viewId, View.VISIBLE);
            }
            hideEntries(views, entries.length());
        } catch (JSONException | ParseException exception) {
            views.setTextViewText(R.id.widget_group, "Kikroo");
            views.setTextViewText(R.id.widget_status, "Open Kikroo to refresh");
            hideEntries(views, 0);
        }
        return views;
    }

    private static void bindFreshness(RemoteViews views, JSONObject snapshot) throws JSONException, ParseException {
        long now = System.currentTimeMillis();
        long generated = WidgetSnapshotStore.parseDate(snapshot.getString("generatedAt")).getTime();
        long freshUntil = WidgetSnapshotStore.parseDate(snapshot.getString("freshUntil")).getTime();
        long expires = WidgetSnapshotStore.parseDate(snapshot.getString("expiresAt")).getTime();
        if (now >= expires) {
            views.setTextViewText(R.id.widget_status, "Expired - Open Kikroo to refresh");
            return;
        }
        String age = Math.max(0, (now - generated) / 60_000L) + " min ago";
        JSONObject recommendation = snapshot.optJSONObject("recommendation");
        String score = recommendation == null ? "" : " - " + recommendation.getInt("available") + "/" + recommendation.getInt("total") + " available";
        views.setTextViewText(R.id.widget_status, (now >= freshUntil ? "May be outdated - " : "Updated ") + age + score);
    }

    private static void bindActions(Context context, RemoteViews views, int widgetId) {
        views.setOnClickPendingIntent(R.id.widget_previous, broadcast(context, ACTION_PREVIOUS, widgetId, 101));
        views.setOnClickPendingIntent(R.id.widget_now, broadcast(context, ACTION_NOW, widgetId, 102));
        views.setOnClickPendingIntent(R.id.widget_next, broadcast(context, ACTION_NEXT, widgetId, 103));
        Intent open = new Intent(context, KikrooLauncherActivity.class)
            .setData(Uri.parse("https://atlastime-staging.onrender.com/?source=android-widget"));
        PendingIntent openIntent = PendingIntent.getActivity(context, widgetId, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_open, openIntent);
        views.setOnClickPendingIntent(R.id.widget_header, openIntent);
    }

    private static PendingIntent broadcast(Context context, String action, int widgetId, int requestOffset) {
        Intent intent = new Intent(context, KikrooWidgetProvider.class).setAction(action);
        return PendingIntent.getBroadcast(context, widgetId + requestOffset, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static String format(Date date, String timeZone) {
        SimpleDateFormat format = new SimpleDateFormat("HH:mm", Locale.getDefault());
        format.setTimeZone(TimeZone.getTimeZone(timeZone));
        return format.format(date);
    }

    private static void hideEntries(RemoteViews views, int from) {
        for (int index = from; index < ENTRY_IDS.length; index += 1) {
            views.setViewVisibility(ENTRY_IDS[index], View.GONE);
        }
    }
}
