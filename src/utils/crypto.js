// src/utils/crypto.js

// Note: Uses Web Crypto API available in modern browsers

function stringToArrayBuffer(input) {
  if (input instanceof ArrayBuffer) return input;
  if (ArrayBuffer.isView(input)) return input.buffer;
  return new TextEncoder().encode(String(input));
}

function arrayBufferToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function arrayBufferToBase64Url(arrayBuffer) {
  return arrayBufferToBase64(arrayBuffer)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function arrayBufferToHex(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compute a cryptographic hash using Web Crypto.
 * Supported algorithms: 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'
 */
export async function computeHash(algorithm, input, encoding = "base64url") {
  const data = stringToArrayBuffer(input);
  const digest = await crypto.subtle.digest(algorithm, data);
  switch (encoding) {
    case "hex":
      return arrayBufferToHex(digest);
    case "base64":
      return arrayBufferToBase64(digest);
    case "base64url":
    default:
      return arrayBufferToBase64Url(digest);
  }
}

/**
 * Compute HMAC using Web Crypto with SHA variants.
 * Example: await computeHmac('SHA-256', keyBytesOrString, data, 'base64url')
 */
export async function computeHmac(algorithm, keyData, input, encoding = "base64url") {
  const keyBuffer = stringToArrayBuffer(keyData);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: { name: algorithm } },
    false,
    ["sign"]
  );
  const data = stringToArrayBuffer(input);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  switch (encoding) {
    case "hex":
      return arrayBufferToHex(signature);
    case "base64":
      return arrayBufferToBase64(signature);
    case "base64url":
    default:
      return arrayBufferToBase64Url(signature);
  }
}

/**
 * PKCE helpers
 */
export function generateCodeVerifier(length = 128) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let text = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * possible.length);
    text += possible.charAt(randomIndex);
  }
  return text;
}

export async function generatePkceChallenge(codeVerifier) {
  return computeHash("SHA-256", codeVerifier, "base64url");
}

export default {
  computeHash,
  computeHmac,
  arrayBufferToBase64Url,
  arrayBufferToHex,
  generateCodeVerifier,
  generatePkceChallenge,
};
