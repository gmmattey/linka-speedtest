package br.com.linka.speedtest.packetloss;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.SocketTimeoutException;

/**
 * Plugin nativo Android que mede packet loss real via UDP.
 *
 * Diferente da estimativa heurística do PWA web (derivada de timeouts
 * de ping HTTP/CORS), este plugin envia N pacotes UDP curtos para um
 * host (default Cloudflare 1.1.1.1:53 — porta DNS) e conta quantos
 * voltaram dentro do timeout. RTT médio é calculado das respostas
 * recebidas.
 *
 * Contrato (TS): src/utils/packetLoss.ts -> PacketLossResult.
 *
 * Permissão: requer apenas `android.permission.INTERNET` (já declarada
 * no AndroidManifest.xml). Não exige localização.
 *
 * Limitações conhecidas:
 *   - Alguns roteadores residenciais bloqueiam respostas DNS UDP de saída
 *     se o cliente não enviar uma query DNS válida — por isso enviamos
 *     uma query DNS minimal (12 bytes) que é aceita por servidores DNS
 *     padrão. Se ainda assim houver bloqueio, o teste retornará 100% de
 *     perda (todos os pacotes em timeout).
 *   - Em redes celulares com NAT/CGNAT pesado, o RTT pode incluir buffer
 *     da operadora, mas a contagem de perda permanece confiável.
 *
 * iOS: este plugin é apenas Android. Para iOS, seria necessário um
 * plugin Capacitor separado em Swift (Network framework / NWConnection).
 * No PWA web, o bridge `measurePacketLossNative()` retorna
 * `{ available: false }` — o orchestrator cai pra estimativa atual.
 */
@CapacitorPlugin(name = "PacketLoss")
public class PacketLossPlugin extends Plugin {

    @PluginMethod
    public void measurePacketLoss(PluginCall call) {
        final String host = call.getString("host", "1.1.1.1");
        final int port = call.getInt("port", 53);
        final int packetCount = call.getInt("packetCount", 50);
        final int timeoutMs = call.getInt("timeoutMs", 1000);
        final int spacingMs = call.getInt("spacingMs", 20);

        // Sai da main thread — UDP I/O bloqueante não pode rodar lá.
        new Thread(() -> {
            try {
                int sent = 0;
                int received = 0;
                long totalRttMs = 0;

                final InetAddress addr = InetAddress.getByName(host);

                for (int i = 0; i < packetCount; i++) {
                    DatagramSocket socket = null;
                    try {
                        socket = new DatagramSocket();
                        socket.setSoTimeout(timeoutMs);

                        byte[] payload = generateDnsQueryPayload((short) (i + 1));
                        DatagramPacket packet = new DatagramPacket(payload, payload.length, addr, port);

                        long t0 = System.nanoTime();
                        socket.send(packet);
                        sent++;

                        try {
                            byte[] buf = new byte[512];
                            DatagramPacket response = new DatagramPacket(buf, buf.length);
                            socket.receive(response);
                            long rtt = (System.nanoTime() - t0) / 1_000_000L;
                            received++;
                            totalRttMs += rtt;
                        } catch (SocketTimeoutException e) {
                            // packet considerado perdido
                        }
                    } finally {
                        if (socket != null && !socket.isClosed()) {
                            socket.close();
                        }
                    }

                    if (i < packetCount - 1 && spacingMs > 0) {
                        try {
                            Thread.sleep(spacingMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }

                int lossPercent = sent > 0
                    ? Math.round(100f * (sent - received) / sent)
                    : 0;
                long avgRttMs = received > 0 ? totalRttMs / received : -1L;

                JSObject result = new JSObject();
                result.put("sent", sent);
                result.put("received", received);
                result.put("lossPercent", lossPercent);
                result.put("avgRttMs", avgRttMs);
                result.put("platform", "android");

                call.resolve(result);
            } catch (Exception e) {
                call.reject("Packet loss measurement failed: " + e.getMessage());
            }
        }, "lk-packet-loss").start();
    }

    /**
     * Gera um payload mínimo de query DNS (RFC 1035) — 12 bytes de header
     * + uma pergunta vazia (root). Servidores DNS respondem com FORMERR ou
     * uma resposta válida — o que importa para nós é receber QUALQUER
     * datagrama de volta dentro do timeout (medição de packet loss, não de
     * resolução).
     *
     * `id` é um identificador de 16 bits que diferencia pacotes — bate com
     * o número da iteração para facilitar debug se necessário.
     */
    private byte[] generateDnsQueryPayload(short id) {
        byte[] packet = new byte[17];
        // Header (12 bytes)
        packet[0] = (byte) ((id >> 8) & 0xFF);  // ID hi
        packet[1] = (byte) (id & 0xFF);         // ID lo
        packet[2] = 0x01;  // flags hi: RD=1 (recursion desired)
        packet[3] = 0x00;  // flags lo
        packet[4] = 0x00; packet[5] = 0x01;  // QDCOUNT=1
        packet[6] = 0x00; packet[7] = 0x00;  // ANCOUNT=0
        packet[8] = 0x00; packet[9] = 0x00;  // NSCOUNT=0
        packet[10] = 0x00; packet[11] = 0x00; // ARCOUNT=0
        // Question section: query for "." (root) — 1 byte zero (label terminator)
        packet[12] = 0x00;
        // QTYPE = A (1)
        packet[13] = 0x00; packet[14] = 0x01;
        // QCLASS = IN (1)
        packet[15] = 0x00; packet[16] = 0x01;
        return packet;
    }
}
