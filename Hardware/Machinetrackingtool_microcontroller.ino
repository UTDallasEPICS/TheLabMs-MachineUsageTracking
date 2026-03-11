/*EPICS 2200
Machine tracking tool
Microcontroller - ESP32-C3
Sensor - ACS724 Current Sensor
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

/*___________________________________
WIFI INFORMATION - NEED TO CHANGE
_____________________________________*/
const char* WIFI_SSID     = "EPICS115";
const char* WIFI_PASSWORD = "epicsHotspot115";
const char* SERVER_URL    = "http://172.20.10.3:3000/X5Znno9EV7rjx0op/server/api/microcontroller";
const char* MACHINE_ID    = "MACHINE_001";


#define CURRENT_PIN  A0   // Use A0, A1, or A2 — whichever pin you wire the sensor to

// ═══════════════════════════════════════════
// ADJUSTABLE SETTINGS
// ═══════════════════════════════════════════

#define CURRENT_THRESHOLD  0.5   // ← Raise or lower this depending on your machine.
                                 //   If the machine draws 5A when ON, set this to 3.0
                                 //   If the machine draws 0.5A when ON, set this to 0.3

#define SEND_INTERVAL  5000      // ← How often to send data (milliseconds)
                                 //   5000 = every 5 seconds
                                 //   10000 = every 10 seconds
                                 //   60000 = every 1 minute

// ═══════════════════════════════════════════
// DO NOT CHANGE ANYTHING BELOW THIS LINE
// ═══════════════════════════════════════════

#define SENSITIVITY           0.133
#define ZERO_POINT            0.5
#define VOLTAGE_DIVIDER_RATIO 0.667
#define ADC_MAX               4095
#define ADC_VREF              3.3

unsigned long lastSendTime = 0;

float readCurrent() {
  int samples = 100;
  long sum = 0;

  for (int i = 0; i < samples; i++) {
    sum += analogRead(CURRENT_PIN);
    delayMicroseconds(100);
  }

  float avgADC     = sum / (float)samples;
  float voltageAtESP32 = (avgADC / ADC_MAX) * ADC_VREF;
  float sensorVoltage  = voltageAtESP32 / VOLTAGE_DIVIDER_RATIO;
  float current        = (sensorVoltage - ZERO_POINT) / SENSITIVITY;

  if (current < 0) current = 0;

  return current;
}

void setup() {
  Serial.begin(115200);

  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;

    float current  = readCurrent();
    bool machineOn = current > CURRENT_THRESHOLD;

    Serial.printf("Current: %.2f A | Machine: %s\n", current, machineOn ? "ON" : "OFF");

    StaticJsonDocument<256> doc;
    doc["machine_id"]  = MACHINE_ID;
    doc["current_A"]   = current;
    doc["machine_on"]  = machineOn;
    doc["timestamp"]   = millis();

    String payload;
    serializeJson(doc, payload);
    Serial.println("Sending: " + payload);

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");

      int responseCode = http.POST(payload);

      if (responseCode > 0) {
        Serial.printf("Server response: %d\n", responseCode);
      } else {
        Serial.printf("HTTP error: %s\n", http.errorToString(responseCode).c_str());
      }

      http.end();
    } else {
      Serial.println("WiFi disconnected. Reconnecting...");
      WiFi.reconnect();
    }
  }
}