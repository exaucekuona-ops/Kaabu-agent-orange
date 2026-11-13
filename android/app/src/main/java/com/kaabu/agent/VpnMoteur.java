package com.kaabu.agent;

import android.content.Context;
import com.wireguard.android.backend.GoBackend;
import com.wireguard.android.backend.Tunnel;
import com.wireguard.config.Config;
import java.io.BufferedReader;
import java.io.StringReader;

public class VpnMoteur {
  private static GoBackend backend = null;
  private static Tunnel tunnel = null;
  private static volatile String etat = "deconnecte";
  private static volatile long debut = 0;
  private static volatile boolean xray = false;
  private static Context appCtx = null;

  private static class T implements Tunnel {
    @Override public String getName() { return "exauchvpn"; }
    @Override public void onStateChange(Tunnel.State s) {
      if (s == Tunnel.State.UP) { etat = "connecte"; } else { etat = "deconnecte"; }
    }
  }

  public static String etat() { if (xray) { return XrayService.etat(); } return etat; }

  public static long duree() {
    if (xray) { return XrayService.duree(); }
    if (etat.equals("connecte") && debut > 0) { return (System.currentTimeMillis() - debut) / 1000; }
    return 0;
  }

  public static String octets() {
    if (xray) { return XrayService.octets(); }
    try {
      if (backend != null && tunnel != null && etat.equals("connecte")) {
        com.wireguard.android.backend.Statistics s = backend.getStatistics(tunnel);
        return s.totalTx() + "," + s.totalRx();
      }
    } catch (Throwable e) { }
    return "0,0";
  }

  public static void demarrer(final Context ctx, final String texte) {
    appCtx = ctx.getApplicationContext();
    if (texte.startsWith("xray|")) {
      try {
        String[] a = texte.split("\\|", -1);
        String cfg = XrayService.config(a[1], a[2], a[3], a[4], a[5]);
        xray = true;
        appCtx.startService(new android.content.Intent(appCtx, XrayService.class).putExtra("config", cfg));
      } catch (Throwable e) { xray = false; etat = "erreur:" + String.valueOf(e.getMessage()); }
      return;
    }
    xray = false;
    etat = "connexion";
    new Thread(new Runnable() {
      public void run() {
        try {
          if (backend == null) { backend = new GoBackend(ctx.getApplicationContext()); }
          if (tunnel == null) { tunnel = new T(); }
          Config cfg = Config.parse(new BufferedReader(new StringReader(texte)));
          backend.setState(tunnel, Tunnel.State.UP, cfg);
          debut = System.currentTimeMillis();
          etat = "connecte";
        } catch (Throwable e) {
          etat = "erreur:" + String.valueOf(e.getMessage());
        }
      }
    }).start();
  }

  public static void arreter() {
    if (xray) {
      xray = false;
      try { appCtx.startService(new android.content.Intent(appCtx, XrayService.class).setAction("STOP")); } catch (Throwable e) { }
      return;
    }
    new Thread(new Runnable() {
      public void run() {
        try {
          if (backend != null && tunnel != null) { backend.setState(tunnel, Tunnel.State.DOWN, null); }
        } catch (Throwable e) { }
        debut = 0;
        etat = "deconnecte";
      }
    }).start();
  }
}
