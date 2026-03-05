import fs from 'fs';
import { google } from 'googleapis';
import { getSettingValue } from '../settings';

interface UploadOptions {
  videoPath: string;
  thumbnailPath: string;
  title: string;
  description: string;
  tags: string[];
}

async function getOAuth2Client() {
  const clientId = await getSettingValue('youtube_client_id');
  const clientSecret = await getSettingValue('youtube_client_secret');
  const refreshToken = await getSettingValue('youtube_refresh_token');

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export async function uploadToYouTube(options: UploadOptions): Promise<string> {
  const { videoPath, thumbnailPath, title, description, tags } = options;

  const auth = await getOAuth2Client();
  const youtube = google.youtube({ version: 'v3', auth });

  // Upload video
  const uploadResponse = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description,
        tags,
        categoryId: '22', // People & Blogs (common for relaxation)
        defaultLanguage: 'en',
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  const youtubeId = uploadResponse.data.id!;

  // Upload thumbnail
  if (fs.existsSync(thumbnailPath)) {
    await youtube.thumbnails.set({
      videoId: youtubeId,
      media: {
        body: fs.createReadStream(thumbnailPath),
      },
    });
  }

  return youtubeId;
}

export async function getYouTubeStats(
  youtubeIds: string[],
): Promise<Record<string, { viewCount: string; likeCount: string }>> {
  if (youtubeIds.length === 0) return {};

  try {
    const auth = await getOAuth2Client();
    const youtube = google.youtube({ version: 'v3', auth });

    const response = await youtube.videos.list({
      part: ['statistics'],
      id: youtubeIds,
    });

    const result: Record<string, { viewCount: string; likeCount: string }> = {};
    for (const item of response.data.items || []) {
      result[item.id!] = {
        viewCount: item.statistics?.viewCount || '0',
        likeCount: item.statistics?.likeCount || '0',
      };
    }
    return result;
  } catch {
    return {};
  }
}
