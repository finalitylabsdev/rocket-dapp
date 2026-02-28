import crypto from 'node:crypto';

const SIWE_STATEMENT = 'Sign in to Entropy Network.';
const DEFAULT_LOOP_INTERVAL_MS = 45_000;
const DEFAULT_INITIAL_SPREAD_MS = 15_000;
const DEFAULT_MAX_BOX_OPENS_PER_CYCLE = 1;
const DEFAULT_MANAGED_WALLET_GENERATION_MIN_INTERVAL_MS = 120_000;
const DEFAULT_MANAGED_WALLET_GENERATION_MAX_INTERVAL_MS = 420_000;
const DEFAULT_WHITELIST_ETH = '0.001';
const DEFAULT_SIM_ETH_LOCK_AMOUNT_WEI = '1000000000000000';
const DEFAULT_SIM_ETH_LOCK_TO_ADDRESS = '0x1111111111111111111111111111111111111111';
const DEFAULT_MANAGED_WALLET_KID = 'sim-local-v1';
const DRY_RUN_BIDDING_DELAY_MS = 90_000;
const DRY_RUN_ROUND_LENGTH_MS = 5 * 60_000;
const KECCAK_RATE_BYTES = 136;
const MASK_64 = (1n << 64n) - 1n;
const CURVE_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
const CURVE_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const CURVE_G = {
  x: 55066263022277343669578718895168534326250603453777594175500187360389116729240n,
  y: 32670510020758816978083085130507043184471273380659243275938904335757337482424n,
};
const KECCAK_ROUND_CONSTANTS = [
  0x0000000000000001n,
  0x0000000000008082n,
  0x800000000000808an,
  0x8000000080008000n,
  0x000000000000808bn,
  0x0000000080000001n,
  0x8000000080008081n,
  0x8000000000008009n,
  0x000000000000008an,
  0x0000000000000088n,
  0x0000000080008009n,
  0x000000008000000an,
  0x000000008000808bn,
  0x800000000000008bn,
  0x8000000000008089n,
  0x8000000000008003n,
  0x8000000000008002n,
  0x8000000000000080n,
  0x000000000000800an,
  0x800000008000000an,
  0x8000000080008081n,
  0x8000000000008080n,
  0x0000000080000001n,
  0x8000000080008008n,
];
const KECCAK_ROTATION_OFFSETS = [
  0, 1, 62, 28, 27,
  36, 44, 6, 55, 20,
  3, 10, 43, 25, 39,
  41, 45, 15, 21, 8,
  18, 2, 61, 56, 14,
];
const DRY_RUN_BOX_PRICE_BY_TIER = Object.freeze({
  common: 10,
  uncommon: 25,
  rare: 50,
  epic: 100,
  legendary: 200,
  mythic: 350,
  celestial: 500,
  quantum: 750,
});
const DEFAULT_DRY_RUN_BOX_TIER_IDS = Object.freeze([
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
  'celestial',
  'quantum',
]);
const DRY_RUN_MIN_RARITY_BY_BOX_TIER = Object.freeze({
  common: 1,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
  celestial: 6,
  quantum: 7,
});

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

function parseWalletSource(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'supabase' ? 'supabase' : 'env';
}

function normalizePostgrestText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function parseEncryptionKey(value) {
  const normalized = normalizePostgrestText(value);
  if (!normalized) {
    return null;
  }

  const stripped = normalized.startsWith('0x') ? normalized.slice(2) : normalized;
  if (/^[0-9a-fA-F]{64}$/.test(stripped)) {
    return Buffer.from(stripped, 'hex');
  }

  try {
    const decoded = Buffer.from(normalized, 'base64');
    if (decoded.length === 32) {
      return decoded;
    }
  } catch {
    return null;
  }

  return null;
}

function randomBetween(min, max) {
  const floorMin = Math.max(0, Math.floor(min));
  const floorMax = Math.max(floorMin, Math.floor(max));
  if (floorMax <= floorMin) {
    return floorMin;
  }

  return floorMin + Math.floor(Math.random() * (floorMax - floorMin + 1));
}

function parseEthToWei(value) {
  const raw = normalizePostgrestText(value);
  if (!raw || !/^\d+(?:\.\d{1,18})?$/.test(raw)) {
    return null;
  }

  const [whole = '0', fractional = ''] = raw.split('.');
  const paddedFractional = `${fractional}000000000000000000`.slice(0, 18);

  return (
    (BigInt(whole) * 1000000000000000000n)
    + BigInt(paddedFractional || '0')
  ).toString();
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
  return /^0x[0-9a-fA-F]+$/.test(trimmed) ? trimmed.toLowerCase() : null;
}

function normalizePrivateKey(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(trimmed)) {
    return null;
  }

  const numericValue = BigInt(trimmed);
  if (numericValue <= 0n || numericValue >= CURVE_N) {
    return null;
  }

  return trimmed;
}

function extractPayloadError(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  for (const key of ['message', 'msg', 'error_description', 'error', 'details', 'hint']) {
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
    typeof sessionSource.access_token === 'string'
    && typeof sessionSource.refresh_token === 'string'
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

function hexToBytes(value) {
  const normalized = value.startsWith('0x') ? value.slice(2) : value;
  return Uint8Array.from(Buffer.from(normalized, 'hex'));
}

function bytesToHex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

function utf8ToBytes(value) {
  return Uint8Array.from(Buffer.from(value, 'utf8'));
}

function concatBytes(...parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function bigintToBytes(value, length, littleEndian = false) {
  let remaining = value;
  const output = new Uint8Array(length);

  for (let index = 0; index < length; index += 1) {
    const byte = Number(remaining & 0xffn);
    const targetIndex = littleEndian ? index : (length - 1 - index);
    output[targetIndex] = byte;
    remaining >>= 8n;
  }

  return output;
}

function bytesToBigint(bytes, littleEndian = false) {
  let value = 0n;

  if (littleEndian) {
    for (let index = bytes.length - 1; index >= 0; index -= 1) {
      value = (value << 8n) | BigInt(bytes[index]);
    }
    return value;
  }

  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }

  return value;
}

function mod(value, modulus) {
  const result = value % modulus;
  return result >= 0n ? result : result + modulus;
}

function invMod(value, modulus) {
  if (value === 0n) {
    throw new Error('Cannot invert zero.');
  }

  let low = mod(value, modulus);
  let high = modulus;
  let lm = 1n;
  let hm = 0n;

  while (low > 1n) {
    const ratio = high / low;
    [hm, lm] = [lm, hm - (lm * ratio)];
    [high, low] = [low, high - (low * ratio)];
  }

  return mod(lm, modulus);
}

function pointAdd(left, right) {
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }

  if (left.x === right.x && mod(left.y + right.y, CURVE_P) === 0n) {
    return null;
  }

  let slope;
  if (left.x === right.x && left.y === right.y) {
    slope = mod(
      (3n * left.x * left.x) * invMod(mod(2n * left.y, CURVE_P), CURVE_P),
      CURVE_P,
    );
  } else {
    slope = mod(
      (right.y - left.y) * invMod(mod(right.x - left.x, CURVE_P), CURVE_P),
      CURVE_P,
    );
  }

  const x = mod((slope * slope) - left.x - right.x, CURVE_P);
  const y = mod((slope * (left.x - x)) - left.y, CURVE_P);
  return { x, y };
}

function scalarMultiply(scalar, point) {
  let remaining = scalar;
  let result = null;
  let addend = point;

  while (remaining > 0n) {
    if (remaining & 1n) {
      result = pointAdd(result, addend);
    }

    addend = pointAdd(addend, addend);
    remaining >>= 1n;
  }

  return result;
}

function rotateLeft64(value, shift) {
  if (shift === 0) {
    return value & MASK_64;
  }

  const amount = BigInt(shift);
  return (((value << amount) & MASK_64) | (value >> (64n - amount))) & MASK_64;
}

function keccakPermutation(state) {
  for (const roundConstant of KECCAK_ROUND_CONSTANTS) {
    const columnParity = new Array(5).fill(0n);
    for (let x = 0; x < 5; x += 1) {
      columnParity[x] =
        state[x]
        ^ state[x + 5]
        ^ state[x + 10]
        ^ state[x + 15]
        ^ state[x + 20];
    }

    const thetaMix = new Array(5).fill(0n);
    for (let x = 0; x < 5; x += 1) {
      thetaMix[x] = columnParity[(x + 4) % 5] ^ rotateLeft64(columnParity[(x + 1) % 5], 1);
    }

    for (let index = 0; index < 25; index += 1) {
      state[index] ^= thetaMix[index % 5];
    }

    const piState = new Array(25).fill(0n);
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        const sourceIndex = x + (5 * y);
        const targetIndex = y + (5 * (((2 * x) + (3 * y)) % 5));
        piState[targetIndex] = rotateLeft64(state[sourceIndex], KECCAK_ROTATION_OFFSETS[sourceIndex]);
      }
    }

    for (let y = 0; y < 5; y += 1) {
      const offset = y * 5;
      const row = piState.slice(offset, offset + 5);
      for (let x = 0; x < 5; x += 1) {
        state[offset + x] = row[x] ^ ((~row[(x + 1) % 5] & MASK_64) & row[(x + 2) % 5]);
      }
    }

    state[0] ^= roundConstant;
  }
}

function keccak256(bytes) {
  const state = new Array(25).fill(0n);
  let offset = 0;

  while (offset + KECCAK_RATE_BYTES <= bytes.length) {
    const block = bytes.slice(offset, offset + KECCAK_RATE_BYTES);
    for (let lane = 0; lane < KECCAK_RATE_BYTES / 8; lane += 1) {
      const laneBytes = block.slice(lane * 8, (lane + 1) * 8);
      state[lane] ^= bytesToBigint(laneBytes, true);
    }
    keccakPermutation(state);
    offset += KECCAK_RATE_BYTES;
  }

  const finalBlock = new Uint8Array(KECCAK_RATE_BYTES);
  finalBlock.set(bytes.slice(offset));
  finalBlock[bytes.length - offset] ^= 0x01;
  finalBlock[KECCAK_RATE_BYTES - 1] ^= 0x80;

  for (let lane = 0; lane < KECCAK_RATE_BYTES / 8; lane += 1) {
    const laneBytes = finalBlock.slice(lane * 8, (lane + 1) * 8);
    state[lane] ^= bytesToBigint(laneBytes, true);
  }
  keccakPermutation(state);

  const output = new Uint8Array(32);
  let outputOffset = 0;
  let laneIndex = 0;

  while (outputOffset < output.length) {
    const laneBytes = bigintToBytes(state[laneIndex], 8, true);
    const sliceLength = Math.min(8, output.length - outputOffset);
    output.set(laneBytes.slice(0, sliceLength), outputOffset);
    outputOffset += sliceLength;
    laneIndex += 1;
  }

  return output;
}

function privateKeyToAddress(privateKeyHex) {
  const normalizedKey = normalizePrivateKey(privateKeyHex);
  if (!normalizedKey) {
    return null;
  }

  const privateScalar = BigInt(normalizedKey);
  const publicPoint = scalarMultiply(privateScalar, CURVE_G);
  if (!publicPoint) {
    return null;
  }

  const publicKeyBytes = concatBytes(
    bigintToBytes(publicPoint.x, 32),
    bigintToBytes(publicPoint.y, 32),
  );

  const addressBytes = keccak256(publicKeyBytes).slice(-20);
  return `0x${bytesToHex(addressBytes)}`;
}

function signPersonalMessage(privateKeyHex, message) {
  const normalizedKey = normalizePrivateKey(privateKeyHex);
  if (!normalizedKey) {
    throw new Error('Invalid Ethereum private key.');
  }

  const messageBytes = utf8ToBytes(message);
  const prefix = utf8ToBytes(`\u0019Ethereum Signed Message:\n${messageBytes.length}`);
  const digest = keccak256(concatBytes(prefix, messageBytes));
  const privateScalar = BigInt(normalizedKey);

  while (true) {
    const nonce = mod(bytesToBigint(crypto.randomBytes(32)), CURVE_N - 1n) + 1n;
    const point = scalarMultiply(nonce, CURVE_G);
    if (!point) {
      continue;
    }

    const r = mod(point.x, CURVE_N);
    if (r === 0n) {
      continue;
    }

    let s = mod(
      invMod(nonce, CURVE_N) * (bytesToBigint(digest) + (r * privateScalar)),
      CURVE_N,
    );
    if (s === 0n) {
      continue;
    }

    let recovery = Number(point.y & 1n);
    if (s > (CURVE_N / 2n)) {
      s = CURVE_N - s;
      recovery ^= 1;
    }

    const v = 27 + recovery;
    return `0x${bytesToHex(concatBytes(
      bigintToBytes(r, 32),
      bigintToBytes(s, 32),
      Uint8Array.of(v),
    ))}`;
  }
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
        identityData.custom_claims?.address,
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

function extractAuthUserIdFromUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  return typeof user.id === 'string' && user.id.trim().length > 0
    ? user.id.trim()
    : null;
}

function createConfig() {
  const supabaseUrl = requiredEnv('VITE_SUPABASE_URL');
  const supabasePublishableKey = optionalEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY');
  if (!supabasePublishableKey) {
    throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY');
  }

  const walletSource = parseWalletSource(process.env.SIM_WALLET_SOURCE);
  const privateKeys = parseList(process.env.SIM_WALLET_PRIVATE_KEYS);
  const dryRun = parseBoolean(process.env.SIM_DRY_RUN, false);

  if (walletSource === 'env' && privateKeys.length === 0) {
    throw new Error('Missing SIM_WALLET_PRIVATE_KEYS. Provide a comma- or newline-separated list of Ethereum private keys.');
  }

  if (dryRun && walletSource !== 'env') {
    throw new Error('SIM_DRY_RUN=true only supports SIM_WALLET_SOURCE=env so the worker stays fully offline.');
  }

  const siweUriValue = optionalEnv('SIM_SIWE_URI', 'VITE_SIWE_URI') || 'https://o.finality.dev/';
  const siweUri = new URL(siweUriValue).toString();
  const siweDomain = optionalEnv('SIM_SIWE_DOMAIN', 'VITE_SIWE_DOMAIN') || new URL(siweUri).host;
  const serviceRoleKey = optionalEnv('SIM_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  const managedWalletEncryptionKey = parseEncryptionKey(process.env.SIM_MANAGED_WALLETS_ENCRYPTION_KEY);
  const whitelistEth = normalizePostgrestText(process.env.VITE_SPEC_WHITELIST_ETH) || DEFAULT_WHITELIST_ETH;
  const defaultEthLockAmountWei = parseEthToWei(whitelistEth) ?? DEFAULT_SIM_ETH_LOCK_AMOUNT_WEI;
  const managedWalletTargetCount = Math.max(0, parseInteger(process.env.SIM_MANAGED_WALLET_TARGET_COUNT, 0));
  const managedWalletGenerationMinIntervalMs = Math.max(
    0,
    parseInteger(
      process.env.SIM_MANAGED_WALLET_GENERATION_MIN_INTERVAL_MS,
      DEFAULT_MANAGED_WALLET_GENERATION_MIN_INTERVAL_MS,
    ),
  );
  const managedWalletGenerationMaxIntervalMs = Math.max(
    managedWalletGenerationMinIntervalMs,
    parseInteger(
      process.env.SIM_MANAGED_WALLET_GENERATION_MAX_INTERVAL_MS,
      DEFAULT_MANAGED_WALLET_GENERATION_MAX_INTERVAL_MS,
    ),
  );

  if (walletSource === 'supabase') {
    if (!serviceRoleKey) {
      throw new Error('SIM_WALLET_SOURCE=supabase requires SIM_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY.');
    }

    if (!managedWalletEncryptionKey) {
      throw new Error('SIM_WALLET_SOURCE=supabase requires SIM_MANAGED_WALLETS_ENCRYPTION_KEY (32-byte hex or base64).');
    }
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
    serviceRoleKey,
    walletSource,
    privateKeys,
    chainId: parseInteger(process.env.SIM_CHAIN_ID, 1),
    siweUri,
    siweDomain,
    dryRun,
    loopIntervalMs: parseInteger(process.env.SIM_LOOP_INTERVAL_MS, DEFAULT_LOOP_INTERVAL_MS),
    initialSpreadMs: parseInteger(process.env.SIM_INITIAL_SPREAD_MS, DEFAULT_INITIAL_SPREAD_MS),
    maxBoxOpensPerCycle: parseInteger(process.env.SIM_MAX_BOX_OPENS_PER_CYCLE, DEFAULT_MAX_BOX_OPENS_PER_CYCLE),
    maxBidAttemptsPerCycle: Math.max(1, parseInteger(process.env.SIM_MAX_BID_ATTEMPTS_PER_CYCLE, 3)),
    bidAttemptProbability: Math.min(1, Math.max(0, parseNumber(process.env.SIM_BID_ATTEMPT_PROBABILITY, 0.9))),
    bidMarkupMin: Math.max(0, parseNumber(process.env.SIM_BID_MARKUP_MIN, 0.05)),
    bidMarkupMax: Math.max(0, parseNumber(process.env.SIM_BID_MARKUP_MAX, 0.35)),
    runOnce: parseBoolean(process.env.SIM_RUN_ONCE, false),
    bootstrapOnly: parseBoolean(process.env.SIM_BOOTSTRAP_ONLY, false),
    whitelistBonusFlux: parseNumber(process.env.VITE_SPEC_WHITELIST_BONUS_FLUX, 0),
    dailyClaimFlux: parseNumber(process.env.VITE_SPEC_DAILY_CLAIM_FLUX, 1),
    faucetIntervalSeconds: parseInteger(process.env.VITE_SPEC_FAUCET_INTERVAL_SECONDS, 86400),
    userAgent: optionalEnv('SIM_USER_AGENT') || 'entropy-sim/1.0',
    configuredBoxTierIds: parseList(process.env.SIM_BOX_TIER_IDS).map((entry) => entry.toLowerCase()),
    importEnvWalletsToSupabase: parseBoolean(process.env.SIM_IMPORT_ENV_WALLETS_TO_SUPABASE, true),
    managedWalletTargetCount,
    managedWalletGenerationMinIntervalMs,
    managedWalletGenerationMaxIntervalMs,
    managedWalletKid: optionalEnv('SIM_MANAGED_WALLET_KID') || DEFAULT_MANAGED_WALLET_KID,
    managedWalletEncryptionKey,
    autoConfirmEthLock: parseBoolean(process.env.SIM_AUTO_CONFIRM_ETH_LOCK, true),
    ethLockToAddress: normalizeWalletAddress(optionalEnv('SIM_ETH_LOCK_TO_ADDRESS', 'VITE_ETH_LOCK_RECIPIENT'))
      ?? DEFAULT_SIM_ETH_LOCK_TO_ADDRESS,
    ethLockAmountWei: normalizePostgrestText(process.env.SIM_ETH_LOCK_AMOUNT_WEI) || defaultEthLockAmountWei,
  };
}

async function parseResponsePayload(response) {
  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    const reason =
      extractPayloadError(payload)
      ?? (typeof payload === 'string' && payload.trim() ? payload.trim() : null)
      ?? `HTTP ${response.status}`;
    throw new Error(reason);
  }

  return payload;
}

function createPublicHeaders(config) {
  return {
    apikey: config.supabasePublishableKey,
    'content-type': 'application/json',
  };
}

function createServiceHeaders(config, includeJsonContentType = true, prefer = '') {
  if (!config.serviceRoleKey) {
    throw new Error('Missing service-role key for managed simulator wallet operations.');
  }

  const headers = {
    apikey: config.serviceRoleKey,
    authorization: `Bearer ${config.serviceRoleKey}`,
  };

  if (includeJsonContentType) {
    headers['content-type'] = 'application/json';
  }

  if (prefer) {
    headers.Prefer = prefer;
  }

  return headers;
}

function createAuthHeaders(config, simUser, includeJsonContentType = true) {
  if (!simUser.accessToken) {
    throw new Error(`Missing access token for wallet ${simUser.walletAddress}.`);
  }

  const headers = {
    apikey: config.supabasePublishableKey,
    authorization: `Bearer ${simUser.accessToken}`,
  };

  if (includeJsonContentType) {
    headers['content-type'] = 'application/json';
  }

  return headers;
}

async function exchangeWeb3SignatureForSession(config, message, signature) {
  const payload = await requestJson(`${config.supabaseUrl}/auth/v1/token?grant_type=web3`, {
    method: 'POST',
    headers: createPublicHeaders(config),
    body: JSON.stringify({
      chain: 'ethereum',
      message,
      signature,
    }),
  });

  const tokens = extractSessionTokens(payload);
  if (!tokens) {
    throw new Error('Web3 sign-in succeeded but no session tokens were returned.');
  }

  return tokens;
}

async function fetchAuthenticatedUser(simUser, config) {
  const payload = await requestJson(`${config.supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: createAuthHeaders(config, simUser, false),
  });

  if (!payload || typeof payload !== 'object') {
    throw new Error(`Failed to read the authenticated user for ${simUser.walletAddress}.`);
  }

  return payload;
}

async function callRpc(simUser, config, functionName, parameters = {}) {
  return requestJson(`${config.supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: createAuthHeaders(config, simUser),
    body: JSON.stringify(parameters),
  });
}

async function selectRows(simUser, config, pathWithQuery) {
  const payload = await requestJson(`${config.supabaseUrl}/rest/v1/${pathWithQuery}`, {
    method: 'GET',
    headers: createAuthHeaders(config, simUser, false),
  });

  return Array.isArray(payload) ? payload : [];
}

async function selectRowsAsServiceRole(config, pathWithQuery) {
  const payload = await requestJson(`${config.supabaseUrl}/rest/v1/${pathWithQuery}`, {
    method: 'GET',
    headers: createServiceHeaders(config, false),
  });

  return Array.isArray(payload) ? payload : [];
}

async function upsertRowsAsServiceRole(config, tableName, rows, onConflict) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  const conflictQuery = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : '';

  await requestJson(`${config.supabaseUrl}/rest/v1/${tableName}${conflictQuery}`, {
    method: 'POST',
    headers: createServiceHeaders(config, true, 'resolution=merge-duplicates,return=minimal'),
    body: JSON.stringify(rows),
  });
}

async function patchRowsAsServiceRole(config, tableQuery, payload) {
  await requestJson(`${config.supabaseUrl}/rest/v1/${tableQuery}`, {
    method: 'PATCH',
    headers: createServiceHeaders(config, true, 'return=minimal'),
    body: JSON.stringify(payload),
  });
}

function generatePrivateKeyHex() {
  while (true) {
    const candidate = `0x${crypto.randomBytes(32).toString('hex')}`;
    const normalized = normalizePrivateKey(candidate);
    if (normalized) {
      return normalized;
    }
  }
}

function encryptPrivateKeyForStorage(privateKey, config) {
  if (!config.managedWalletEncryptionKey) {
    throw new Error('Missing managed wallet encryption key.');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', config.managedWalletEncryptionKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(privateKey, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    private_key_ciphertext: ciphertext.toString('base64'),
    private_key_iv: iv.toString('base64'),
    private_key_auth_tag: authTag.toString('base64'),
  };
}

function decryptPrivateKeyFromStorage(row, config) {
  if (!config.managedWalletEncryptionKey) {
    throw new Error('Missing managed wallet encryption key.');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    config.managedWalletEncryptionKey,
    Buffer.from(row.private_key_iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(row.private_key_auth_tag, 'base64'));

  const privateKey = Buffer.concat([
    decipher.update(Buffer.from(row.private_key_ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');

  const normalized = normalizePrivateKey(privateKey);
  if (!normalized) {
    throw new Error(`Managed wallet ${row.wallet_address} decrypted to an invalid private key.`);
  }

  return normalized;
}

function buildManagedWalletRow(privateKey, config, source = 'simulator_generated') {
  const normalizedKey = normalizePrivateKey(privateKey);
  if (!normalizedKey) {
    throw new Error('Managed wallet import attempted to store an invalid private key.');
  }

  const walletAddress = privateKeyToAddress(normalizedKey);
  if (!walletAddress) {
    throw new Error('Failed to derive a managed wallet address from the provided private key.');
  }

  return {
    wallet_address: walletAddress,
    ...encryptPrivateKeyForStorage(normalizedKey, config),
    private_key_kid: config.managedWalletKid,
    source,
    status: 'active',
    last_used_at: null,
  };
}

async function ensureManagedWalletProfile(config, walletAddress) {
  const shortAddress = `${walletAddress.slice(0, 6)}${walletAddress.slice(-4)}`;

  await upsertRowsAsServiceRole(config, 'sim_wallet_profiles', [{
    wallet_address: walletAddress,
    persona_name: `SIM-${shortAddress.toUpperCase()}`,
    aggression_score: 52,
    box_open_bias: 58,
    auction_bid_bias: 61,
    launch_bias: 44,
    active: true,
  }], 'wallet_address');
}

async function importEnvWalletsIntoManagedPool(config) {
  if (!config.importEnvWalletsToSupabase || config.privateKeys.length === 0) {
    return 0;
  }

  const rows = config.privateKeys.map((privateKey) => buildManagedWalletRow(privateKey, config, 'env_import'));
  await upsertRowsAsServiceRole(config, 'sim_wallet_keys', rows, 'wallet_address');
  await Promise.all(rows.map((row) => ensureManagedWalletProfile(config, row.wallet_address)));
  return rows.length;
}

async function createManagedWallet(config, source = 'simulator_generated') {
  const row = buildManagedWalletRow(generatePrivateKeyHex(), config, source);
  await upsertRowsAsServiceRole(config, 'sim_wallet_keys', [row], 'wallet_address');
  await ensureManagedWalletProfile(config, row.wallet_address);
  log('managed_wallet_generated', {
    wallet: row.wallet_address,
    source,
    keyKid: row.private_key_kid,
  });
  return row;
}

async function loadManagedWalletRows(config) {
  const rows = await selectRowsAsServiceRole(
    config,
    'sim_wallet_keys?select=wallet_address,private_key_ciphertext,private_key_iv,private_key_auth_tag,private_key_kid,status,created_at&status=eq.active&order=created_at.asc',
  );

  return rows
    .filter((row) => (
      typeof row.wallet_address === 'string'
      && typeof row.private_key_ciphertext === 'string'
      && typeof row.private_key_iv === 'string'
      && typeof row.private_key_auth_tag === 'string'
    ))
    .map((row) => ({
      wallet_address: normalizeWalletAddress(row.wallet_address),
      private_key_ciphertext: row.private_key_ciphertext,
      private_key_iv: row.private_key_iv,
      private_key_auth_tag: row.private_key_auth_tag,
      private_key_kid: typeof row.private_key_kid === 'string' ? row.private_key_kid : config.managedWalletKid,
      status: typeof row.status === 'string' ? row.status : 'active',
      created_at: typeof row.created_at === 'string' ? row.created_at : null,
    }))
    .filter((row) => row.wallet_address !== null);
}

async function touchManagedWalletUsage(config, walletAddress) {
  await patchRowsAsServiceRole(
    config,
    `sim_wallet_keys?wallet_address=eq.${walletAddress}`,
    { last_used_at: toIsoNow() },
  );
}

async function ensureWalletRegistryRow(config, walletAddress) {
  await upsertRowsAsServiceRole(config, 'wallet_registry', [{
    wallet_address: walletAddress,
    first_seen_at: toIsoNow(),
    last_seen_at: toIsoNow(),
  }], 'wallet_address');
}

function createSyntheticTxHash(walletAddress) {
  return `0x${crypto
    .createHash('sha256')
    .update(`synthetic-eth-lock:${walletAddress}:${Date.now()}:${getRandomHex(8)}`)
    .digest('hex')}`;
}

async function ensureSyntheticEthLock(config, simUser) {
  if (!config.autoConfirmEthLock) {
    return;
  }

  if (!simUser.authUserId) {
    throw new Error(`Cannot create a synthetic ETH lock without an auth user id for ${simUser.walletAddress}.`);
  }

  await ensureWalletRegistryRow(config, simUser.walletAddress);

  const timestamp = toIsoNow();

  await upsertRowsAsServiceRole(config, 'eth_lock_submissions', [{
    wallet_address: simUser.walletAddress,
    auth_user_id: simUser.authUserId,
    tx_hash: createSyntheticTxHash(simUser.walletAddress),
    chain_id: config.chainId,
    block_number: 0,
    from_address: simUser.walletAddress,
    to_address: config.ethLockToAddress,
    amount_wei: config.ethLockAmountWei,
    receipt: {
      simulated: true,
      source: 'rocket-sim',
      kind: 'pseudo_commit',
    },
    status: 'confirmed',
    is_lock_active: true,
    last_error: null,
    tx_submitted_at: timestamp,
    verifying_started_at: timestamp,
    confirmed_at: timestamp,
    verification_attempts: 1,
    client_timestamp: timestamp,
    user_agent: `${config.userAgent} managed-wallet-bootstrap`,
  }], 'wallet_address');

  log('synthetic_eth_lock_seeded', {
    wallet: simUser.walletAddress,
    to: config.ethLockToAddress,
  });
}

async function createSimUser(config, privateKey, index) {
  const normalizedKey = normalizePrivateKey(privateKey);
  if (!normalizedKey) {
    throw new Error(`SIM_WALLET_PRIVATE_KEYS[${index}] is not a valid Ethereum private key.`);
  }

  const walletAddress = privateKeyToAddress(normalizedKey);
  if (!walletAddress) {
    throw new Error(`Failed to derive an Ethereum address for SIM_WALLET_PRIVATE_KEYS[${index}].`);
  }

  const simUser = {
    privateKey: normalizedKey,
    walletAddress,
    accessToken: '',
    refreshToken: '',
    authUserId: null,
    nextClaimAt: 0,
    lastSubmittedRoundId: null,
  };

  await authenticateSimUserSession(simUser, config);
  return simUser;
}

async function createSimUserFromManagedWallet(config, managedWalletRow) {
  const privateKey = decryptPrivateKeyFromStorage(managedWalletRow, config);
  const simUser = {
    privateKey,
    walletAddress: managedWalletRow.wallet_address,
    accessToken: '',
    refreshToken: '',
    authUserId: null,
    nextClaimAt: 0,
    lastSubmittedRoundId: null,
  };

  await authenticateSimUserSession(simUser, config);
  await ensureSyntheticEthLock(config, simUser);
  await touchManagedWalletUsage(config, simUser.walletAddress);
  return simUser;
}

function createDryRunUser(config, privateKey, index) {
  const normalizedKey = normalizePrivateKey(privateKey);
  if (!normalizedKey) {
    throw new Error(`SIM_WALLET_PRIVATE_KEYS[${index}] is not a valid Ethereum private key.`);
  }

  const walletAddress = privateKeyToAddress(normalizedKey);
  if (!walletAddress) {
    throw new Error(`Failed to derive an Ethereum address for SIM_WALLET_PRIVATE_KEYS[${index}].`);
  }

  return {
    privateKey: normalizedKey,
    walletAddress,
    accessToken: '',
    refreshToken: '',
    authUserId: null,
    nextClaimAt: 0,
    lastSubmittedRoundId: null,
    dryRunBalance: Math.max(0, config.whitelistBonusFlux),
    dryRunInventory: [],
  };
}

function resolveDryRunBoxTierIds(config) {
  if (config.configuredBoxTierIds.length > 0) {
    return config.configuredBoxTierIds;
  }

  return [...DEFAULT_DRY_RUN_BOX_TIER_IDS];
}

function createDryRunState() {
  const startedAt = Date.now();
  return {
    roundId: 1,
    roundStartedAt: startedAt,
    biddingDelayMs: DRY_RUN_BIDDING_DELAY_MS,
    roundLengthMs: DRY_RUN_ROUND_LENGTH_MS,
    submissions: [],
    bidAmounts: new Map(),
    usersByWallet: new Map(),
    highestBidWallet: null,
    currentHighestBid: 0,
    selectedByWallet: null,
    lastStatus: 'accepting_submissions',
  };
}

function refundDryRunEscrow(sharedState) {
  for (const [walletAddress, amount] of sharedState.bidAmounts.entries()) {
    const user = sharedState.usersByWallet.get(walletAddress);
    if (user) {
      user.dryRunBalance += amount;
    }
  }
}

function resetDryRunUsers(sharedState) {
  for (const user of sharedState.usersByWallet.values()) {
    user.lastSubmittedRoundId = null;
    for (const part of user.dryRunInventory) {
      part.is_locked = false;
    }
  }
}

function advanceDryRunAuctionState(sharedState) {
  const now = Date.now();

  while (now >= (sharedState.roundStartedAt + sharedState.roundLengthMs)) {
    refundDryRunEscrow(sharedState);
    resetDryRunUsers(sharedState);
    sharedState.bidAmounts = new Map();
    sharedState.submissions = [];
    sharedState.highestBidWallet = null;
    sharedState.currentHighestBid = 0;
    sharedState.selectedByWallet = null;
    sharedState.roundId += 1;
    sharedState.roundStartedAt += sharedState.roundLengthMs;
    sharedState.lastStatus = 'accepting_submissions';
    log('dry_run_round_started', { roundId: sharedState.roundId });
  }

  const elapsedMs = now - sharedState.roundStartedAt;
  const status = elapsedMs >= sharedState.biddingDelayMs ? 'bidding' : 'accepting_submissions';

  if (status === 'bidding' && !sharedState.selectedByWallet && sharedState.submissions.length > 0) {
    sharedState.selectedByWallet = sharedState.submissions[0];
  }

  if (status !== sharedState.lastStatus) {
    sharedState.lastStatus = status;
    log('dry_run_phase_changed', {
      roundId: sharedState.roundId,
      status,
      selectedByWallet: sharedState.selectedByWallet,
    });
  }

  const bids = sharedState.highestBidWallet
    ? [{ wallet: sharedState.highestBidWallet, amount: sharedState.currentHighestBid }]
    : [];

  return {
    round_id: sharedState.roundId,
    status,
    current_highest_bid: sharedState.currentHighestBid,
    bids,
    part: sharedState.selectedByWallet
      ? { submitted_by: sharedState.selectedByWallet }
      : null,
  };
}

function createDryRunPart(boxTierId) {
  const minimumRarity = DRY_RUN_MIN_RARITY_BY_BOX_TIER[boxTierId] ?? 1;
  const rarityTierId = Math.min(8, minimumRarity + Math.floor(Math.random() * 3));
  const partValue = Math.round(((40 + (Math.random() * 60)) * rarityTierId) * 100) / 100;

  return {
    id: createUuid(),
    rarity_tier_id: rarityTierId,
    part_value: partValue,
    is_locked: false,
    is_equipped: false,
  };
}

async function runDryRunCycle(simUser, config, boxTierIds, sharedState) {
  const activeAuction = advanceDryRunAuctionState(sharedState);
  const now = Date.now();

  if (now >= simUser.nextClaimAt) {
    simUser.dryRunBalance += config.dailyClaimFlux;
    simUser.nextClaimAt = now + (config.faucetIntervalSeconds * 1000);
    log('faucet_claimed', {
      wallet: simUser.walletAddress,
      mode: 'dry_run',
      balance: Number(simUser.dryRunBalance.toFixed(2)),
    });
  }

  const attempts = Math.max(0, config.maxBoxOpensPerCycle);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (Math.random() > 0.45) {
      continue;
    }

    const boxTierId = pickRandom(boxTierIds) ?? boxTierIds[0];
    const price = DRY_RUN_BOX_PRICE_BY_TIER[boxTierId] ?? 50;
    if (simUser.dryRunBalance < price) {
      break;
    }

    simUser.dryRunBalance -= price;
    simUser.dryRunInventory.push(createDryRunPart(boxTierId));
    log('box_opened', {
      wallet: simUser.walletAddress,
      boxTierId,
      mode: 'dry_run',
      balance: Number(simUser.dryRunBalance.toFixed(2)),
    });
  }

  if (activeAuction.status === 'accepting_submissions') {
    const chosenPart = selectAuctionPart(simUser.dryRunInventory);
    if (
      chosenPart
      && simUser.lastSubmittedRoundId !== activeAuction.round_id
      && Math.random() <= 0.65
    ) {
      chosenPart.is_locked = true;
      simUser.lastSubmittedRoundId = activeAuction.round_id;
      if (!sharedState.submissions.includes(simUser.walletAddress)) {
        sharedState.submissions.push(simUser.walletAddress);
      }
      log('auction_submitted', {
        wallet: simUser.walletAddress,
        roundId: activeAuction.round_id,
        partId: chosenPart.id,
        mode: 'dry_run',
      });
    }
  }

  if (activeAuction.status === 'bidding') {
    if (
      (!sharedState.selectedByWallet || sharedState.selectedByWallet !== simUser.walletAddress)
      && Math.random() <= 0.6
    ) {
      const previousBid = sharedState.bidAmounts.get(simUser.walletAddress) ?? 0;
      const minBid = computeMinNextBid(sharedState.currentHighestBid);
      const markup = sharedState.currentHighestBid > 0 ? Math.random() * 0.1 : 0;
      const amount = Math.round((minBid * (1 + markup)) * 100) / 100;
      const effectiveDeduction = Math.max(0, amount - previousBid);

      if (effectiveDeduction > 0 && simUser.dryRunBalance >= effectiveDeduction) {
        simUser.dryRunBalance -= effectiveDeduction;
        sharedState.bidAmounts.set(simUser.walletAddress, amount);
        sharedState.currentHighestBid = amount;
        sharedState.highestBidWallet = simUser.walletAddress;
        log('auction_bid', {
          wallet: simUser.walletAddress,
          roundId: activeAuction.round_id,
          amount,
          mode: 'dry_run',
          balance: Number(simUser.dryRunBalance.toFixed(2)),
        });
      }
    }
  }
}

async function authenticateSimUserSession(simUser, config) {
  const message = buildSiweMessage(
    simUser.walletAddress,
    config.chainId,
    config.siweUri,
    config.siweDomain,
  );

  const signature = normalizeSignature(signPersonalMessage(simUser.privateKey, message));
  if (!signature) {
    throw new Error(`Failed to sign the SIWE message for wallet ${simUser.walletAddress}.`);
  }

  const tokens = await exchangeWeb3SignatureForSession(config, message, signature);
  simUser.accessToken = tokens.accessToken;
  simUser.refreshToken = tokens.refreshToken;

  const user = await fetchAuthenticatedUser(simUser, config);
  const sessionWallet = extractWalletAddressFromUser(user);
  if (sessionWallet && sessionWallet !== simUser.walletAddress) {
    throw new Error(`Authenticated wallet mismatch for ${simUser.walletAddress}.`);
  }

  simUser.authUserId = extractAuthUserIdFromUser(user);
}

async function resolveBoxTierIds(simUser, config) {
  if (config.configuredBoxTierIds.length > 0) {
    return config.configuredBoxTierIds;
  }

  const rows = await selectRows(simUser, config, 'box_tiers?select=id&order=sort_order.asc');
  const boxTierIds = rows
    .map((row) => (typeof row.id === 'string' ? row.id.toLowerCase() : null))
    .filter(Boolean);

  if (boxTierIds.length === 0) {
    throw new Error('No box tiers are available for the simulator.');
  }

  return boxTierIds;
}

async function syncBalance(simUser, config) {
  await callRpc(simUser, config, 'sync_wallet_flux_balance', {
    p_wallet_address: simUser.walletAddress,
    p_whitelist_bonus_amount: config.whitelistBonusFlux,
    p_client_timestamp: toIsoNow(),
    p_user_agent: config.userAgent,
  });
}

async function claimFaucet(simUser, config) {
  const now = Date.now();
  if (now < simUser.nextClaimAt) {
    return;
  }

  const nonce = createUuid();
  const issuedAt = toIsoNow();
  const idempotencyKey = `sim-faucet:${simUser.walletAddress}:${nonce}`;
  const signedMessage = buildFluxClaimMessage(
    simUser.walletAddress,
    config.dailyClaimFlux,
    config.faucetIntervalSeconds,
    config.chainId,
    nonce,
    issuedAt,
  );
  const signature = normalizeSignature(signPersonalMessage(simUser.privateKey, signedMessage));
  if (!signature) {
    throw new Error(`Failed to sign faucet claim for ${simUser.walletAddress}.`);
  }

  await callRpc(simUser, config, 'record_flux_faucet_claim', {
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
    p_idempotency_key: idempotencyKey,
  });

  simUser.nextClaimAt = now + (config.faucetIntervalSeconds * 1000);
  log('faucet_claimed', { wallet: simUser.walletAddress });
}

async function getInventory(simUser, config) {
  const payload = await callRpc(simUser, config, 'get_user_inventory', {
    p_wallet_address: simUser.walletAddress,
  });

  return Array.isArray(payload) ? payload : [];
}

async function getActiveAuction(simUser, config) {
  const payload = await callRpc(simUser, config, 'get_active_auction');
  return payload && typeof payload === 'object' ? payload : null;
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
    const idempotencyKey = `sim-box:${simUser.walletAddress}:${boxTierId}:${createUuid()}`;

    try {
      await callRpc(simUser, config, 'open_mystery_box', {
        p_wallet_address: simUser.walletAddress,
        p_box_tier_id: boxTierId,
        p_whitelist_bonus_amount: config.whitelistBonusFlux,
        p_client_timestamp: toIsoNow(),
        p_user_agent: config.userAgent,
        p_idempotency_key: idempotencyKey,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('insufficient flux balance')) {
        return;
      }
      throw error;
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

  const inventory = await getInventory(simUser, config);
  const chosenPart = selectAuctionPart(inventory);
  if (!chosenPart) {
    return;
  }

  try {
    await callRpc(simUser, config, 'submit_auction_item', {
      p_wallet_address: simUser.walletAddress,
      p_part_id: chosenPart.id,
      p_client_timestamp: toIsoNow(),
      p_user_agent: config.userAgent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('already submitted a part for this auction round')
      || message.includes('no active auction round accepting submissions')
    ) {
      simUser.lastSubmittedRoundId = roundId;
      return;
    }
    throw error;
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

  const roundId = Number(activeAuction.round_id);
  if (!Number.isFinite(roundId)) {
    return;
  }

  const bidAttempts = Math.max(1, config.maxBidAttemptsPerCycle);

  for (let attempt = 0; attempt < bidAttempts; attempt += 1) {
    if (Math.random() > config.bidAttemptProbability) {
      continue;
    }

    if (getHighestBidWallet(activeAuction) === simUser.walletAddress) {
      break;
    }

    const currentHighestBid = Number(activeAuction.current_highest_bid ?? 0);
    const minBid = computeMinNextBid(currentHighestBid);
    const effectiveMarkupMax = Math.max(config.bidMarkupMin, config.bidMarkupMax);
    const markupRange = Math.max(0, effectiveMarkupMax - config.bidMarkupMin);
    const markup = currentHighestBid > 0
      ? config.bidMarkupMin + (Math.random() * markupRange)
      : config.bidMarkupMin;
    const amount = Math.round((minBid * (1 + markup)) * 100) / 100;
    const idempotencyKey = `sim-bid:${simUser.walletAddress}:${roundId}:${attempt}:${amount.toFixed(2)}`;

    try {
      await callRpc(simUser, config, 'place_auction_bid', {
        p_wallet_address: simUser.walletAddress,
        p_round_id: roundId,
        p_amount: amount,
        p_whitelist_bonus_amount: config.whitelistBonusFlux,
        p_client_timestamp: toIsoNow(),
        p_user_agent: config.userAgent,
        p_idempotency_key: idempotencyKey,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('insufficient flux balance')
        || message.includes('cannot bid on your own submitted item')
        || message.includes('auction round is not currently accepting bids')
        || message.includes('bid must be at least')
        || message.includes('new bid must exceed your previous bid')
      ) {
        break;
      }
      throw error;
    }

    activeAuction.current_highest_bid = amount;
    if (!Array.isArray(activeAuction.bids)) {
      activeAuction.bids = [];
    }
    activeAuction.bids.push({
      wallet: simUser.walletAddress,
      amount,
    });

    log('auction_bid', {
      wallet: simUser.walletAddress,
      roundId,
      amount,
      attempt: attempt + 1,
    });
  }
}

function isAuthError(error) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('JWT')
    || message.includes('auth')
    || message.includes('session')
    || message.includes('Refresh Token')
    || message.includes('authenticated session required')
    || message.includes('Invalid JWT')
  );
}

async function runCycle(simUser, config, boxTierIds) {
  await syncBalance(simUser, config);
  await claimFaucet(simUser, config);
  await openBoxes(simUser, config, boxTierIds);

  const activeAuction = await getActiveAuction(simUser, config);
  await maybeSubmitAuctionPart(simUser, config, activeAuction);
  await maybePlaceBid(simUser, config, activeAuction);
}

async function runUserLoop(simUser, config, boxTierIds, index, sharedState = null, totalUserCount = config.privateKeys.length) {
  if (config.initialSpreadMs > 0) {
    const delayMs = Math.min(
      config.initialSpreadMs,
      Math.floor((index / Math.max(1, totalUserCount - 1)) * config.initialSpreadMs) + randomDelay(1000),
    );
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  while (true) {
    try {
      if (config.dryRun) {
        await runDryRunCycle(simUser, config, boxTierIds, sharedState);
      } else {
        await runCycle(simUser, config, boxTierIds);
      }
      log('cycle_complete', { wallet: simUser.walletAddress });
    } catch (error) {
      log('cycle_error', {
        wallet: simUser.walletAddress,
        message: error instanceof Error ? error.message : String(error),
      });

      if (!config.dryRun && isAuthError(error)) {
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

async function bootstrapManagedWalletPool(config) {
  const importedCount = await importEnvWalletsIntoManagedPool(config);

  let managedRows = await loadManagedWalletRows(config);
  const shouldEagerFillTarget = config.bootstrapOnly || config.runOnce;

  if (shouldEagerFillTarget && config.managedWalletTargetCount > managedRows.length) {
    const missingCount = config.managedWalletTargetCount - managedRows.length;
    for (let index = 0; index < missingCount; index += 1) {
      await createManagedWallet(config);
    }
    managedRows = await loadManagedWalletRows(config);
  } else if (managedRows.length === 0 && config.managedWalletTargetCount > 0) {
    await createManagedWallet(config);
    managedRows = await loadManagedWalletRows(config);
  }

  return {
    importedCount,
    managedRows,
  };
}

async function runManagedWalletGrowthLoop(config, runtime) {
  if (config.runOnce || config.managedWalletTargetCount <= 0) {
    return;
  }

  while (true) {
    if (runtime.users.length >= config.managedWalletTargetCount) {
      await sleep(config.managedWalletGenerationMinIntervalMs || DEFAULT_MANAGED_WALLET_GENERATION_MIN_INTERVAL_MS);
      continue;
    }

    const delayMs = randomBetween(
      config.managedWalletGenerationMinIntervalMs,
      config.managedWalletGenerationMaxIntervalMs,
    );

    if (delayMs > 0) {
      await sleep(delayMs);
    }

    if (runtime.users.length >= config.managedWalletTargetCount) {
      continue;
    }

    try {
      const managedWalletRow = await createManagedWallet(config);
      const simUser = await createSimUserFromManagedWallet(config, managedWalletRow);
      runtime.users.push(simUser);
      log('wallet_authenticated', { wallet: simUser.walletAddress, source: 'supabase' });

      if (runtime.boxTierIds.length === 0) {
        try {
          const nextBoxTierIds = await resolveBoxTierIds(simUser, config);
          runtime.boxTierIds.splice(0, runtime.boxTierIds.length, ...nextBoxTierIds);
          log('box_tiers_loaded', { boxTierIds: runtime.boxTierIds, source: 'supabase_growth' });
        } catch (error) {
          log('box_tiers_unavailable', {
            message: error instanceof Error ? error.message : String(error),
            source: 'supabase_growth',
          });
        }
      }

      void runUserLoop(
        simUser,
        config,
        runtime.boxTierIds,
        runtime.users.length - 1,
        null,
        Math.max(runtime.users.length, config.managedWalletTargetCount || runtime.users.length),
      );
    } catch (error) {
      log('managed_wallet_generation_failed', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function runSelfTest() {
  const emptyDigest = bytesToHex(keccak256(new Uint8Array()));
  if (emptyDigest !== 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470') {
    throw new Error('Keccak-256 self-test failed.');
  }

  const testKey = '0x5ccdefd701805f0b030d77e039583f6e4ceb6491bd168f062001c6dace3ef9d0';
  const expectedAddress = '0xdef863c208e00330bc322332b09ffc79f7ec34ee';
  const actualAddress = privateKeyToAddress(testKey);
  if (actualAddress !== expectedAddress) {
    throw new Error(`Address derivation self-test failed: expected ${expectedAddress}, got ${actualAddress ?? 'null'}.`);
  }

  const signature = normalizeSignature(signPersonalMessage(testKey, 'synthetic-sim-self-test'));
  if (!signature || signature.length !== 132) {
    throw new Error('Signature self-test failed.');
  }

  log('self_test_ok', {
    keccak256_empty: emptyDigest,
    wallet: actualAddress,
  });
}

async function main() {
  if (parseBoolean(process.env.SIM_SELF_TEST, false)) {
    runSelfTest();
    return;
  }

  const config = createConfig();

  log('simulator_starting', {
    configuredEnvWalletCount: config.privateKeys.length,
    walletSource: config.walletSource,
    dryRun: config.dryRun,
    runOnce: config.runOnce,
    bootstrapOnly: config.bootstrapOnly,
    loopIntervalMs: config.loopIntervalMs,
    whitelistBonusFlux: config.whitelistBonusFlux,
    dailyClaimFlux: config.dailyClaimFlux,
    faucetIntervalSeconds: config.faucetIntervalSeconds,
    managedWalletTargetCount: config.managedWalletTargetCount,
  });

  if (config.dryRun) {
    const boxTierIds = resolveDryRunBoxTierIds(config);
    const sharedState = createDryRunState();
    log('dry_run_round_started', { roundId: sharedState.roundId });

    const users = [];
    for (let index = 0; index < config.privateKeys.length; index += 1) {
      const simUser = createDryRunUser(config, config.privateKeys[index], index);
      users.push(simUser);
      sharedState.usersByWallet.set(simUser.walletAddress, simUser);
      log('wallet_authenticated', { wallet: simUser.walletAddress, mode: 'dry_run' });
    }

    log('box_tiers_loaded', { boxTierIds, mode: 'dry_run' });
    await Promise.all(users.map((simUser, index) => runUserLoop(
      simUser,
      config,
      boxTierIds,
      index,
      sharedState,
      users.length,
    )));
    return;
  }

  if (config.walletSource === 'supabase') {
    const { importedCount, managedRows } = await bootstrapManagedWalletPool(config);
    const selectedManagedRows = config.managedWalletTargetCount > 0
      ? managedRows.slice(0, config.managedWalletTargetCount)
      : managedRows;

    log('managed_wallet_pool_ready', {
      importedCount,
      availableWalletCount: managedRows.length,
      selectedWalletCount: selectedManagedRows.length,
      targetCount: config.managedWalletTargetCount,
      autoConfirmEthLock: config.autoConfirmEthLock,
    });

    if (config.bootstrapOnly) {
      log('managed_wallet_bootstrap_complete', {
        availableWalletCount: managedRows.length,
      });
      return;
    }

    if (selectedManagedRows.length === 0) {
      throw new Error('No active managed simulator wallets are available. Seed SIM_WALLET_PRIVATE_KEYS or set SIM_MANAGED_WALLET_TARGET_COUNT.');
    }

    const users = [];
    for (let index = 0; index < selectedManagedRows.length; index += 1) {
      const simUser = await createSimUserFromManagedWallet(config, selectedManagedRows[index]);
      users.push(simUser);
      log('wallet_authenticated', { wallet: simUser.walletAddress, source: 'supabase' });
    }

    let boxTierIds = [];
    try {
      boxTierIds = await resolveBoxTierIds(users[0], config);
      log('box_tiers_loaded', { boxTierIds, source: 'supabase' });
    } catch (error) {
      log('box_tiers_unavailable', {
        message: error instanceof Error ? error.message : String(error),
        source: 'supabase',
      });
    }

    if (config.runOnce) {
      await Promise.all(users.map((simUser, index) => runUserLoop(
        simUser,
        config,
        boxTierIds,
        index,
        null,
        users.length,
      )));
      return;
    }

    const runtime = {
      users,
      boxTierIds,
    };

    users.forEach((simUser, index) => {
      void runUserLoop(simUser, config, runtime.boxTierIds, index, null, users.length);
    });

    await runManagedWalletGrowthLoop(config, runtime);
    return;
  }

  if (config.bootstrapOnly) {
    throw new Error('SIM_BOOTSTRAP_ONLY=true requires SIM_WALLET_SOURCE=supabase.');
  }

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

  await Promise.all(users.map((simUser, index) => runUserLoop(
    simUser,
    config,
    boxTierIds,
    index,
    null,
    users.length,
  )));
}

main().catch((error) => {
  log('simulator_fatal', {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
