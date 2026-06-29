<<<<<<< HEAD
import { createServer } from "node:http";

const serviceName = "elavon-file-gateway";
const port = Number.parseInt(process.env.PORT ?? "8080", 10);

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        status: "ok",
        service: serviceName,
      }),
    );
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`${serviceName} listening on port ${port}`);
=======
import http, { IncomingMessage, ServerResponse } from 'node:http';

const serviceName = 'elavon-file-gateway';
const port = Number(process.env.PORT || 8080);

type HealthResponse = {
  status: 'ok';
  service: string;
};

function sendJson(response: ServerResponse, statusCode: number, body: HealthResponse | { error: string }): void {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

function requestHandler(request: IncomingMessage, response: ServerResponse): void {
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, {
      status: 'ok',
      service: serviceName,
    });
    return;
  }

  sendJson(response, 404, {
    error: 'Not found',
  });
}

const server = http.createServer(requestHandler);

server.listen(port, () => {
  console.log(JSON.stringify({ level: 'info', service: serviceName, message: 'Service started', port }));
>>>>>>> origin/main
});
