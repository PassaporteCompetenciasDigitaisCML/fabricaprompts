// Ficheiro: netlify/functions/generate.ts

interface RequestBody {
  prompt: string;
  type: 'text' | 'image' | 'suggestion';
}

export const handler = async (event: { httpMethod?: string; body: string | null }) => {
  console.log("--- Netlify Function 'generate' started ---");
  
  if (event.httpMethod !== 'POST') {
    console.log("Method not allowed:", event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, type } = JSON.parse(event.body || '{}') as RequestBody;
    console.log(`Received request - Type: ${type}, Prompt: "${prompt.substring(0, 50)}..."`);


    if (!prompt || !type) {
      console.error("Validation Error: Missing prompt or type.");
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt or type' }) };
    }

    let result: string;

    if (type === 'image') {
      const encodedPrompt = encodeURIComponent(prompt);
      result = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
      console.log("Generated image URL for Pollinations.ai");

    } else {
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) {
        console.error("CRITICAL ERROR: OPENROUTER_API_KEY environment variable not found.");
        throw new Error('A variável de ambiente OPENROUTER_API_KEY não está configurada na Netlify.');
      }
      console.log("OPENROUTER_API_KEY found.");

      let systemInstruction = "You are a helpful assistant.";
      if (type === 'text') {
        systemInstruction = "És um assistente de IA divertido e pedagógico. Responde de forma sucinta, cordial e com um toque de humor. Usa alguns emojis apropriados para tornar a conversa mais leve. No final da tua resposta, faz sempre uma ou duas questões de desenvolvimento ou reflexão sobre o tema, para incentivar o utilizador a pensar mais sobre o assunto e a continuar a experimentar.";
      } else if (type === 'suggestion') {
        systemInstruction = "És um especialista em IA generativa e um excelente professor para iniciantes. A tua tarefa é dar uma dica útil, curta e fácil de entender em Português. Foca-te em como o utilizador pode melhorar o prompt ou em conceitos importantes de engenharia de prompts.";
      }
      
      const userMessage = type === 'suggestion' 
        ? `O prompt do utilizador é: "${prompt}". Dá-me uma dica para melhorar este prompt.`
        : prompt;

      const payload = {
        model: "deepseek/deepseek-chat-v3-0324:free", 
        messages: [
          { "role": "system", "content": systemInstruction },
          { "role": "user", "content": userMessage }
        ]
      };

      console.log("Sending payload to OpenRouter...");
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterApiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log(`OpenRouter response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API Error Response Text:", errorText);
        let errorMessage = `A API da OpenRouter falhou com o estado ${response.status}`;
        try {
            const errorBody = JSON.parse(errorText);
            errorMessage = errorBody.error?.message || errorMessage;
        } catch (e) {
            // A resposta não era JSON, o que é útil saber
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Successfully received and parsed JSON from OpenRouter.");

      result = data.choices[0].message.content;
    }

    console.log("--- Function finished successfully ---");
    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };

  } catch (error: any) {
    console.error("--- ERROR in Netlify function catch block ---");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Ocorreu um erro desconhecido no servidor.' }),
    };
  }
};
