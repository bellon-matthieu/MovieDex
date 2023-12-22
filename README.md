# APPSINF LINFO1212 Groupe PF11

## MovieDex
#### Table des matières
<ol>
    <li>Résumé</li>
    <li>Initialisation de la base de donnée</li>
    <li>Lancement du serveur</li>
    <li>Pages du sites</li>
</ol>

#### Résumé
L’idée principale du site est de permettre aux utilisateurs de créer des collections de films appelées « Dex » 
dans lesquelles ils pourront ajouter/supprimer des films. 
L’objectif du site est de proposer une manière facile et rapide de garder des listes de films. 
Que ce soit nos films préférés, nos films déjà vus, ceux qu’ils nous restent à voir et bien d’autres.
 
#### Initialisation de la base de donnée
Pour démarer initiliser la base de données, il suffit de se connecter à mongodb depuis un terminal de commande:

	mongosh
	use MovieDex

Ensuite il faut ajouter les différentes collections.\
Quelques Dexes d'illustration:

    mongoimport -d MovieDex -c dex all_dexes.json

Tous les films :

    mongoimport -d MovieDex -c movie all_movies.json

Certain compte utilisateur (identifiant:"Matthieu" et mot de passe : "test"): 

    mongoimport -d MovieDex -c user all_user.json

#### Lancement du serveur

Pour lancer le serveur, il faut trouver le fichier main.js et le lancer avec la commande :

	node ..\main.js

#### Pages du sites
Toutes les pages du site ont accès à la navbar qui offre la possibilité d'atteindre Home/Recherche/Film aléatoire/Film du jour/Mes Dexs/Profile.
Certaines pages offrent des fonctionnalité en plus.

##### Home
<ul>
    <li>Voir les 15 films en tendance</li>
</ul>

##### Recherche
<ul>
    <li>Voir les résultats de la recherche</li>
	<li>Accéder à la recherche avancée</li>
</ul>

##### Film
<ul>
    <li>Voir les informations du film</li>
	<li>Pouvoir ajouter le film à une dex</li>
	<li>Considérer le film comme "Déjà vu"</li>
	<li>Donner une note au film</li>
</ul>


##### Film aléatoire
<ul>
    <li>Accéder à la page "movie" d'un film au hasard</li>
</ul>

##### Film du jour
<ul>
    <li>Accéder à la page "movie" du film du jour</li>
</ul>

##### Mes dexs
<ul>
    <li>Créer une nouvelle dex</li>
	<li>Consulter les informations d'une dex en cliquant dessus</li>
</ul>

##### Profile
<ul>
    <li>Consulter mes informations</li>
	<li>Consulter mes films notés</li>
</ul>

##### Log-in/Register
<ul>
    <li>Créer un nouveau compte utilisateur</li>
	<li>Se connecter à un compte existant</li>
</ul>