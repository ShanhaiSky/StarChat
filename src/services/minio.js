/**
 * MinIO 对象存储服务
 * 使用预签名 URL 上传，避免复杂的签名计算
 * @author ShanhaiSky
 */

const CONFIG_KEY = 'audichat_minio_config'

const DEFAULT_CONFIG = {
  endpoint: '',
  accessKey: '',
  secretKey: '',
  bucket: 'starchat',
  region: 'us-east-1',
}

/**
 * 获取 MinIO 配置
 */
export function getMinioConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_KEY)
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
  } catch {}
  return { ...DEFAULT_CONFIG }
}

/**
 * 保存 MinIO 配置
 */
export function setMinioConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

/**
 * 测试 MinIO 连接
 * 使用简单的 GET 请求测试 bucket 是否存在
 */
export async function testMinioConnection(config) {
  try {
    const { endpoint, bucket } = config
    const url = `${endpoint}/${bucket}/`
    const date = new Date()
    const headers = buildSignedHeaders('GET', `/${bucket}/`, '', config, date)

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    // 200 = bucket 存在且可访问
    // 403 = bucket 存在但无权限
    // 404 = bucket 不存在
    if (response.status === 200 || response.status === 403 || response.status === 404) {
      return { success: true, message: '连接成功' }
    }

    return { success: false, message: `HTTP ${response.status}` }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

/**
 * 上传文件到 MinIO
 * 使用 FormData + POST 方式（MinIO 支持的策略上传）
 */
export async function uploadFile(file, onProgress) {
  const config = getMinioConfig()
  const { endpoint, bucket } = config

  // 生成唯一的对象名
  const ext = file.name.split('.').pop() || ''
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const objectName = `uploads/${timestamp}_${random}${ext ? '.' + ext : ''}`

  // 方式1: 尝试直接 PUT 上传（需要正确的签名）
  try {
    const result = await uploadWithPut(file, objectName, config, onProgress)
    return result
  } catch (e) {
    console.warn('[MinIO] PUT 上传失败，尝试 POST 方式:', e.message)
  }

  // 方式2: 使用 POST 方式上传（MinIO 支持）
  return await uploadWithPost(file, objectName, config, onProgress)
}

/**
 * 使用 PUT 方式上传
 */
async function uploadWithPut(file, objectName, config, onProgress) {
  const { endpoint, bucket } = config
  const url = `${endpoint}/${bucket}/${objectName}`
  const date = new Date()

  // 构建签名头
  const headers = buildSignedHeaders('PUT', `/${bucket}/${objectName}`, '', config, date)
  headers['Content-Type'] = file.type || 'application/octet-stream'

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          url: `${endpoint}/${bucket}/${objectName}`,
          objectName,
          filename: file.name,
          size: file.size,
          type: file.type,
        })
      } else {
        reject(new Error(`HTTP ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('网络错误')))

    xhr.open('PUT', url)
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }
    xhr.send(file)
  })
}

/**
 * 使用 POST 方式上传（FormData）
 */
async function uploadWithPost(file, objectName, config, onProgress) {
  const { endpoint, bucket } = config
  const url = `${endpoint}/${bucket}`
  const date = new Date()

  // 构建签名头
  const headers = buildSignedHeaders('POST', `/${bucket}/`, '', config, date)

  // 创建 FormData
  const formData = new FormData()
  formData.append('key', objectName)
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          url: `${endpoint}/${bucket}/${objectName}`,
          objectName,
          filename: file.name,
          size: file.size,
          type: file.type,
        })
      } else {
        reject(new Error(`HTTP ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('网络错误')))

    xhr.open('POST', url)
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }
    xhr.send(formData)
  })
}

/**
 * 获取文件的公开访问 URL
 */
export function getFileUrl(objectName) {
  const config = getMinioConfig()
  return `${config.endpoint}/${config.bucket}/${objectName}`
}

/**
 * 构建 AWS S3 V4 签名的请求头
 * 简化版本，适用于 MinIO
 */
function buildSignedHeaders(method, path, queryStr, config, date) {
  const { accessKey, secretKey, region, endpoint } = config
  const host = new URL(endpoint).host

  // 日期格式：20230101T000000Z
  const amzDate = date.toISOString().replace(/[-:]|(\.\d{3})/g, '')
  const dateStamp = amzDate.slice(0, 8)

  // 签名所需的头部
  const payloadHash = 'UNSIGNED-PAYLOAD'
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'

  // 规范请求
  const canonicalQueryStr = queryStr || ''
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`

  const canonicalRequest = [
    method,
    encodePath(path),
    canonicalQueryStr,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  // 待签名字符串
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  // 计算签名
  const signingKey = getSignatureKey(secretKey, dateStamp, region, 's3')
  const signature = hmacSha256Hex(signingKey, stringToSign)

  return {
    'Host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  }
}

/**
 * URL 编码路径（保留 / 不编码）
 */
function encodePath(path) {
  return path.split('/').map(segment =>
    encodeURIComponent(segment).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16))
  ).join('/')
}

// ── SHA-256 实现 ──

function sha256Hex(message) {
  const hash = sha256Core(new TextEncoder().encode(message))
  return bytesToHex(hash)
}

function hmacSha256Hex(key, message) {
  const keyBytes = typeof key === 'string' ? new TextEncoder().encode(key) : key
  const messageBytes = new TextEncoder().encode(message)
  const hash = hmacSha256Core(keyBytes, messageBytes)
  return bytesToHex(hash)
}

function getSignatureKey(key, dateStamp, region, service) {
  const kDate = hmacSha256Core(new TextEncoder().encode('AWS4' + key), new TextEncoder().encode(dateStamp))
  const kRegion = hmacSha256Core(kDate, new TextEncoder().encode(region))
  const kService = hmacSha256Core(kRegion, new TextEncoder().encode(service))
  return hmacSha256Core(kService, new TextEncoder().encode('aws4_request'))
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function concatBytes(a, b) {
  const result = new Uint8Array(a.length + b.length)
  result.set(a)
  result.set(b, a.length)
  return result
}

// HMAC-SHA256 核心
function hmacSha256Core(key, message) {
  const blockSize = 64
  const keyBlock = new Uint8Array(blockSize)

  if (key.length > blockSize) {
    keyBlock.set(sha256Core(key))
  } else {
    keyBlock.set(key)
  }

  const oKeyPad = new Uint8Array(blockSize)
  const iKeyPad = new Uint8Array(blockSize)

  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyBlock[i] ^ 0x5c
    iKeyPad[i] = keyBlock[i] ^ 0x36
  }

  const innerHash = sha256Core(concatBytes(iKeyPad, message))
  return sha256Core(concatBytes(oKeyPad, innerHash))
}

// SHA-256 核心算法
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

function sha256Core(message) {
  const msgLen = message.length
  const bitLen = msgLen * 8
  const padLen = ((msgLen + 9 + 63) & ~63) - msgLen
  const padded = new Uint8Array(msgLen + padLen)
  padded.set(message)
  padded[msgLen] = 0x80

  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false)
  view.setUint32(padded.length - 4, bitLen & 0xffffffff, false)

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19

  for (let offset = 0; offset < padded.length; offset += 64) {
    const w = new Uint32Array(64)
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false)
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xffffffff
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7

    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[i] + w[i]) & 0xffffffff
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) & 0xffffffff

      h = g; g = f; f = e; e = (d + temp1) & 0xffffffff
      d = c; c = b; b = a; a = (temp1 + temp2) & 0xffffffff
    }

    h0 = (h0 + a) & 0xffffffff; h1 = (h1 + b) & 0xffffffff
    h2 = (h2 + c) & 0xffffffff; h3 = (h3 + d) & 0xffffffff
    h4 = (h4 + e) & 0xffffffff; h5 = (h5 + f) & 0xffffffff
    h6 = (h6 + g) & 0xffffffff; h7 = (h7 + h) & 0xffffffff
  }

  const result = new Uint8Array(32)
  const rv = new DataView(result.buffer)
  rv.setUint32(0, h0, false); rv.setUint32(4, h1, false)
  rv.setUint32(8, h2, false); rv.setUint32(12, h3, false)
  rv.setUint32(16, h4, false); rv.setUint32(20, h5, false)
  rv.setUint32(24, h6, false); rv.setUint32(28, h7, false)
  return result
}

function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount))
}
