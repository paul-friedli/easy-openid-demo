var IhmUtils = function () {

    var too_long_str_truncate = function (str, maxlength) {
        if (str == null) return null;
        if (str.length > maxlength) {
            return `${str.substring(0, maxlength)}...`;
        }
        return str;
    };

    var _OIDProfileToHTML = function (OpenIDProfileInfos) {

        let htmlToInject = '<table class="oid-json-table">';

        const dataFields = {
            token: ['token_id', 'expiration_not_before', 'expiration_not_before_in_secs'],
            user: ['id', 'displayName', 'mail', 'userPrincipalName', 'preferredLanguage', 'givenName', 'mobilePhone', 'photo'],
            company: ['employeeId', 'jobTitle', 'companyName', 'department', 'streetAddress', 'postalCode', 'city', 'state', 'country', 'usageLocation'],
        }

        htmlToInject += '<tr><td colspan="2" class="oid-json-td-domain"><div class="oid-json-div-domain">Photo du profil utilisateur</div></td></tr>';
        if (OpenIDProfileInfos.user.photo != null)
            htmlToInject += '<tr><td class="oid-json-td-data-key"><div class="oid-json-div-key">Photo</div></td><td class="oid-json-td-data-value"><div class="oid-json-div-value"><img id="profile-picture" width="128" height="128" style="border-radius:50%;" src="' + OpenIDProfileInfos.user.photo + '"/></div></td></tr>';
        else
            htmlToInject += '<tr><td class="oid-json-td-data-key"><div class="oid-json-div-key">Photo</div></td><td class="oid-json-td-data-value"><div class="oid-json-div-value"><img id="profile-picture" width="128" height="128" style="border-radius:50%;" src="res/unknown-user.png"/></div></td></tr>';

        Object.keys(dataFields).forEach(key => {
            const domaine = key;
            const listeCles = dataFields[key];

            htmlToInject += '<tr><td colspan="2" class="oid-json-td-domain"><div class="oid-json-div-domain">' + domaine + '</div></td></tr>';
            listeCles.forEach(subKey => {
                if (subKey !== 'photo') {
                    htmlToInject += '<tr><td class="oid-json-td-data-key"><div class="oid-json-div-key">' + subKey + '</div></td><td class="oid-json-td-data-value"><div class="oid-json-div-value">' + OpenIDProfileInfos[key][subKey] + '</div></td></tr>';
                }
            });
        });

        htmlToInject += '<tr><td colspan="2" class="oid-json-td-domain"><div class="oid-json-div-domain">JSON brut retourné par WrkOpenIdEtatFr</div></td></tr>';
        htmlToInject += '<tr><td colspan="2" class="oid-json-td-raw">';

        let OpenIDProfileInfosCopy = JSON.parse(JSON.stringify(OpenIDProfileInfos));
        OpenIDProfileInfosCopy.user.photo = too_long_str_truncate(OpenIDProfileInfosCopy.user.photo, 48);
        htmlToInject += '<pre class="oid-json-pre-raw">' + JSON.stringify(OpenIDProfileInfosCopy, null, 2) + '</pre>';

        htmlToInject += '</td></tr>';

        htmlToInject += '</table>';

        return htmlToInject;
    };

    return {
        OIDProfileToHTML: _OIDProfileToHTML,
    };
}();

