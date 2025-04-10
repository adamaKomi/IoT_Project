```markdown
# 🚦 Système de Gestion de la Congestion Routière - Frontend

![React](https://img.shields.io/badge/React-19-blue)
![Redux](https://img.shields.io/badge/Redux-4.x-purple)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-blueviolet)

Interface utilisateur de l'application de régulation de trafic urbain en temps réel, basée sur React. Ce frontend communique avec les microservices backend via WebSockets et REST API.

---

## 📚 Table des matières
- [🚀 Fonctionnalités](#-fonctionnalités)
- [🧰 Technologies](#-technologies)
- [📥 Installation](#-installation)
- [⚙️ Configuration](#-configuration)
- [📁 Structure du Projet](#-structure-du-projet)
- [🌐 API Endpoints](#-api-endpoints)
- [🚀 Déploiement](#-déploiement)
- [📄 Licence](#-licence)

---

## 🚀 Fonctionnalités

### 🗺️ Cartographie Interactive
- Visualisation en temps réel des routes congestionnées
- Marqueurs dynamiques avec code couleur (niveau de congestion)
- Navigation fluide et zoom multi-niveaux

### 🎮 Contrôle de Simulation
- Commandes : Démarrer, Arrêter, Mettre en pause, Reprendre
- Statut de la simulation en temps réel
- Réglage des paramètres de simulation

### ⚠️ Système d'Alertes
- Notifications instantanées pour les zones critiques
- Historique des alertes enregistrées
- Filtrage par niveau de gravité

### 🧭 Calcul d'Itinéraires
- Recherche par coordonnées GPS
- Suggestions d'itinéraires alternatifs
- Estimation du temps de trajet en fonction du trafic

---

## 🧰 Technologies

### Frontend
- ⚛️ **React 19** + **Vite**
- 🧠 **Redux Toolkit**
- 🗺️ **React Leaflet** (OpenStreetMap)
- 🔌 **Socket.io-client**
- 🎨 **Bootstrap 5** + **CSS Modules**

### Outils de Développement
- 🔍 **ESLint** (linting)
- 🧼 **Prettier** (formatage de code)
- 🗃️ **Git** (versioning)

---

## 📥 Installation

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/votre-repo/decongestionnement.git
   cd decongestionnement/frontend
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Configurer les variables d’environnement :**
   Créez un fichier `.env` à la racine du dossier `frontend` :
   ```env
   VITE_API_URL=http://localhost:4200
   VITE_SIMULATION_URL=http://localhost:5000
   VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
   ```

4. **Lancer l’application :**
   ```bash
   npm run dev
   ```

---

## ⚙️ Configuration

- `vite.config.js` → Configuration du projet Vite
- `eslint.config.js` → Règles de linting
- `src/redux/store` → Configuration du store Redux

### 🎨 Personnalisation
Modifiez `src/components/Layout/MainLayout.css` pour :
- Adapter les couleurs du thème
- Modifier les dimensions du layout
- Styliser les composants selon vos besoins

---

## 📁 Structure du Projet

```
src/
├── components/
│   ├── Layout/          # Composants principaux de mise en page
│   ├── Map/             # Composants liés à la carte
│   └── Simulation/      # UI de contrôle de simulation
├── redux/
│   ├── actions/         # Actions Redux
│   ├── reducers/        # Réducteurs d’état
│   └── store/           # Configuration centrale Redux
├── services/            # Services pour les appels API
├── assets/              # Fichiers statiques (images, icônes...)
└── utils/               # Fonctions utilitaires
```

---

## 🌐 API Endpoints

### 🔗 Service Principal

| Endpoint                    | Méthode | Description                      |
|----------------------------|---------|----------------------------------|
| `/api/alerts/congestion`   | GET     | Récupère les alertes en cours   |

### 🧪 Service de Simulation

| Endpoint                      | Méthode | Corps de requête             | Description                        |
|------------------------------|---------|------------------------------|------------------------------------|
| `/api/v1/start-simulation`   | POST    | `{ "duration": number }`     | Démarre la simulation              |
| `/api/v1/stop-simulation`    | POST    | -                            | Arrête la simulation               |
| `/api/v1/pause-simulation`   | POST    | -                            | Met en pause                       |
| `/api/v1/resume-simulation`  | POST    | -                            | Reprend la simulation              |
| `/api/v1/simulation-status`  | GET     | -                            | Retourne le statut actuel          |

---

## 🚀 Déploiement

1. **Build de production :**
   ```bash
   npm run build
   ```

2. **Lancer un serveur local de prévisualisation :**
   ```bash
   npm run preview
   ```

3. **Déployer les fichiers `/dist` sur :**
   - [Vercel](https://vercel.com/)
   - [Netlify](https://netlify.com/)
   - Serveur personnel (Nginx, Apache, etc.)

---

## 📄 Licence

Ce projet est sous licence **MIT**.  
Consultez le fichier [LICENSE](./LICENSE) pour plus d’informations.

---

## 👨‍💻 Auteur

Développé avec ❤️ par **Groupe 1 IOT/Ilisi2** – 2025  
[![Contact](https://img.shields.io/badge/Contact-Email-green)](mailto:votre@email.com)
```

---
