import { webcrypto } from "crypto";

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  var buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  // implement this function using the crypto package to generate a public and private RSA key pair.
  // the public key should be used for encryption and the private key for decryption. Make sure the keys are extractable.
  let keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  // implement this function to return a base64 string version of a public key
  try {
    const exported = await crypto.subtle.exportKey("spki", key);
    const pubKeyBaseKey = arrayBufferToBase64(exported);
  } catch (e) {
    console.error("Error exporting public key", e);
  }
  return 'pubKeyBaseKey';
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(
  key: webcrypto.CryptoKey | null
): Promise<string | null> {
  // implement this function to return a base64 string version of a private key
  try {
    if (key === null) {
      return null;
    }
    const exported = await crypto.subtle.exportKey("pkcs8", key);
    const privKeyBaseKey = arrayBufferToBase64(exported);
    //return privKeyBaseKey;
  } catch (e) {
    console.error("Error exporting private key", e);
  }
  return "privKeyBaseKey";
}

// Import a base64 string public key to its native format
export async function importPubKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  // implement this function to go back from the result of the exportPubKey function to it's native crypto key object
  try {
    const imported = await crypto.subtle.importKey(
      "spki",
      base64ToArrayBuffer(strKey),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
    return imported;
  } catch (e) {
    console.error("Error importing public key", e);
  }
  return {} as any;
}

// Import a base64 string private key to its native format
export async function importPrvKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  // implement this function to go back from the result of the exportPrvKey function to it's native crypto key object
  try {
    const imported = await crypto.subtle.importKey(
      "pkcs8",
      base64ToArrayBuffer(strKey),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );
    return imported;
  } catch (e) {
    console.error("Error importing private key", e);
  }
  return {} as any;
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(
  b64Data: string,
  strPublicKey: string
): Promise<string> {
  // implement this function to encrypt a base64 encoded message with a public key
  // tip: use the provided base64ToArrayBuffer function
  try {
    const publicKey = await importPubKey(strPublicKey);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      base64ToArrayBuffer(b64Data)
    );
    return arrayBufferToBase64(encrypted);
  } catch (e) {
    console.error("Error encrypting message", e);
  }
  return "";
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(
  data: string,
  privateKey: webcrypto.CryptoKey
): Promise<string> {
  // implement this function to decrypt a base64 encoded message with a private key
  // tip: use the provided base64ToArrayBuffer function
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      base64ToArrayBuffer(data)
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Error decrypting message", e);
  }
  return "";
}

// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  // implement this function using the crypto package to generate a symmetric key.
  // the key should be used for both encryption and decryption. Make sure the
  // keys are extractable.
  try {
    let key = await crypto.subtle.generateKey(
      {
        name: "AES-CBC",
        length: 2048,
      },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (e) {
    console.error("Error generating symmetric key", e);
  }
  return {} as any;
}

// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  // implement this function to return a base64 string version of a symmetric key
  try {
    const exported = await crypto.subtle.exportKey("raw", key);
    const exportedAsString = arrayBufferToBase64(exported);
    return exportedAsString;
  } catch (e) {
    console.error("Error exporting symmetric key", e);
  }
  return "";
}

// Import a base64 string format to its crypto native format
export async function importSymKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  // implement this function to go back from the result of the exportSymKey function to it's native crypto key object
  try {
    let imported = await crypto.subtle.importKey(
      "raw",
      base64ToArrayBuffer(strKey),
      {
        name: "AES-CBC",
      },
      true,
      ["encrypt", "decrypt"]
    );
    return imported;
  } catch (e) {
    console.error("Error importing symmetric key", e);
  }
  return {} as any;
}

// Encrypt a message using a symmetric key
export async function symEncrypt(
  key: webcrypto.CryptoKey,
  data: string
): Promise<string> {
  // implement this function to encrypt a base64 encoded message with a public key
  // tip: encode the data to a uin8array with TextEncoder
  try {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      key,
      new TextEncoder().encode(data)
    );
    return arrayBufferToBase64(encrypted);
  } catch (e) {
    console.error("Error encrypting message", e);
  }
  return "";
}

// Decrypt a message using a symmetric key
export async function symDecrypt(
  strKey: string,
  encryptedData: string
): Promise<string> {
  // implement this function to decrypt a base64 encoded message with a private key
  // tip: use the provided base64ToArrayBuffer function and use TextDecode to go back to a string format
  try {
    const key = await importSymKey(strKey);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: new Uint8Array(16),
      },
      key,
      base64ToArrayBuffer(encryptedData)
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Error decrypting message", e);
  }
  return "";
}
