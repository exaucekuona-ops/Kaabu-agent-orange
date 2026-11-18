package com.kaabu.agent;

import android.content.Context;

public class VpnMoteur {
  private static volatile String etat = "deconnecte";
  private static volatile boolean xray = false;
  private static Context appCtx = null;

  public static String etat() { if (xray) { return XrayService.etat(); } return etat; }

  public static long duree() { if (xray) { return XrayService.duree(); } return 0; }

  public static String octets() { if (xray) { return XrayService.octets(); } return "0,0"; }

  public static void demarrer(final Context ctx, final String texte) {
    appCtx = ctx.getApplicationContext();
    if (texte != null && texte.startsWith("ssh|")) {
      try {
        xray = true;
        appCtx.startService(new android.content.Intent(appCtx, XrayService.class).putExtra("ssh", texte.substring(4)));
      } catch (Throwable e) {
        xray = false;
        etat = "erreur:" + String.valueOf(e.getMessage());
      }
      return;
    }
    if (texte == null || !texte.startsWith("xray|")) {
      xray = false;
      etat = "erreur:config xray invalide";
      return;
    }
    try {
      String[] a = texte.split("\\|", -1);
      String cfg = XrayService.config(a[1], a[2], a[3], a[4], a[5]);
      xray = true;
      appCtx.startService(new android.content.Intent(appCtx, XrayService.class).putExtra("config", cfg));
    } catch (Throwable e) {
      xray = false;
      etat = "erreur:" + String.valueOf(e.getMessage());
    }
  }

  public static void arreter() {
    if (xray) {
      xray = false;
      try { appCtx.startService(new android.content.Intent(appCtx, XrayService.class).setAction("STOP")); } catch (Throwable e) { }
    }
    etat = "deconnecte";
  }
}
