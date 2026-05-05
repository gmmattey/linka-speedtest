package br.com.linka.speedtest.network;

import android.Manifest;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.MulticastSocket;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(
    name = "LinkaLocalNetworkDiscovery",
    permissions = {
        @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION }, alias = "location")
    }
)
public class LocalNetworkDiscoveryPlugin extends Plugin {
    private static final String ALIAS_LOCATION = "location";
    private static final int MAX_TARGETS = 64;
    private static final int TCP_TIMEOUT_MS = 350;
    private static final int UDP_TIMEOUT_MS = 2300;
    private static final int[] TCP_PORTS = new int[] { 80, 443, 22, 53, 554, 8080 };
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void discoverDevices(PluginCall call) {
        if (getPermissionState(ALIAS_LOCATION) != PermissionState.GRANTED) {
            requestPermissionForAlias(ALIAS_LOCATION, call, "permissionCallback");
            return;
        }
        executor.execute(() -> resolveDiscovery(call));
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (getPermissionState(ALIAS_LOCATION) == PermissionState.GRANTED) {
            executor.execute(() -> resolveDiscovery(call));
            return;
        }
        JSObject denied = baseResult(false);
        denied.put("permissionStatus", "denied");
        call.resolve(denied);
    }

    private void resolveDiscovery(PluginCall call) {
        JSObject result = baseResult(true);
        JSArray observations = new JSArray();
        NetworkContext network = readNetworkContext();

        if (network == null) {
            result.put("available", false);
            result.put("observations", observations);
            call.resolve(result);
            return;
        }

        Set<String> targets = new HashSet<>();
        targets.add(network.gateway);

        for (Observation observation : readArpObservations()) {
            observations.put(observation.toJson());
            targets.add(observation.ip);
        }

        for (String target : buildTargets(network)) {
            targets.add(target);
            if (targets.size() >= MAX_TARGETS) break;
        }

        for (Observation observation : scanTcp(targets)) observations.put(observation.toJson());
        for (Observation observation : scanNetbios(targets)) observations.put(observation.toJson());
        for (Observation observation : scanSsdp()) observations.put(observation.toJson());
        for (Observation observation : scanMdns()) observations.put(observation.toJson());

        result.put("observations", observations);
        call.resolve(result);
    }

    private JSObject baseResult(boolean available) {
        JSObject result = new JSObject();
        result.put("available", available);
        result.put("permissionStatus", "granted");
        result.put("platform", "android");
        return result;
    }

    private NetworkContext readNetworkContext() {
        Context context = getContext();
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        WifiManager wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (cm == null || wifiManager == null || !wifiManager.isWifiEnabled()) return null;

        String ip = null;
        String gateway = null;
        try {
            Network active = cm.getActiveNetwork();
            if (active != null) {
                LinkProperties props = cm.getLinkProperties(active);
                if (props != null) {
                    for (android.net.LinkAddress link : props.getLinkAddresses()) {
                        if (link.getAddress() instanceof Inet4Address) {
                            ip = link.getAddress().getHostAddress();
                            break;
                        }
                    }
                    for (android.net.RouteInfo route : props.getRoutes()) {
                        InetAddress gw = route.getGateway();
                        if (route.isDefaultRoute() && gw instanceof Inet4Address) {
                            gateway = gw.getHostAddress();
                            break;
                        }
                    }
                }
            }
        } catch (SecurityException ignored) {
            return null;
        }

        if (ip == null && Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            try {
                WifiInfo info = wifiManager.getConnectionInfo();
                ip = intToIp(info.getIpAddress());
            } catch (SecurityException ignored) {
                return null;
            }
        }

        if (ip == null || gateway == null) return null;
        return new NetworkContext(ip, gateway);
    }

    private List<String> buildTargets(NetworkContext network) {
        List<String> targets = new ArrayList<>();
        String[] parts = network.ip.split("\\.");
        if (parts.length != 4) return targets;
        String prefix = parts[0] + "." + parts[1] + "." + parts[2] + ".";
        int self = parseLastOctet(network.ip);
        int gateway = parseLastOctet(network.gateway);

        for (int offset = -16; offset <= 16; offset++) {
            int candidate = self + offset;
            if (candidate > 0 && candidate < 255 && candidate != self) targets.add(prefix + candidate);
        }
        for (int i = 1; i <= 32; i++) {
            if (i != self && i != gateway) targets.add(prefix + i);
        }
        return targets;
    }

    private List<Observation> readArpObservations() {
        List<Observation> observations = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader("/proc/net/arp"))) {
            String line;
            boolean header = true;
            while ((line = reader.readLine()) != null) {
                if (header) {
                    header = false;
                    continue;
                }
                String[] parts = line.trim().split("\\s+");
                if (parts.length < 4) continue;
                String ip = parts[0];
                String mac = parts[3];
                if (!isIpv4(ip) || "00:00:00:00:00:00".equals(mac)) continue;
                observations.add(new Observation(ip, "arp").mac(mac));
            }
        } catch (IOException ignored) {
            // Android 10+ pode restringir ARP; outras fontes seguem.
        }
        return observations;
    }

    private List<Observation> scanTcp(Set<String> targets) {
        List<Observation> observations = new ArrayList<>();
        for (String ip : targets) {
            for (int port : TCP_PORTS) {
                if (connects(ip, port)) {
                    observations.add(new Observation(ip, "tcp"));
                    break;
                }
            }
        }
        return observations;
    }

    private boolean connects(String ip, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(ip, port), TCP_TIMEOUT_MS);
            return true;
        } catch (IOException ignored) {
            return false;
        }
    }

    private List<Observation> scanNetbios(Set<String> targets) {
        List<Observation> observations = new ArrayList<>();
        byte[] query = netbiosNodeStatusQuery();
        try (DatagramSocket socket = new DatagramSocket()) {
            socket.setSoTimeout(UDP_TIMEOUT_MS);
            for (String ip : targets) {
                try {
                    DatagramPacket packet = new DatagramPacket(query, query.length, InetAddress.getByName(ip), 137);
                    socket.send(packet);
                } catch (IOException ignored) {
                    // segue para o próximo IP
                }
            }

            long deadline = System.currentTimeMillis() + UDP_TIMEOUT_MS;
            while (System.currentTimeMillis() < deadline) {
                try {
                    byte[] buffer = new byte[576];
                    DatagramPacket response = new DatagramPacket(buffer, buffer.length);
                    socket.receive(response);
                    String name = parseNetbiosName(buffer, response.getLength());
                    String ip = response.getAddress().getHostAddress();
                    if (name != null) observations.add(new Observation(ip, "netbios").netbiosName(name));
                } catch (SocketTimeoutException timeout) {
                    break;
                } catch (IOException ignored) {
                    break;
                }
            }
        } catch (IOException ignored) {
            // indisponível neste device/rede
        }
        return observations;
    }

    private byte[] netbiosNodeStatusQuery() {
        return new byte[] {
            0x4c, 0x4b, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x20, 0x43, 0x4b, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41,
            0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41,
            0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x00, 0x00, 0x21,
            0x00, 0x01
        };
    }

    private String parseNetbiosName(byte[] data, int length) {
        if (length < 57) return null;
        int count = data[56] & 0xff;
        int offset = 57;
        for (int i = 0; i < count && offset + 18 <= length; i++) {
            String name = new String(data, offset, 15, StandardCharsets.US_ASCII).trim();
            int suffix = data[offset + 15] & 0xff;
            offset += 18;
            if (suffix == 0x00 && isUsefulNetbiosName(name)) return name;
        }
        return null;
    }

    private boolean isUsefulNetbiosName(String name) {
        if (name == null || name.isEmpty()) return false;
        String upper = name.toUpperCase(Locale.ROOT);
        return !upper.equals("WORKGROUP") && !upper.equals("MSHOME") && !upper.equals("__MSBROWSE__") && !upper.matches("[0-9A-F]{12,}");
    }

    private List<Observation> scanSsdp() {
        List<Observation> observations = new ArrayList<>();
        String request = "M-SEARCH * HTTP/1.1\r\n"
            + "HOST: 239.255.255.250:1900\r\n"
            + "MAN: \"ssdp:discover\"\r\n"
            + "MX: 1\r\n"
            + "ST: ssdp:all\r\n\r\n";

        try (DatagramSocket socket = new DatagramSocket()) {
            socket.setSoTimeout(UDP_TIMEOUT_MS);
            DatagramPacket packet = new DatagramPacket(
                request.getBytes(StandardCharsets.UTF_8),
                request.length(),
                InetAddress.getByName("239.255.255.250"),
                1900
            );
            socket.send(packet);

            long deadline = System.currentTimeMillis() + UDP_TIMEOUT_MS;
            while (System.currentTimeMillis() < deadline) {
                try {
                    byte[] buffer = new byte[2048];
                    DatagramPacket response = new DatagramPacket(buffer, buffer.length);
                    socket.receive(response);
                    String ip = response.getAddress().getHostAddress();
                    String raw = new String(buffer, 0, response.getLength(), StandardCharsets.UTF_8);
                    Observation observation = new Observation(ip, "ssdp");
                    String location = headerValue(raw, "location");
                    if (location != null) enrichFromSsdpDescription(observation, location);
                    observations.add(observation);
                } catch (SocketTimeoutException timeout) {
                    break;
                }
            }
        } catch (IOException ignored) {
            // SSDP bloqueado/indisponível
        }
        return observations;
    }

    private void enrichFromSsdpDescription(Observation observation, String location) {
        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(location).openConnection();
            conn.setConnectTimeout(900);
            conn.setReadTimeout(1200);
            conn.setRequestMethod("GET");
            try (InputStream stream = conn.getInputStream()) {
                String xml = readString(stream, 64_000);
                observation
                    .friendlyName(xmlTag(xml, "friendlyName"))
                    .vendor(xmlTag(xml, "manufacturer"))
                    .model(xmlTag(xml, "modelName"));
            }
        } catch (IOException ignored) {
            // descrição é enriquecimento, presença já foi detectada
        }
    }

    private List<Observation> scanMdns() {
        List<Observation> observations = new ArrayList<>();
        byte[] query = mdnsServicesQuery();
        try (MulticastSocket socket = new MulticastSocket()) {
            socket.setSoTimeout(UDP_TIMEOUT_MS);
            DatagramPacket packet = new DatagramPacket(query, query.length, InetAddress.getByName("224.0.0.251"), 5353);
            socket.send(packet);

            long deadline = System.currentTimeMillis() + UDP_TIMEOUT_MS;
            while (System.currentTimeMillis() < deadline) {
                try {
                    byte[] buffer = new byte[1500];
                    DatagramPacket response = new DatagramPacket(buffer, buffer.length);
                    socket.receive(response);
                    String ip = response.getAddress().getHostAddress();
                    String name = parseMdnsReadableName(buffer, response.getLength());
                    observations.add(new Observation(ip, "mdns").mdnsName(name));
                } catch (SocketTimeoutException timeout) {
                    break;
                }
            }
        } catch (IOException ignored) {
            // mDNS pode falhar em redes com multicast bloqueado
        }
        return observations;
    }

    private byte[] mdnsServicesQuery() {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(0); out.write(0); out.write(0); out.write(0);
        out.write(0); out.write(1); out.write(0); out.write(0);
        out.write(0); out.write(0); out.write(0); out.write(0);
        writeDnsName(out, "_services._dns-sd._udp.local");
        out.write(0); out.write(12);
        out.write(0); out.write(1);
        return out.toByteArray();
    }

    private String parseMdnsReadableName(byte[] data, int length) {
        for (int i = 12; i < length - 4; i++) {
            int labelLength = data[i] & 0xff;
            if (labelLength == 0 || labelLength > 63 || i + labelLength >= length) continue;
            String label = new String(data, i + 1, labelLength, StandardCharsets.UTF_8).trim();
            if (label.length() >= 2 && !label.startsWith("_") && !label.contains("\u0000")) return label;
        }
        return null;
    }

    private void writeDnsName(ByteArrayOutputStream out, String name) {
        for (String label : name.split("\\.")) {
            byte[] bytes = label.getBytes(StandardCharsets.UTF_8);
            out.write(bytes.length);
            out.write(bytes, 0, bytes.length);
        }
        out.write(0);
    }

    private String headerValue(String raw, String name) {
        String prefix = name.toLowerCase(Locale.ROOT) + ":";
        for (String line : raw.split("\\r?\\n")) {
            String lower = line.toLowerCase(Locale.ROOT);
            if (lower.startsWith(prefix)) return line.substring(line.indexOf(':') + 1).trim();
        }
        return null;
    }

    private String xmlTag(String xml, String tag) {
        Pattern pattern = Pattern.compile("<([^>/\\s:]+:)?" + tag + ">(.*?)</([^>/\\s:]+:)?" + tag + ">", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
        Matcher matcher = pattern.matcher(xml);
        if (!matcher.find()) return null;
        return matcher.group(2).replaceAll("\\s+", " ").trim();
    }

    private String readString(InputStream stream, int limit) throws IOException {
        byte[] buffer = new byte[4096];
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int read;
        while ((read = stream.read(buffer)) != -1 && out.size() < limit) {
            out.write(buffer, 0, Math.min(read, limit - out.size()));
        }
        return out.toString(StandardCharsets.UTF_8.name());
    }

    private String intToIp(int value) {
        return (value & 0xff) + "." + ((value >> 8) & 0xff) + "." + ((value >> 16) & 0xff) + "." + ((value >> 24) & 0xff);
    }

    private int parseLastOctet(String ip) {
        String[] parts = ip.split("\\.");
        if (parts.length != 4) return -1;
        try {
            return Integer.parseInt(parts[3]);
        } catch (NumberFormatException ignored) {
            return -1;
        }
    }

    private boolean isIpv4(String ip) {
        return ip != null && ip.matches("\\d{1,3}(\\.\\d{1,3}){3}");
    }

    private static class NetworkContext {
        final String ip;
        final String gateway;

        NetworkContext(String ip, String gateway) {
            this.ip = ip;
            this.gateway = gateway;
        }
    }

    private static class Observation {
        final String ip;
        final String source;
        String mac;
        String friendlyName;
        String mdnsName;
        String netbiosName;
        String vendor;
        String kind;

        Observation(String ip, String source) {
            this.ip = ip;
            this.source = source;
        }

        Observation mac(String value) { this.mac = value; return this; }
        Observation friendlyName(String value) { this.friendlyName = value; inferKind(value); return this; }
        Observation mdnsName(String value) { this.mdnsName = value; inferKind(value); return this; }
        Observation netbiosName(String value) { this.netbiosName = value; return this; }
        Observation vendor(String value) { this.vendor = value; inferKind(value); return this; }
        Observation model(String value) { inferKind(value); return this; }

        JSObject toJson() {
            JSObject out = new JSObject();
            out.put("ip", ip);
            out.put("source", source);
            if (mac != null) out.put("mac", mac);
            if (friendlyName != null) out.put("friendlyName", friendlyName);
            if (mdnsName != null) out.put("mdnsName", mdnsName);
            if (netbiosName != null) out.put("netbiosName", netbiosName);
            if (vendor != null) out.put("vendor", vendor);
            if (kind != null) out.put("kind", kind);
            return out;
        }

        private void inferKind(String value) {
            if (value == null || kind != null) return;
            String text = value.toLowerCase(Locale.ROOT);
            if (text.contains("router") || text.contains("gateway")) kind = "router";
            else if (text.contains("tv") || text.contains("chromecast") || text.contains("roku")) kind = "tv";
            else if (text.contains("printer") || text.contains("epson") || text.contains(" hp")) kind = "printer";
            else if (text.contains("camera")) kind = "camera";
            else if (text.contains("speaker") || text.contains("echo")) kind = "speaker";
            else if (text.contains("iphone") || text.contains("galaxy") || text.contains("android")) kind = "phone";
        }
    }
}
