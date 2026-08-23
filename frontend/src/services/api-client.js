const DEFAULT_TIMEOUT_MS = 10000;

function joinUrl(baseUrl, path) {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = String(path).replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}

async function readResponseBody(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      throw new ApiError('Response did not contain valid JSON', {
        status: response.status,
        statusText: response.statusText,
        cause: error
      });
    }
  }

  const text = await response.text();
  if (text) {
    throw new ApiError(`Expected JSON response, received ${contentType || 'an unknown content type'}`, {
      status: response.status,
      statusText: response.statusText
    });
  }
  return null;
}

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.statusText = options.statusText ?? '';
    this.method = options.method ?? '';
    this.url = options.url ?? '';
  }
}

export function createApiClient({
  baseUrl = '/api',
  timeout = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch
} = {}) {
  async function request(path, {
    method = 'GET',
    body,
    timeoutMs = timeout
  } = {}) {
    const url = joinUrl(baseUrl, path);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const headers = {
      Accept: 'application/json'
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        let detail = '';
        try {
          const errorBody = await readResponseBody(response);
          if (errorBody && typeof errorBody === 'object') {
            detail = errorBody.error || errorBody.message || '';
          } else if (errorBody) {
            detail = String(errorBody);
          }
        } catch (error) {
          detail = response.statusText || `HTTP ${response.status}`;
        }

        throw new ApiError(
          detail || `Request failed with status ${response.status}`,
          {
            status: response.status,
            statusText: response.statusText,
            method,
            url
          }
        );
      }

      return await readResponseBody(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error && error.name === 'AbortError') {
        throw new ApiError(`Request timed out after ${timeoutMs}ms`, {
          status: 0,
          statusText: 'Timeout',
          method,
          url,
          cause: error
        });
      }

      throw new ApiError(`Network request failed for ${method} ${url}`, {
        status: 0,
        statusText: 'Network Error',
        method,
        url,
        cause: error
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    get(path, options = {}) {
      return request(path, { ...options, method: 'GET' });
    },
    getGlycanPresets(options = {}) {
      return request('glycans/presets', { ...options, method: 'GET' });
    },
    post(path, body, options = {}) {
      return request(path, { ...options, method: 'POST', body });
    }
  };
}

export default createApiClient;
