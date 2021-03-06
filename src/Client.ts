import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as request from 'request-promise';
import { IClientOptions } from './@types/IClientOptions';
import cuid = require('cuid');

export default class Client {
    private options: IClientOptions;
    private app: express.Application;
    private subscribed: { topic: string, callback: (cid: string, data: any) => any }[] = [];
    private watching: { topic: string, cid: string, resolve: (data: any) => void, reject: (error: string) => void, timer: NodeJS.Timeout }[] = [];
    private serverEndpoint: string;
    private uid?: string;

    constructor(options?: IClientOptions) {
        if (!options) {
            options = {};
        }

        this.options = {
            host: options.host || 'http://localhost',
            port: options.port || 9998,
            path: options.path || '/radon',
            serverHost: options.serverHost || 'http://localhost',
            serverPort: options.serverPort || 9999,
            serverPath: options.serverPath || '/radon',
            onReady: options.onReady
        };

        this.serverEndpoint = `${this.options.serverHost}:${this.options.serverPort}${this.options.serverPath}`;
        this.app = options.app || express();
        this.initApp(!!options.app);
    }

    initApp(hasApp: boolean) {
        const router = express.Router();
        router.use(bodyParser.json());
        router.post('/onevent', this.handleTopic.bind(this));

        this.app.use(this.options.path!, router);

        if (!hasApp) {
            this.app.listen(this.options.port, this.options.onReady);
        } else {
            this.options.onReady && this.options.onReady();
        }
    }

    async register() {
        const payload = {
            host: this.options.host,
            port: this.options.port,
            path: this.options.path
        }

        const response = await this.requestServer('/register', payload);

        this.uid = response.uid;
    }

    async send(topic: string, data: any) {
        return new Promise(async (resolve, reject) => {
            try {
                const cid = cuid();
                const payload = {
                    topic,
                    message: {
                        uid: this.uid,
                        cid,
                        data,
                        timestamp: new Date().getTime(),
                    }
                };

                await this.requestServer('/publish', payload);

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    async get(topic: string, data: any) {
        return new Promise(async (resolve, reject) => {
            try {
                const cid = cuid();
                const payload = {
                    topic,
                    message: {
                        uid: this.uid,
                        cid,
                        data,
                        timestamp: new Date().getTime(),
                    }
                };

                await this.subscribe(topic);
                await this.requestServer('/publish', payload);

                const timer = setTimeout(() => {
                    const index = this.watching.findIndex((item) => item.topic === topic && item.cid === cid);
                    if (index > -1) {
                        this.watching.splice(index, 1);
                        reject(new Error('Timeout'));
                    }
                }, 1000);

                this.watching.push({
                    topic,
                    cid,
                    resolve,
                    reject,
                    timer
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    async handleTopic(req: express.Request, res: express.Response, _next: express.NextFunction) {
        const { topic, message, error }: { topic: string, message: IMessage, error: string } = req.body;

        const index = this.watching.findIndex((item) => item.topic === topic && item.cid === message.cid);

        if (index > -1) {
            const watching = this.watching[index];
            clearTimeout(watching.timer);

            if (error) {
                watching.reject(error);
            } else {
                watching.resolve(message.data);
            }

            this.watching.splice(index, 1);
            await this.unsubscribe(topic);
        } else {
            const subscribed = this.subscribed.find((subscribed) => subscribed.topic === topic);

            if (subscribed && subscribed.callback) {
                await subscribed.callback(message.cid, message.data);
            }
        }

        return res.status(200).send();
    }

    async subscribe(topic: string, callback: (data: any) => any = () => null) {
        const payload = {
            topic
        };

        await this.requestServer('/subscribe', payload);

        this.subscribed.push({
            topic,
            callback: async (cid: string, data: any) => {
                const result = await callback(data);

                if (result) {
                    const payload = {
                        cid,
                        topic,
                        message: {
                            uid: this.uid,
                            cid,
                            data: result,
                            timestamp: new Date().getTime()
                        }
                    };

                    await this.requestServer('/publish', payload);
                }
            }
        });
    }

    async unsubscribe(topic: string) {
        const payload = {
            topic
        };

        await this.requestServer('/unsubscribe', payload);

        const index = this.subscribed.findIndex((subscribed) => subscribed.topic === topic);

        if (index > -1) {
            this.subscribed.splice(index, 1);
        }
    }

    requestServer(path: string, payload: any) {
        return request.post(`${this.serverEndpoint}${path}`, {
            method: 'POST',
            body: payload,
            json: true,
            headers: {
                RadonUID: this.uid || ''
            }
        });
    }
}