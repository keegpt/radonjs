const radon = require('../lib').default;

(() => {
    const client = new radon.Client({
        port: 3013,
        onReady: async () => {
            await client.register();

            client.subscribe('test', async (data) => {
                console.log('3013 received:', data);
            });
        }
    });
})();