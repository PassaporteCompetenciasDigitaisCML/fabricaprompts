// Este serviço agora faz a ponte entre o frontend e a nossa Netlify Function segura.

async function callNetlifyFunction(prompt: string, type: 'text' | 'image' | 'suggestion'): Promise<string> {
  try {
    const response = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, type }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Resposta de erro inválida do servidor.' }));
      throw new Error(errorBody.error || `O pedido falhou com o estado ${response.status}`);
    }

    const data = await response.json();
    return data.result;

  } catch (error) {
    console.error(`Erro ao chamar a Netlify function para o tipo ${type}:`, error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error(`Ocorreu um erro desconhecido ao gerar ${type}.`);
  }
}

export function generateContentWithGemini(prompt: string): Promise<string> {
  return callNetlifyFunction(prompt, 'text');
}

export function generateImageWithGemini(prompt: string): Promise<string> {
  return callNetlifyFunction(prompt, 'image');
}

export function generatePromptSuggestion(prompt: string): Promise<string> {
  return callNetlifyFunction(prompt, 'suggestion');
}
