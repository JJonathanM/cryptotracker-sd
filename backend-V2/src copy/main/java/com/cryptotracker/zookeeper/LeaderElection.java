package com.cryptotracker.zookeeper;

import org.apache.zookeeper.*;
import org.apache.zookeeper.data.Stat;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;

public class LeaderElection implements Watcher {
    
    public interface LeadershipListener {
        void onBecomeLeader();
        void onLoseLeadership();
    }
    
    private static final String ELECTION_NAMESPACE = "/cryptotracker/election";
    private static final int SESSION_TIMEOUT = 5000;
    
    private ZooKeeper zk;
    private String nodeId;
    private String currentZNode;
    private boolean isLeader = false;
    private LeadershipListener listener;
    private final CountDownLatch connectedSignal = new CountDownLatch(1);
    
    public LeaderElection(String hosts, String nodeId, LeadershipListener listener) throws Exception {
        this.nodeId = nodeId;
        this.listener = listener;
        
        // Conectar a ZooKeeper
        this.zk = new ZooKeeper(hosts, SESSION_TIMEOUT, this);
        connectedSignal.await();
        
        // Crear estructura de directorios si no existe
        createElectionNamespace();
    }
    
    public void start() throws Exception {
        // Crear nodo efímero secuencial
        currentZNode = zk.create(
            ELECTION_NAMESPACE + "/node-",
            nodeId.getBytes(),
            ZooDefs.Ids.OPEN_ACL_UNSAFE,
            CreateMode.EPHEMERAL_SEQUENTIAL
        );
        
        System.out.println("Nodo de elección creado: " + currentZNode);
        
        // Verificar liderazgo
        checkLeadership();
    }
    
    private void checkLeadership() throws Exception {
        List<String> children = zk.getChildren(ELECTION_NAMESPACE, false);
        Collections.sort(children);
        
        String smallestNode = children.get(0);
        String currentNodeName = currentZNode.substring(currentZNode.lastIndexOf("/") + 1);
        
        if (currentNodeName.equals(smallestNode)) {
            // Soy el líder
            if (!isLeader) {
                isLeader = true;
                listener.onBecomeLeader();
            }
        } else {
            // No soy el líder
            if (isLeader) {
                isLeader = false;
                listener.onLoseLeadership();
            }
            
            // Encontrar y vigilar al nodo anterior
            int currentIndex = children.indexOf(currentNodeName);
            if (currentIndex > 0) {
                String previousNode = children.get(currentIndex - 1);
                Stat stat = zk.exists(ELECTION_NAMESPACE + "/" + previousNode, this);
                
                if (stat == null) {
                    // El nodo anterior ya no existe, verificar nuevamente
                    checkLeadership();
                }
            }
        }
    }
    
    @Override
    public void process(WatchedEvent event) {
        if (event.getType() == Event.EventType.None) {
            if (event.getState() == Event.KeeperState.SyncConnected) {
                connectedSignal.countDown();
            } else if (event.getState() == Event.KeeperState.Expired) {
                System.err.println("Sesión de ZooKeeper expirada");
            }
        } else if (event.getType() == Event.EventType.NodeDeleted) {
            // Un nodo fue eliminado, verificar liderazgo
            try {
                checkLeadership();
            } catch (Exception e) {
                System.err.println("Error al verificar liderazgo: " + e.getMessage());
            }
        }
    }
    
    private void createElectionNamespace() throws Exception {
        createNode("/cryptotracker", new byte[0]);
        createNode(ELECTION_NAMESPACE, new byte[0]);
    }
    
    private void createNode(String path, byte[] data) throws Exception {
        try {
            Stat stat = zk.exists(path, false);
            if (stat == null) {
                zk.create(path, data, ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
            }
        } catch (KeeperException.NodeExistsException e) {
            // El nodo ya existe, ignorar
        }
    }
    
    public void close() {
        if (zk != null) {
            try {
                zk.close();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}