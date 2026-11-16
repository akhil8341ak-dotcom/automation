# YouTube Data API v3 & Channel Integration Guide

Follow this guide to connect CreatorFlow AI with the official Google YouTube Data API v3 for video uploads, analytics, and channel synchronization.

---

## 1. Create a Google Cloud Project

1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown and select **New Project**.
3. Name your project (e.g., `CreatorFlow-Studio`) and click **Create**.

---

## 2. Enable Required APIs

In the Google Cloud Console, navigate to **APIs & Services** → **Library**:
1. Search for **YouTube Data API v3** and click **Enable**.
2. Search for **YouTube Analytics API** and click **Enable**.

---

## 3. Configure OAuth Consent Screen

1. In the left sidebar, navigate to **APIs & Services** → **OAuth consent screen**.
2. Choose **External** (or **Internal** if using Google Workspace). Click **Create**.
3. Fill in:
   - **App name**: `CreatorFlow AI`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes** and add:
   - `https://www.googleapis.com/auth/youtube.upload` (Upload YouTube videos)
   - `https://www.googleapis.com/auth/youtube.readonly` (Read channel info)
   - `https://www.googleapis.com/auth/yt-analytics.readonly` (View YouTube analytics)
6. Under **Test Users**, add your YouTube channel's Google account email address.
7. Click **Save and Continue**.

---

## 4. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth client ID**.
3. Set **Application type** to **Web application**.
4. Set **Name** to `CreatorFlow AI Client`.
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3001/api/youtube/oauth2callback
   ```
6. Click **Create**.
7. Copy the generated **Client ID** and **Client Secret**.

---

## 5. Configure `.env` in CreatorFlow AI

Add the credentials to your `.env` file:
```env
YOUTUBE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3001/api/youtube/oauth2callback
DEFAULT_PRIVACY_STATUS=private
REQUIRE_PUBLISH_APPROVAL=true
```

Restart the server:
```bash
npm start
```

---

## 6. Understanding YouTube API Quotas

- **Default Quota**: 10,000 units per day.
- **Cost per Upload**: Video upload (`videos.insert`) costs **1,600 units**.
- This permits approximately **6 video uploads per day** on the free default quota.
- Channel metadata and search queries cost 1-100 units.
- You can request higher quotas from Google Cloud Console as your channel production grows.

---

## 7. Safety & Policy Defaults

CreatorFlow AI enforces strict compliance defaults:
- **Default Privacy**: Always sets `privacyStatus: 'private'`. Videos will never be published publicly without an explicit approval gate decision.
- **AI Synthetic Media Tag**: Automatically appends YouTube's required AI-generated content disclosure to the video snippet and description.
