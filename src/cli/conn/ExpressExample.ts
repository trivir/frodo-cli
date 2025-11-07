import axios from 'axios';
import { spawn } from 'node:child_process';
import crypto from 'crypto';
import express from 'express';
import qrcode from 'qrcode-terminal';
import { AccessTokenMetaType } from '@rockcarver/frodo-lib/types/ops/OAuth2OidcOps';
import { frodo, state } from '@rockcarver/frodo-lib';
const { saveUserBearerToken } = frodo.cache;

export async function webAuthenticate(): Promise<AccessTokenMetaType> {
  const app = express();
  const port = 3000;

  function generateCodeVerifier(length = 64) {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    for (let b of randomBytes) {
      result += charset[b % charset.length];
    }
    return result;
  }

  function generateCodeChallenge(verifier: string) {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function getAuthUrl(codeChallenge: string) {
    const params = new URLSearchParams({
      client_id: 'local-client',
      response_type: 'code',
      redirect_uri: `http://localhost:${port}`,
      scope: 'fr:idm:* openid',
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });
    return `https://openam-frodo-dev.forgeblocks.com/am/oauth2/authorize?${params.toString()}`;
  }

  function openUrl(url: string) {
    const platform = process.platform;
    if (platform === 'darwin') {
      spawn('open', [url]);
    } else if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url]);
    } else {
      spawn('xdg-open', [url]);
    }
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  return new Promise<AccessTokenMetaType>((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
      openUrl(getAuthUrl(codeChallenge));
    });

    app.get('/', async (req, res) => {
      const { code } = req.query;

      if (!code) {
        res.status(400).send('Missing code parameter');
        return;
      }

      try {
        const tokenResponse = await fetch(
          'https://openam-frodo-dev.forgeblocks.com/am/oauth2/realms/root/access_token',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: code.toString(),
              redirect_uri: `http://localhost:${port}`,
              client_id: 'local-client',
              code_verifier: codeVerifier,
            }),
          }
        );

        const raw: any = await tokenResponse.json();
        const tokens: AccessTokenMetaType = {
          access_token: raw.access_token,
          id_token: raw.id_token,
          scope: raw.scope ?? 'openid',
          token_type: raw.token_type ?? 'Bearer',
          expires_in: raw.expires_in ?? 3600,
          expires: Date.now() + (raw.expires_in ?? 3600) * 1000,
          from_cache: false,
        };

        state.setUsername('interactive-user');
        state.setPassword('interactive-session');
        state.setRealm('/');
        state.setUseTokenCache(true);
        state.setBearerTokenMeta(tokens);
        await saveUserBearerToken(tokens);

        res.send('Authentication successful! You can close this tab.');

        server.close(() => {
          console.log('Example app closed');
          resolve(tokens);
        });
      } catch (err) {
        console.error('Token exchange failed:', err);
        res.status(500).send('Authentication failed');
        server.close();
        reject(err);
      }
    });
  });
}

export async function deviceAuthenticate(): Promise<AccessTokenMetaType> {
  const client_id = 'myClient';
  const baseUrl =
    'https://openam-trivir-demo.forgeblocks.com/am/oauth2/alpha';
  const deviceAuthEndpoint = `${baseUrl}/device/code`;
  const tokenEndpoint = `${baseUrl}/access_token`;

  const response = await fetch(deviceAuthEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client_id,
      scope: 'write',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start device flow: ${response.statusText}`);
  }

  const data: any = await response.json();

  const {
    device_code,
    user_code,
    verification_uri,
    verification_uri_complete,
    expires_in,
    interval,
  } = data;

  qrcode.generate(verification_uri_complete, { small: true });

  console.log('\nScan the QR code above or visit:');
  console.log(verification_uri);
  console.log(verification_uri_complete);
  console.log('\nEnter code: ' + user_code);

  const start = Date.now();
  const pollInterval = interval ? interval * 1000 : 5000;

  while (Date.now() - start < expires_in * 1000) {
    await new Promise((res) => setTimeout(res, pollInterval));

    const pollRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code,
        client_id,
      }),
    });

    // console.log(`Poll status: ${pollRes.status}`);
    const tokenData: any = await pollRes.json();
    // console.log('Poll response:', JSON.stringify(tokenData, null, 2));

    if (pollRes.ok && tokenData.access_token) {
      const tokens: AccessTokenMetaType = {
        access_token: tokenData.access_token,
        id_token: tokenData.id_token,
        scope: tokenData.scope ?? 'openid',
        token_type: tokenData.token_type ?? 'Bearer',
        expires_in: tokenData.expires_in ?? 3600,
        expires: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
        from_cache: false,
      };

      state.setUsername('interactive-user');
      state.setPassword('interactive-session');
      state.setRealm('/');
      state.setUseTokenCache(true);
      state.setBearerTokenMeta(tokens);
      await saveUserBearerToken(tokens);

      console.log('\nAuthentication successful!\n');
      return tokens;
    }

    if (tokenData.error === 'authorization_pending') {
      continue;
    }

    throw new Error(`Device flow failed: ${JSON.stringify(tokenData)}`);
  }

  throw new Error('Device flow expired before completion.');
}
