import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const fixture = readFileSync(
  new URL("../fixtures/shopify-page.json", import.meta.url),
  "utf8",
);

createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  const page = Number(url.searchParams.get("page") ?? "1");
  response.setHeader("content-type", "application/json");
  response.end(page === 1 ? fixture : JSON.stringify({ products: [] }));
}).listen(3100, () => console.log("fixture catalogue on :3100"));
