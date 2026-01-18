import json
import uuid
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pika
import redis

app = Flask(__name__)
CORS(app) 

# Configuration via variables d'environnement 
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')

# Connexion Redis
r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

def get_rabbitmq_channel():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()
    channel.queue_declare(queue='calcul_queue') # On s'assure que la file existe
    return connection, channel

@app.route('/api/calculate', methods=['POST'])
def request_calculation():
    data = request.json
    
    
    if not data or 'op' not in data:
        return jsonify({"error": "Données invalides"}), 400

    task_id = str(uuid.uuid4()) # Génération de l'ID unique
    
    message = {
        "id": task_id,
        "a": float(data['a']),
        "b": float(data['b']),
        "op": data['op']
    }

    # Envoi dans RabbitMQ
    try:
        connection, channel = get_rabbitmq_channel()
        channel.basic_publish(
            exchange='',
            routing_key='calcul_queue',
            body=json.dumps(message)
        )
        connection.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # On retourne l'ID immédiatement au React
    return jsonify({"task_id": task_id}), 202

@app.route('/api/result/<task_id>', methods=['GET'])
def get_result(task_id):
    # L'API lit seulement dans Redis
    result = r.get(task_id)
    
    if result is None:
        return jsonify({"status": "pending"}), 404
    
    return jsonify({"status": "completed", "result": float(result)}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
