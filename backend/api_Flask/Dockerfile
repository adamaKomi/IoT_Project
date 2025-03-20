FROM python:3.11-slim

WORKDIR /app

COPY src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Installation de SUMO et dépendances X11
RUN apt-get update && apt-get install -y \
    sumo \
    sumo-tools \
    sumo-doc \
    libgl1-mesa-glx \
    libx11-6 \
    libxext6 \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Définir SUMO_HOME
ENV SUMO_HOME="/usr/share/sumo"

COPY src/ .

EXPOSE 5000

CMD ["python", "app.py"]