import { api } from './api';
import { ENV } from '../config/env';

const API_KEY = ENV.GOOGLE_API_KEY;

export function extractPlaylistId(url: string): string | null {
  const regex = /[&?]list=([^&]+)/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function fetchYoutubePlaylist(playlistId: string) {
  if (!API_KEY) {
    throw new Error("YouTube API key is not configured. Please add VITE_YOUTUBE_API_KEY to your environment variables.");
  }
  
  // 1. Fetch Playlist Info (Title)
  const { data: playlistData, error: playlistError } = await api.get<any>(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`
  );
  
  if (playlistError || !playlistData?.items || playlistData.items.length === 0) {
    throw new Error(playlistError || "Playlist not found or is private.");
  }
  
  const playlistTitle = playlistData.items[0].snippet.title;
  const playlistThumbnail = playlistData.items[0].snippet.thumbnails?.high?.url || playlistData.items[0].snippet.thumbnails?.default?.url;

  // 2. Fetch Playlist Items
  const { data: itemsData, error: itemsError } = await api.get<any>(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${API_KEY}`
  );
  
  if (itemsError || !itemsData) {
    throw new Error(itemsError || "Failed to fetch playlist items.");
  }

  const videoIds = itemsData.items.map((item: any) => item.snippet.resourceId.videoId);
  
  // 3. Fetch Video Durations
  const { data: videosData, error: videosError } = await api.get<any>(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${API_KEY}`
  );
  
  if (videosError || !videosData) {
    throw new Error(videosError || "Failed to fetch video details.");
  }
  
  const durationMap: Record<string, number> = {};
  videosData.items.forEach((video: any) => {
    durationMap[video.id] = parseISODuration(video.contentDetails.duration);
  });

  return {
    title: playlistTitle,
    thumbnail: playlistThumbnail,
    videos: itemsData.items.map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      position: item.snippet.position,
      duration: durationMap[item.snippet.resourceId.videoId] || 0
    }))
  };
}

function parseISODuration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || '0');
  const minutes = parseInt(matches[2] || '0');
  const seconds = parseInt(matches[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
