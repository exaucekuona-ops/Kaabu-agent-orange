package com.kaabu.agent;

import android.content.Intent;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import libv2ray.CoreCallbackHandler;
import libv2ray.CoreController;
import libv2ray.Libv2ray;
import org.json.JSONObject;
import com.trilead.ssh2.Connection;
import com.trilead.ssh2.DynamicPortForwarder;

public class XrayService extends VpnService {
  private static volatile String etat = "deconnecte";
  private static volatile long debut = 0;
  private CoreController ctrl = null;
  private ParcelFileDescriptor tun = null;
  private Connection ssh = null;
  private DynamicPortForwarder dpf = null;

  public static String etat() { return etat; }
  public static long duree() {
    if (etat.equals("connecte") && debut > 0) { return (System.currentTimeMillis() - debut) / 1000; }
    return 0;
  }
  public static String octets() { return "0,0"; }

  public static String config(String ip, String port, String uuid, String sni, String chemin) {
    String h = sni.length() > 0 ? sni : ip;
    String p = chemin.length() > 0 ? chemin : "/";
    return "{\"log\":{\"loglevel\":\"warning\"},"
      + "\"dns\":{\"servers\":[\"1.1.1.1\",\"8.8.8.8\"]},"
      + "\"inbounds\":[{\"tag\":\"tun\",\"protocol\":\"tun\",\"settings\":{\"name\":\"xray0\",\"MTU\":1500}}],"
      + "\"outbounds\":[{\"tag\":\"proxy\",\"protocol\":\"vless\",\"settings\":{\"vnext\":[{\"address\":" + JSONObject.quote(ip)
      + ",\"port\":" + Integer.parseInt(port.trim()) + ",\"users\":[{\"id\":" + JSONObject.quote(uuid) + ",\"encryption\":\"none\"}]}]},"
      + "\"streamSettings\":{\"network\":\"ws\",\"security\":\"tls\",\"tlsSettings\":{\"serverName\":" + JSONObject.quote(h) + "},"
      + "\"wsSettings\":{\"path\":" + JSONObject.quote(p) + ",\"headers\":{\"Host\":" + JSONObject.quote(h) + "}}}},"
      + "{\"tag\":\"direct\",\"protocol\":\"freedom\"}]}";
  }

  public static String configSsh(int portLocal) {
    return "{\"log\":{\"loglevel\":\"warning\"},"
      + "\"dns\":{\"servers\":[\"tcp://1.1.1.1\",\"tcp://8.8.8.8\"]},"
      + "\"inbounds\":[{\"tag\":\"tun\",\"protocol\":\"tun\",\"settings\":{\"name\":\"xray0\",\"MTU\":1500}}],"
      + "\"outbounds\":[{\"tag\":\"proxy\",\"protocol\":\"socks\",\"settings\":{\"servers\":[{\"address\":\"127.0.0.1\",\"port\":" + portLocal + "}]}},"
      + "{\"tag\":\"direct\",\"protocol\":\"freedom\"}]}";
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent != null && "STOP".equals(intent.getAction())) { arreter(); return START_NOT_STICKY; }
    final String cfg = intent == null ? null : intent.getStringExtra("config");
    final String sshInfo = intent == null ? null : intent.getStringExtra("ssh");
    if (cfg == null && sshInfo == null) { etat = "erreur:config vide"; return START_NOT_STICKY; }
    etat = "connexion";
    new Thread(new Runnable() {
      public void run() { demarrer(cfg, sshInfo); }
    }).start();
    return START_NOT_STICKY;
  }

  private void demarrer(String cfgIn, String sshInfo) {
    try {
      String cfg = cfgIn;
      if (sshInfo != null) {
        String[] a = sshInfo.split("\\|", 4);
        ssh = new Connection(a[0], Integer.parseInt(a[1].trim()));
        ssh.connect(null, 15000, 15000);
        if (!ssh.authenticateWithPassword(a[2], a[3])) { throw new Exception("SSH: nom ou mot de passe refuse"); }
        dpf = ssh.createDynamicPortForwarder(10809);
        cfg = configSsh(10809);
      }
      Builder b = new Builder();
      b.setSession("ExauchVPN").addAddress("172.19.0.1", 30).addRoute("0.0.0.0", 0)
       .addDnsServer("1.1.1.1").addDnsServer("8.8.8.8").setMtu(1500);
      try { b.addDisallowedApplication(getPackageName()); } catch (Throwable e) { }
      tun = b.establish();
      if (tun == null) { throw new Exception("TUN refuse"); }
      Libv2ray.initCoreEnv(getFilesDir().getAbsolutePath(), "");
      ctrl = Libv2ray.newCoreController(new CoreCallbackHandler() {
        public long onEmitStatus(long a, String s) { return 0; }
        public long shutdown() { return 0; }
        public long startup() { return 0; }
      });
      ctrl.startLoop(cfg, tun.getFd());
      debut = System.currentTimeMillis();
      etat = "connecte";
    } catch (Throwable e) {
      nettoyer();
      etat = "erreur:" + String.valueOf(e.getMessage());
    }
  }

  private void nettoyer() {
    try { if (dpf != null) { dpf.close(); } } catch (Throwable e) { }
    try { if (ssh != null) { ssh.close(); } } catch (Throwable e) { }
    dpf = null; ssh = null;
    try { if (ctrl != null) { ctrl.stopLoop(); } } catch (Throwable e) { }
    try { if (tun != null) { tun.close(); } } catch (Throwable e) { }
    ctrl = null; tun = null; debut = 0;
  }

  private void arreter() {
    nettoyer();
    etat = "deconnecte";
    stopSelf();
  }

  @Override
  public void onDestroy() { nettoyer(); etat = "deconnecte"; super.onDestroy(); }
}
