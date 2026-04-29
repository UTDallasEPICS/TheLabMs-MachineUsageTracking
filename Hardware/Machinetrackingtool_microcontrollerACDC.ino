/*
 * EPICS 2200
 * Machine Tracking Tool
 * Microcontroller : Seeed XIAO ESP32-C3
 * Sensor          : ACS724 Current Sensor
 * Supports both AC and DC current
 */

 /*
 USEFULL INFORMATION!!!

  Libraries - NO NEED TO DOWNLOAD

    WiFi.h -        This library is built into the ESP32 package and handles everything related to WiFi connectivity. It allows the ESP32 to connect to a WiFi network, maintain that connection, and reconnect if it drops. Without this library the ESP32 has no way of communicating wirelessly. It provides functions like WiFi.begin() to connect, WiFi.status() to check connection status, and WiFi.localIP() to get the device's IP address on the network.
    HTTPClient.h -  This library is also built into the ESP32 package and handles sending data over the internet using the HTTP protocol. It is what allows the ESP32 to send your sensor data to the Nuxt.js web application. It provides functions like http.begin() to open a connection to a server, http.POST() to send data, and http.end() to close the connection. Without this library the ESP32 would have no way of talking to your server.
    time.h -        This is a standard C library that comes built into the Arduino framework. It handles everything related to time and dates. It works together with the NTP server to store and format the current time. It provides functions like getLocalTime() to retrieve the current time and strftime() to format it into a readable string like 2026-03-10 14:35:22. Without this library you would have no way of getting real timestamps on your data.

  Libraries - NEED TO DOWNLAOD

    ArduinoJson.h - This library is made by Benoit Blanchon and needs to be installed separately through the Arduino IDE Library Manager. It handles building and formatting JSON data which is the format your server expects to receive. It provides functions like doc["key"] = value to add data fields and serializeJson() to convert the JSON object into a text string ready to send. Without this library you would have to manually build the JSON string character by character which is very error prone.

  EXPLAINING THE CODE!
    Section 1:
      Configuration Section - 
        This section at the top stores all the settings the code needs. The WiFi credentials tell the ESP32 which network to connect to. The server URL tells it where to send the data. The API key is like a password that proves to the server that the data is coming from a legitimate device. The machine ID labels which machine the data is coming from. The AC mode switch tells the code whether to use AC or DC calculation. The voltage threshold is the cutoff point between ON and OFF.
    Section 2:
      Gettimestamp function - 
        This function gets the current date and time from the ESP32's internal clock which was synced with the NTP server on startup. It formats it into a human readable string like 2026-03-10 14:35:22. If the time is not available for any reason it returns the word unavailable so the code does not crash.
    Section 3:
      Read Voltage function - 
        This is the most important function in the code. It reads the voltage coming from the ACS724 sensor. It takes 500 samples and processes them differently depending on whether AC or DC mode is selected.
        For DC mode it takes a simple average of all 500 readings and converts the raw ADC number into an actual voltage between 0 and 3.3V.
        For AC mode it uses an RMS (Root Mean Square) calculation. This is necessary for AC because the current constantly switches direction. A simple average would always give zero because the positive and negative values cancel each other out. RMS squares each value first (making everything positive), averages them, then takes the square root. This gives a true representation of the AC signal strength.
    Section 4:
      Read to voltage function - 
        This function converts the voltage reading from the sensor into an actual current value in Amps. It uses the ACS724 sensor's formula from its datasheet. The sensitivity is 0.133 volts per amp when powered at 5V, and scales proportionally if powered at 3.3V. It subtracts the zero point first because the sensor outputs 0.33V or 0.5V at zero current. Any negative result gets clamped to zero since you cannot have negative current in this context.
    Section 5:
      Send to server function - 
        This function packages all the sensor data into a JSON format and sends it to the server. It first builds a JSON document with all the fields the server expects. It then converts that into a text string and sends it via HTTP POST to the server URL. It includes the API key in the header so the server knows the request is legitimate. It waits up to 5 seconds for the server to respond and prints whether it succeeded or failed.
    Section 6:
      Setup Function - 
        This function runs exactly once when the ESP32 powers on. It does three things in order. First it starts the Serial Monitor so you can see debug messages on your computer. Second it connects to WiFi using your credentials and waits until the connection is confirmed. Third it contacts the NTP server over the internet to sync the real current time so all your readings have accurate timestamps.
    Section 7:
      loop function - 
        This function runs forever after setup finishes. Every loop it reads the sensor voltage, converts it to current, and compares it to the threshold to determine ON or OFF. It prints the readings to the Serial Monitor every second so you can see what is happening in real time. The key feature is that it only sends data to the server when the machine state actually changes — so it sends once when the machine turns ON and once when it turns OFF instead of sending every 5 seconds regardless.

  FLOWCHART SUMMARY!!!
  
    ESP32 powers on
      ↓
    Connects to WiFi
      ↓
    Syncs time from NTP server
      ↓
    Takes initial sensor reading
      ↓
    Reads sensor every 200ms
      ↓
    Has state changed? → No → keep reading
      ↓ Yes
    Build JSON payload
      ↓
    Send HTTP POST to server with API key
      ↓
    Server stores data in Prisma database
      ↓
    Dashboard displays ON or OFF

*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <math.h>

// ═══════════════════════════════════════════
//  ✏️  CHANGE THESE
// ═══════════════════════════════════════════


//Section 1 
const char* WIFI_SSID     = "Abdi's S25";
const char* WIFI_PASSWORD = "zapp5050";
const char* SERVER_URL    = "http://10.150.238.115:3000/api/microcontroller/sensor";
const char* MODE_URL      = "http://10.150.238.115:3000/api/microcontroller/mode/modeChange";
const char* API_KEY       = "mByj6Y2qUfe1b1gX";
const char* MACHINE_ID    = "Vacuum";

#define CURRENT_PIN       A0
#define VOLTAGE_THRESHOLD 0.3   // ← Adjust after seeing your readings
#define DEFAULT_AC_MODE   true  // ← fallback if server mode request fails

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
bool          isACMode         = DEFAULT_AC_MODE;

float toSignalVoltage(float measuredVoltage) {
  if (isACMode) {
    return measuredVoltage;
  }
  return fabs(measuredVoltage - ZERO_POINT);
}

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
// AC (RMS) and DC (average) based on runtime mode
// ─────────────────────────────────────────
float readVoltage() {
  float sumSquares = 0;
  float sumVoltage = 0;

  for (int i = 0; i < SAMPLES; i++) {
    float raw      = analogRead(CURRENT_PIN);
    float voltage  = (raw / ADC_MAX) * ADC_VREF;
    float centered = voltage - ZERO_POINT;

    if (isACMode) {
      sumSquares += centered * centered;
    } else {
      sumVoltage += voltage;
    }

    delayMicroseconds(100);
  }

  if (isACMode) {
    return sqrt(sumSquares / SAMPLES);
  }

  return sumVoltage / (float)SAMPLES;
}

// Ask server for AC/DC mode at the startup
// Accepts: {"mode":"AC"|"DC"} or {"ac_mode":true|false}
bool fetchModeFromServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected — cannot fetch mode");
    return false;
  }

  HTTPClient http;
  http.begin(MODE_URL);
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(5000);

  int responseCode = http.GET();

  // Backward compatibility if route expects POST.
  if (responseCode == 404 || responseCode == 405) {
    http.end();
    http.begin(MODE_URL);
    http.addHeader("x-api-key", API_KEY);
    http.addHeader("Content-Type", "application/json");
    responseCode = http.POST("{}");
  }

  if (responseCode <= 0) {
    Serial.print("Mode fetch connection error : ");
    Serial.println(http.errorToString(responseCode));
    http.end();
    return false;
  }

  if (responseCode != 200) {
    Serial.print("Mode fetch server error : ");
    Serial.println(responseCode);
    Serial.println(http.getString());
    http.end();
    return false;
  }

  String responseBody = http.getString();
  http.end();

  StaticJsonDocument<192> responseDoc;
  DeserializationError err = deserializeJson(responseDoc, responseBody);
  if (err) {
    Serial.print("Mode fetch parse error : ");
    Serial.println(err.c_str());
    return false;
  }

  if (responseDoc.containsKey("mode")) {
    String mode = responseDoc["mode"].as<String>();
    mode.toUpperCase();
    if (mode == "AC") {
      isACMode = true;
      return true;
    }
    if (mode == "DC") {
      isACMode = false;
      return true;
    }
  }

  if (responseDoc.containsKey("type")) {
    String type = responseDoc["type"].as<String>();
    type.toUpperCase();
    if (type == "AC") {
      isACMode = true;
      return true;
    }
    if (type == "DC") {
      isACMode = false;
      return true;
    }
  }

  if (responseDoc.containsKey("ac_mode")) {
    isACMode = responseDoc["ac_mode"].as<bool>();
    return true;
  }

  if (responseDoc.containsKey("isAC")) {
    isACMode = responseDoc["isAC"].as<bool>();
    return true;
  }

  Serial.println("Mode response missing valid AC/DC value");
  return false;
}

// ─────────────────────────────────────────
// Convert voltage to current in Amps
// ─────────────────────────────────────────
float voltageToCurrent(float voltage) {
  float sensitivity = 0.133 * (ADC_VREF / 5.0);
  float current;

  if (isACMode) {
    current = voltage / sensitivity;
  } else {
    current = (voltage - ZERO_POINT) / sensitivity;
  }

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
  doc["machine_state"] = machineOn;
  doc["timestamp"]     = timestamp;
  doc["isAC"]          = isACMode;
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
  Serial.println("Waiting for server mode");
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
    Serial.println("Requesting mode from server...");
    if (fetchModeFromServer()) {
      Serial.print("Server mode applied : ");
      Serial.println(isACMode ? "AC" : "DC");
    } else {
      isACMode = DEFAULT_AC_MODE;
      Serial.print("Using fallback mode : ");
      Serial.println(isACMode ? "AC" : "DC");
    }
  } else {
    Serial.println("\nWiFi Failed!");
    isACMode = DEFAULT_AC_MODE;
  }

  Serial.print("Active sensing mode : ");
  Serial.println(isACMode ? "AC Current" : "DC Current");

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
  float initialSignal  = toSignalVoltage(initialVoltage);
  float initialCurrent = voltageToCurrent(initialVoltage);
  lastMachineState     = initialSignal > VOLTAGE_THRESHOLD;

  Serial.print("Initial voltage : "); Serial.print(initialVoltage, 4); Serial.println(" V");
  Serial.print("Initial signal  : "); Serial.print(initialSignal, 4); Serial.println(" V");
  Serial.print("Initial current : "); Serial.print(initialCurrent, 4); Serial.println(" A");
  Serial.print("Initial state   : "); Serial.println(lastMachineState ? "ON" : "OFF");

  // Keep server session state aligned after every restart.
  sendToServer(lastMachineState, initialVoltage, initialCurrent, getTimestamp());
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

  float voltage   = readVoltage();
  float signal    = toSignalVoltage(voltage);
  float current   = voltageToCurrent(voltage);
  bool  machineOn = signal > VOLTAGE_THRESHOLD;

  // Print every second
  unsigned long now = millis();
  if (now - lastPrintTime >= 1000) {
    lastPrintTime = now;
    Serial.print("Voltage : ");
    Serial.print(voltage, 4);
    Serial.print(" V  |  Signal : ");
    Serial.print(signal, 4);
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
    Serial.print  ("│ Mode    : "); Serial.println(isACMode ? "AC" : "DC");
    Serial.print  ("│ Time    : "); Serial.println(timestamp);
    Serial.print  ("│ Voltage : "); Serial.print(voltage, 4); Serial.println(" V");
    Serial.print  ("│ Current : "); Serial.print(current, 4); Serial.println(" A");
    Serial.print  ("│ Status  : "); Serial.println(machineOn ? "ON  ✓" : "OFF ✗");
    Serial.println("└─────────────────────────────────────┘");

    sendToServer(machineOn, voltage, current, timestamp);
  }

  delay(200);
}