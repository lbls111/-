// Fix: Provide full content for geminiService.ts to implement listModels and resolve import errors.
interface ListModelsParams {
  apiBaseUrl: string;
  apiKey: string;
  signal?: AbortSignal; // Add signal for cancellation
}

export async function listModels({ apiBaseUrl, apiKey, signal }: ListModelsParams): Promise<string[]> {
  let response: Response;
  try {
    // Ensure the URL is clean and doesn't have trailing slashes before appending the path
    const cleanedUrl = apiBaseUrl.replace(/\/$/, "");
    response = await fetch(`${cleanedUrl}/models`, {
      signal, // Pass the signal to fetch
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json', // Explicitly request a JSON response
      },
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log("Fetch aborted for listModels");
      throw new Error("模型获取任务已取消。");
    }
    console.error("Network error while fetching models:", error);
    throw new Error(`网络错误: 无法连接到API服务器 ${apiBaseUrl}。请检查URL和您的网络连接。`);
  }

  const contentType = response.headers.get("content-type");

  // Handle non-successful responses (like 401, 404, 500)
  if (!response.ok) {
    let errorText = `HTTP 错误! 状态: ${response.status} ${response.statusText}`;
    // If the server was kind enough to send a JSON error, use it.
    if (contentType && contentType.includes("application/json")) {
        try {
            const errorData = await response.json();
            errorText = errorData.error?.message || JSON.stringify(errorData);
        } catch (jsonError) {
            // The server said it's JSON but it wasn't. Fallback to text.
            errorText = "服务器返回了一个无法解析的错误响应。";
        }
    } else {
        // This is the most likely case for the user's error: getting an HTML page.
        errorText = "收到了意外的HTML响应。请检查您的API地址是否正确，并确保它指向一个有效的API端点（例如 https://.../v1），而不是一个网页。";
    }
    throw new Error(errorText);
  }

  // Handle successful responses that are not JSON
  if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`收到了意外的响应类型: ${contentType}。API应该返回JSON格式的数据。`);
  }

  try {
    const data = await response.json();
    // Standard OpenAI format
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((model: any) => model.id).sort();
    }
    // Fallback for other formats (like Ollama)
    if (data.models && Array.isArray(data.models)) {
        return data.models.map((model: any) => model.name).sort();
    }
    if (Array.isArray(data)) {
        return data.map((model: any) => model.id || model.name).sort();
    }
    
    throw new Error("来自API的JSON格式不符合预期。");
  } catch (error) {
    if (error.name === 'AbortError') {
        throw new Error("模型获取任务已取消。");
    }
    console.error("Failed to parse JSON response:", error);
    throw new Error("无法解析来自API服务器的JSON响应。数据可能已损坏。");
  }
}
