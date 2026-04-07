const client_id = "79aac9b485fa4074b286c4826f478278";
const client_secret = "3cfd7af4eca247d2b657603a7f0dd1eb";
const refresh_token = "AQBl7JQnSYSlg17FEm42gAZ1IMAcpGG7B-uACPk29p-unS7hBaWQPrdYbeChf2Hzqm6wl95t5ivkSNRoGRsiDH24vdb7yexBG62ceQ1X6xe3_VUCLcmu-Wft2IfmDHMRrPI";

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played?limit=1`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token || '',
    }),
  });

  return response.json();
};

async function diagnostic() {
  try {
    const tokenData = await getAccessToken();
    const access_token = tokenData.access_token;
    console.log("Token success:", !!access_token);

    const nowPlayingRes = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log("NOW_PLAYING_STATUS:", nowPlayingRes.status);

    const recentlyPlayedRes = await fetch(RECENTLY_PLAYED_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log("RECENTLY_PLAYED_STATUS:", recentlyPlayedRes.status);
    if (recentlyPlayedRes.status !== 200) {
      console.log("Error:", await recentlyPlayedRes.text());
    }

  } catch (err) {
    console.error("DIAGNOSTIC ERROR:", err);
  }
}

diagnostic();
