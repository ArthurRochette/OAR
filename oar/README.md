<a name="readme-top"></a>

<div align="center">


<h3 align="center">Oar</h3>

  <p align="center">
    Contraintes sur les organes à risques
    <br />

  </p>
</div>



<!-- SOMMAIRE -->
<details>
  <summary>Sommaire</summary>
  <ol>
    <li>
      <a href="#about-the-project">A propos du project</a>
      <ul>
        <li><a href="#built-with">Développé avec</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prérequis</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->

## A propos du projet

Application permettant de centraliser les informations sur les organes à risques.

### Développé avec

* [Python](https://python.org)
* [Django](https://www.djangoproject.com/)

<br>

<!-- GETTING STARTED -->

## Getting Started

Pour récupérer une copie en local et exécuter le serveur.

### Prérequis

* Une installation de Python 3

* npm
  ```sh
  pip install Django==4.1.2
  ```

### Installation

1. Cloner le repo
   ```sh
   git clone https://github.com/ArthurRochette/OAR.git
   ```
2. Installer les packages pip
   ```sh
   pip install -r requirements.txt
   ```
3. Démarrer le serveur
    ```sh
    python manage.py runserver
    ```
4. Démarrer tailwind pour modifier le css (dev uniquement)
    ```sh
    python manage.py tailwind start
    ```

<!-- USAGE EXAMPLES -->

## Usage

A présent le serveur est disponible sur http://localhost:8000. Pour se connecter ou créer des utilisateurs, référez-vous
à la documentation [Django]((https://www.djangoproject.com/)) pour creer le super user.


<br>
<br>
