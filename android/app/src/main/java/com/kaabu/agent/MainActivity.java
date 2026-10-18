package com.kaabu.agent;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  static volatile boolean visible = false;

  public class Pont {
    @JavascriptInterface
    public void stop() {
      arreter();
    }
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
