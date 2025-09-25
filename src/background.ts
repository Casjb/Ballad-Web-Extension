// IMPORTANT: redirect uri below only works for file structure of:
/*
            /root
            |-- dist/
            |-- icons/
            `-- manifest.json
 */
// any other package configuration will result in a differing extension key, breaking the uri.
// this can be fixed when the extension is approved and on the web store

const clientId: string = '1419429683283492915'
const clientSecret: string = '-eKFnPxMajF0lc3aYrpeuS9robquDu0N'
const redirectUri: string =
    `https://elmjgoniopidhkghhfgojbmodackgbnd.chromiumapp.org`
const oAuthUrl: string =
    `https://discord.com/oauth2/authorize?client_id=1419429683283492915&response_type=code&redirect_uri=https%3A%2F%2Fedodmhmplbbkmibhnllndmakgfjdjhmi.chromiumapp.org%2F&scope=identify`
const webhookUrl = 'https://discord.com/api/webhooks/1420186646384738345/z5RAvjkRBY9PzWRR4fbI2EHUXPJGeIt70utm4DTrhUzZKQMGrult2HAu3ZVb-vm4sLIg';

// oauth flow after initial installation:
// open oauth window => callback to built-in handler to get access code => exchange for access token
chrome.runtime.onInstalled.addListener((details: any) => {
    if (details.reason != 'install') return
    chrome.identity.launchWebAuthFlow({
        url: oAuthUrl,
        interactive: true
    }, async (responseUrl) => {
        const url = new URL(responseUrl!);
        const code = url.searchParams.get('code');
        console.log('got auth code:', code);

        // exchange code for access token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret, // get this from discord dev portal
                grant_type: 'authorization_code',
                code: code!,
                redirect_uri: `${redirectUri}/`
            })
        });
        const {access_token} = await tokenResponse.json();

        // get user discord info from api and extract id and name
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {Authorization: `Bearer ${access_token}`}
        });
        const {id, username} = await userResponse.json();

        // log readably
        console.group('User Data:')
        console.table({'id': id, 'username': username});
        console.groupEnd();

        // store discord user in local cache
        await chrome.storage.local.set({
            discordUser: {id, username}
        })
    });
})

// listen for balatrodle stats sent from content.ts
chrome.runtime.onMessage.addListener(async (message: any) => {
    console.log('got message:', message);
    if (message.type != 'stats') return
    const { discordUser: {id, username} } = await chrome.storage.local.get('discordUser');
    const { wins, streak, lastWin, average } = message.data;

    // send data to discord webhook channel
    await fetch(webhookUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            embeds: [{
                title: "Balatrodle Stats",
                color: 0x5865F2,
                fields: [
                    {name: "Player", value: `${username} ${id}`, inline: true},
                    {name: "Wins", value: wins.toString(), inline: true},
                    {name: "Average", value: average.toFixed(1), inline: true},
                    {name: "Streak", value: streak.toString(), inline: true},
                    {name: "LastWin", value: lastWin.toString(), inline: true},
                ],
                timestamp: new Date().toISOString()
            }]
        })
    });

})

