/*
 * EPICS 2200
 * Machine Tracking Tool
 * Microcontroller : Seeed XIAO ESP32-C3
 * Sensor          : ACS724 Current Sensor
 * Supports both AC and DC current
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// ═══════════════════════════════════════════
//  ✏️  CHANGE THESE
// ═══════════════════════════════════════════

const char* WIFI_SSID     = "EPICS115";
const char* WIFI_PASSWORD = "epicsHotspot115";
const char* SERVER_URL    = "http://172.20.10.11:3000/api/microcontroller/sensor";
const char* API_KEY       = "mByj6Y2qUfe1b1gX";
const char* MACHINE_ID    = "Vacuum";

#define CURRENT_PIN       A0
#define VOLTAGE_THRESHOLD 0.1   // ← Adjust after seeing your readings
#define AC_MODE           false  // ← false = DC, true = AC

// ═══════════════════════════════════════════
//  🔒  DO NOT CHANGE BELOW
// ═══════════════════════════════════════════

#define ADC_MAX    4095
#define ADC_VREF   3.3
#define ZERO_POINT 0.33  // ← 0.33 if sensor powered by 3.3V, 0.5 if powered by 5V
#define SAMPLES    500

const char* NTP_SERVER      = "pool.ntp.org";
const long  GMT_OFFSET      = -21600;
const int   DAYLIGHT_OFFSET = 3600;

bool          lastMachineState = false;
unsigned long lastPrintTime    = 0;

// ─────────────────────────────────────────
// Get timestamp
// ─────────────────────────────────────────
String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "unavailable";
  char timestamp[25];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(timestamp);
}

// ─────────────────────────────────────────
// Read voltage — automatically handles
// AC (RMS) and DC (average) based on AC_MODE
// ─────────────────────────────────────────
float readVoltage() {
  float sumSquares = 0;
  long  sum        = 0;

  for (int i = 0; i < SAMPLES; i++) {
    float raw      = analogRead(CURRENT_PIN);
    float voltage  = (raw / ADC_MAX) * ADC_VREF;
    float centered = voltage - ZERO_POINT;

    if (AC_MODE) {
      sumSquares += centered * centered;
    } else {
      sum += analogRead(CURRENT_PIN);
    }

    delayMicroseconds(100);
  }

  if (AC_MODE) {
    return sqrt(sumSquares / SAMPLES);
  } else {
    float avgADC = sum / (float)SAMPLES;
    return (avgADC / ADC_MAX) * ADC_VREF;
  }
}

// ─────────────────────────────────────────
// Convert voltage to current in Amps
// ─────────────────────────────────────────
float voltageToCurrent(float voltage) {
  float sensitivity = 0.133 * (ADC_VREF / 5.0);
  float current     = (voltage - ZERO_POINT) / sensitivity;
  if (current < 0) current = 0;
  return current;
}

// ─────────────────────────────────────────
// Send to server
// ─────────────────────────────────────────
void sendToServer(bool machineOn, float voltage, float current, String timestamp) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected — skipping send");
    return;
  }

  StaticJsonDocument<256> doc;
  doc["machine_id"]    = MACHINE_ID;
  doc["machine_state"] = machineOn;
  doc["timestamp"]     = timestamp;
  doc["voltage"]       = voltage;
  doc["current_A"]     = current;

  String payload;
  serializeJson(doc, payload);

  Serial.print("Sending : ");
  Serial.println(payload);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("x-api-key", API_KEY);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  int responseCode = http.POST(payload);

  if (responseCode == 200 || responseCode == 201) {
    Serial.println("Server : 200 OK — data saved!");
  } else if (responseCode > 0) {
    Serial.print("Server error : ");
    Serial.println(responseCode);
    Serial.println(http.getString());
  } else {
    Serial.print("Connection error : ");
    Serial.println(http.errorToString(responseCode));
  }

  http.end();
}

// ─────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────
void setup() {
  delay(3000);
  Serial.begin(115200);

  Serial.println("=========================================");
  Serial.println("      EPICS Machine Tracking Tool       ");
  Serial.print  ("      Mode : ");
  Serial.println(AC_MODE ? "AC Current" : "DC Current");
  Serial.println("=========================================");

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP : ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Failed!");
  }

  Serial.print("Syncing time");
  configTime(GMT_OFFSET, DAYLIGHT_OFFSET, NTP_SERVER);

  struct tm timeinfo;
  attempts = 0;
  while (!getLocalTime(&timeinfo) && attempts < 10) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  Serial.println("\nTime synced : " + getTimestamp());
  Serial.println("=========================================");
  Serial.println("DEBUG MODE — printing every second      ");
  Serial.println("=========================================");

  float initialVoltage = readVoltage();
  float initialCurrent = voltageToCurrent(initialVoltage);
  lastMachineState     = initialVoltage > VOLTAGE_THRESHOLD;

  Serial.print("Initial voltage : "); Serial.print(initialVoltage, 4); Serial.println(" V");
  Serial.print("Initial current : "); Serial.print(initialCurrent, 4); Serial.println(" A");
  Serial.print("Initial state   : "); Serial.println(lastMachineState ? "ON" : "OFF");
}

// ─────────────────────────────────────────
// LOOP
// ─────────────────────────────────────────
void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi dropped — reconnecting...");
    WiFi.reconnect();
    delay(3000);
  }

  float voltage  = readVoltage();
  float current  = voltageToCurrent(voltage);
  bool  machineOn = voltage > VOLTAGE_THRESHOLD;

  // Print every second
  unsigned long now = millis();
  if (now - lastPrintTime >= 1000) {
    lastPrintTime = now;
    Serial.print("Voltage : ");
    Serial.print(voltage, 4);
    Serial.print(" V  |  Current : ");
    Serial.print(current, 4);
    Serial.print(" A  |  Status : ");
    Serial.println(machineOn ? "ON " : "OFF");
  }

  // Only send when state changes
  if (machineOn != lastMachineState) {
    lastMachineState = machineOn;
    String timestamp = getTimestamp();

    Serial.println();
    Serial.println("!!! STATE CHANGED !!!");
    Serial.println("┌─────────────────────────────────────┐");
    Serial.print  ("│ Machine : "); Serial.println(MACHINE_ID);
    Serial.print  ("│ Mode    : "); Serial.println(AC_MODE ? "AC" : "DC");
    Serial.print  ("│ Time    : "); Serial.println(timestamp);
    Serial.print  ("│ Voltage : "); Serial.print(voltage, 4); Serial.println(" V");
    Serial.print  ("│ Current : "); Serial.print(current, 4); Serial.println(" A");
    Serial.print  ("│ Status  : "); Serial.println(machineOn ? "ON  ✓" : "OFF ✗");
    Serial.println("└─────────────────────────────────────┘");

    sendToServer(machineOn, voltage, current, timestamp);
  }

  delay(200);
}