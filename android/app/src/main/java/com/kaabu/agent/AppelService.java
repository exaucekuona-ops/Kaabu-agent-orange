package com.kaabu.agent;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.service.notification.StatusBarNotification;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class AppelService extends MessagingService {
  static final String CANAL = "appels_v2";
  static final String CANAL_MANQUE = "appels_manques";
  static final int ID_APPEL = 7001;
  static final int ID_MANQUE = 7002;
  static final long[] VIBRE = new long[] {0, 800, 600, 800, 600, 800};

  @Override
  public void onMessageReceived(@NonNull RemoteMessage message) {
    Map<String, String> d = message.getData();
    String type = d.get("type");
    if ("appel".equals(type)) {
      try { sonner(d); } catch (Exception e) { }
      return;
    }
    if ("appel_fin".equals(type)) {
      try { fin(d); } catch (Exception e) { }
      return;
    }
    super.onMessageReceived(message);
  }

  private void canaux(NotificationManager nm) {
    if (Build.VERSION.SDK_INT < 26) return;
    if (nm.getNotificationChannel(CANAL) == null) {
      NotificationChannel c = new NotificationChannel(CANAL, "Appels entrants", NotificationManager.IMPORTANCE_HIGH);
      c.setDescription("Sonnerie des appels vocaux");
      c.setSound(
          RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
          new AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .build());
      c.enableVibration(true);
      c.setVibrationPattern(VIBRE);
      c.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
      nm.createNotificationChannel(c);
    }
    if (nm.getNotificationChannel(CANAL_MANQUE) == null) {
      NotificationChannel m = new NotificationChannel(CANAL_MANQUE, "Appels manqu\u00e9s", NotificationManager.IMPORTANCE_DEFAULT);
      nm.createNotificationChannel(m);
    }
  }

  private PendingIntent lien(String id, String act, int code) {
    Intent i = new Intent(this, MainActivity.class);
    i.setAction(Intent.ACTION_VIEW);
    i.setData(Uri.parse("com.kaabu.agent://appel?id=" + Uri.encode(id) + "&act=" + act));
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    return PendingIntent.getActivity(this, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }

  private void sonner(Map<String, String> d) {
    if (MainActivity.visible) return;
    String id = d.get("appel_id");
    if (id == null || id.isEmpty()) return;
    String nom = d.get("nom");
    if (nom == null || nom.isEmpty()) nom = "Appel";
    NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    canaux(nm);
    PendingIntent ouvrir = lien(id, "ouvrir", 1);
    NotificationCompat.Builder b = new NotificationCompat.Builder(this, CANAL)
        .setSmallIcon(android.R.drawable.sym_call_incoming)
        .setContentTitle(nom)
        .setContentText("Appel vocal entrant")
        .setPriority(NotificationCompat.PRIORITY_MAX)
        .setCategory(NotificationCompat.CATEGORY_CALL)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))
        .setVibrate(VIBRE)
        .setOngoing(true)
        .setAutoCancel(true)
        .setTimeoutAfter(45000)
        .setContentIntent(ouvrir)
        .setFullScreenIntent(ouvrir, true)
        .addAction(0, "Refuser", lien(id, "refuser", 3))
        .addAction(0, "R\u00e9pondre", lien(id, "repondre", 2));
    Notification n = b.build();
    n.flags |= Notification.FLAG_INSISTENT;
    nm.notify(ID_APPEL, n);
  }

  private void fin(Map<String, String> d) {
    NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    boolean sonnait = false;
    for (StatusBarNotification s : nm.getActiveNotifications()) {
      if (s.getId() == ID_APPEL) sonnait = true;
    }
    nm.cancel(ID_APPEL);
    if (!sonnait) return;
    canaux(nm);
    String nom = d.get("nom");
    if (nom == null || nom.isEmpty()) nom = "Appel";
    Intent li = getPackageManager().getLaunchIntentForPackage(getPackageName());
    if (li == null) return;
    PendingIntent pi = PendingIntent.getActivity(this, 9, li, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    Notification n = new NotificationCompat.Builder(this, CANAL_MANQUE)
        .setSmallIcon(android.R.drawable.sym_call_missed)
        .setContentTitle("Appel manqu\u00e9")
        .setContentText(nom)
        .setAutoCancel(true)
        .setContentIntent(pi)
        .build();
    nm.notify(ID_MANQUE, n);
  }
}
