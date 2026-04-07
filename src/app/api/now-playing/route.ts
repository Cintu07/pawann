import { NextResponse } from 'next/server';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!refresh_token) {
    return NextResponse.json({ isPlaying: false, message: "No refresh token" }, { status: 500 });
  }

  try {
    const { access_token } = await getAccessToken();

    // 1. Try fetching currently playing
    const nowPlayingRes = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      cache: 'no-store',
    });

    if (nowPlayingRes.status === 200) {
      const song = await nowPlayingRes.json();
      if (song && song.item) {
        return new NextResponse(JSON.stringify({
          album: song.item.album.name,
          albumImageUrl: song.item.album.images[0].url,
          artist: song.item.artists.map((_artist: any) => _artist.name).join(', '),
          isPlaying: song.is_playing,
          songUrl: song.item.external_urls.spotify,
          title: song.item.name,
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }
    }

    // 2. Fallback to Recently Played if nothing is currently playing
    const recentlyPlayedRes = await fetch(RECENTLY_PLAYED_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      cache: 'no-store',
    });

    if (recentlyPlayedRes.status === 200) {
      const data = await recentlyPlayedRes.json();
      if (data.items && data.items.length > 0) {
        const song = data.items[0].track;
        return new NextResponse(JSON.stringify({
          album: song.album.name,
          albumImageUrl: song.album.images[0].url,
          artist: song.artists.map((_artist: any) => _artist.name).join(', '),
          isPlaying: false,
          songUrl: song.external_urls.spotify,
          title: song.name,
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }
    }

    return new NextResponse(JSON.stringify({ isPlaying: false }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    console.error("Spotify API error", err);
    return NextResponse.json({ isPlaying: false }, { status: 500 });
  }
}
