# Используем официальный образ Python с предустановленным Node.js
# Берём полноценный образ, а не slim
FROM python:3.12-bullseye

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ffmpeg \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

# Создаём симлинк espeak → espeak-ng
RUN ln -s /usr/bin/espeak-ng /usr/bin/espeak

# Устанавливаем Node.js через официальный установщик (надёжнее)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Проверим, что npm установлен
RUN npm --version

# Настройка рабочей директории
WORKDIR /app

# Копируем package.json и устанавливаем зависимости Node.js
COPY package*.json ./
RUN npm install

# Устанавливаем piper-tts
RUN pip install piper-tts onnxruntime

# Копируем сервер и веб-интерфейс
COPY server.js ./
COPY public ./public

# Папка для голосов
RUN mkdir -p voices

# Копируем голоса (если они есть локально)
COPY voices/*.onnx voices/
COPY voices/*.json voices/

# Экспорт порта
EXPOSE 3005

# Запуск сервера
CMD ["node", "server.js"]