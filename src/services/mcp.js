/**
 * MCP 客户端服务
 * 支持 SSE 和 StreamableHTTP 两种传输方式
 * 支持自定义 Headers（如 Bearer Token 认证）
 * @author ShanhaiSky
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

// 连接池: Map<serverId, { client, transport, tools, status }>
const connections = new Map()

/**
 * 判断是否在 Electron 环境中
 */
function isElectron() {
  return typeof window !== 'undefined' && window.process && window.process.type
}

/**
 * 将 localhost URL 转换为代理 URL（浏览器模式下解决 CORS）
 * 远程 URL（非 localhost）直接返回，不需要代理
 */
function toProxyUrl(url) {
  if (isElectron()) return url
  try {
    const u = new URL(url)
    // 只代理 localhost 请求
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      const proxyPath = `/mcp-proxy${u.pathname}${u.search}`
      return `${window.location.origin}${proxyPath}`
    }
    return url
  } catch {
    return url
  }
}

// 事件监听器
const listeners = new Set()

function emitChange() {
  const snapshot = getConnectionSnapshot()
  for (const fn of listeners) fn(snapshot)
}

export function onConnectionChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getConnectionSnapshot() {
  const result = {}
  for (const [id, conn] of connections) {
    result[id] = {
      status: conn.status,
      tools: conn.tools,
      error: conn.error,
    }
  }
  return result
}

/**
 * 创建传输层
 * @param {Object} serverConfig - { url, type, headers }
 */
function createTransport(serverConfig) {
  const { url, type, headers } = serverConfig
  const effectiveUrl = toProxyUrl(url)

  // 构建请求头
  const requestInit = {}
  if (headers && typeof headers === 'object') {
    requestInit.headers = { ...headers }
  }

  // 根据 type 选择传输方式
  if (type === 'streamableHttp') {
    console.log(`[MCP] 使用 StreamableHTTP 传输: ${url} → ${effectiveUrl}`)
    return new StreamableHTTPClientTransport(new URL(effectiveUrl), { requestInit })
  }

  // 默认使用 SSE
  console.log(`[MCP] 使用 SSE 传输: ${url} → ${effectiveUrl}`)
  return new SSEClientTransport(new URL(effectiveUrl), { requestInit })
}

/**
 * 连接 MCP Server
 * @param {Object} serverConfig - { id, name, url, type, headers }
 * @returns {Promise<Client>}
 */
export async function connectServer(serverConfig) {
  const { id } = serverConfig

  // 如果已连接，先断开
  if (connections.has(id)) {
    await disconnectServer(id)
  }

  const conn = { client: null, transport: null, tools: [], status: 'connecting', error: null }
  connections.set(id, conn)
  emitChange()

  try {
    const client = new Client({ name: 'StarChat', version: '1.0.0' })
    const transport = createTransport(serverConfig)

    await client.connect(transport)

    // 获取工具列表
    const { tools } = await client.listTools()

    conn.client = client
    conn.transport = transport
    conn.tools = tools.map(t => ({
      name: t.name,
      description: t.description || '',
      inputSchema: t.inputSchema || { type: 'object', properties: {} },
      serverId: id,
    }))
    conn.status = 'connected'
    conn.error = null

    emitChange()
    return client
  } catch (err) {
    conn.status = 'error'
    conn.error = err.message
    emitChange()
    throw err
  }
}

/**
 * 断开 MCP Server
 */
export async function disconnectServer(serverId) {
  const conn = connections.get(serverId)
  if (!conn) return

  try {
    if (conn.client) {
      await conn.client.close()
    }
  } catch {
    // 忽略关闭错误
  }

  connections.delete(serverId)
  emitChange()
}

/**
 * 断开所有服务器
 */
export async function disconnectAll() {
  const ids = [...connections.keys()]
  for (const id of ids) {
    await disconnectServer(id)
  }
}

/**
 * 调用 MCP 工具
 * @param {string} toolName - 工具名称
 * @param {Object} args - 工具参数
 * @param {number} timeout - 超时时间（毫秒），默认 30s
 * @returns {Promise<string>}
 */
export async function callTool(toolName, args, timeout = 30000) {
  let targetConn = null
  for (const [, conn] of connections) {
    if (conn.status === 'connected' && conn.tools.some(t => t.name === toolName)) {
      targetConn = conn
      break
    }
  }

  if (!targetConn) {
    throw new Error(`工具 "${toolName}" 未找到或所属服务器未连接`)
  }

  const callPromise = targetConn.client.callTool({ name: toolName, arguments: args })
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`工具调用超时 (${timeout / 1000}s)`)), timeout)
  )

  const result = await Promise.race([callPromise, timeoutPromise])

  if (result.content && Array.isArray(result.content)) {
    return result.content.map(c => c.text || JSON.stringify(c)).join('\n')
  }
  return typeof result === 'string' ? result : JSON.stringify(result)
}

/**
 * 获取所有已连接服务器的工具列表
 */
export function getAllTools() {
  const tools = []
  for (const [, conn] of connections) {
    if (conn.status === 'connected') {
      tools.push(...conn.tools)
    }
  }
  return tools
}

/**
 * 获取指定服务器的连接状态
 */
export function getServerStatus(serverId) {
  const conn = connections.get(serverId)
  if (!conn) return { status: 'disconnected', tools: [], error: null }
  return { status: conn.status, tools: conn.tools, error: conn.error }
}

/**
 * 自动连接所有标记为 autoConnect 的服务器
 */
export async function autoConnectAll(servers) {
  const targets = servers.filter(s => s.enabled && s.autoConnect && s.url)
  const results = await Promise.allSettled(
    targets.map(s => connectServer(s).catch(err => {
      console.warn(`[MCP] 自动连接 "${s.name}" 失败:`, err.message)
      return null
    }))
  )
  const connected = results.filter(r => r.status === 'fulfilled' && r.value).length
  console.log(`[MCP] 自动连接完成: ${connected}/${targets.length} 成功`)
}
