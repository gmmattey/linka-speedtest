package br.com.linka.speedtest;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import br.com.linka.speedtest.wifi.LinkaWifiDiagnosticsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registra o plugin nativo ANTES de super.onCreate() — assim o
        // Bridge instancia o plugin durante a inicialização do webview
        // e expõe Capacitor.Plugins.LinkaWifiDiagnostics no JS.
        registerPlugin(LinkaWifiDiagnosticsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
