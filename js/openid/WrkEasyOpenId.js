////////////////////////////////////////////////////////////////////////////
//         _____                   ___                   ___ ____         //
//        | ____|__ _ ___ _   _   / _ \ _ __   ___ _ __ |_ _|  _ \        //
//        |  _| / _` / __| | | | | | | | '_ \ / _ \ '_ \ | || | | |       //
//        | |__| (_| \__ \ |_| | | |_| | |_) |  __/ | | || || |_| |       //
//        |_____\__,_|___/\__, |  \___/| .__/ \___|_| |_|___|____/        //
//        Written         |___/   by   |_|      Paul Friedli / v1.0       //
//                                                                        //
//  --------------------------------------------------------------------  //
//                                                                        //
//                       Released under the WTFPL                         //
//                (https://fr.wikipedia.org/wiki/WTFPL)                   //
//                                                                        //
//                 NO rights reserved and NO copyrights                   //
//                     (and NO responsabilities :-)                       //
//                                                                        //
//                Just don't forget who wrote it and ...                  //
//                 ...please mention it in your sources                   //
//                                                                        //
////////////////////////////////////////////////////////////////////////////

var WrkEasyOpenId = function () {

    const msalConfig = {
        auth: {
            // 'Application (client) ID' dans le portail Azure, c'est un GUID
            clientId: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",                                       // <= a remplacer par votre propre ID
            // URL complet pour atteindre le 'tenant' dans la forme https://login.microsoftonline.com/<tenant-id>
            authority: "https://login.microsoftonline.com/YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY",    // <= a remplacer par votre propre URL avec tenant ID
            // URL de redirection complet de votre application
            redirectUri: "https://www.your-domain-name.com/your-app-redirection-url",               // <= a remplacer par votre propre URL de redirection complet
        },
        cache: {
            // Pour configurer où sera votre cache :
            // - utilisez "sessionStorage" (cas normal) et chaque onglet du navigateur vous permettra d'utiliser un compte différent pour vous authentifier
            // - utilisez "localStorage" et chaque onglet utilisera le même utilisateur
            cacheLocation: "sessionStorage",
            // Mettre 'true' pour forcer l'ajout du state dans de cookies, seulement en cas de soucis avec IE11 ou Edge
            storeAuthStateInCookie: false,
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, containsPii) => {
                    if (containsPii) {
                        return;
                    }
                    switch (level) {
                        case msal.LogLevel.Error:
                            console.error(message);
                            return;
                        case msal.LogLevel.Info:
                            //                            console.info(message);    // Décommenter en mode développement pour voir ce qui se passe, les appels réalisés au niveau du protocole OpenId
                            return;
                        case msal.LogLevel.Verbose:
                            //                            console.debug(message);   // Décommenter en mode développement pour voir ce qui se passe, les appels réalisés au niveau du protocole OpenId
                            return;
                        case msal.LogLevel.Warning:
                            console.warn(message);
                            return;
                    }
                }
            }
        }
    };

    const msalClient = new msal.PublicClientApplication(msalConfig);

    var _openIdAuthenticationLogin = function () {
        msalClient.loginRedirect();
    };

    var _openIdAuthenticationLogout = function () {
        msalClient.logoutRedirect();
    };

    var _openIdAuthenticationRefresh = function (
        retrieveProfilePicture,
        fnOnOIDAuthenticationProcess_Started,
        fnOnOIDAuthenticationProcess_Failed,
        fnOnOIDAuthenticationEvent_Unsuccessfull,
        fnOnOIDAuthenticationEvent_Successfull
    ) {
        // Vérifier la présence des paramètres obligatoires...
        if (typeof retrieveProfilePicture !== "boolean") {
            console.error("Le paramètre booléen retrieveProfilePicture DOIT être fourni !");
            return;
        }
        if (typeof fnOnOIDAuthenticationEvent_Successfull !== 'function') {
            console.error("La méthode à appeler dans le paramètre fnOnOIDAuthenticationEvent_Successfull DOIT être fournie !");
            return;
        }
        if (typeof fnOnOIDAuthenticationEvent_Unsuccessfull !== 'function') {
            console.error("La méthode à appeler dans le paramètre fnOnOIDAuthenticationEvent_Unsuccessfull DOIT être fournie !");
            return;
        }

        // Appeler l'écouteur fnOnOIDAuthenticationProcess_Started() si fourni
        if (typeof fnOnOIDAuthenticationProcess_Started === 'function') {
            fnOnOIDAuthenticationProcess_Started();
        }

        msalClient
            .handleRedirectPromise()
            .then(response => {

                const accounts = msalClient.getAllAccounts();

                if (accounts.length === 0) {
                    fnOnOIDAuthenticationEvent_Unsuccessfull();
                }
                else if (accounts.length === 1) {

                    const userAccount = accounts[0];
                    const graphClient = _getGraphClient(userAccount);

                    graphClient
                        .api('/me?$select=id,displayName,givenName,jobTitle,mobilePhone,mail,companyName,userPrincipalName,city,companyName,country,department,displayName,employeeId,givenName,id,jobTitle,postalCode,preferredLanguage,state,streetAddress,usageLocation,userPrincipalName')
                        .get()
                        .then(res => {

                            let allOpenIDProfileInfos = {
                                token: {
                                    token_id: userAccount.idTokenClaims.uti,
                                    expiration_not_before: new Date(userAccount.idTokenClaims.exp * 1000).toLocaleDateString('fr-CH') + ' ' + new Date(userAccount.idTokenClaims.exp * 1000).toLocaleTimeString('fr-CH'),
                                    expiration_not_before_in_secs: Math.round(userAccount.idTokenClaims.exp - (new Date()).getTime() / 1000)
                                },
                                user: {
                                    id: (res.id != null) ? res.id.toLowerCase() : null,
                                    displayName: res.displayName,
                                    mail: (res.mail != null) ? res.mail.toLowerCase() : null,
                                    userPrincipalName: res.userPrincipalName,
                                    preferredLanguage: res.preferredLanguage,
                                    givenName: res.givenName,
                                    mobilePhone: res.mobilePhone,
                                    photo: null // Pour le moment, car la demande va être envoyée sous peu (si souhaité)
                                },
                                company: {
                                    employeeId: res.employeeId,
                                    jobTitle: res.jobTitle,
                                    companyName: res.companyName,
                                    department: res.department,
                                    streetAddress: res.streetAddress,
                                    postalCode: res.postalCode,
                                    city: res.city,
                                    state: res.state,
                                    country: res.country,
                                    usageLocation: res.usageLocation
                                }
                            };

                            // Doit-on faire une requête pour obtenir la photo du profil ?
                            if (retrieveProfilePicture === true) {

                                // Vérifier si la photo n'est pas déjà en cache pour ce token-là, histoire de gagner beaucoup de temps en évitant la requête inutile (car la photo ne change pas souvent...)
                                let cachedPictureInSession = JSON.parse(sessionStorage.getItem('profile-picture-cache'));
                                if ((cachedPictureInSession != null) && (allOpenIDProfileInfos.token.token_id === cachedPictureInSession.currentTokenId)) {
                                    // Oui, alors la prendre du cache local et éviter la requête vers Azure qui prends du temps...
                                    allOpenIDProfileInfos.user.photo = cachedPictureInSession.pictureData;
                                    // Comptabiliser le nbre de fois qu'on a utilisé l'image du cache
                                    cachedPictureInSession.howManyTimesUsed++;
                                    sessionStorage.setItem('profile-picture-cache', JSON.stringify(cachedPictureInSession));
                                    console.info('Appel Azure évité, photo du profil prise du cache local ' + cachedPictureInSession.howManyTimesUsed + ' fois...');
                                    // Appeler notre client avec l'ensemble des données du profil reçues
                                    fnOnOIDAuthenticationEvent_Successfull(allOpenIDProfileInfos);
                                } else {
                                    // Requête pour obtenir la photo du profil (si les droits de le faire sont concédés...)
                                    graphClient
                                        .api('/me/photo/$value')
                                        .responseType("blob")
                                        .get()
                                        .then(picture => {
                                            if (picture) {
                                                let reader = new FileReader();
                                                reader.addEventListener("load", () => {
                                                    allOpenIDProfileInfos.user.photo = reader.result;
                                                    // Mettre la photo en cache pour gagner de la vitesse d'exécution car elle change pas souvent...
                                                    const cachedPictureInSession = {
                                                        currentTokenId: allOpenIDProfileInfos.token.token_id,
                                                        pictureData: allOpenIDProfileInfos.user.photo,
                                                        howManyTimesUsed: 0
                                                    };
                                                    sessionStorage.setItem('profile-picture-cache', JSON.stringify(cachedPictureInSession));
                                                    // Appeler notre client avec l'ensemble des données du profil reçues
                                                    fnOnOIDAuthenticationEvent_Successfull(allOpenIDProfileInfos);
                                                }, false);
                                                reader.readAsDataURL(picture);
                                            } else {
                                                // L'utilisateur ne semble pas avoir de photo dans son profil Azure
                                                allOpenIDProfileInfos.user.photo = null;
                                                // Appeler notre client avec l'ensemble des données du profil reçues
                                                fnOnOIDAuthenticationEvent_Successfull(allOpenIDProfileInfos);
                                            }
                                        })
                                        .catch(error => {
                                            if (error.toString().includes('404')) {
                                                // L'utilisateur ne semble pas avoir de photo dans son profil Azure
                                                allOpenIDProfileInfos.user.photo = null;
                                                // Appeler notre client avec l'ensemble des données du profil reçues
                                                fnOnOIDAuthenticationEvent_Successfull(allOpenIDProfileInfos);
                                                // Erreur "normale" car l'utilisateur n'a pas de photo dans son profil !
                                                console.warn("Photo demandée pour un utilisateur qui n'en possède pas !");
                                            } else {
                                                console.error("Erreur lors de la récupération de la photo de profil de l'utilisateur : " + error);
                                            }
                                        });
                                }
                            } else {
                                // Appeler notre client avec l'ensemble des données du profil reçues
                                fnOnOIDAuthenticationEvent_Successfull(allOpenIDProfileInfos);
                            }
                        })
                        .catch(error => {
                            console.error(error);
                            fnOnOIDAuthenticationEvent_Unsuccessfull();
                            if ((typeof fnOnOIDAuthenticationProcess_Failed !== 'undefined') && (fnOnOIDAuthenticationProcess_Failed instanceof Function)) {
                                fnOnOIDAuthenticationProcess_Failed(error);
                            }
                        });
                } else {
                    const errorMsg = "Utilisation simultanée de plusieurs comptes Azure détectée !";
                    console.error(errorMsg);
                    fnOnOIDAuthenticationEvent_Unsuccessfull();
                    if ((typeof fnOnOIDAuthenticationProcess_Failed !== 'undefined') && (fnOnOIDAuthenticationProcess_Failed instanceof Function)) {
                        fnOnOIDAuthenticationProcess_Failed(error);
                    }
                }
            })
            .catch(error => {
                console.error(error);
                fnOnOIDAuthenticationEvent_Unsuccessfull();
                if ((typeof fnOnOIDAuthenticationProcess_Failed !== 'undefined') && (fnOnOIDAuthenticationProcess_Failed instanceof Function)) {
                    fnOnOIDAuthenticationProcess_Failed(error);
                }
            });
    };

    var _getGraphClient = function (account) {
        const authProvider = new MSGraphAuthCodeMSALBrowserAuthProvider.AuthCodeMSALBrowserAuthenticationProvider(msalClient, {
            account,
            scopes: ['user.read'],
            interactionType: msal.InteractionType.Redirect,
        });

        return MicrosoftGraph.Client.initWithMiddleware({ authProvider });
    };

    return {
        openIdAuthenticationLogin: _openIdAuthenticationLogin,
        openIdAuthenticationLogout: _openIdAuthenticationLogout,
        openIdAuthenticationRefresh: _openIdAuthenticationRefresh
    };
}();

