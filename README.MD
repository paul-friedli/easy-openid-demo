# Easy-OpenID-Demo
## C'est quoi ?
<img align="left" width="92" style="padding-right: 1em;" src="res/unknown-user.png" alt="User profile picture" />  

Démo minimaliste de comment réaliser une identification/authentification `OpenID/OAuth2.0` avec récupération de **la photo du profil de l'utilisateur** ainsi que tout **un tas d'autres informations utiles** (voir JSON ci-dessous), en 1 appel de méthode et quelques écouteurs.

Ce projet démo montre comment très simplement s'authentifier via OpenID/OAuth2.0 depuis une SPA (Single Page Application) en utilisant [MSAL](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-overview) (librairie LTS de Microsoft pour atteindre les Graph API de Azure) pour rapidement récupérer les informations utiles du profil de l'utilisateur d'un `tenant` comme celui de l'État de Fribourg.
## Comment tester ce truc et m'en faire une idée avant de lire toute la tartine...
Si vous avez un compte à l'État de Fribourg : [https://www.polosoft.ch/oid/](https://www.polosoft.ch/oid/)
## Pourquoi cela peut m'être utile ?
Ce petit projet démo contient un worker `WrkEasyOpenId` très simple à utiliser qui s'occupe de tout au niveau `OpenID/OAuth2.0`.

Ce worker permet de très facilement réaliser la bonne pratique d'**identifier et authentifier l'utilisateur le plus en amont possible de la solution technique**. Il réalise tout le processus `OpenID/OAuth2.0` sur simple appel d'une méthode et récupère la photo du profil de l'utilisateur (si souhaité) ainsi qu'un tas d'autres informations utiles pour que l'application sache en amont déjà a qui elle a à faire et puisse prendre les décisions de filtrage qui s'imposent.
 
 Pour l'utiliser, il n'y a que **3 infos à fournir** pour configurer OpenID et **3 méthodes à appeler**.
 
 Voici un exemple des informations qui sont fournies par ce worker :
```json
{
  "token": {
    "token_id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    "expiration_not_before": "07.09.2023 16:42:55",
    "expiration_not_before_in_secs": 3556
  },
  "user": {
    "id": "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY",
    "displayName": "Friedli Paul",
    "mail": "paul.friedli@edufr.ch",
    "userPrincipalName": "Paul.Friedli@edufr.ch",
    "preferredLanguage": "fr-ch",
    "givenName": "Paul",
    "mobilePhone": null,
    "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgA..."
  },
  "company": {
    "employeeId": "ZZZZZZZZZZZZZZZZZZ",
    "jobTitle": "Maître/sse professionnel/le",
    "companyName": "Ecole des métiers de Fribourg (EMF)",
    "department": "EMF",
    "streetAddress": "Chemin du Musée 2",
    "postalCode": "1700",
    "city": "Fribourg",
    "state": "FR",
    "country": "Switzerland",
    "usageLocation": "CH"
  }
}
```
## Comment ça marche ?
### Utilisation
Au niveau fonctionnel, `WrkEasyOpenId` n'a que 3 méthodes :
1) `openIdAuthenticationLogin()` pour volontairement démarrer un processus `OpenID/OAuth2.0` d'identification et d'authentification de l'utilisateur lorsque cela est nécessaire.
2) `openIdAuthenticationLogout()` pour faire l'inverse et "déconnecter l'application" afin d'invalider les tokens précédemment reçus.
3) `openIdAuthenticationRefresh()` conçue pour être appelée à chaque (re)chargement de la SPA, pour automatiquement rafraîchir, automatiquement reconnecter, automatiquement obtenir à nouveau les informations liées au compte (c-à-d le compte qui avait été utilisé avec succès dans le cadre d'un appel préalable à la méthode `openIdAuthenticationLogin`).
### Configuration
Au niveau de sa configuration, il n'y a que 3 information nécessaires à reporter dans l'entête de `WrkEasyOpenId.js` (voir sa variable `msalConfig`). Reportez-y ces 3 informations reçues par les gestionnaires de votre domaine (*) :
1) l'url de redirection
2) l'id unique de votre application
3) l'url pour atteindre le `tenant` de votre domaine.

(*) ils devront vous créer une configuration Azure de type `Single-page application` avec les droits `Access tokens (used for implicit flows)`, et lui accorder les droits `User.Read`. Rien de plus n'est nécessaire pour fonctionner et obtenir les informations affichées ici.
### Optimisation de performance pour la photo de profil
L'obtention de la photo du profil est optionnelle. Le souhait de l'obtenir doit être explicitement exprimé sans quoi elle ne sera pas retournée (voir premier paramètre booléen lors de l'appel à `WrkEasyOpenId.openIdAuthenticationRefresh()` qui permet d'exprimer ce souhait).

Au niveau OpenID/OAuth2.0, la récupération de la photo du profil implique nécessairement un second appel `https` au Graph API de Azure (le premier appel étant pour obtenir toutes les autres informations ci-dessus d'un coup, comme l'adresse email de l'utilisateur, son employeur, ...).

Puisque la photo de profil d'un utilisateur ne change pas toutes les cinq minutes, un cache local (sessionStorage) est utilisé pour y déposer la photo de profil associée au `token_id`. La photo y restera disponible et valable tant que le `token_id` le sera aussi.

En conséquence, la photo de profil ne sera téléchargée qu'une fois par durée de vie du `token_id`. Donc, à moins que l'utilisateur ne se délogue volontairement puis se relogue, ou qu'il attende derrière son écran suffisamment longtemps pour que le `token_id` de la session finisse par devenir invalide, à chaque refresh la photo de profil sera reprise du cache local ce qui sera instantané. Et du coup, l'ensemble du processus de rafraîchissement en sera très grandement accéléré.

## Que contient ce projet de démonstration ?
Ce projet contient les fichiers suivants :
| Fichier    | Mission, signification, contenu (c'est bon vous m'avez compris hihi) |
| -------- | ------- |
| [index.html](index.html)  | HTML minimaliste de cette SPA fournissant un bouton **Login** et **Logout** ainsi qu'une zone où seront montrées toutes les informations reçues dans le **&lt;DIV&gt;** avec l'`id="all-profile-infos-will-be-then-displayed-here"`|
| [oid.css](css/oid.css) | pour que la page HTML ne soit pas trop moche à regarder. |
| [IhmUtils.js](js/ihm/IhmUtils.js) |une seule méthode responsable de transformer le JSON reçu (avec toutes les informations du profil utilisateur et photo de profil) en HTML a afficher. Cet HTML est injecté par le Ctrl dans le **&lt;DIV&gt;** ci-dessus avec l'`id="all-profile-infos-will-be-then-displayed-here"`.|
| [WrkEasyOpenId.js](js/openid/WrkEasyOpenId.js) | qui contient mon worker qui devrait s'occuper de tout au niveau OpenID/OAuth2.0, login, logout et redirection. |
| [Ctrl.js](js/ctrl/Ctrl.js) | le contrôleur de l'application qui appelle `openIdAuthenticationRefresh()` au chargement de la page et qui ne contient que 6 écouteurs : 2 pour écouter les boutons de l'ihm pour appeler les méthodes login() et logout de `WrkEasyOpenId` lorsque pressés, et 4 pour être notifiés par `WrkEasyOpenId` des événements tels que authentification réussie, échouée, en cours, ... |
## Copyright ©
<img align="left" width="128" style="padding-right: 1em;" src="res/WTFPL_logo.svg.png" alt="WTFPL image" />  

Comme indiqué dans `WrkEasyOpenId.js`, ce logiciel est publié sous le modèle de licence [WTFPL](https://fr.wikipedia.org/wiki/WTFPL).
**WTFPL** = _Do What The Fuck You Want Public License_.  

Donc _NO rights reserved_, _NO copyrights_ et ... _NO responsabilities_ 😁

Seulement :
1) une bière 😎 au développeur si vous trouvez `WrkEasyOpenId.js` utile et que vous l'utilisez
2) y conserver l'entête avec mention de l'auteur
