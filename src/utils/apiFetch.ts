const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function isTransientRenderRoutingMiss(response: Response) {
  if (response.headers.get('x-render-routing') === 'no-server') {
    return true;
  }

  if (response.status !== 404) {
    return response.status === 502 || response.status === 503 || response.status === 504;
  }

  const body = await response.clone().text().catch(() => '');
  return body.trim() === 'Not Found';
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 3
) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, init);
      const shouldRetry = attempt < retries && (await isTransientRenderRoutingMiss(response));

      if (!shouldRetry) {
        return response;
      }
    } catch (err) {
      if (attempt >= retries) {
        throw err;
      }
    }

    await delay(350 * (attempt + 1));
  }

  return fetch(input, init);
}
