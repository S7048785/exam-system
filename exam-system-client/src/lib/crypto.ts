/**
 * RSA 加密工具（使用 Web Crypto API）
 * 使用公钥加密字符串
 * @param plaintext 要加密的字符串
 * @param publicKeyBase64 公钥的 Base64 编码
 * @returns 加密后的字符串的 Base64 编码
 */
export async function encryptWithPublicKey(
  plaintext: string,
  publicKeyBase64: string
): Promise<string> {
  // 解码公钥
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64)

  // 导入公钥
  const key = await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  )

  // 加密
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    new TextEncoder().encode(plaintext)
  )

  // 转 Base64
  return arrayBufferToBase64(encrypted)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
