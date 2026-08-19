package com.badie.kikroo;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;

final class WidgetSnapshotStore {
    static final String PREFERENCES = "kikroo_widget_private_v1";
    static final String SNAPSHOT_KEY = "snapshot";
    private static final int MAX_MESSAGE_BYTES = 24 * 1024;
    private static final Set<String> ROOT_FIELDS = fields("version", "generatedAt", "freshUntil", "expiresAt",
        "deviceTimeZone", "selectedAt", "group", "entries", "recommendation", "theme", "privacyMode");
    private static final Set<String> GROUP_FIELDS = fields("id", "label");
    private static final Set<String> ENTRY_FIELDS = fields("id", "label", "place", "countryCode", "timeZone", "workStart", "workEnd");
    private static final Set<String> RECOMMENDATION_FIELDS = fields("startAt", "available", "total");
    private static final Set<String> ENVELOPE_FIELDS = fields("type", "payload");
    private static final Set<String> VALID_ZONES = Collections.unmodifiableSet(
        new HashSet<>(Arrays.asList(TimeZone.getAvailableIDs())));

    private WidgetSnapshotStore() {}

    static boolean saveBridgeMessage(Context context, String message) {
        if (message == null || message.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > MAX_MESSAGE_BYTES) return false;
        try {
            JSONObject envelope = new JSONObject(message);
            requireOnly(envelope, ENVELOPE_FIELDS);
            if (!"kikroo.widget.snapshot".equals(envelope.getString("type"))) return false;
            JSONObject snapshot = envelope.getJSONObject("payload");
            validateSnapshot(snapshot);
            boolean saved = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
                .edit().putString(SNAPSHOT_KEY, snapshot.toString()).commit();
            if (saved) KikrooWidgetProvider.updateAll(context);
            return saved;
        } catch (JSONException | ParseException | IllegalArgumentException exception) {
            return false;
        }
    }

    static JSONObject read(Context context) {
        String raw = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE).getString(SNAPSHOT_KEY, null);
        if (raw == null) return null;
        try { return new JSONObject(raw); }
        catch (JSONException ignored) { return null; }
    }

    static boolean updateSelectedAt(Context context, Date selectedAt) {
        JSONObject snapshot = read(context);
        if (snapshot == null) return false;
        try {
            snapshot.put("selectedAt", formatDate(selectedAt));
            return context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
                .edit().putString(SNAPSHOT_KEY, snapshot.toString()).commit();
        } catch (JSONException exception) {
            return false;
        }
    }

    static Date parseDate(String value) throws ParseException {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        format.setLenient(false);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.parse(value);
    }

    static String formatDate(Date date) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.format(date);
    }

    private static void validateSnapshot(JSONObject value) throws JSONException, ParseException {
        requireOnly(value, ROOT_FIELDS);
        if (value.getInt("version") != 1) throw new IllegalArgumentException("Unsupported version");
        Date generated = parseDate(value.getString("generatedAt"));
        Date freshUntil = parseDate(value.getString("freshUntil"));
        Date expires = parseDate(value.getString("expiresAt"));
        Date selected = parseDate(value.getString("selectedAt"));
        long now = System.currentTimeMillis();
        if (generated.getTime() > now + 5 * 60_000L || generated.getTime() < now - 24 * 60 * 60_000L) throw new IllegalArgumentException("Invalid generation time");
        if (freshUntil.before(generated) || freshUntil.getTime() > generated.getTime() + 16 * 60_000L) throw new IllegalArgumentException("Invalid freshness");
        if (expires.before(freshUntil) || expires.getTime() > generated.getTime() + 25 * 60 * 60_000L) throw new IllegalArgumentException("Invalid expiry");
        if (Math.abs(selected.getTime() - generated.getTime()) > 370L * 24 * 60 * 60_000L) throw new IllegalArgumentException("Invalid selected time");
        validZone(value.getString("deviceTimeZone"));
        String theme = value.getString("theme");
        if (!"sky".equals(theme) && !"midnight".equals(theme)) throw new IllegalArgumentException("Invalid theme");
        String privacy = value.getString("privacyMode");
        if (!"labels".equals(privacy) && !"times-only".equals(privacy)) throw new IllegalArgumentException("Invalid privacy mode");

        JSONObject group = value.getJSONObject("group");
        requireOnly(group, GROUP_FIELDS);
        bounded(group.getString("id"), 120);
        if (group.has("label")) bounded(group.getString("label"), 80);

        JSONArray entries = value.getJSONArray("entries");
        if (entries.length() > 6) throw new IllegalArgumentException("Too many entries");
        for (int index = 0; index < entries.length(); index += 1) {
            JSONObject entry = entries.getJSONObject(index);
            requireOnly(entry, ENTRY_FIELDS);
            bounded(entry.getString("id"), 120);
            if (entry.has("label")) bounded(entry.getString("label"), 80);
            if (entry.has("place")) bounded(entry.getString("place"), 80);
            if (entry.has("countryCode")) bounded(entry.getString("countryCode"), 2);
            validZone(entry.getString("timeZone"));
            validHour(entry.getDouble("workStart"));
            validHour(entry.getDouble("workEnd"));
        }

        if (value.has("recommendation")) {
            JSONObject recommendation = value.getJSONObject("recommendation");
            requireOnly(recommendation, RECOMMENDATION_FIELDS);
            parseDate(recommendation.getString("startAt"));
            int total = recommendation.getInt("total");
            int available = recommendation.getInt("available");
            if (total < 0 || total > 500 || available < 0 || available > total) throw new IllegalArgumentException("Invalid recommendation");
        }
    }

    private static void validZone(String value) {
        bounded(value, 80);
        if (!VALID_ZONES.contains(value)) throw new IllegalArgumentException("Invalid time zone");
    }

    private static void validHour(double value) {
        if (!Double.isFinite(value) || value < 0 || value > 24) throw new IllegalArgumentException("Invalid work hour");
    }

    private static void bounded(String value, int maximum) {
        if (value == null || value.length() > maximum) throw new IllegalArgumentException("Invalid string");
    }

    private static void requireOnly(JSONObject value, Set<String> allowed) throws JSONException {
        Iterator<String> keys = value.keys();
        while (keys.hasNext()) if (!allowed.contains(keys.next())) throw new JSONException("Unknown field");
    }

    private static Set<String> fields(String... values) {
        return Collections.unmodifiableSet(new HashSet<>(Arrays.asList(values)));
    }
}
