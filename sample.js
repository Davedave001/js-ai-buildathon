import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Emulate __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
// Use a multimodal model that supports image input
const model = "meta/Llama-4-Maverick-17B-128E-Instruct-FP8";

export async function main() {
  // Read and encode the image as base64
  const imagePath = path.join(__dirname, "contoso_layout_sketch (1).jpg");
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString("base64");

  const client = ModelClient(
    endpoint,
    new AzureKeyCredential(token),
  );

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Write HTML and CSS code for a web page based on the following hand-drawn sketch."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 1.0,
      top_p: 1.0,
      model: model
    }
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  console.log(response.body.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});

