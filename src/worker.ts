const seatsAvailableAgain = () => ({
  title: "Discord TestFlight",
  url: "https://dis.gd/testflight",
  type: "rich",
  description: "New seats available in Discord TestFlight (Discord iOS Beta)",
  color: 5763719,
  timestamp: new Date().toISOString(),
});

const seatsFull = () => ({
  title: "Discord TestFlight",
  url: "https://dis.gd/testflight",
  type: "rich",
  description:
    "All seats in Discord TestFlight (Discord iOS Beta) are taken again.",
  color: 15548997,
  timestamp: new Date().toISOString(),
});

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const currentState = (await env.TESTFLIGHT_STATE.get("STATE")) ?? "FULL";
    const lastUpdate =
      (await env.TESTFLIGHT_STATE.get("TIME")) ?? new Date(0).toISOString();
    return new Response(
      JSON.stringify({
        state: currentState,
        lastUpdate,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  async scheduled(event: Request, env: Env, ctx: ExecutionContext) {
    const result = await fetch("https://testflight.apple.com/join/gdE4pRzI", {
      headers: {
        "Accept-Language": "en-us",
      },
    });

    const text = await result.text();

    const newState = text.includes("<span>This beta is full.</span>")
      ? "FULL"
      : "OPEN";
    const currentState = await env.TESTFLIGHT_STATE.get("STATE");

    if (newState !== currentState) {
      await env.TESTFLIGHT_STATE.put("STATE", newState);
      await env.TESTFLIGHT_STATE.put("TIME", new Date().toISOString());
      if (env.DISCORD_WEBHOOK_URL)
        fetch(env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            newState === "FULL" ? seatsFull() : seatsAvailableAgain()
          ),
        });
    }
  },
};
