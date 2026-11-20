package com.kaabu.agent;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.app.DownloadManager;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import java.io.File;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  static volatile boolean visible = false;

  public class Pont {
    @JavascriptInterface
    public void sonner() {
      jouer();
    }

    @JavascriptInterface
    public void stop() {
      couper();
      arreter();
    }

    @JavascriptInterface
    public void vpnConnecter(final String config) {
      runOnUiThread(new Runnable() {
        public void run() {
          try {
            Intent i = VpnService.prepare(MainActivity.this);
            if (i != null) { vpnEnAttente = config; startActivityForResult(i, 7711); }
            else { VpnMoteur.demarrer(MainActivity.this, config); }
          } catch (Exception e) { }
        }
      });
    }

    @JavascriptInterface
    public void vpnDeconnecter() { VpnMoteur.arreter(); }

    @JavascriptInterface
    public String vpnEtat() { return VpnMoteur.etat(); }

    @JavascriptInterface
    public long vpnDuree() { return VpnMoteur.duree(); }
    @JavascriptInterface
    public String vpnOctets() { return VpnMoteur.octets(); }

    @JavascriptInterface
    public String majDemarrer(String url, String version) {
      try {
        SharedPreferences sp = getSharedPreferences("maj", Context.MODE_PRIVATE);
        DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        File f = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "telecom-rdc.apk");
        long id = sp.getLong("id", -1);
        if (id != -1 && version.equals(sp.getString("ver", ""))) {
          Cursor c = dm.query(new DownloadManager.Query().setFilterById(id));
          if (c != null) {
            try {
              if (c.moveToFirst()) {
                int st = c.getInt(c.getColumnIndex(DownloadManager.COLUMN_STATUS));
                if (st == DownloadManager.STATUS_RUNNING || st == DownloadManager.STATUS_PENDING || st == DownloadManager.STATUS_PAUSED) { return "reprise"; }
                if (st == DownloadManager.STATUS_SUCCESSFUL && f.exists()) { return "reprise"; }
              }
            } finally {
              c.close();
            }
          }
        }
        if (id != -1) { dm.remove(id); }
        if (f.exists()) { f.delete(); }
        DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
        r.setTitle("Telecom RDC : mise a jour");
        r.setDescription("Telechargement de la nouvelle version");
        r.setMimeType("application/vnd.android.package-archive");
        r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        r.setAllowedOverMetered(true);
        r.setAllowedOverRoaming(true);
        r.setDestinationInExternalFilesDir(MainActivity.this, Environment.DIRECTORY_DOWNLOADS, "telecom-rdc.apk");
        long nid = dm.enqueue(r);
        sp.edit().putLong("id", nid).putString("ver", version).apply();
        return "demarre";
      } catch (Exception e) {
        return "erreur: " + e.getMessage();
      }
    }

    @JavascriptInterface
    public String majEtat(String version) {
      try {
        SharedPreferences sp = getSharedPreferences("maj", Context.MODE_PRIVATE);
        long id = sp.getLong("id", -1);
        if (id == -1 || !version.equals(sp.getString("ver", ""))) { return "aucun|0|0"; }
        DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        Cursor c = dm.query(new DownloadManager.Query().setFilterById(id));
        if (c == null) { return "aucun|0|0"; }
        try {
          if (!c.moveToFirst()) { return "aucun|0|0"; }
          int st = c.getInt(c.getColumnIndex(DownloadManager.COLUMN_STATUS));
          long fait = c.getLong(c.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
          long total = c.getLong(c.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
          if (st == DownloadManager.STATUS_SUCCESSFUL) {
            File f = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "telecom-rdc.apk");
            if (!f.exists()) { return "aucun|0|0"; }
            return "ok|" + fait + "|" + total;
          }
          if (st == DownloadManager.STATUS_FAILED) { return "echec|0|0"; }
          if (st == DownloadManager.STATUS_PAUSED) { return "pause|" + fait + "|" + total; }
          return "cours|" + fait + "|" + total;
        } finally {
          c.close();
        }
      } catch (Exception e) {
        return "aucun|0|0";
      }
    }

    @JavascriptInterface
    public String majChemin() {
      return new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "telecom-rdc.apk").getAbsolutePath();
    }
  }

  private String vpnEnAttente = null;

  @Override
  public void onActivityResult(int code, int res, Intent data) {
    super.onActivityResult(code, res, data);
    if (code == 7711 && res == RESULT_OK && vpnEnAttente != null) {
      VpnMoteur.demarrer(this, vpnEnAttente);
    }
    if (code == 7711) { vpnEnAttente = null; }
  }

  private MediaPlayer lecteur = null;

  void jouer() {
    runOnUiThread(new Runnable() {
      public void run() {
        try {
          couper();
          int id = getResources().getIdentifier("sonnerie_appel", "raw", getPackageName());
          if (id == 0) return;
          AudioAttributes a = new AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .build();
          lecteur = MediaPlayer.create(MainActivity.this, id, a, AudioManager.AUDIO_SESSION_ID_GENERATE);
          if (lecteur == null) return;
          lecteur.setLooping(true);
          lecteur.setVolume(1f, 1f);
          lecteur.start();
          final MediaPlayer p = lecteur;
          new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(new Runnable() {
            public void run() { if (lecteur == p) couper(); }
          }, 45000);
        } catch (Exception e) { }
      }
    });
  }

  void couper() {
    runOnUiThread(new Runnable() {
      public void run() {
        try { if (lecteur != null) { lecteur.stop(); lecteur.release(); } } catch (Exception e) { }
        lecteur = null;
      }
    });
  }

  void arreter() {
    try {
      NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
      nm.cancel(AppelService.ID_APPEL);
    } catch (Exception e) { }
  }

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    try { getBridge().getWebView().getSettings().setTextZoom(100); } catch (Exception e) { }
    try {
      getBridge().getWebView().addJavascriptInterface(new Pont(), "AppelNatif");
    } catch (Exception e) { }
    reveiller(getIntent());
  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    reveiller(intent);
  }

  @Override
  public void onResume() {
    super.onResume();
    visible = true;
  }

  @Override
  public void onPause() {
    super.onPause();
    visible = false;
  }

  private void reveiller(Intent i) {
    try {
      if (i == null || i.getData() == null) return;
      if (!"appel".equals(i.getData().getHost())) return;
      if (Build.VERSION.SDK_INT >= 27) {
        setShowWhenLocked(true);
        setTurnScreenOn(true);
      } else {
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
      }
      getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      String act = i.getData().getQueryParameter("act");
      if ("repondre".equals(act) || "refuser".equals(act)) arreter();
    } catch (Exception e) { }
  }
}
