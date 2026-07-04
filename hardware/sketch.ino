/*
  ============================================================
  Office IoT Monitor - ESP32 Firmware  (Work Room 1 - representative room)
  ------------------------------------------------------------
  Project : "Lights, Fans, Discord: The Boss's Big Idea"
  Board   : ESP32 DevKit V1  (Wokwi simulation)

  ============================================================
*/

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>

// ---------- WiFi (Wokwi's built-in simulated open network) ----------
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// ---------- Room identity ----------
const char* ROOM_NAME = "WorkRoom1";

// ---------- Backend endpoint (replace with your real backend URL) ----------
const char* BACKEND_URL = "http://your-backend-server.example.com/api/rooms/update";

// ---------- Device pin map ----------
#define FAN1_PIN            16
#define FAN2_PIN            17
#define LIGHT1_PIN          18
#define LIGHT2_PIN          19
#define LIGHT3_PIN          21
#define CURRENT_SENSOR_PIN  34   // ADC1_CH6 - potentiometer stands in for ACS712 analog out

// Relay modules used here are ACTIVE HIGH (IN=HIGH -> coil energised -> COM-NO closed)
#define RELAY_ON   HIGH
#define RELAY_OFF  LOW

struct Device {
  const char* name;
  const char* type;     // "fan" or "light"
  uint8_t     pin;
  float       ratedWatts;
  bool        isOn;
};

Device devices[5] = {
  { "Fan1",   "fan",   FAN1_PIN,   55.0, false },
  { "Fan2",   "fan",   FAN2_PIN,   55.0, false },
  { "Light1", "light", LIGHT1_PIN, 15.0, false },
  { "Light2", "light", LIGHT2_PIN, 15.0, false },
  { "Light3", "light", LIGHT3_PIN, 15.0, false },
};

const int NUM_DEVICES = 5;

WebServer server(80);

unsigned long lastReportMs = 0;
const unsigned long REPORT_INTERVAL_MS = 5000;

// ---------------- Helper functions ----------------

int findDeviceIndex(const String& name) {
  for (int i = 0; i < NUM_DEVICES; i++) {
    if (name.equalsIgnoreCase(devices[i].name)) return i;
  }
  return -1;
}

void applyRelay(int idx) {
  digitalWrite(devices[idx].pin, devices[idx].isOn ? RELAY_ON : RELAY_OFF);
}

// theoretical load from devices that are currently ON
float calcTheoreticalWatts() {
  float total = 0;
  for (int i = 0; i < NUM_DEVICES; i++) {
    if (devices[i].isOn) total += devices[i].ratedWatts;
  }
  return total;
}

// Read the simulated current sensor and convert to Amps / Watts.
// Potentiometer 0-4095 -> 0-10A (placeholder scale).
// On real hardware with an ACS712: Amps = (Vout - Vzero) / sensitivity
float readSensorAmps() {
  int raw = analogRead(CURRENT_SENSOR_PIN);   // 0 - 4095
  float amps = (raw / 4095.0) * 10.0;         // scaled to 0-10A range
  return amps;
}

String buildStatusJson() {
  float theoreticalW = calcTheoreticalWatts();
  float sensorAmps   = readSensorAmps();
  float sensorWatts  = sensorAmps * 220.0;    // assume 220V mains

  String json = "{";
  json += "\"room\":\"" + String(ROOM_NAME) + "\",";
  json += "\"devices\":[";
  for (int i = 0; i < NUM_DEVICES; i++) {
    json += "{";
    json += "\"name\":\"" + String(devices[i].name) + "\",";
    json += "\"type\":\"" + String(devices[i].type) + "\",";
    json += "\"state\":" + String(devices[i].isOn ? "true" : "false");
    json += "}";
    if (i < NUM_DEVICES - 1) json += ",";
  }
  json += "],";
  json += "\"theoretical_watts\":" + String(theoreticalW, 1) + ",";
  json += "\"sensor_amps\":" + String(sensorAmps, 2) + ",";
  json += "\"sensor_watts\":" + String(sensorWatts, 1) + ",";
  json += "\"uptime_ms\":" + String(millis());
  json += "}";
  return json;
}

// ---------------- HTTP handlers (local REST API) ----------------

void handleStatus() {
  server.send(200, "application/json", buildStatusJson());
}

void handleToggle() {
  if (!server.hasArg("device") || !server.hasArg("state")) {
    server.send(400, "application/json", "{\"error\":\"missing device or state param\"}");
    return;
  }
  String devName  = server.arg("device");
  String stateStr = server.arg("state");
  int idx = findDeviceIndex(devName);
  if (idx < 0) {
    server.send(404, "application/json", "{\"error\":\"device not found\"}");
    return;
  }
  bool newState = (stateStr == "1" || stateStr.equalsIgnoreCase("on") || stateStr.equalsIgnoreCase("true"));
  devices[idx].isOn = newState;
  applyRelay(idx);

  Serial.printf("[TOGGLE] %s -> %s\n", devices[idx].name, newState ? "ON" : "OFF");
  server.send(200, "application/json", buildStatusJson());
}

void handleRoot() {
  String html = "<html><body><h2>" + String(ROOM_NAME) + " - Device Monitor</h2>";
  html += "<p>GET /status  -&gt; JSON status of this room</p>";
  html += "<p>GET /toggle?device=Fan1&amp;state=1 -&gt; control a device</p>";
  html += "<pre>" + buildStatusJson() + "</pre></body></html>";
  server.send(200, "text/html", html);
}

// ---------------- Backend reporting ----------------

void reportToBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");

  String payload = buildStatusJson();
  int httpCode = http.POST(payload);

  Serial.print("[BACKEND] POST status code: ");
  Serial.println(httpCode);
  http.end();
}

// ---------------- Setup / Loop ----------------

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== Office IoT Monitor booting ===");

  for (int i = 0; i < NUM_DEVICES; i++) {
    pinMode(devices[i].pin, OUTPUT);
    digitalWrite(devices[i].pin, RELAY_OFF);
  }
  pinMode(CURRENT_SENSOR_PIN, INPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi NOT connected - running offline (relays still respond locally).");
  }

  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/toggle", handleToggle);
  server.begin();
  Serial.println("Local REST API started on port 80.");
}

void loop() {
  server.handleClient();

  if (millis() - lastReportMs > REPORT_INTERVAL_MS) {
    lastReportMs = millis();
    Serial.println(buildStatusJson());
    reportToBackend();
  }
}
