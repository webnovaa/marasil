export type IntegrationLanguage =
    | 'curl'
    | 'javascript'
    | 'node'
    | 'python'
    | 'php'
    | 'csharp'
    | 'java'
    | 'go'
    | 'ruby'
    | 'kotlin'
    | 'swift'
    | 'dart';

export const INTEGRATION_LANGUAGES: { id: IntegrationLanguage; label: string }[] = [
    { id: 'curl', label: 'cURL' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'node', label: 'Node.js' },
    { id: 'python', label: 'Python' },
    { id: 'php', label: 'PHP' },
    { id: 'csharp', label: 'C#' },
    { id: 'java', label: 'Java' },
    { id: 'go', label: 'Go' },
    { id: 'ruby', label: 'Ruby' },
    { id: 'kotlin', label: 'Kotlin' },
    { id: 'swift', label: 'Swift' },
    { id: 'dart', label: 'Dart' },
];

export type SnippetContext = {
    baseUrl: string;
    apiKey: string;
    username: string;
    deviceName: string;
    deviceBound: boolean;
    deviceId?: string;
};

function payloadLines(ctx: SnippetContext): string[] {
    const lines = [`"to": "+9639XXXXXXXX"`, `"message": "مرحباً من ${ctx.deviceName}"`];
    if (!ctx.deviceBound) {
        lines.unshift(`"device_id": "${ctx.deviceId ?? 'YOUR_DEVICE_ULID'}"`);
    }
    return lines;
}

export function buildIntegrationSnippet(lang: IntegrationLanguage, ctx: SnippetContext): { code: string; language: string } {
    const url = `${ctx.baseUrl}/messages/text`;
    const key = ctx.apiKey || 'YOUR_API_KEY';
    const lines = payloadLines(ctx);

    switch (lang) {
        case 'curl':
            return {
                language: 'bash',
                code: `curl -X POST "${url}" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: msg-001" \\
  -d '{
    ${lines.join(',\n    ')}
  }'`,
            };

        case 'javascript':
            return {
                language: 'javascript',
                code: `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${key}",
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({
    ${lines.join(',\n    ')}
  }),
});

console.log(await response.json());`,
            };

        case 'node':
            return {
                language: 'javascript',
                code: `import axios from "axios";

const { data } = await axios.post(
  "${url}",
  {
    ${lines.join(',\n    ')}
  },
  {
    headers: {
      Authorization: "Bearer ${key}",
      "Idempotency-Key": crypto.randomUUID(),
    },
  },
);

console.log(data);`,
            };

        case 'python':
            return {
                language: 'python',
                code: `import requests
import uuid

response = requests.post(
    "${url}",
    headers={
        "Authorization": "Bearer ${key}",
        "Idempotency-Key": str(uuid.uuid4()),
    },
    json={
        ${lines.join(',\n        ')}
    },
    timeout=30,
)

print(response.json())`,
            };

        case 'php':
            return {
                language: 'php',
                code: `<?php

$payload = [
    ${lines.map((l) => {
        const [k, v] = l.split(': ');
        return `'${k.replace(/"/g, '')}' => ${v}`;
    }).join(',\n    ')}
];

$ch = curl_init('${url}');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ${key}',
        'Content-Type: application/json',
        'Idempotency-Key: ' . uniqid('msg-', true),
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
]);

echo curl_exec($ch);`,
            };

        case 'csharp':
            return {
                language: 'csharp',
                code: `using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

var client = new HttpClient();
client.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", "${key}");

var payload = new {
    ${lines.map((l) => {
        const [k, v] = l.split(': ');
        return `${k.replace(/"/g, '')} = ${v}`;
    }).join(',\n    ')}
};

var request = new HttpRequestMessage(HttpMethod.Post, "${url}")
{
    Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
};
request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());

var response = await client.SendAsync(request);
Console.WriteLine(await response.Content.ReadAsStringAsync());`,
            };

        case 'java':
            return {
                language: 'java',
                code: `HttpClient client = HttpClient.newHttpClient();

String body = """
{
  ${lines.join(',\n  ')}
}
""";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${url}"))
    .header("Authorization", "Bearer ${key}")
    .header("Content-Type", "application/json")
    .header("Idempotency-Key", UUID.randomUUID().toString())
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
            };

        case 'go':
            return {
                language: 'go',
                code: `package main

import (
  "bytes"
  "fmt"
  "net/http"
)

func main() {
  body := []byte(\`{
  ${lines.join(',\n  ')}
}\`)

  req, _ := http.NewRequest("POST", "${url}", bytes.NewBuffer(body))
  req.Header.Set("Authorization", "Bearer ${key}")
  req.Header.Set("Content-Type", "application/json")
  req.Header.Set("Idempotency-Key", "msg-001")

  resp, err := http.DefaultClient.Do(req)
  if err != nil {
    panic(err)
  }
  defer resp.Body.Close()
  fmt.Println(resp.Status)
}`,
            };

        case 'ruby':
            return {
                language: 'ruby',
                code: `require "net/http"
require "json"
require "securerandom"

uri = URI("${url}")
req = Net::HTTP::Post.new(uri)
req["Authorization"] = "Bearer ${key}"
req["Content-Type"] = "application/json"
req["Idempotency-Key"] = SecureRandom.uuid
req.body = {
  ${lines.map((l) => l.replace(/"/g, '')).join(',\n  ')}
}.to_json

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") { |http| http.request(req) }
puts res.body`,
            };

        case 'kotlin':
            return {
                language: 'kotlin',
                code: `val client = HttpClient.newBuilder().build()

val body = """
{
  ${lines.join(',\n  ')}
}
""".trimIndent()

val request = HttpRequest.newBuilder()
    .uri(URI.create("${url}"))
    .header("Authorization", "Bearer ${key}")
    .header("Content-Type", "application/json")
    .header("Idempotency-Key", UUID.randomUUID().toString())
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build()

val response = client.send(request, HttpResponse.BodyHandlers.ofString())
println(response.body())`,
            };

        case 'swift':
            return {
                language: 'swift',
                code: `var request = URLRequest(url: URL(string: "${url}")!)
request.httpMethod = "POST"
request.addValue("Bearer ${key}", forHTTPHeaderField: "Authorization")
request.addValue("application/json", forHTTPHeaderField: "Content-Type")
request.addValue(UUID().uuidString, forHTTPHeaderField: "Idempotency-Key")

let body: [String: Any] = [
  ${lines.map((l) => {
        const [k, v] = l.split(': ');
        return `${k.replace(/"/g, '')}: ${v}`;
    }).join(',\n  ')}
]
request.httpBody = try JSONSerialization.data(withJSONObject: body)

let (data, _) = try await URLSession.shared.data(for: request)
print(String(data: data, encoding: .utf8) ?? "")`,
            };

        case 'dart':
            return {
                language: 'dart',
                code: `import 'dart:convert';
import 'package:http/http.dart' as http;

final response = await http.post(
  Uri.parse('${url}'),
  headers: {
    'Authorization': 'Bearer ${key}',
    'Content-Type': 'application/json',
    'Idempotency-Key': 'msg-001',
  },
  body: jsonEncode({
    ${lines.map((l) => l.replace(/"/g, "'")).join(',\n    ')}
  }),
);

print(response.body);`,
            };

        default:
            return { code: '', language: 'text' };
    }
}
