# Dentro de la instancia
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk

# Descargar ZooKeeper
sudo wget https://downloads.apache.org/zookeeper/zookeeper-3.8.4/apache-zookeeper-3.8.4-bin.tar.gz
sudo tar -xzf apache-zookeeper-3.8.4-bin.tar.gz
sudo mv apache-zookeeper-3.8.4-bin zookeeper

# Configuración básica
sudo mkdir -p /var/lib/zookeeper
echo "1" | sudo tee /var/lib/zookeeper/myid

# Mueve a una ubicación estándar
sudo mv zookeeper /opt

# Crea el archivo de configuración
sudo mkdir -p /opt/zookeeper/data
cat <<EOF | sudo tee /opt/zookeeper/conf/zoo.cfg
tickTime=2000
dataDir=/opt/zookeeper/data
clientPort=2181
initLimit=5
syncLimit=2
EOF

# Inicia ZooKeeper
chmod 755 /opt/zookeeper/bin/zkServer.sh
sudo /opt/zookeeper/bin/zkServer.sh start

# Verificar que está corriendo
sudo /opt/zookeeper/bin/zkServer.sh status