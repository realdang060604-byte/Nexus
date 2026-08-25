import fs from 'node:fs/promises';
import path from 'node:path';

import {
  authenticate
} from '@google-cloud/local-auth';

import {
  google,
  Auth
} from 'googleapis';

/* ==========================================
   CONFIG
========================================== */

const SCOPES = [
  'https://www.googleapis.com/auth/calendar'
];

const CREDENTIALS_PATH = path.join(
  process.cwd(),
  'credentials.json'
);

const TOKEN_PATH = path.join(
  process.cwd(),
  'token.json'
);

const loadEnvironmentCredentials = (): Auth.OAuth2Client | null => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const client = new google.auth.OAuth2(clientId, clientSecret);
  client.setCredentials({ refresh_token: refreshToken });
  return client;
};

const isInvalidGrant = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /invalid_grant|invalid_rapt|unauthorized_client/i.test(message);
};

const verifyCredentials = async (
  client: Auth.OAuth2Client
): Promise<boolean> => {
  try {
    await client.getAccessToken();
    return true;
  } catch (error) {
    if (isInvalidGrant(error)) return false;
    throw error;
  }
};

/* ==========================================
   LOAD SAVED TOKEN
========================================== */

const loadSavedCredentials =
  async (): Promise<Auth.OAuth2Client | null> => {
    try {
      const content =
        await fs.readFile(
          TOKEN_PATH,
          'utf-8'
        );

      const credentials =
        JSON.parse(content);

      const client =
        google.auth.fromJSON(
          credentials
        );

      const oauthClient = client as Auth.OAuth2Client;
      return await verifyCredentials(oauthClient) ? oauthClient : null;

    } catch (error) {
      if (isInvalidGrant(error)) return null;
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  };

/* ==========================================
   SAVE TOKEN
========================================== */

const saveCredentials =
  async (
    client: Auth.OAuth2Client
  ): Promise<void> => {
    const content =
      await fs.readFile(
        CREDENTIALS_PATH,
        'utf-8'
      );

    const keys =
      JSON.parse(content);

    const key =
      keys.installed ||
      keys.web;

    if (!key) {
      throw new Error(
        'Invalid credentials.json format'
      );
    }

    const refreshToken =
      client.credentials.refresh_token;

    if (!refreshToken) {
      console.warn(
        '⚠️ Google did not return a refresh token.'
      );

      return;
    }

    const payload = {
      type: 'authorized_user',

      client_id:
        key.client_id,

      client_secret:
        key.client_secret,

      refresh_token:
        refreshToken
    };

    await fs.writeFile(
      TOKEN_PATH,

      JSON.stringify(
        payload,
        null,
        2
      ),

      'utf-8'
    );

    console.log(
      '💾 Google Calendar token saved'
    );
  };

/* ==========================================
   AUTHORIZE CALENDAR
========================================== */

export const authorizeCalendar =
  async (): Promise<Auth.OAuth2Client> => {

    const environmentClient = loadEnvironmentCredentials();
    if (environmentClient) {
      if (!await verifyCredentials(environmentClient)) {
        throw new Error(
          'Google Calendar refresh token is expired or revoked. Generate a new GOOGLE_REFRESH_TOKEN.'
        );
      }
      return environmentClient;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN are required in production'
      );
    }

    /* ======================================
       1. TRY SAVED TOKEN
    ====================================== */

    const savedClient =
      await loadSavedCredentials();

    if (savedClient) {
      console.log(
        '🔑 Using saved Google Calendar token'
      );

      return savedClient;
    }

    /* ======================================
       2. START LOCAL OAUTH
    ====================================== */

    console.log(
      '🔐 Google Calendar authorization required...'
    );

    console.log(
      `📄 Credentials: ${CREDENTIALS_PATH}`
    );

    const localAuthClient =
      await authenticate({
        scopes: SCOPES,
        keyfilePath:
          CREDENTIALS_PATH
      });

    /*
      @google-cloud/local-auth
      và googleapis có thể kéo
      hai version google-auth-library
      khác nhau.

      Runtime vẫn tương thích,
      nhưng TypeScript coi chúng
      là hai OAuth2Client khác nhau.

      Vì vậy cast ở đúng boundary này.
    */

    const client =
      localAuthClient as unknown as Auth.OAuth2Client;

    /* ======================================
       3. SAVE TOKEN
    ====================================== */

    await saveCredentials(
      client
    );

    console.log(
      '📅 Google Calendar authorized successfully'
    );

    return client;
  };
