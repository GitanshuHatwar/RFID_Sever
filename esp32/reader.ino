#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "http://<PC_IP>:8000/api/reader/tap";
const char* READER_ID = "ESP32_READER_01";

const int RST_PIN = 22;
const int SS_PIN = 5;
const int LED_PIN = 2;
const int BUTTON_PIN = 15;

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  Wire.begin();
  lcd.init();
  lcd.backlight();
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  lcd.print("Connecting...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(300); }
  lcd.clear();
  lcd.print("RFID Reader");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;
  String uid;
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  processTap(uid);
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(500);
}

void processTap(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    lcd.clear(); lcd.print("WiFi offline"); return;
  }
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  String body = "{\"rfid_uid\":\"" + uid + "\",\"reader_id\":\"" + READER_ID + "\"}";
  int code = http.POST(body);
  lcd.clear();
  if (code == 200) {
    String response = http.getString();
    StaticJsonDocument<512> json;
    deserializeJson(json, response);
    bool recognized = json["data"]["recognized"];
    String message = recognized
      ? String((const char*)json["data"]["device_name"])
      : "Unknown tag";
    lcd.print(message.substring(0, 16));
    if (recognized) {
      digitalWrite(LED_PIN, HIGH);
      tone(2, 1200, 100);
      delay(1000);
      digitalWrite(LED_PIN, LOW);
    }
  } else {
    lcd.print(code == 401 ? "Reader denied" : "Server error");
  }
  http.end();
}
