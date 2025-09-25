const clientId = '1419429683283492915';
const clientSecret = '-eKFnPxMajF0lc3aYrpeuS9robquDu0N';

// fixed redirect you registered in discord
const fixedRedirect = 'https://casjb.github.io/Ballad-Extension/oauth.html';

// the redirect chrome.identity will intercept (dynamic per install)
const extRedirect = chrome.identity.getRedirectURL('/cb');

const webhookUrl = 'https://discord.com/api/webhooks/1420186646384738345/z5RAvjkRBY9PzWRR4fbI2EHUXPJGeIt70utm4DTrhUzZKQMGrult2HAu3ZVb-vm4sLIg';

function nonce(n = 16) {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return btoa(String.fromCharCode(...a)).replace(/[^a-z0-9]/gi, '').slice(0, 22);
}

async function startDiscordAuth() {
    const n = nonce();
    await chrome.storage.session.set({ oauthNonce: n });

    const state = `${chrome.runtime.id}:${n}`;
    const oAuthUrl =
        `https://discord.com/api/oauth2/authorize` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(fixedRedirect)}` +
        `&scope=identify` +
        `&state=${encodeURIComponent(state)}`;

    chrome.identity.launchWebAuthFlow({ url: oAuthUrl, interactive: true }, async (responseUrl) => {
        if (!responseUrl) { console.log('oauth cancelled/failed'); return; }

        // should be extRedirect + ?code=...&state=...
        if (!responseUrl.startsWith(extRedirect)) {
            console.log('unexpected redirect:', responseUrl, 'expected prefix:', extRedirect);
            return;
        }

        try {
            const u = new URL(responseUrl);
            const code = u.searchParams.get('code');
            const st = u.searchParams.get('state') || '';
            const [extId, gotNonce] = st.split(':');
            const { oauthNonce } = await chrome.storage.session.get('oauthNonce');

            if (!code) { console.log('missing code'); return; }
            if (extId !== chrome.runtime.id || gotNonce !== oauthNonce) { console.log('state mismatch'); return; }

            // exchange code -> token (must use the SAME fixed redirect you sent to discord)
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: fixedRedirect
                })
            });

            if (!tokenResponse.ok) {
                console.log('token exchange failed', tokenResponse.status, await tokenResponse.text());
                return;
            }
            const { access_token } = await tokenResponse.json();

            const userResponse = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            if (!userResponse.ok) {
                console.log('user fetch failed', userResponse.status, await userResponse.text());
                return;
            }

            const { id, username } = await userResponse.json();
            console.group('user data'); console.table({ id, username }); console.groupEnd();

            await chrome.storage.local.set({ discordUser: { id, username } });
        } catch (e) {
            console.log('oauth flow error', e);
        }
    });
}

// run oauth once on install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') startDiscordAuth();
});

// listen for balatrodle stats from content script and post to webhook
chrome.runtime.onMessage.addListener(async (message) => {
    if (message?.type !== 'stats') return;

    const store = await chrome.storage.local.get('discordUser');
    const discordUser = store.discordUser;
    if (!discordUser) { console.log('no discord user cached yet'); return; }

    const { id, username } = discordUser;
    const { wins, streak, lastWin, average } = message.data || {};

    if (wins == null || average == null) {
        console.log('stats payload missing fields', message.data);
        return;
    }

    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            embeds: [{
                title: 'balatrodle stats',
                color: 0x5865F2,
                fields: [
                    { name: 'player', value: `${username} (${id})`, inline: true },
                    { name: 'wins', value: String(wins), inline: true },
                    { name: 'average', value: average.toFixed(1), inline: true },
                    { name: 'streak', value: String(streak ?? 0), inline: true },
                    { name: 'last win', value: String(lastWin ?? ''), inline: true }
                ],
                timestamp: new Date().toISOString()
            }]
        })
    });
});
