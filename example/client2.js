const radon = require('../lib').default;

(() => {
    const client = new radon.Client({
        port: 3012,
        onReady: async () => {
            await client.register();

            setTimeout(async () => {
                try {
                    const result = await client.get('test', { some: 'data' });
                    console.log('3012 received', result);

                    client.send('another/test', { more: 'data' });
                } catch (error) {
                    console.error(error)
                }
            }, 1000);
        }
    });
})();