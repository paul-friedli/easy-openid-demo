
jQuery(document).ready(function () {

    // =====================================
    // Lors du onLoad() de la page
    // =====================================
    WrkEasyOpenId.openIdAuthenticationRefresh(
        true,   // true si on veut aussi la photo de profil
        Ctrl.onOIDAuthentication_Started,
        Ctrl.onOIDAuthentication_Failed,
        Ctrl.onOIDAuthentication_Unsuccessfull,
        Ctrl.onIDAuthentication_Successfull
    );
});

var Ctrl = function () {

    var _onBtnLoginPressed = function (event) {

        // L'utilisateur souhaite s'authentifier via l'OpenID de l'État de Fribourg
        WrkEasyOpenId.openIdAuthenticationLogin();
    };

    var _onBtnLogoutPressed = function (event) {

        // L'utilisateur souhaite se "déloguer" de l'OpenID de l'État de Fribourg pour probablement changer d'identité par la suite
        WrkEasyOpenId.openIdAuthenticationLogout();
    };

    var _onOIDAuthentication_Unsuccessfull = function () {

        // La récupération de l'identité OpenID à échoué => il faudra manuellement se "loguer" !
        // Mais pour le moment, on ne l'est pas !

        // Changer l'état des boutons en conséquence
        $('#idBtnLogin').prop('disabled', false);
        $('#idBtnLogout').prop('disabled', true);

        // Vider le <div> prévu pour afficher toutes les informations OpenID reçues
        $('#all-profile-infos-will-be-then-displayed-here').html('Rien à afficher pour le moment...');    
    };

    var _onIDAuthentication_Successfull = function (OpenIDProfileInfos) {

        // Youpiiii, la récupération de l'identité OpenID à réussi !

        // Changer l'état des boutons en conséquence, on doit pouvoir se "déloguer"
        $('#idBtnLogin').prop('disabled', true);
        $('#idBtnLogout').prop('disabled', false);

        // Afficher toutes les informations reçues dans `OpenIDProfileInfos` dans le <div> prévu
        let html_to_inject = IhmUtils.OIDProfileToHTML(OpenIDProfileInfos);
        $('#all-profile-infos-will-be-then-displayed-here').html(html_to_inject);    
    };

    var _onOIDAuthentication_Started = function () {

        // Rien à faire dans cet exemple minimaliste

        // On sait juste que la machinerie OpenId est lancée et qu'éventuellement
        // il y aura redirection si l'authentification n'a pas encore eu lieu,
        // si le jeton ne peut pas être récupéré ou s'il est échu

        console.info('onOIDAuthentication_Started() a été appelée...');
    };

    var _onOIDAuthentication_Failed = function () {

        // Là c'est grave ! Qqch de technique a échoué !!

        // Probablement par manque de droits accordés à l'application dans Azure.
        // Il faut vérifier si :
        //   - l'application a bien été configurée dans Azure et que les identifiants (clientId et tenant-id dans authority sont bien corrects)
        //   - la page/url de redirection a bien été configurée dans Azure et est correcte dans redirectUri
        //   - les droits et scopes ont bien été attribués correctement "openid", "profile", "User.Read" (voir "User.Read.All" selon les besoins de l'application)

        console.warn('onOIDAuthentication_Failed() a été appelée !');
    };

    return {
        onBtnLoginPressed: _onBtnLoginPressed,
        onBtnLogoutPressed: _onBtnLogoutPressed,
        onOIDAuthentication_Started: _onOIDAuthentication_Started,
        onOIDAuthentication_Failed: _onOIDAuthentication_Failed,
        onOIDAuthentication_Unsuccessfull: _onOIDAuthentication_Unsuccessfull,
        onIDAuthentication_Successfull: _onIDAuthentication_Successfull
    };
}();
