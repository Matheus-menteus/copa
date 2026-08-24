// api/evento.js

export default async function handler(req, res) {
  // 1. Só aceitamos requisições POST (que mandam dados)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // 2. Pegamos a chave secreta que estará escondida na Vercel
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da API não configurada' });
  }

  // 3. Pegamos o status atual do ciclista que o seu index.html mandou
  const statusCiclista = req.body;

  // 4. O Prompt de Sistema (A regra de ouro para gastar poucos tokens e não quebrar o jogo)
  const prompt = `
    Atue como um game designer de um jogo de ciclismo de texto.
    O jogador está na temporada ${statusCiclista.temporada}.
    A equipe dele é a ${statusCiclista.equipe} e ele é um ${statusCiclista.vertente}.
    Atributos: Potência (${statusCiclista.potencia}), Explosão (${statusCiclista.explosao}), Resistência (${statusCiclista.resistencia}), Reputação (${statusCiclista.reputacao}).

    Crie um dilema narrativo curto (evento de bastidores ou treino) com 2 opções de escolha.
    
    Responda EXATAMENTE no formato JSON abaixo, sem usar formatação markdown (\`\`\`json) e sem texto extra:
    {
      "titulo": "Título do Evento",
      "descricao": "Descrição curta do dilema...",
      "opcoes": [
        {
          "texto": "Opção A",
          "feedback": "Consequência curta narrada",
          "efeitos": { "potencia": 2, "resistencia": -3 } 
        },
        {
          "texto": "Opção B",
          "feedback": "Consequência curta narrada",
          "efeitos": { "reputacao": 3 }
        }
      ]
    }
  `;

  try {
    // 5. Fazemos a chamada para o Gemini 1.5 Flash (o modelo rápido e barato)
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await geminiResponse.json();
    
    // 6. Limpamos a resposta para garantir que seja um JSON válido
    let textoResposta = data.candidates[0].content.parts[0].text;
    textoResposta = textoResposta.replace(/```json/g, '').replace(/```/g, '').trim();

    const eventoGerado = JSON.parse(textoResposta);

    // 7. Devolvemos o evento prontinho para o seu jogo
    return res.status(200).json(eventoGerado);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar o evento com a IA' });
  }
}
