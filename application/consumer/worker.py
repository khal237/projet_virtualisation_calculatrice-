import pika
import redis
import json
import os
import time

# Configuration
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')

# Connexion Redis
r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

print("⏳ Attente de RabbitMQ...")
# Petite attente pour laisser le temps à RabbitMQ de démarrer (utile en Docker)
time.sleep(10) 

def callback(ch, method, properties, body):
    data = json.loads(body)
    print(f" [x] Reçu : {data}")
    
    result = None
    a = data['a']
    b = data['b']
    op = data['op']
    
    # Logique métier (Calculatrice)
    try:
        if op == '+':
            result = a + b
        elif op == '-':
            result = a - b
        elif op == '*':
            result = a * b
        elif op == '/':
            if b == 0:
                result = "Erreur: Division par zéro"
            else:
                result = a / b
    except Exception as e:
        result = "Erreur de calcul"

    # Stockage du résultat dans Redis
    # On stocke avec l'ID comme clé
    r.set(data['id'], result)
    print(f" [v] Résultat stocké dans Redis pour {data['id']} : {result}")

def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()
    channel.queue_declare(queue='calcul_queue')

    channel.basic_consume(queue='calcul_queue', on_message_callback=callback, auto_ack=True)

    print(' [*] En attente de messages. CTRL+C pour quitter')
    channel.start_consuming()

if __name__ == '__main__':
    main()
