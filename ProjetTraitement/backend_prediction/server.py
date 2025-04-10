"""
Serveur Flask pour fournir des prédictions d'accidents basées sur des modèles ARIMA.
Charge les données depuis MongoDB, génère des prédictions et des graphiques pour chaque rue.
"""

# --- Section : Imports ---
import matplotlib
matplotlib.use('Agg')  # Forcer le backend Agg pour éviter les problèmes de threads
from flask import Flask, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
import os
from pymongo import MongoClient

# --- Section : Configuration ---
# Constantes et paramètres globaux
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Chemin absolu du dossier contenant server.py
MODELS_DIR = os.path.join(BASE_DIR, 'models')  # Chemin vers le dossier 'models' à la racine du projet
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "Mydb"
COLLECTION_NAME = "accidents"
TRAIN_RATIO = 0.8  # Proportion des données pour l'entraînement
FORECAST_PERIOD = 30  # Nombre de jours pour les prédictions futures

# Dictionnaires globaux pour stocker les modèles et les données
loaded_models_dict = {}
street_data_dict = {}

# --- Section : Initialisation de l'application Flask ---
app = Flask(__name__)
CORS(app)  # Activer CORS pour les requêtes cross-origin

# --- Section : Fonctions utilitaires ---

def connect_to_mongo():
    """Établit une connexion à MongoDB et retourne la collection 'accidents'."""
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    return db[COLLECTION_NAME]

def prepare_street_data(df, street_name, min_date, max_date):
    """
    Prépare les données d'accidents pour une rue spécifique en complétant les jours manquants.

    Args:
        df (pd.DataFrame): DataFrame contenant les données groupées par date et rue.
        street_name (str): Nom de la rue à traiter.
        min_date (pd.Timestamp): Date minimale pour la plage de données.
        max_date (pd.Timestamp): Date maximale pour la plage de données.

    Returns:
        pd.DataFrame: Données préparées avec les colonnes 'accident_count' et 'on_street_name'.
    """
    data_zone = df[df['on_street_name'] == street_name].copy()
    if data_zone.empty:
        return None
    data_zone['date'] = pd.to_datetime(data_zone['date'])
    data_zone.set_index('date', inplace=True)
    data_zone.sort_index(inplace=True)
    date_range = pd.date_range(start=min_date, end=max_date, freq='D')
    data_zone = data_zone.reindex(date_range, fill_value=0)
    data_zone['on_street_name'] = street_name
    data_zone.index.name = 'date'
    return data_zone[['accident_count', 'on_street_name']]

def load_data_from_mongo():
    """
    Charge les données d'accidents depuis MongoDB et les prépare pour l'analyse.

    Returns:
        dict: Dictionnaire contenant les données par rue.
    """
    # Connexion à MongoDB et récupération des données
    collection = connect_to_mongo()
    data = pd.DataFrame(list(collection.find()))

    # Vérification des colonnes nécessaires
    if 'crash_date' not in data.columns or 'on_street_name' not in data.columns:
        raise ValueError(" Colonnes 'crash_date' ou 'on_street_name' absentes dans les données MongoDB.")

    # Conversion et regroupement des données
    data['crash_date'] = pd.to_datetime(data['crash_date'])
    data_grouped = data.groupby(['crash_date', 'on_street_name']).size().reset_index(name='accident_count')
    data_grouped.rename(columns={'crash_date': 'date'}, inplace=True)

    # Préparation des données pour chaque rue
    min_date = data_grouped['date'].min()
    max_date = data_grouped['date'].max()
    streets = data_grouped['on_street_name'].unique()
    temp_street_data = {}

    for street in streets:
        street_data = prepare_street_data(data_grouped, street, min_date, max_date)
        if street_data is not None:
            temp_street_data[street] = street_data

    return temp_street_data

def load_arima_models():
    """
    Charge les modèles ARIMA depuis les fichiers .pkl dans MODELS_DIR.

    Returns:
        dict: Dictionnaire contenant les modèles chargés (clé: rue, valeur: modèle).
    """
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
        print(f"Dossier {MODELS_DIR} créé car il n'existait pas.")
        return {}

    available_models = [f for f in os.listdir(MODELS_DIR) if f.endswith('.pkl')]
    print(f"Modèles disponibles dans {MODELS_DIR} : {len(available_models)} fichiers trouvés.")

    models = {}
    for filename in available_models:
        street = filename.replace('arima_model_', '').replace('_', ' ').replace('.pkl', '')
        filepath = os.path.join(MODELS_DIR, filename)
        try:
            with open(filepath, 'rb') as file:
                models[street] = pickle.load(file)
            print(f"Modèle chargé pour '{street}' depuis {filepath}")
        except Exception as e:
            print(f"Erreur lors du chargement de {filepath}: {e}")

    return models

def generate_plot(train_dates, train_series, train_predictions, test_dates, test_series, test_predictions, future_dates, future_predictions):
    """
    Génère un graphique des données et prédictions, et le convertit en base64.

    Args:
        train_dates (pd.Index): Dates des données d'entraînement.
        train_series (pd.Series): Données réelles d'entraînement.
        train_predictions (list): Prédictions sur les données d'entraînement.
        test_dates (pd.Index): Dates des données de test.
        test_series (pd.Series): Données réelles de test.
        test_predictions (list): Prédictions sur les données de test.
        future_dates (pd.DatetimeIndex): Dates des prédictions futures.
        future_predictions (list): Prédictions futures.

    Returns:
        str: Image encodée en base64.
    """
    plt.figure(figsize=(14, 8))
    plt.plot(train_dates, train_series, label='Train', color='blue')
    plt.plot(train_dates, train_predictions, label='Pred Train', color='cyan', linestyle='--')
    plt.plot(test_dates, test_series, label='Test', color='green')
    plt.plot(test_dates, test_predictions, label='Pred Test', color='orange', linestyle='--')
    plt.plot(future_dates, future_predictions, label='Pred Future', color='red')
    plt.legend()
    plt.grid(True)

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    plt.close()

    return img_base64

# --- Section : Chargement initial des données et modèles ---
def initialize_data_and_models():
    """Charge les données et les modèles au démarrage du serveur."""
    global loaded_models_dict, street_data_dict
    street_data_dict = load_data_from_mongo()
    loaded_models_dict = load_arima_models()

    # Filtrer les données pour ne garder que les rues avec un modèle
    street_data_dict = {street: data for street, data in street_data_dict.items() if street in loaded_models_dict}
    print(f"Rues avec modèles chargés : {len(loaded_models_dict)}")

# Charger les données et modèles au démarrage
initialize_data_and_models()

# --- Section : Routes de l'API ---

@app.route('/api/streets', methods=['GET'])
def get_streets():
    """Retourne la liste des rues disponibles pour lesquelles un modèle est chargé."""
    return jsonify(list(loaded_models_dict.keys()))

@app.route('/api/predictions/<street>', methods=['GET'])
def get_predictions(street):
    """
    Génère et retourne les prédictions d'accidents pour une rue donnée.

    Args:
        street (str): Nom de la rue pour laquelle générer les prédictions.

    Returns:
        JSON: Données d'entraînement, de test, prédictions futures et graphique.
    """
    # Vérifier si la rue existe
    if street not in loaded_models_dict or street not in street_data_dict:
        print(f"Requête pour '{street}' rejetée : rue non trouvée")
        return jsonify({'error': f'Rue "{street}" non trouvée parmi les modèles ou données chargés'}), 404

    print(f"Prédiction demandée pour '{street}'")
    model = loaded_models_dict[street]
    series = street_data_dict[street]['accident_count']

    # Diviser les données en ensembles d'entraînement et de test
    train_size = int(len(series) * TRAIN_RATIO)
    train_series = series[:train_size]
    test_series = series[train_size:]
    train_dates = train_series.index
    test_dates = test_series.index

    # Générer les prédictions
    try:
        train_predictions = model.predict(start=train_dates[0], end=train_dates[-1]).tolist()
        test_predictions = model.forecast(steps=len(test_series)).tolist()
    except Exception as e:
        print(f"Erreur lors de la génération des prédictions pour '{street}': {e}")
        return jsonify({'error': f'Erreur lors de la génération des prédictions: {str(e)}'}), 500

    # Générer les dates et prédictions futures
    last_date = series.index.max()
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=FORECAST_PERIOD, freq='D')
    try:
        future_predictions_series = model.forecast(steps=FORECAST_PERIOD)
        # S'assurer que les prédictions futures sont alignées avec les dates
        future_predictions = future_predictions_series.tolist()
        # Remplacer les NaN par 0
        future_predictions = [0 if np.isnan(x) else x for x in future_predictions]
    except Exception as e:
        print(f"Erreur lors de la génération des prédictions futures pour '{street}': {e}")
        return jsonify({'error': f'Erreur lors de la génération des prédictions futures: {str(e)}'}), 500

    # Vérifier que les longueurs correspondent
    if len(future_dates) != len(future_predictions):
        print(f"Erreur: Les longueurs de future_dates ({len(future_dates)}) et future_predictions ({len(future_predictions)}) ne correspondent pas.")
        return jsonify({'error': 'Erreur interne: Les données de prédiction future sont mal formées.'}), 500

    # Générer le graphique
    try:
        img_base64 = generate_plot(
            train_dates, train_series, train_predictions,
            test_dates, test_series, test_predictions,
            future_dates, future_predictions
        )
    except Exception as e:
        print(f"Erreur lors de la génération du graphique pour '{street}': {e}")
        return jsonify({'error': f'Erreur lors de la génération du graphique: {str(e)}'}), 500

    # Préparer les données futures sous forme de DataFrame
    future_df = pd.DataFrame({
        'date': [d.strftime('%Y-%m-%d %H:%M:%S') for d in future_dates],
        'predicted_accidents': future_predictions,
        'street': street
    })

    # Construire la réponse JSON
    response = {
        'train': {
            'dates': [d.strftime('%Y-%m-%d') for d in train_dates] if train_dates is not None else [],
            'real': train_series.tolist() if train_series is not None else [],
            'predictions': train_predictions if train_predictions else []
        },
        'test': {
            'dates': [d.strftime('%Y-%m-%d') for d in test_dates] if test_dates is not None else [],
            'real': test_series.tolist() if test_series is not None else [],
            'predictions': test_predictions if test_predictions else []
        },
        'future': future_df.to_dict(orient='records') if not future_df.empty else [],
        'plot': f'data:image/png;base64,{img_base64}' if img_base64 else ''
    }

    return jsonify(response)

# --- Section : Démarrage du serveur ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Lancer le serveur en mode debug sur le port 5000