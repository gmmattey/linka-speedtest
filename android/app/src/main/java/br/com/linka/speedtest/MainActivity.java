package br.com.linka.speedtest;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import br.com.linka.speedtest.wifi.LinkaWifiDiagnosticsPlugin;
import br.com.linka.speedtest.packetloss.PacketLossPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registra os plugins nativos ANTES de super.onCreate() — assim o
        // Bridge instancia os plugins durante a inicialização do webview
        // e expõe Capacitor.Plugins.<Name> no JS.
        registerPlugin(LinkaWifiDiagnosticsPlugin.class);
        registerPlugin(PacketLossPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
