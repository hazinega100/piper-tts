FROM python:3.12-slim

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && npm install -g npm

RUN apt-get update && apt-get install -y \
    wget \
    ffmpeg \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

# Настройка рабочей директории
WORKDIR /app

COPY package*.json ./
RUN npm install

RUN pip install piper-tts

# Создаём симлинк espeak → espeak-ng
RUN ln -s /usr/bin/espeak-ng /usr/bin/espeak

COPY server.js ./
COPY public ./public

RUN mkdir -p voices

COPY voices/*.onnx voices/
COPY voices/*.json voices/

# Переменная окружения (не нужна, но чистим)
ENV PIPER_VOICE_DIR=/app/voices

EXPOSE 3005

CMD ["node", "server.js"]