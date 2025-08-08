#!/usr/bin/env python3
# speak_piper.py — использует Piper CLI (надёжно)

import sys
import subprocess
import os

MODEL = "ru_RU-irina-medium.onnx"
text = sys.argv[1] if len(sys.argv) > 1 else "Привет"
output_file = sys.argv[2] if len(sys.argv) > 2 else "output.wav"

# Команда: piper -m модель -f выходной_файл
cmd = [
    "./venv/bin/piper",
    "-m", MODEL,
    "-f", output_file
]

try:
    print(f"🔊 Озвучка: {text}")
    result = subprocess.run(
        cmd,
        input=text,
        text=True,
        check=True,
        capture_output=True
    )
    print(f"✅ Аудио сохранено: {output_file}")

    # Проверим размер
    size = os.path.getsize(output_file)
    print(f"📏 Размер аудио: {size} байт")
    if size == 0:
        print("❌ Ошибка: файл пустой")
        sys.exit(1)

except subprocess.CalledProcessError as e:
    stderr = e.stderr.strip()
    print(f"❌ Ошибка Piper CLI: {stderr}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Системная ошибка: {e}")
    sys.exit(1)