/*EPICS 2200
Machine tracking tool
Microcontroller - ESP32-C3
Sensor - ACS724 Current Sensor
AC Current version - uses RMS calculation
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

/*___________________________________
WIFI INFORMATION - NEED TO CHANGE
_____________________________________*/
const char* WIFI_SSID     = "EPICS115";
const char* WIFI_PASSWORD = "epicsHotspot115";
const char* SERVER_URL    = "http://172.20.10.11:3000/api/microcontroller/sensor";
const char* API_KEY       = "mByj6Y2qUfe1b1gX";
const char* MACHINE_ID    = "MACHINE_001";

#define CURRENT_PIN        A0
#define VOLTAGE_THRESHOLD  0.05  // ← Lowered for RMS AC readings
#define SEND_INTERVAL      5000

/*___________________________________
DO NOT CHANGE ANYTHING BELOW
_____________________________________*/

#define ADC_MAX          4095
#define ADC_VREF         3.3
#define ZERO_POINT       0.5    // ACS724 outputs 0.5V at 0 current

const char* NTP_SERVER      = "pool.ntp.org";
const long  GMT_OFFSET      = -21600;
const int   DAYLIGHT_OFFSET = 3600;

unsigned long lastSendTime = 0;

String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "unavailable";
  char timestamp[25];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(timestamp);
}

// ─────────────────────────────────────────
// RMS voltage calculation for AC current
// Takes 1000 samples over multiple AC cycles
// and calculates true RMS value
// ─────────────────────────────────────────
float readVoltageRMS() {
  float sumSquares = 0;
  int   samples    = 1000;

  for (int i = 0; i < samples; i++) {
    float raw      = analogRead(CURRENT_PIN);
    float voltage  = (raw / ADC_MAX) * ADC_VREF;
    float centered = voltage - ZERO_POINT;  // Remove 0.5V zero offset
    sumSquares    += centered * centered;   // Square the value
    delayMicroseconds(100);
  }

  // Square root of average of squares = RMS
  float rmsVoltage = sqrt(sumSquares / samples);

  return rmsVoltage;
}

void setup() {
  delay(3000);
  Serial.begin(115200);

  Serial.println("=========================================");
  Serial.println("   EPICS Machine Tracking Tool          ");
  Serial.println("   AC Current Mode (RMS)                ");
  Serial.println("=========================================");

  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");

  Serial.println("Syncing time...");
  configTime(GMT_OFFSET, DAYLIGHT_OFFSET, NTP_SERVER);

  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nTime synced!");
  Serial.println(getTimestamp());
  Serial.println("=========================================");
}

void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;

    float rmsVoltage = readVoltageRMS();
    bool  machineOn  = rmsVoltage > VOLTAGE_THRESHOLD;
    String timestamp = getTimestamp();

    // Print to Serial Monitor
    Serial.println("─────────────────────────────────");
    Serial.print  ("Time         : "); Serial.println(timestamp);
    Serial.print  ("RMS Voltage  : "); Serial.print(rmsVoltage, 4); Serial.println(" V");
    Serial.print  ("Machine      : "); Serial.println(machineOn ? "ON" : "OFF");
    Serial.println("─────────────────────────────────");

    if (WiFi.status() == WL_CONNECTED) {
      StaticJsonDocument<256> doc;
      doc["machine_id"]    = MACHINE_ID;
      doc["machine_state"] = machineOn ? "ON" : "OFF";
      doc["timestamp"]     = timestamp;
      doc["voltage"]       = rmsVoltage;

      String payload;
      serializeJson(doc, payload);
      Serial.println("Sending: " + payload);

      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("x-api-key", API_KEY);
      http.addHeader("Content-Type", "application/json");
      http.setTimeout(3000);

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