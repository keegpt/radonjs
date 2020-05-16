const radon = require('../lib').default;

(() => {
    const client = new radon.Client({
        port: 3011,
        onReady: async () => {
            await client.register();

            client.subscribe('test', async (data) => {
                console.log('3011 received:', data);
                return { success: true };
            });

            client.subscribe('another/test', async (data) => {
                console.log('3011 received:', data);
            });
        }
    });
})();