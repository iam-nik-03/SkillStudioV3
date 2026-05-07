import { Router } from "express";
import { google } from "googleapis";

import { SERVER_CONFIG } from "../config/env.js";

const router = Router();
const youtube = google.youtube("v3");

// Helper to get API key from environment
const getApiKey = () => SERVER_CONFIG.GOOGLE_API_KEY;

router.get("/search", async (req, res) => {
  const { q } = req.query;
  const apiKey = getApiKey();

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  if (!apiKey) {
    console.error("YouTube API key is missing in environment variables");
    return res.status(500).json({ error: "YouTube API key not configured on server" });
  }

  try {
    console.log(`Searching for YouTube playlists with query: "${q}" using API Key: ${apiKey.substring(0, 5)}...`);
    const response: any = await youtube.search.list({
      auth: apiKey,
      part: ["snippet"],
      q: q as string,
      type: ["playlist"],
      maxResults: 20,
    });

    const playlists = response.data.items || [];
    console.log(`Found ${playlists.length} initial search results`);
    
    if (playlists.length === 0) {
      console.log("No playlists found for query");
      return res.json([]);
    }

    // Get more details for each playlist (like video count)
    const playlistIds = playlists.map((p: any) => p.id?.playlistId).filter(Boolean) as string[];
    console.log(`Extracted ${playlistIds.length} playlist IDs: ${playlistIds.join(', ')}`);
    
    if (playlistIds.length === 0) {
      return res.json([]);
    }

    const detailsResponse: any = await youtube.playlists.list({
      auth: apiKey,
      part: ["contentDetails", "snippet"],
      id: playlistIds,
    });

    const detailedPlaylists = detailsResponse.data.items?.map((item: any) => ({
      id: item.id,
      title: item.snippet?.title,
      description: item.snippet?.description,
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle,
      videoCount: item.contentDetails?.itemCount,
    }));

    console.log(`Returning ${detailedPlaylists?.length || 0} detailed playlists`);
    res.json(detailedPlaylists);
  } catch (error: any) {
    console.error("YouTube search error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch YouTube playlists" });
  }
});

router.get("/playlist/:playlistId", async (req, res) => {
  const { playlistId } = req.params;
  const apiKey = getApiKey();
  console.log(`Fetching details for playlist: ${playlistId}`);

  if (!apiKey) {
    return res.status(500).json({ error: "YouTube API key not configured on server" });
  }

  try {
    // Get playlist details
    const playlistResponse: any = await youtube.playlists.list({
      auth: apiKey,
      part: ["snippet", "contentDetails"],
      id: [playlistId],
    });

    const playlist = playlistResponse.data.items?.[0];
    if (!playlist) {
      console.error(`Playlist not found: ${playlistId}`);
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Get playlist items (videos)
    let videos: any[] = [];
    let nextPageToken: string | undefined | null = undefined;

    do {
      console.log(`Fetching playlist items for ${playlistId}, token: ${nextPageToken || 'none'}`);
      const itemsResponse: any = await youtube.playlistItems.list({
        auth: apiKey,
        part: ["snippet", "contentDetails"],
        playlistId: playlistId,
        maxResults: 50,
        pageToken: nextPageToken || undefined,
      });

      videos = [...videos, ...(itemsResponse.data.items || [])];
      nextPageToken = itemsResponse.data.nextPageToken;
    } while (nextPageToken);

    console.log(`Fetched ${videos.length} videos for playlist ${playlistId}`);

    const formattedVideos = videos.map((v, index) => ({
      id: v.contentDetails?.videoId,
      title: v.snippet?.title,
      description: v.snippet?.description,
      thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url,
      orderIndex: index,
    }));

    res.json({
      id: playlist.id,
      title: playlist.snippet?.title,
      description: playlist.snippet?.description,
      thumbnail: playlist.snippet?.thumbnails?.high?.url || playlist.snippet?.thumbnails?.medium?.url,
      channelTitle: playlist.snippet?.channelTitle,
      videos: formattedVideos,
    });
  } catch (error: any) {
    console.error("YouTube playlist error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch YouTube playlist details" });
  }
});

export default router;
