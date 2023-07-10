const seatsAvailableAgain = (env: Env) => ({
	content: "<@&1116109018247733401>",
	embeds: [
		{
			title: "Discord TestFlight",
			url: env.TESTFLIGHT_URL,
			type: "rich",
			description: "New Discord TestFlight (Discord iOS Beta) seats available!",
			color: 5763719,
			timestamp: new Date().toISOString(),
			footer: {
				text: "DiscordLookup.com"
			}
		}
	],
	components: [
		{
			type: 1,
			components: [
				{
					type: 2,
					label: "Join TestFlight",
					style: 5,
					url: env.TESTFLIGHT_URL
				}
			]
		}
	]
});

const seatsFull = (env: Env) => ({
	embeds: [
		{
			title: "Discord TestFlight",
			url: env.TESTFLIGHT_URL,
			type: "rich",
			description: "All Discord TestFlight (Discord iOS Beta) seats are taken again.",
			color: 15548997,
			timestamp: new Date().toISOString(),
			footer: {
				text: "DiscordLookup.com"
			}
		}
	]
});

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const currentState = (await env.TESTFLIGHT_STATE.get("STATE")) ?? "FULL";
    const lastChange = (await env.TESTFLIGHT_STATE.get("TIME")) ?? new Date(0).toISOString();
    return new Response(
      JSON.stringify({
				url: env.TESTFLIGHT_URL,
        status: currentState,
        changed_at: lastChange,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  async scheduled(event: Request, env: Env, ctx: ExecutionContext) {
    const result = await fetch(env.TESTFLIGHT_URL, {
      headers: {
        "Accept-Language": "en-us",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
    });

    const text = await result.text();

    const newState = text.includes("<span>This beta is full.</span>")
      ? "FULL"
      : "OPEN";
    const currentState = await env.TESTFLIGHT_STATE.get("STATE");

    if (newState !== currentState && result.ok) {
      await env.TESTFLIGHT_STATE.put("STATE", newState);
      await env.TESTFLIGHT_STATE.put("TIME", new Date().toISOString());
      if (env.DISCORD_WEBHOOK_URL)
        await fetch(env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "DiscordBot (https://discordlookup.com/, 1.0)",
          },
          body: JSON.stringify(
            newState === "FULL" ? seatsFull(env) : seatsAvailableAgain(env)
          ),
        });
    }
  },
};
