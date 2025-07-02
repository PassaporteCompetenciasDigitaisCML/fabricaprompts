// Ficheiro: netlify/functions/generate.ts

interface RequestBody {
  prompt: string;
  type: 'text' | 'image' | 'suggestion';
}

// Handler principal da Netlify Function
export const handler = async (event: { httpMethod?: string; body: string | null }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, type } = JSON.parse(event.body || '{}') as RequestBody;

    if (!prompt || !type) {
      return { statusCode: 400, body: 'Missing prompt or type' };
    }

    let result: string;

    if (type === 'image') {
      // Usa a Pollinations.ai para imagens (não requer chave de API)
      const encodedPrompt = encodeURIComponent(prompt);
      result = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

    } else {
      // Usa a OpenRouter.ai para texto e sugestões
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured in Netlify environment variables.');
      }

      let systemInstruction = "You are a helpful assistant.";
      if (type === 'text') {
        systemInstruction = "És um assistente de IA divertido e pedagógico. Responde de forma sucinta, cordial e com um toque de humor. Usa alguns emojis apropriados para tornar a conversa mais leve. No final da tua resposta, faz sempre uma ou duas questões de desenvolvimento ou reflexão sobre o tema, para incentivar o utilizador a pensar mais sobre o assunto e a continuar a experimentar. Exemplo: 'O que mais poderíamos explorar sobre este tópico? 🤔'";
      } else if (type === 'suggestion') {
        systemInstruction = "És um especialista em IA generativa e um excelente professor para iniciantes. A tua tarefa é dar uma dica útil, curta e fácil de entender em Português. Foca-te em como o utilizador pode melhorar o prompt ou em conceitos importantes de engenharia de prompts. Usa um tom encorajador e educativo.";
      }
      
      const userMessage = type === 'suggestion' 
        ? `O prompt do utilizador é: "${prompt}". Dá-me uma dica para melhorar este prompt ou uma dica geral relacionada com ele.`
        : prompt;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterApiKey}`
        },
        body: JSON.stringify({
          // ALTERAÇÃO CRÍTICA: Aponta para o modelo gratuito da OpenRouter
          model: "deepseek/deepseek-chat-v3-0324:free", 
          messages: [
            { "role": "system", "content": systemInstruction },
            { "role": "user", "content": userMessage }
          ]
        })
      });
      
      if (!response.ok) {
        const errorBody = await response.json();
        console.error("OpenRouter API Error:", errorBody);
        throw new Error(errorBody.error?.message || `OpenRouter API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        throw new Error("Resposta inválida da API OpenRouter.");
      }
      result = data.choices[0].message.content;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };

  } catch (error: any) {
    console.error('Error in Netlify function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'An unknown error occurred.' }),
    };
  }
};
