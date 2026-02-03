# 🧮 Calculatrice Distribuée - Architecture Microservices sur Kubernetes

Ce projet implémente une application de calculatrice résiliente et scalable, déployée sur un cluster Kubernetes . Elle démontre une architecture microservices complète séparant le frontend, l'API backend et le traitement asynchrone des calculs via des files de messages.

---

## 👥 Équipe et Répartition des tâches

Le projet a été mené en séparant les responsabilités "Développement" (Dev) et "Opérations/Infrastructure" (Ops).

| Membre | Rôle Principal | Responsabilités détaillées |
| :--- | :--- | :--- |
| **Khalil NDAM** | **Fullstack Developer & DevOps** | • Développement du **Frontend React** (Interface & Appels API).<br>• Développement du **Backend Flask** et du **Consumer**.<br>• Conteneurisation (Rédaction des `Dockerfiles` optimisés).<br>• Intégration de la logique asynchrone (RabbitMQ & Redis). |
| **André BITOTE** | **Cloud Architect & Kubernetes Ops** | • Conception de l'infrastructure **Kubernetes** (Manifestes YAML).<br>• Gestion du **Réseau & Ingress** (Règles de routage et réécriture d'URL).<br>• Déploiement sur Google Cloud Platform (GKE) & Terraform.<br>• Monitoring, Debugging et résolution des conflits de déploiement. |

---

## 📂 Structure du Projet

L'organisation des fichiers reflète l'architecture distribuée de l'application.

```text
/Bureau/Application
├── foundation/                 # Infrastructure as Code (Terraform)
│   ├── main.tf                 # Provisionnement des ressources GCP
│   └── README.md
│
├── kubernetes/                 # Manifestes de déploiement K8s
│   ├── namespace.yaml          # Isolation (khalil-andre)
│   ├── redis.yaml              # Base de données Cache
│   ├── rabbitmq.yaml           # Broker de messages
│   ├── backend.yaml            # Déploiement API Flask
│   ├── consumer.yaml           # Déploiement Worker Python
│   ├── frontend.yaml           # Déploiement Serveur Web
│   ├── ingress-backend.yaml    # Routage API (avec réécriture /api)
│   └── ingress-frontend.yaml   # Routage statique Web
│
└── application/                # Code source des Microservices
    ├── backend/
    │   ├── app.py              # API Gateway (Flask)
    │   ├── Dockerfile
    │   └── requirements.txt
    │
    ├── consumer/
    │   ├── worker.py           # Script de traitement des calculs
    │   ├── Dockerfile
    │   └── requirements.txt
    │
    ├── frontend/
    │   ├── src/components/Calculator.tsx  # Logique métier (Appels API)
    │   └── Dockerfile          # Configuration de l'image Nginx/React
    │
    └── docker-compose.yml      # Environnement de test local
```


## 🏗️ Architecture Technique

L'application repose sur 5 composants interconnectés :

Frontend (React + Nginx) : Interface utilisateur. Envoie les calculs à l'API via /api/calculate.

Ingress Controller (Nginx) : Point d'entrée unique du cluster. Il redirige le trafic vers le bon service et gère la réécriture d'URL pour le backend.

Backend (Python Flask) : Reçoit la requête, génère un ID de tâche et pousse l'opération dans une file d'attente.

Message Broker (RabbitMQ) : Assure la communication asynchrone et la mise en tampon des calculs.

Consumer (Worker Python) : Récupère les messages, effectue le calcul mathématique et stocke le résultat dans Redis.

Redis : Base de données en mémoire utilisée pour stocker les résultats en attente de récupération.

## 🚀 Guide de Déploiement
1. Construction des images Docker
Les images sont construites localement et poussées sur le Google Artifact Registry.

Bash
# Exemple pour le frontend (v10)
docker build --no-cache -t europe-west1-docker.pkg.dev/polytech-dijon/polytech-dijon/calculatrice-frontend-khalil-andre:v10 ./application/frontend
docker push europe-west1-docker.pkg.dev/polytech-dijon/polytech-dijon/calculatrice-frontend-khalil-andre:v10
2. Déploiement sur Kubernetes
L'ordre d'application est important pour assurer que les bases de données sont prêtes avant les applications.

Bash
# 1. Création du Namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Infrastructure de données (Redis & RabbitMQ)
kubectl apply -f kubernetes/redis.yaml
kubectl apply -f kubernetes/rabbitmq.yaml

# 3. Microservices (Backend, Consumer, Frontend)
kubectl apply -f kubernetes/backend.yaml
kubectl apply -f kubernetes/consumer.yaml
kubectl apply -f kubernetes/frontend.yaml

# 4. Exposition publique (Ingress)
kubectl apply -f kubernetes/ingress-frontend.yaml
kubectl apply -f kubernetes/ingress-backend.yaml
🔧 Point Technique : Gestion de l'Ingress
Un défi majeur du projet a été la gestion du routage sur un domaine unique. Nous avons mis en place une stratégie à deux Ingress :

Ingress Frontend : Sert le contenu statique à la racine /.

Ingress Backend : Intercepte les requêtes commençant par /api. Une annotation spécifique permet de conserver le préfixe /api pour que l'application Flask route correctement la demande :

YAML
# Extrait de ingress-backend.yaml
nginx.ingress.kubernetes.io/rewrite-target: /api/$1
Cette configuration assure que l'URL .../api/calculate est transmise correctement au conteneur backend sans être tronquée.