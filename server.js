// server.js — работает с моделями в папке voices/

import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.static('public'));
app.use(express.json());

// Путь к папке с голосами
const VOICES_DIR = join(__dirname, 'voices');

// Маппинг: голос → имя файла модели
const VOICES = {
  irina: 'ru_RU-irina-medium.onnx',
  denis: 'ru_RU-denis-medium.onnx'
};

// Определяем, где запущен код
const PIPER = process.cwd().includes('app') ? 'piper' : './venv/bin/piper';

// Или через переменную окружения
// const PIPER = process.env.PIPER_CMD || 'piper';

const OUTPUT_FILE = 'output.wav';
const OUTPUT_PATH = join(__dirname, OUTPUT_FILE);

// Проверка: существуют ли модели
for (const [name, filename] of Object.entries(VOICES)) {
  const modelPath = join(VOICES_DIR, filename);
  const configPath = join(VOICES_DIR, filename + '.json');

  if (!fs.existsSync(modelPath)) {
    console.warn(`⚠️ Модель не найдена: ${modelPath}`);
  } else {
    console.log(`✅ Модель загружена: ${name} → ${filename}`);
  }

  if (!fs.existsSync(configPath)) {
    console.warn(`⚠️ Конфиг не найден: ${configPath}`);
  }
}

app.post('/speak', (req, res) => {
  const { text, voice = 'irina' } = req.body;
  const trimmedText = text?.trim();

  if (!trimmedText) {
    return res.status(400).json({ error: 'Текст не указан' });
  }

  const modelFile = VOICES[voice];
  if (!modelFile) {
    return res.status(400).json({ error: 'Неверный голос' });
  }

  const modelPath = join(VOICES_DIR, modelFile);
  const configPath = modelPath + '.json';

  if (!fs.existsSync(modelPath)) {
    console.error(`❌ Модель не найдена: ${modelPath}`);
    return res.status(500).json({ error: `Модель не найдена: ${modelFile}` });
  }

  if (!fs.existsSync(configPath)) {
    console.error(`❌ Конфиг не найден: ${configPath}`);
    return res.status(500).json({ error: `Конфиг не найден: ${modelFile}.json` });
  }

  console.log(`📝 Текст: "${trimmedText}"`);
  console.log(`🎤 Голос: ${voice} → ${modelFile}`);

  // Удаляем старый файл
  if (fs.existsSync(OUTPUT_PATH)) {
    fs.unlinkSync(OUTPUT_PATH);
  }

  // Запускаем Piper с полным путём к модели
  const piper = spawn(PIPER, ['-m', modelPath, '-f', OUTPUT_FILE], {
    cwd: __dirname,
    stdio: ['pipe', 'inherit', 'inherit']
  });

  piper.stdin.write(trimmedText);
  piper.stdin.end();

  piper.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Piper завершился с кодом ${code}`);
      return res.status(500).json({ error: 'Ошибка синтеза речи' });
    }

    try {
      const stats = fs.statSync(OUTPUT_PATH);
      if (stats.size > 0) {
        console.log(`✅ Аудио сохранено: ${OUTPUT_FILE} (${stats.size} байт)`);
        res.status(200).json({ ok: true });
      } else {
        console.error('❌ Файл аудио пустой');
        res.status(500).json({ error: 'Аудио-файл пустой' });
      }
    } catch (err) {
      console.error('❌ Ошибка при сохранении:', err.message);
      res.status(500).json({ error: 'Не удалось сохранить аудио' });
    }
  });

  piper.on('error', (err) => {
    console.error('❌ Ошибка запуска Piper:', err);
    res.status(500).json({ error: 'Не удалось запустить Piper' });
  });
});

app.get('/output.wav', (req, res) => {
  const file = join(__dirname, OUTPUT_FILE);
  res.sendFile(file, (err) => {
    if (err) {
      console.error('❌ Файл не найден:', err.message);
      res.status(404).send('Аудио не найдено');
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🌐 Сервер запущен: http://localhost:${PORT}`);
  console.log(`🔊 Доступные голоса: ${Object.keys(VOICES).join(', ')}`);
});