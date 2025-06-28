#!/bin/bash

# Instalar Java (si no está)
sudo apt-get update
sudo apt-get install -y openjdk-17-jre-headless

# Descargar el JAR
gsutil cp gs://cryptotracker-bucket/cryptotracker-server-1.0.0.jar .

# Ejecutar servidor
nohup java -jar cryptotracker-server-1.0.0.jar > server.log 2>&1 &