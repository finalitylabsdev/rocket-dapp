import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Wallet } from 'ethers';

const SIWE_STATEMENT = 'Sign in to Entropy Network.';
const DEFAULT_LOOP_INTERVAL_MS = 45_000;
const DEFAULT_INITIAL_SPREAD_MS = 15_000;
const DEFAULT_MAX_BOX_OPENS_PER_CYCLE = 1;

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }
  return '';
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNumber(value, fallback) {
  const parsed = Number(value ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value, fallback = false) {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parseList(value) {
  if (!value) {
    return [];
  }
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeWalletAddress(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

function normalizeSignature(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return /^0x[0-9a-fA-F]+$/.test(trimmed) ? trimmed : null;
}

function extractPayloadError(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  for (const key of ['message', 'msg', 'error_description', 'error']) {
    const candidate = payload[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return null;
}

function extractSessionTokens(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const sessionSource =
    payload.session && typeof payload.session === 'object'
      ? payload.session
      : payload;

  if (
    typeof sessionSource.access_token === 'string' &&
    typeof sessionSource.refresh_token === 'string'
  ) {
    return {
      accessToken: sessionSource.access_token,
      refreshToken: sessionSource.refresh_token,
    };
  }

  return null;
}

function getRandomHex(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

function createUuid() {
  return crypto.randomUUID();
}

function toIsoNow() {
  return new Date().toISOString();
}

function createDailyFaucetKey(walletAddress) {
  const day = new Date().toISOString().slice(0, 10);
  return `faucet:${walletAddress}:${day}`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomDelay(maxMs) {
  if (maxMs <= 0) {
    return 0;
  }
  return Math.floor(Math.random() * maxMs);
}

function pickRandom(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
}

function computeMinNextBid(currentHighestBid) {
  const numericBid = Number(currentHighestBid);
  if (!Number.isFinite(numericBid) || numericBid <= 0) {
    return 1;
  }
  const minIncrement = numericBid * 0.05;
  return Math.max(1, Math.round((numericBid + minIncrement) * 100) / 100);
}

function log(event, details = {}) {
  process.stdout.write(`${JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...details,
  })}\n`);
}

function buildSiweMessage(address, chainId, uri, domain) {
  const issuedAt = new Date().toISOString();
  const nonce = getRandomHex(16);

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    SIWE_STATEMENT,
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');
}

function buildFluxClaimMessage(walletAddress, claimAmount, cooldownSeconds, chainId, nonce, issuedAt) {
  return [
    'Entropy Network Flux Faucet',
    `Wallet: ${walletAddress}`,
    'Action: claim_flux',
    `Amount: ${claimAmount}`,
    `Cooldown Seconds: ${cooldownSeconds}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    'Settlement: offchain_message',
  ].join('\n');
}

function extractWalletAddressFromUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const directCandidates = [user.id];
  if (user.user_metadata && typeof user.user_metadata === 'object') {
    directCandidates.push(
      user.user_metadata.wallet_address,
      user.user_metadata.address,
      user.user_metadata.sub,
    );
  }

  for (const candidate of directCandidates) {
    const normalized = normalizeWalletAddress(candidate);
    if (normalized) {
      return normalized;
    }
  }

  if (Array.isArray(user.identities)) {
    for (const identity of user.identities) {
      if (!identity || typeof identity !== 'object') {
        continue;
      }

      const providerMatch = normalizeWalletAddress(identity.provider_id ?? identity.provider);
      if (providerMatch) {
        return providerMatch;
      }

      const identityData = identity.identity_data;
      if (!identityData || typeof identityData !== 'object') {
        continue;
      }

      for (const candidate of [
        identityData.wallet_address,
        identityData.address,
        identityData.sub,
      ]) {
        const normalized = normalizeWalletAddress(candidate);
        if (normalized) {
          return normalized;
        }
      }
    }
  }

  return null;
}

function createConfig() {
  const supabaseUrl = requiredEnv('VITE_SUPABASE_URL');
  const supabasePublishableKey = optionalEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!supabasePublishableKey) {
    throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY');
  }

  const privateKeys = parseList(process.env.SIM_WALLET_PRIVATE_KEYS);
  if (privateKeys.length === 0) {
    throw new Error('Missing SIM_WALLET_PRIVATE_KEYS. Provide a comma- or newline-separated list of Ethereum private keys.');
  }

  const siweUriValue = optionalEnv('SIM_SIWE_URI', 'VITE_SIWE_URI') || 'http://rocket-web/';
  const siweUri = new URL(siweUriValue).toString();
  const siweDomain = optionalEnv('SIM_SIWE_DOMAIN', 'VITE_SIWE_DOMAIN') || new URL(siweUri).host;

  return {
    supabaseUrl,
    supabasePublishableKey,
    privateKeys,
    chainId: parseInteger(process.env.SIM_CHAIN_ID, 1),
    siweUri,
    siweDomain,
    loopIntervalMs: parseInteger(process.env.SIM_LOOP_INTERVAL_MS, DEFAULT_LOOP_INTERVAL_MS),
    initialSpreadMs: parseInteger(process.env.SIM_INITIAL_SPREAD_MS, DEFAULT_INITIAL_SPREAD_MS),
    maxBoxOpensPerCycle: parseInteger(process.env.SIM_MAX_BOX_OPENS_PER_CYCLE, DEFAULT_MAX_BOX_OPENS_PER_CYCLE),
    runOnce: parseBoolean(process.env.SIM_RUN_ONCE, false),
    whitelistBonusFlux: parseNumber(process.env.VITE_SPEC_WHITELIST_BONUS_FLUX, 0),
    dailyClaimFlux: parseNumber(process.env.VITE_SPEC_DAILY_CLAIM_FLUX, 1),
    faucetIntervalSeconds: parseInteger(process.env.VITE_SPEC_FAUCET_INTERVAL_SECONDS, 86400),
    userAgent: optionalEnv('SIM_USER_AGENT') || 'entropy-sim/1.0',
    configuredBoxTierIds: parseList(process.env.SIM_BOX_TIER_IDS).map((entry) => entry.toLowerCase()),
  };
}

async function exchangeWeb3SignatureForSession(config, message, signature) {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=web3`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: config.supabasePublishableKey,
    },
    body: JSON.stringify({
      chain: 'ethereum',
      message,
      signature,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = extractPayloadError(payload) ?? `Web3 sign-in failed (${response.status}).`;
    throw new Error(reason);
  }

  const tokens = extractSessionTokens(payload);
  if (!tokens) {
    throw new Error('Web3 sign-in succeeded but no session tokens were returned.');
  }

  return tokens;
}

async function createSimUser(config, privateKey, index) {
  const wallet = new Wallet(privateKey);
  const walletAddress = normalizeWalletAddress(wallet.address);
  if (!walletAddress) {
    throw new Error(`SIM_WALLET_PRIVATE_KEYS[${index}] is not a valid Ethereum private key.`);
  }

  const client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-simulated-traffic': 'true',
      },
    },
  });

  await authenticateSimUserSession({ wallet, walletAddress, client }, config);

  return {
    wallet,
    walletAddress,
    client,
    nextClaimAt: 0,
    lastSubmittedRoundId: null,
  };
}

async function authenticateSimUserSession(simUser, config) {
  const message = buildSiweMessage(
    simUser.walletAddress,
    config.chainId,
    config.siweUri,
    config.siweDomain,
  );
  const signature = normalizeSignature(await simUser.wallet.signMessage(message));
  if (!signature) {
    throw new Error(`Failed to sign the SIWE message for wallet ${simUser.walletAddress}.`);
  }

  const tokens = await exchangeWeb3SignatureForSession(config, message, signature);
  const { error: sessionError } = await simUser.client.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });

  if (sessionError) {
    throw new Error(`Failed to set the Supabase session for ${simUser.walletAddress}: ${sessionError.message}`);
  }

  const { data: userData, error: userError } = await simUser.client.auth.getUser();
  if (userError) {
    throw new Error(`Failed to read the authenticated user for ${simUser.walletAddress}: ${userError.message}`);
  }

  const sessionWallet = extractWalletAddressFromUser(userData.user);
  if (sessionWallet && sessionWallet !== simUser.walletAddress) {
    throw new Error(`Authenticated wallet mismatch for ${simUser.walletAddress}.`);
  }
}

async function resolveBoxTierIds(simUser, config) {
  if (config.configuredBoxTierIds.length > 0) {
    return config.configuredBoxTierIds;
  }

  const { data, error } = await simUser.client
    .from('box_tiers')
    .select('id')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to load box tiers: ${error.message}`);
  }

  const boxTierIds = (data ?? [])
    .map((row) => (typeof row.id === 'string' ? row.id.toLowerCase() : null))
    .filter(Boolean);

  if (boxTierIds.length === 0) {
    throw new Error('No box tiers are available for the simulator.');
  }

  return boxTierIds;
}

async function syncBalance(simUser, config) {
  const { error } = await simUser.client.rpc('sync_wallet_flux_balance', {
    p_wallet_address: simUser.walletAddress,
    p_whitelist_bonus_amount: config.whitelistBonusFlux,
    p_client_timestamp: toIsoNow(),
    p_user_agent: config.userAgent,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function claimFaucet(simUser, config) {
  const now = Date.now();
  if (now < simUser.nextClaimAt) {
    return;
  }

  const nonce = createUuid();
  const issuedAt = toIsoNow();
  const signedMessage = buildFluxClaimMessage(
    simUser.walletAddress,
    config.dailyClaimFlux,
    config.faucetIntervalSeconds,
    config.chainId,
    nonce,
    issuedAt,
  );
  const signature = normalizeSignature(await simUser.wallet.signMessage(signedMessage));
  if (!signature) {
    throw new Error(`Failed to sign faucet claim for ${simUser.walletAddress}.`);
  }

  const { error } = await simUser.client.rpc('record_flux_faucet_claim', {
    p_wallet_address: simUser.walletAddress,
    p_claim_amount: config.dailyClaimFlux,
    p_claim_window_seconds: config.faucetIntervalSeconds,
    p_settlement_kind: 'offchain_message',
    p_settlement_status: 'confirmed',
    p_signed_message: signedMessage,
    p_signature: signature,
    p_message_nonce: nonce,
    p_chain_id: config.chainId,
    p_whitelist_bonus_amount: config.whitelistBonusFlux,
    p_client_timestamp: issuedAt,
    p_user_agent: config.userAgent,
    p_idempotency_key: createDailyFaucetKey(simUser.walletAddress),
  });

  if (error) {
    throw new Error(error.message);
  }

  simUser.nextClaimAt = now + (config.faucetIntervalSeconds * 1000);
  log('faucet_claimed', { wallet: simUser.walletAddress });
}

async function getInventory(simUser) {
  const { data, error } = await simUser.client.rpc('get_user_inventory', {
    p_wallet_address: simUser.walletAddress,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Array.isArray(data) ? data : [];
}

async function getActiveAuction(simUser) {
  const { data, error } = await simUser.client.rpc('get_active_auction');

  if (error) {
    throw new Error(error.message);
  }

  return data && typeof data === 'object' ? data : null;
}

async function openBoxes(simUser, config, boxTierIds) {
  if (!Array.isArray(boxTierIds) || boxTierIds.length === 0) {
    return;
  }

  const attempts = Math.max(0, config.maxBoxOpensPerCycle);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (Math.random() > 0.45) {
      continue;
    }

    const boxTierId = pickRandom(boxTierIds) ?? boxTierIds[0];
    const { error } = await simUser.client.rpc('open_mystery_box', {
      p_wallet_address: simUser.walletAddress,
      p_box_tier_id: boxTierId,
      p_whitelist_bonus_amount: config.whitelistBonusFlux,
      p_client_timestamp: toIsoNow(),
      p_user_agent: config.userAgent,
      p_idempotency_key: `box_open:${simUser.walletAddress}:${createUuid()}`,
    });

    if (error) {
      const message = error.message ?? '';
      if (message.includes('insufficient flux balance')) {
        return;
      }
      throw new Error(message);
    }

    log('box_opened', { wallet: simUser.walletAddress, boxTierId });
  }
}

function selectAuctionPart(inventory) {
  return inventory
    .filter((part) => (
      part
      && typeof part.id === 'string'
      && !part.is_locked
      && !part.is_equipped
      && Number(part.rarity_tier_id) >= 3
    ))
    .sort((left, right) => {
      const rarityGap = Number(right.rarity_tier_id) - Number(left.rarity_tier_id);
      if (rarityGap !== 0) {
        return rarityGap;
      }
      return Number(right.part_value) - Number(left.part_value);
    })[0] ?? null;
}

async function maybeSubmitAuctionPart(simUser, config, activeAuction) {
  if (!activeAuction || activeAuction.status !== 'accepting_submissions') {
    return;
  }

  const roundId = Number(activeAuction.round_id);
  if (!Number.isFinite(roundId) || simUser.lastSubmittedRoundId === roundId) {
    return;
  }

  if (Math.random() > 0.65) {
    return;
  }

  const inventory = await getInventory(simUser);
  const chosenPart = selectAuctionPart(inventory);
  if (!chosenPart) {
    return;
  }

  const { error } = await simUser.client.rpc('submit_auction_item', {
    p_wallet_address: simUser.walletAddress,
    p_part_id: chosenPart.id,
    p_client_timestamp: toIsoNow(),
    p_user_agent: config.userAgent,
  });

  if (error) {
    const message = error.message ?? '';
    if (
      message.includes('already submitted a part for this auction round')
      || message.includes('no active auction round accepting submissions')
    ) {
      simUser.lastSubmittedRoundId = roundId;
      return;
    }
    throw new Error(message);
  }

  simUser.lastSubmittedRoundId = roundId;
  log('auction_submitted', {
    wallet: simUser.walletAddress,
    roundId,
    partId: chosenPart.id,
  });
}

function getHighestBidWallet(activeAuction) {
  if (!activeAuction || !Array.isArray(activeAuction.bids) || activeAuction.bids.length === 0) {
    return null;
  }

  const sorted = [...activeAuction.bids].sort((left, right) => Number(right.amount) - Number(left.amount));
  const walletAddress = sorted[0]?.wallet;
  return normalizeWalletAddress(walletAddress);
}

async function maybePlaceBid(simUser, config, activeAuction) {
  if (!activeAuction || activeAuction.status !== 'bidding') {
    return;
  }

  if (activeAuction.part && normalizeWalletAddress(activeAuction.part.submitted_by) === simUser.walletAddress) {
    return;
  }

  if (Math.random() > 0.6) {
    return;
  }

  if (getHighestBidWallet(activeAuction) === simUser.walletAddress && Math.random() > 0.2) {
    return;
  }

  const roundId = Number(activeAuction.round_id);
  if (!Number.isFinite(roundId)) {
    return;
  }

  const currentHighestBid = Number(activeAuction.current_highest_bid ?? 0);
  const minBid = computeMinNextBid(currentHighestBid);
  const markup = currentHighestBid > 0 ? Math.random() * 0.1 : 0;
  const amount = Math.round((minBid * (1 + markup)) * 100) / 100;

  const { error } = await simUser.client.rpc('place_auction_bid', {
    p_wallet_address: simUser.walletAddress,
    p_round_id: roundId,
    p_amount: amount,
    p_whitelist_bonus_amount: config.whitelistBonusFlux,
    p_client_timestamp: toIsoNow(),
    p_user_agent: config.userAgent,
    p_idempotency_key: `bid:${simUser.walletAddress}:${roundId}:${amount}`,
  });

  if (error) {
    const message = error.message ?? '';
    if (
      message.includes('insufficient flux balance')
      || message.includes('cannot bid on your own submitted item')
      || message.includes('auction round is not currently accepting bids')
      || message.includes('bid must be at least')
      || message.includes('new bid must exceed your previous bid')
    ) {
      return;
    }
    throw new Error(message);
  }

  log('auction_bid', {
    wallet: simUser.walletAddress,
    roundId,
    amount,
  });
}

function isAuthError(error) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('JWT')
    || message.includes('auth')
    || message.includes('session')
    || message.includes('Refresh Token')
  );
}

async function runCycle(simUser, config, boxTierIds) {
  await syncBalance(simUser, config);
  await claimFaucet(simUser, config);
  await openBoxes(simUser, config, boxTierIds);

  const activeAuction = await getActiveAuction(simUser);
  await maybeSubmitAuctionPart(simUser, config, activeAuction);
  await maybePlaceBid(simUser, config, activeAuction);
}

async function runUserLoop(simUser, config, boxTierIds, index) {
  if (config.initialSpreadMs > 0) {
    const delayMs = Math.min(
      config.initialSpreadMs,
      Math.floor((index / Math.max(1, config.privateKeys.length - 1)) * config.initialSpreadMs) + randomDelay(1000),
    );
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  while (true) {
    try {
      await runCycle(simUser, config, boxTierIds);
      log('cycle_complete', { wallet: simUser.walletAddress });
    } catch (error) {
      log('cycle_error', {
        wallet: simUser.walletAddress,
        message: error instanceof Error ? error.message : String(error),
      });

      if (isAuthError(error)) {
        try {
          await authenticateSimUserSession(simUser, config);
          log('reauthenticated', { wallet: simUser.walletAddress });
        } catch (reauthError) {
          log('reauth_failed', {
            wallet: simUser.walletAddress,
            message: reauthError instanceof Error ? reauthError.message : String(reauthError),
          });
        }
      }
    }

    if (config.runOnce) {
      return;
    }

    const nextDelay = config.loopIntervalMs + randomDelay(Math.floor(config.loopIntervalMs * 0.25));
    await sleep(nextDelay);
  }
}

async function main() {
  const config = createConfig();

  log('simulator_starting', {
    walletCount: config.privateKeys.length,
    runOnce: config.runOnce,
    loopIntervalMs: config.loopIntervalMs,
    whitelistBonusFlux: config.whitelistBonusFlux,
    dailyClaimFlux: config.dailyClaimFlux,
    faucetIntervalSeconds: config.faucetIntervalSeconds,
  });

  const users = [];
  for (let index = 0; index < config.privateKeys.length; index += 1) {
    const simUser = await createSimUser(config, config.privateKeys[index], index);
    users.push(simUser);
    log('wallet_authenticated', { wallet: simUser.walletAddress });
  }

  let boxTierIds = [];
  try {
    boxTierIds = await resolveBoxTierIds(users[0], config);
    log('box_tiers_loaded', { boxTierIds });
  } catch (error) {
    log('box_tiers_unavailable', {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  await Promise.all(users.map((simUser, index) => runUserLoop(simUser, config, boxTierIds, index)));
}

main().catch((error) => {
  log('simulator_fatal', {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
