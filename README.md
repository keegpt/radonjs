# RadonJS

An event backbone for microservices architectures using express

Version: Alpha.2

## Installation

Use the package manager [npm](https://www.npmjs.com) to install radonjs.

```bash
npm install @keegpt/radonjs
```

## Server

```js
const radon = require('../lib').default;

(() => {
    const server = new radon.Server();
})();
```

## Clients

```js
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
```

```js
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
```

## Todo
Some of this are simple to do, i'm just trying to find time :(
* Remove request-promise dependency (use native http/https)
* Allow to customize event timeout and concurrency values
* Create a system to get all updated stats from each event
* A error handling system
* A debug system
* A microservice recovery system
* Implement redis as core

## Docs

### Server options

Property  | Description
------------- | -------------
app  | An express application
path  | Internal radon router path

### Client options

Property  | Description
------------- | -------------
app  | An express application
host | Client host
port | Client port
path | Internal radon router path
serverHost | Server host
serverPort| Server port
serverPath | Server internal radon router path
onReady | Ready to work callback

### Client methods

#### subscribe(eventName, callback)
```js
client.subscribe('EVENT_NAME', async (data: any) => {
    // logic
    // we can return data to the publisher, just returning something in this function
});
```

#### send(eventName)
```js
(async () => {
    client.send('EVENT_NAME', { some: 'data' });
})
```

#### get(eventName, callback)
```js
(async () => {
    const result = await client.get('EVENT_NAME', { some: 'data' });
    console.log(result);
})
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)