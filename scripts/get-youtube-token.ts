/**
 * One-time script to generate a YouTube OAuth refresh token.
 * Run with: npx tsx scripts/get-youtube-token.ts
 */
import { google } from 'googleapis';
import readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || '';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

async function main() {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\nOpen this URL in your browser and authorize:');
  console.log('\n' + authUrl + '\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.question('Paste the authorization code here: ', async (code) => {
    rl.close();
    try {
      const { tokens } = await oauth2Client.getToken(code.trim());
      console.log('\n✅ Success! Your refresh token:');
      console.log('\n' + tokens.refresh_token + '\n');
      console.log('Copy this into your /settings page under "YouTube Refresh Token"');
    } catch (err) {
      console.error('Error:', err);
    }
  });
}

main();
