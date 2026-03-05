export async function onRequest(context) {
  const { params } = context;
  const code = params.code ?? "(no code)";
  return new Response(`Hello from /r/${code}`, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
