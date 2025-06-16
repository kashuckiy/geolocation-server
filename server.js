const express = require('express');
const requestIp = require('request-ip');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(requestIp.mw());
app.use(express.static('public'));

const logFile = path.join(__dirname, 'data', 'log.json');

// Создание папки и файла, если нужно
const dataDir = path.dirname(logFile);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let existing = [];
try {
  if (fs.existsSync(logFile)) {
    const raw = fs.readFileSync(logFile, 'utf-8');
    if (raw.trim()) existing = JSON.parse(raw);
  } else {
    fs.writeFileSync(logFile, '[]');
  }
} catch (err) {
  console.error('Ошибка чтения log.json:', err.message);
  existing = [];
}

app.post('/location', (req, res) => {
  const ip = req.clientIp;
  const userAgent = req.headers['user-agent'];
  const referrer = req.headers['referer'] || 'прямой заход';
  const language = req.headers['accept-language'];
  const time = new Date().toISOString();

  const data = {
    time,
    ip,
    userAgent,
    referrer,
    language,
    geoAllowed: req.body.geoAllowed || false,
    geo: req.body.latitude && req.body.longitude
      ? {
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          accuracy: req.body.accuracy
        }
      : null,
    screen: req.body.screen || {},
    platform: req.body.platform || 'unknown'
  };

  console.log('Получены данные:', data);

  existing.push(data);
  fs.writeFileSync(logFile, JSON.stringify(existing, null, 2));

  res.status(200).json({ message: 'Данные сохранены' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
