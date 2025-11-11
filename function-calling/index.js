// import { GoogleGenAI } from "@google/genai";
// import readlineSync from "readline-sync";
// const ai = new GoogleGenAI({
//   apiKey: "api_key",
// });

// const History = [];

// async function Chatting(userProblem) {
//   History.push({
//     role: "user",
//     parts: [{ text: userProblem }],
//   });

//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: History,
//   });

//   History.push({
//     role: "model",
//     parts: [{ text: response.text }],
//   });

//   console.log(response.text);
//   console.log(History);
// }

// async function main() {
//   const userProblem = await readlineSync.question("Ask anything --> ");
//   await Chatting(userProblem);
//   main();
// }

// await main();

import readlineSync from "readline-sync";
import { GoogleGenAI } from "@google/genai";

const History = [];

async function getCryptoPrice(coin) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin.toLowerCase()}`;
  const response = await fetch(url);
  const data = await response.json();
  return data[0]; // return only first coin info
}

const cryptoDeclaration = {
  name: "getCryptoPrice",
  description:
    "Get the current price of any cryptocurrency like bitcoin, ethereum, etc.",
  parameters: {
    type: "object",
    properties: {
      coin: {
        type: "string",
        description: "The name of the cryptocurrency, e.g. bitcoin, ethereum.",
      },
    },
    required: ["coin"],
  },
};

const ai = new GoogleGenAI({
  apiKey: "Api_key", // replace with your real key
});

async function Chatting(userProblem) {
  History.push({ role: "user", parts: [{ text: userProblem }] });

  try {
    const model = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: History,
      tools: [{ functionDeclarations: [cryptoDeclaration] }],
    });

    if (!model.response) {
      console.error("Gemini API error: No response from model.");
      return;
    }

    const functionCalls = model.response.functionCalls || [];

    if (functionCalls.length > 0) {
      const { name, args } = functionCalls[0];

      if (name === "getCryptoPrice") {
        const result = await getCryptoPrice(args.coin);
        console.log("\n🪙 Function Result:", result);

        const followUp = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            ...History,
            { role: "model", parts: [{ functionCall: { name, args } }] },
            { role: "function", parts: [{ text: JSON.stringify(result) }] },
          ],
        });

        console.log("\n🤖:", followUp.response.text());
        History.push({
          role: "model",
          parts: [{ text: followUp.response.text() }],
        });
      }
    } else {
      console.log("\n🤖:", model.response.text());
      History.push({ role: "model", parts: [{ text: model.response.text() }] });
    }
  } catch (error) {
    console.error("Gemini API error:", error.message || error);
  }
}

async function main() {
  while (true) {
    const userProblem = readlineSync.question("You: ");
    await Chatting(userProblem);
  }
}

main();
