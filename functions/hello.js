export function onRequest() {
  return new Response("HELLO FUNCTION HIT", {
    headers: {
      "Content-Type": "text/plain",
      "X-PopBite-Function": "hello"
    }
  });
}
