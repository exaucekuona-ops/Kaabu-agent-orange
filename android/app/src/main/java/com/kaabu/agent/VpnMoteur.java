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

  private static class T implements Tunnel {
    @Override public String getName() { return "exauchvpn"; }
    @Override public void onStateChange(Tunnel.State s) {
      if (s == Tunnel.State.UP) { etat = "connecte"; } else { etat = "deconnecte"; }
    }
  }

  public static String etat() { return etat; }

  public static long duree() {
    if (etat.equals("connecte") && debut > 0) { return (System.currentTimeMillis() - debut) / 1000; }
    return 0;
  }

  public static void demarrer(final Context ctx, final String texte) {
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
