import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";

const endpoint = "https://aistudioaiservices598439611076.services.ai.azure.com/";
const deploymentName = "Llama-4-Maverick-17B-128E-Instruct-FP8";

export async function main() {
  console.log("Endpoint:", endpoint);
  console.log("Deployment name:", deploymentName);
  console.log(`Requesting: ${endpoint}models/${deploymentName}/chat/completions?api-version=2024-05-01-preview`);

  const client = ModelClient(endpoint, new AzureKeyCredential("<API_KEY>"));

  const response = await client
    .path(`/models/${deploymentName}/chat/completions`)
    .post({
      queryParameters: { "api-version": "2024-05-01-preview" },
      body: {
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "I am going to Paris, what should I see?" }
        ],
        max_tokens: 2048,
        temperature: 0.8,
        top_p: 0.1,
        presence_penalty: 0,
        frequency_penalty: 0,
        stream: true
      }
    }).asNodeStream();

  const stream = response.body;
  if (!stream) {
    throw new Error("The response stream is undefined");
  }

  if (response.status !== "200") {
    stream.destroy();
    throw new Error(`Failed to get chat completions, http operation failed with ${response.status} code`);
  }

  const sseStream = createSseStream(stream);

  for await (const event of sseStream) {
    if (event.data === "[DONE]") {
      return;
    }
    for (const choice of (JSON.parse(event.data)).choices) {
      process.stdout.write(choice.delta?.content ?? ``);
    }
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});