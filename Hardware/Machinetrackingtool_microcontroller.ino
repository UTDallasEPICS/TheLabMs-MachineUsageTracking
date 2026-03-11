/*EPICS 2200
Machine tracking tool
Microcontroller - ESP32-C3
Sensor - ACS724 Current Sensor
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>        // ← Added for timestamp

/*___________________________________
WIFI INFORMATION - NEED TO CHANGE
_____________________________________*/
const char* WIFI_SSID     = "EPICS115";
const char* WIFI_PASSWORD = "epicsHotspot115";
const char* SERVER_URL    = "http://172.20.10.11:3000/api/microcontroller/sensor";
const char* API_KEY       = "mByj6Y2qUfe1b1gX";
const char* MACHINE_ID    = "MACHINE_001";

#define CURRENT_PIN  A0

// ═══════════════════════════════════════════
// ADJUSTABLE SETTINGS
// ═══════════════════════════════════════════

#define VOLTAGE_THRESHOLD  0.3
#define SEND_INTERVAL      1000

// ═══════════════════════════════════════════
// DO NOT CHANGE ANYTHING BELOW THIS LINE
// ═══════════════════════════════════════════

#define ADC_MAX   4095
#define ADC_VREF  3.3

// NTP server settings
const char* NTP_SERVER   = "pool.ntp.org";
const long  GMT_OFFSET   = -21600;  // ← UTC-6 for Dallas Texas (change if different timezone)
const int   DAYLIGHT_OFFSET = 3600; // ← 1 hour daylight saving

unsigned long lastSendTime = 0;

// Gets current date and time as a formatted string
String getTimestamp() {
  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {
    return "Time not available";
  }

  char timestamp[30];
  // Format: 2026-03-10 14:35:22
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", &timeinfo);

  return String(timestamp);
}

float readVoltage() {
  int  samples = 100;
  long sum     = 0;

  for (int i = 0; i < samples; i++) {
    sum += analogRead(CURRENT_PIN);
    delayMicroseconds(100);
  }

  float avgADC  = sum / (float)samples;
  float voltage = (avgADC / ADC_MAX) * ADC_VREF;

  return voltage;
}

void setup() {
  Serial.begin(115200);

  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(3000);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");

  // Sync time from NTP server
  Serial.println("Syncing time...");
  configTime(GMT_OFFSET, DAYLIGHT_OFFSET, NTP_SERVER);

  // Wait until time is synced
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nTime synced!");
  Serial.println(getTimestamp());
}

void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;

    float voltage    = readVoltage();
    bool machineOn   = voltage > VOLTAGE_THRESHOLD;
    String timestamp = getTimestamp();

    // Print to Serial Monitor
    Serial.println("─────────────────────────────────");
    Serial.print  ("Time    : "); Serial.println(timestamp);
    Serial.print  ("Machine : "); Serial.println(machineOn ? "ON" : "OFF");
    Serial.println("─────────────────────────────────");

    // Send to API
    if (WiFi.status() == WL_CONNECTED) {
      StaticJsonDocument<128> doc;
      doc["machine_id"]    = MACHINE_ID;
      doc["machine_state"] = machineOn ? true : false;
      doc["timestamp"]     = timestamp;   // ← e.g. "2026-03-10 14:35:22"

      String payload;
      serializeJson(doc, payload);

      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("x-api-key", API_KEY);        // ← Fixed
      http.addHeader("Content-Type", "application/json");

      int responseCode = http.POST(payload);

      if (responseCode > 0) {
        Serial.printf("API Response: %d\n", responseCode);
      } else {
        Serial.printf("Error: %s\n", http.errorToString(responseCode).c_str());
      }

      http.end();
    } else {
      Serial.println("WiFi disconnected. Reconnecting...");
      WiFi.reconnect();
    }
  }
}