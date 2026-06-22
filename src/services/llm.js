/**
 * 前端直连 LLM 服务
 * 支持 OpenAI 兼容接口（fetch + SSE 流式）
 * @author ShanhaiSky
 */

const CONFIG_KEY = 'audichat_llm_config'

const DEFAULT_CONFIG = {
  models: [
    { name: 'deepseek-v4-flash', baseUrl: 'https://api.deepseek.com/v1', apiKey: '' },
  ],
  currentModel: 'deepseek-v4-flash',
  supportsReasoning: false,
}

/**
 * 获取 LLM 配置
 */
export function getLLMConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_KEY)
    if (saved) {
      const config = JSON.parse(saved)

      // 兼容旧格式1：顶层 baseUrl/apiKey/model
      if (config.baseUrl && !config.models?.length) {
        config.models = [{ name: config.model || 'default', baseUrl: config.baseUrl, apiKey: config.apiKey || '' }]
        config.currentModel = config.models[0].name
        delete config.baseUrl
        delete config.apiKey
        delete config.model
      }

      // 兼容旧格式2：models 是字符串数组
      if (config.models?.length && typeof config.models[0] === 'string') {
        config.models = config.models.map(name => ({
          name,
          baseUrl: config.baseUrl || 'https://api.deepseek.com/v1',
          apiKey: config.apiKey || '',
        }))
        delete config.baseUrl
        delete config.apiKey
      }

      const merged = {
        ...JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
        ...config,
      }

      if (Array.isArray(merged.models) && merged.models.length) {
        const exact = merged.models.find(m => m.name === merged.currentModel)
        if (!exact) {
          const current = String(merged.currentModel || '')
          const lower = current.toLowerCase()
          const ci = merged.models.find(m => String(m.name || '').toLowerCase() === lower)
          merged.currentModel = (ci || merged.models[0]).name
        }
      }

      return merged
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG))
}

/**
 * 保存 LLM 配置
 */
export function setLLMConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

/**
 * 获取当前模型的配置
 */
function getCurrentModelConfig(config) {
  const model = config.models?.find(m => m.name === config.currentModel)
  return model || config.models?.[0] || { name: '', baseUrl: '', apiKey: '' }
}

/**
 * 流式对话 — async generator
 * @param {Array} messages - OpenAI 格式的消息数组
 * @param {Object} config - LLM 配置
 * @param {AbortSignal} signal - 可选的 AbortSignal
 * @yields {{ type: string, content: string }}
 */
export async function* chatStream(messages, config, signal) {
  const model = getCurrentModelConfig(config)
  const { supportsReasoning } = config

  const body = {
    model: model.name,
    messages,
    stream: true,
    stream_options: { include_usage: true },
  }

  const headers = {
    'Content-Type': 'application/json',
  }
  if (model.apiKey) {
    headers['Authorization'] = `Bearer ${model.apiKey}`
  }

  const response = await fetch(`${model.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LLM API 错误 (${response.status}): ${errorText}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue

      const dataStr = trimmed.slice(6)
      if (dataStr === '[DONE]') return

      try {
        const data = JSON.parse(dataStr)

        // usage 数据（最后一个 chunk）
        if (data.usage) {
          yield { type: 'usage', content: data.usage }
          continue
        }

        const delta = data.choices?.[0]?.delta
        if (!delta) continue

        if (delta.reasoning_content) {
          yield { type: 'thinking', content: delta.reasoning_content }
        }

        if (delta.content) {
          yield { type: 'text', content: delta.content }
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            yield {
              type: 'tool_call',
              content: {
                index: tc.index,
                id: tc.id,
                function: tc.function,
              },
            }
          }
        }
      } catch {
        // 忽略解析错误
      }
    }
  }
}

/**
 * 生成对话标题
 */
export async function generateTitle(firstMessage, config) {
  const model = getCurrentModelConfig(config)

  const headers = { 'Content-Type': 'application/json' }
  if (model.apiKey) {
    headers['Authorization'] = `Bearer ${model.apiKey}`
  }

  const response = await fetch(`${model.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model.name,
      messages: [
        {
          role: 'system',
          content: '你是一个标题生成助手。请根据用户的对话内容，生成一个简短的标题（不超过20个字）。只输出标题，不要任何其他内容。',
        },
        { role: 'user', content: firstMessage },
      ],
      stream: false,
      max_tokens: 50,
    }),
  })

  if (!response.ok) throw new Error('生成标题失败')

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

/**
 * 生成每日 slogan
 */
export async function generateSlogan(prompt, config) {
  const model = getCurrentModelConfig(config)

  const headers = { 'Content-Type': 'application/json' }
  if (model.apiKey) {
    headers['Authorization'] = `Bearer ${model.apiKey}`
  }

  const response = await fetch(`${model.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model.name,
      messages: [
        { role: 'system', content: '你是一个 slogan 生成助手。只输出 slogan 本身，不要引号，不要任何其他内容。' },
        { role: 'user', content: prompt },
      ],
      stream: false,
      max_tokens: 30,
    }),
  })

  if (!response.ok) throw new Error('生成 slogan 失败')

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

/**
 * 测试 LLM 连接
 */
export async function testConnection(config) {
  try {
    const model = getCurrentModelConfig(config)

    const headers = { 'Content-Type': 'application/json' }
    if (model.apiKey) {
      headers['Authorization'] = `Bearer ${model.apiKey}`
    }

    const response = await fetch(`${model.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model.name,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, message: `HTTP ${response.status}: ${errorText}` }
    }

    return { success: true, message: '连接成功' }
  } catch (e) {
    return { success: false, message: e.message }
  }
}
