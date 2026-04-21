/**
 * IoT Filament Monitoring System - ESP32 Firmware
 * Sensor: HTU21D (Temperature & Humidity)
 * Display: TFT ST7789 240x320
 * Version: 2.0.0 - Modern UI + Fixed Colors
 *
 * ─── NOTA SOBRE COLORES ───────────────────────────────────────────────────
 * Este display ST7789 (clon chino) tiene la polaridad de color invertida
 * por hardware. La solución es llamar tft.invertDisplay(false) justo
 * después de tft.init() — esto envía el comando INVOFF al chip y los
 * colores se muestran correctos.
 *
 * Los colores se definen en RGB normal con la macro RGB565(r, g, b):
 *   RGB565(255, 0,   0) → rojo    
 *   RGB565(0,   255, 0) → verde   
 *   RGB565(0,   0,   255) → azul  
 *
 * Si en el futuro usas otro ST7789 y los colores se ven mal, prueba
 * cambiar a tft.invertDisplay(true) — usa color_test_ST7789.ino para
 * diagnosticar cualquier pantalla ST7789.
 * ─────────────────────────────────────────────────────────────────────────
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "Adafruit_HTU21DF.h"
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>
#include <time.h>

// ─── WiFi Configuration ────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// ─── API Configuration ─────────────────────────────────────────────────────
const char* API_URL       = "http://YOUR_SERVER_IP:8000/sensor-data";
const char* DEVICE_ID     = "ESP32-FILAMENT-01";
const int   READ_INTERVAL = 30000;

// ─── NTP Configuration ─────────────────────────────────────────────────────
const char* NTP_SERVER = "pool.ntp.org";
const long  GMT_OFFSET = -21600; // UTC-6 México
const int   DST_OFFSET = 0;

// ─── TFT ST7789 Pin Configuration ──────────────────────────────────────────
#define TFT_CS    5
#define TFT_RST   4
#define TFT_DC    2
#define TFT_MOSI  23
#define TFT_SCLK  18

// ─── Macro RGB → RGB565 ────────────────────────────────────────────────────
// Uso: RGB565(255, 0, 0) = rojo puro
// Orden RGB estándar (invertDisplay(false) corrige los colores)
#define RGB565(r, g, b) (uint16_t)(((uint16_t)(r & 0xF8) << 8) | ((uint16_t)(g & 0xFC) << 3) | (b >> 3))

// ─── Paleta de Colores Corregida ───────────────────────────────────────────
// Fondo oscuro tipo dashboard tech
#define COLOR_BG         RGB565(10,  12,  20)   // Azul casi negro
#define COLOR_PANEL      RGB565(18,  22,  38)   // Panel oscuro
#define COLOR_BORDER     RGB565(35,  45,  75)   // Borde sutil azul
#define COLOR_WHITE      RGB565(230, 235, 255)  // Blanco suave
#define COLOR_GRAY       RGB565(90,  100, 130)  // Gris azulado
#define COLOR_CYAN       RGB565(0,   210, 255)  // Cyan brillante
#define COLOR_BLUE_LIGHT RGB565(80,  150, 255)  // Azul claro

// ─── Colores de Estado CORREGIDOS ──────────────────────────────────────────
// Estos son los que aparecían mal antes:
#define COLOR_GREEN      RGB565(0,   210,  80)  // Verde puro 
#define COLOR_GREEN_DIM  RGB565(0,    60,  25)  // Verde oscuro para fondo
#define COLOR_YELLOW     RGB565(255, 200,   0)  // Amarillo puro 
#define COLOR_YELLOW_DIM RGB565(70,   50,   0)  // Amarillo oscuro para fondo
#define COLOR_RED        RGB565(255,  40,  40)  // Rojo puro 
#define COLOR_RED_DIM    RGB565(70,   10,  10)  // Rojo oscuro para fondo

// ─── Objetos ───────────────────────────────────────────────────────────────
Adafruit_HTU21DF htu21d;
Adafruit_ST7789  tft = Adafruit_ST7789(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCLK, TFT_RST);

// ─── Estado ────────────────────────────────────────────────────────────────
float         lastTemperature = -999.0;
float         lastHumidity    = -999.0;
String        lastStatus      = "";
unsigned long lastReadTime    = 0;
bool          wifiConnected   = false;

// ─── Riesgo ────────────────────────────────────────────────────────────────
String calculateRiskLevel(float humidity) {
  if (humidity < 40.0)       return "SAFE";
  else if (humidity <= 55.0) return "WARNING";
  else                       return "RISK";
}

uint16_t getStatusColor(const String& status) {
  if (status == "SAFE")    return COLOR_GREEN;
  if (status == "WARNING") return COLOR_YELLOW;
  return COLOR_RED;
}

uint16_t getStatusBgColor(const String& status) {
  if (status == "SAFE")    return COLOR_GREEN_DIM;
  if (status == "WARNING") return COLOR_YELLOW_DIM;
  return COLOR_RED_DIM;
}

// ─── Utilidades de Dibujo ──────────────────────────────────────────────────

// Dibuja un rectángulo con borde de color
void drawCard(int x, int y, int w, int h, uint16_t bgColor, uint16_t borderColor) {
  tft.fillRoundRect(x, y, w, h, 6, bgColor);
  tft.drawRoundRect(x, y, w, h, 6, borderColor);
}

// Dibuja texto centrado en X
void drawCenteredText(const char* text, int y, uint16_t color, uint8_t size) {
  tft.setTextSize(size);
  tft.setTextColor(color);
  // Cada carácter mide 6px * size de ancho
  int charW = 6 * size;
  int textW = strlen(text) * charW;
  int x = (240 - textW) / 2;
  tft.setCursor(x, y);
  tft.print(text);
}

// Dibuja línea separadora con degradado visual (doble línea)
void drawDivider(int y) {
  tft.drawFastHLine(15, y,   210, COLOR_BORDER);
  tft.drawFastHLine(15, y+1, 210, COLOR_BG);
}

// Barra de progreso moderna
void drawProgressBar(int x, int y, int w, int h, float percent, uint16_t fillColor) {
  // Fondo de la barra
  tft.fillRoundRect(x, y, w, h, h/2, COLOR_PANEL);
  tft.drawRoundRect(x, y, w, h, h/2, COLOR_BORDER);
  // Relleno
  int fillW = (int)((float)(w - 4) * (percent / 100.0));
  if (fillW > 0) {
    tft.fillRoundRect(x + 2, y + 2, fillW, h - 4, (h-4)/2, fillColor);
  }
}

// ─── Sección: Header ───────────────────────────────────────────────────────
void drawHeader() {
  // Fondo del header con borde inferior
  tft.fillRect(0, 0, 240, 48, COLOR_PANEL);
  tft.drawFastHLine(0, 48, 240, COLOR_BORDER);

  // Línea decorativa de acento cyan en el top
  tft.fillRect(0, 0, 240, 3, COLOR_CYAN);

  // Título
  tft.setTextSize(2);
  tft.setTextColor(COLOR_WHITE);
  tft.setCursor(12, 10);
  tft.print("FILAMENT");
  tft.setTextColor(COLOR_CYAN);
  tft.print(" MON");

  // Subtítulo con device ID
  tft.setTextSize(1);
  tft.setTextColor(COLOR_GRAY);
  tft.setCursor(12, 32);
  tft.print(DEVICE_ID);

  // Punto decorativo
  tft.fillCircle(220, 14, 5, COLOR_BORDER);
}

// ─── Sección: Estado WiFi ──────────────────────────────────────────────────
void drawWiFiStatus(bool connected) {
  // Área en esquina superior derecha del header
  tft.fillRect(175, 28, 58, 14, COLOR_PANEL);

  if (connected) {
    // Punto verde + texto
    tft.fillCircle(179, 35, 3, COLOR_GREEN);
    tft.setTextSize(1);
    tft.setTextColor(COLOR_GREEN);
    tft.setCursor(185, 31);
    tft.print("ONLINE");
  } else {
    tft.fillCircle(179, 35, 3, COLOR_RED);
    tft.setTextSize(1);
    tft.setTextColor(COLOR_RED);
    tft.setCursor(185, 31);
    tft.print("OFFLIN");
  }
}

// ─── Sección: Datos del Sensor ─────────────────────────────────────────────
void drawSensorData(float temp, float hum, const String& status) {
  uint16_t sColor    = getStatusColor(status);
  uint16_t sBgColor  = getStatusBgColor(status);

  // ── Temperatura ────────────────────────────────────────────────────────
  drawCard(8, 56, 224, 68, COLOR_PANEL, COLOR_BORDER);

  // Ícono termómetro (simple dot decorativo)
  tft.fillCircle(22, 72, 4, COLOR_CYAN);
  tft.fillRect(20, 62, 4, 10, COLOR_CYAN);

  // Label
  tft.setTextSize(1);
  tft.setTextColor(COLOR_GRAY);
  tft.setCursor(32, 62);
  tft.print("TEMPERATURA");

  // Valor grande
  tft.setTextColor(COLOR_WHITE);
  tft.setTextSize(3);
  tft.setCursor(32, 76);
  tft.print(temp, 1);
  tft.setTextSize(2);
  tft.setTextColor(COLOR_CYAN);
  tft.print(" C");

  // ── Humedad ────────────────────────────────────────────────────────────
  drawCard(8, 132, 224, 80, COLOR_PANEL, COLOR_BORDER);

  // Ícono gota (triángulo + círculo)
  tft.fillCircle(22, 156, 4, COLOR_BLUE_LIGHT);

  // Label
  tft.setTextSize(1);
  tft.setTextColor(COLOR_GRAY);
  tft.setCursor(32, 138);
  tft.print("HUMEDAD RELATIVA");

  // Valor grande
  tft.setTextColor(COLOR_CYAN);
  tft.setTextSize(3);
  tft.setCursor(32, 152);
  tft.print(hum, 1);
  tft.setTextSize(2);
  tft.setTextColor(COLOR_BLUE_LIGHT);
  tft.print(" %");

  // Barra de progreso de humedad (0-100%)
  // Color cambia según nivel de riesgo
  drawProgressBar(16, 196, 208, 10, hum, sColor);

  // ── Estado del Filamento ───────────────────────────────────────────────
  drawCard(8, 220, 224, 56, sBgColor, sColor);

  // Label pequeño
  tft.setTextSize(1);
  tft.setTextColor(sColor);
  tft.setCursor(18, 226);
  tft.print("FILAMENT STATUS");

  // Texto de estado centrado y grande
  tft.setTextSize(2);
  tft.setTextColor(sColor);

  // Centrar según longitud del texto
  int px;
  if      (status == "SAFE")    px = 82;
  else if (status == "WARNING") px = 52;
  else                          px = 90; // RISK

  tft.setCursor(px, 244);
  tft.print(status);

  // Círculo indicador de estado
  tft.fillCircle(215, 248, 7, sColor);
}

// ─── Sección: Indicador de Envío ──────────────────────────────────────────
void drawSendingIndicator(bool sending) {
  tft.fillRect(175, 10, 58, 16, COLOR_PANEL);
  if (sending) {
    tft.setTextSize(1);
    tft.setTextColor(COLOR_YELLOW);
    tft.setCursor(178, 14);
    tft.print("SENDING..");
  }
}

// ─── Pantalla de Arranque ──────────────────────────────────────────────────
void drawBootScreen() {
  tft.fillScreen(COLOR_BG);

  // Barra top cyan
  tft.fillRect(0, 0, 240, 3, COLOR_CYAN);

  // Logo centrado
  tft.setTextSize(2);
  tft.setTextColor(COLOR_CYAN);
  tft.setCursor(30, 100);
  tft.print("FILAMENT MON");

  tft.setTextSize(1);
  tft.setTextColor(COLOR_GRAY);
  tft.setCursor(60, 126);
  tft.print("IoT Humidity Guard");

  tft.setTextSize(1);
  tft.setTextColor(COLOR_BORDER);
  tft.setCursor(80, 160);
  tft.print("v2.0  ESP32");

  // Barra de carga animada
  for (int i = 0; i <= 200; i += 4) {
    tft.fillRoundRect(20, 190, i, 8, 4, COLOR_CYAN);
    delay(15);
  }

  tft.setTextColor(COLOR_GREEN);
  tft.setCursor(82, 210);
  tft.print("LISTO");

  delay(800);
}

// ─── Pantalla de Error ─────────────────────────────────────────────────────
void drawErrorScreen(const char* msg) {
  tft.fillScreen(COLOR_BG);
  tft.fillRect(0, 0, 240, 3, COLOR_RED);
  drawCard(20, 100, 200, 60, COLOR_RED_DIM, COLOR_RED);
  tft.setTextSize(1);
  tft.setTextColor(COLOR_RED);
  tft.setCursor(30, 115);
  tft.print("ERROR DE SENSOR");
  tft.setTextColor(COLOR_WHITE);
  tft.setCursor(30, 135);
  tft.print(msg);
}

// ─── WiFi ──────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("Conectando a WiFi: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Mostrar progreso en pantalla
  tft.setTextSize(1);
  tft.setTextColor(COLOR_GRAY);
  tft.setCursor(40, 240);
  tft.print("Conectando WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    tft.print(".");
    attempts++;
  }

  wifiConnected = (WiFi.status() == WL_CONNECTED);

  if (wifiConnected) {
    Serial.printf("\nWiFi OK! IP: %s\n", WiFi.localIP().toString().c_str());
    configTime(GMT_OFFSET, DST_OFFSET, NTP_SERVER);
  } else {
    Serial.println("\nWiFi falló. Modo offline.");
  }
}

// ─── Timestamp ISO8601 ─────────────────────────────────────────────────────
String getISO8601Timestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "2024-01-01T00:00:" + String(millis() / 1000) + "Z";
  }
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

// ─── Enviar a API ──────────────────────────────────────────────────────────
bool sendDataToAPI(float temperature, float humidity, const String& riskLevel) {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  StaticJsonDocument<256> doc;
  doc["temperature"] = temperature;
  doc["humidity"]    = humidity;
  doc["device_id"]   = DEVICE_ID;
  doc["timestamp"]   = getISO8601Timestamp();
  doc["risk_level"]  = riskLevel;

  String payload;
  serializeJson(doc, payload);

  Serial.printf("POST %s\n%s\n", API_URL, payload.c_str());
  drawSendingIndicator(true);

  int code = http.POST(payload);
  drawSendingIndicator(false);

  bool ok = (code == HTTP_CODE_OK || code == HTTP_CODE_CREATED);
  Serial.printf("Resp: %d\n", code);
  http.end();
  return ok;
}

// ─── Setup ─────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("=== Filament Monitor v2.0 ===");

  Wire.begin(21, 22); // SDA=21, SCL=22

  // Init display
  tft.init(240, 320);
  tft.invertDisplay(false);  // ← Corrige los colores en este display ST7789
  tft.setRotation(0);
  tft.fillScreen(COLOR_BG);

  drawBootScreen();

  // Init sensor
  if (!htu21d.begin()) {
    Serial.println("HTU21D no encontrado!");
    drawErrorScreen("HTU21D no encontrado");
    while (1) delay(1000);
  }
  Serial.println("HTU21D OK");

  // Conectar WiFi
  tft.fillScreen(COLOR_BG);
  tft.fillRect(0, 0, 240, 3, COLOR_CYAN);
  tft.setTextSize(1);
  tft.setTextColor(COLOR_GRAY);
  tft.setCursor(40, 220);
  tft.print("Iniciando red...");

  connectWiFi();

  // Dibujar UI base
  tft.fillScreen(COLOR_BG);
  drawHeader();
  drawWiFiStatus(wifiConnected);

  Serial.println("Listo. Iniciando loop...");
}

// ─── Loop ──────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // Reconexión WiFi automática
  if (WiFi.status() != WL_CONNECTED && wifiConnected) {
    wifiConnected = false;
    drawWiFiStatus(false);
    Serial.println("WiFi desconectado. Reconectando...");
    WiFi.reconnect();
  } else if (WiFi.status() == WL_CONNECTED && !wifiConnected) {
    wifiConnected = true;
    drawWiFiStatus(true);
    Serial.println("WiFi reconectado!");
  }

  // Lectura cada READ_INTERVAL ms
  if (now - lastReadTime >= READ_INTERVAL || lastReadTime == 0) {
    lastReadTime = now;

    float temp = htu21d.readTemperature();
    float hum  = htu21d.readHumidity();

    if (isnan(temp) || isnan(hum)) {
      Serial.println("Lectura inválida. Saltando.");
      return;
    }

    String risk = calculateRiskLevel(hum);
    Serial.printf("[LECTURA] Temp: %.2f°C | Humedad: %.2f%% | Estado: %s\n",
                  temp, hum, risk.c_str());

    bool changed = (abs(temp - lastTemperature) > 0.1) ||
                   (abs(hum  - lastHumidity)    > 0.5) ||
                   (risk != lastStatus);

    if (changed) {
      drawSensorData(temp, hum, risk);
      lastTemperature = temp;
      lastHumidity    = hum;
      lastStatus      = risk;
    }

    bool sent = sendDataToAPI(temp, hum, risk);
    if (!sent) Serial.println("Fallo al enviar a API.");
  }

  delay(100);
}
