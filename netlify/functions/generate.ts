// Ficheiro: netlify/functions/generate.ts

interface RequestBody {
  prompt: string;
  type: 'text' | 'image' | 'suggestion';
}

export const handler = async (event: { httpMethod?: string; body: string | null }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, type } = JSON.parse(event.body || '{}') as RequestBody;

    if (!prompt || !type) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt or type' }) };
    }

    let result: string;

    if (type === 'image') {
      const encodedPrompt = encodeURIComponent(prompt);
      result = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
    } else {
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) {
        throw new Error('A variável de ambiente OPENROUTER_API_KEY não está configurada na Netlify.');
      }

      let systemInstruction = "You are a helpful assistant.";
      if (type === 'text') {
        systemInstruction = "És um assistente de IA divertido e pedagógico. Responde de forma sucinta, cordial e com um toque de humor. Usa alguns emojis apropriados para tornar a conversa mais leve. No final da tua resposta, faz sempre uma ou duas questões de desenvolvimento ou reflexão sobre o tema, para incentivar o utilizador a pensar mais sobre o assunto e a continuar a experimentar.";
      } else if (type === 'suggestion') {
        systemInstruction = "És um especialista em IA generativa e um excelente professor para iniciantes. A tua tarefa é dar uma dica útil, curta e fácil de entender em Português. Foca-te em como o utilizador pode melhorar o prompt ou em conceitos importantes de engenharia de prompts.";
      }
      
      const userMessage = type === 'suggestion' 
        ? `O prompt do utilizador é: "${prompt}". Dá-me uma dica para melhorar este prompt.`
        : prompt;

      // ADICIONA UM CONTROLO DE TIMEOUT AO FETCH
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 31000); // Timeout de 31 segundos

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openRouterApiKey}`
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3-0324:free", 
            messages: [
              { "role": "system", "content": systemInstruction },
              { "role": "user", "content": userMessage }
            ]
          }),
          signal: controller.signal // Associa o controlador de timeout ao pedido
        });

        clearTimeout(timeoutId); // Limpa o timeout se a resposta chegar a tempo

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ error: { message: "Não foi possível analisar a resposta de erro da OpenRouter." }}));
          const errorMessage = errorBody.error?.message || `A API da OpenRouter falhou com o estado ${response.status}`;
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        result = data.choices[0].message.content;

      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('A API demorou demasiado a responder. Por favor, tente novamente.');
        }
        throw error;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };

  } catch (error: any) {
    console.error('Error in Netlify function:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Ocorreu um erro desconhecido no servidor.' }),
    };
  }
};
