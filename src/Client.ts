import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as request from 'request-promise';
import { getId } from './utils';
import { IClientOptions, IClientEvent, EventModeEnum, EventActionEnum, IClientWaiting } from './types';

export default class Client {
    options: IClientOptions;
    router: express.Router = express.Router();
    serverEndpoint: string;
    subscribed: IClientEvent[] = [];
    waiting: IClientWaiting[] = [];

    constructor(options: IClientOptions) {
        this.options = options;
        this.router.use(bodyParser.json());
        this.router.post('/onevent', this.handleEvent.bind(this));
        this.serverEndpoint = `${options.serverHost}:${options.serverPort}${options.serverPath}`;

        options.app.use(options.path, this.router);
    }

    async publish(eventName: string, data: any, action: EventActionEnum = EventActionEnum.CONTINUE) {
        return new Promise(async (resolve, reject) => {
            try {
                const cid = getId();

                const payload = {
                    cid,
                    event: {
                        name: eventName,
                        action
                    },
                    data
                };

                console.log("publishing in", eventName, cid);

                this.subscribe(cid);

                await request.post(`${this.serverEndpoint}/publish`, {
                    method: 'POST',
                    body: payload,
                    json: true
                });

                if (action === EventActionEnum.CONTINUE) {
                    return resolve();
                }

                this.wait(cid, resolve, reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    wait(cid: string, resolve: (data: any) => void, reject: (error: Error) => void) {
        console.log("wait for", cid);
        this.waiting.push({
            cid,
            resolve,
            reject
        });
    }

    async handleEvent(req: express.Request, res: express.Response, _next: express.NextFunction) {
        const { cid, event, data, error } = req.body;

        console.log("handling in", event.name, cid);

        const index = this.waiting.findIndex((ev) => ev.cid === event.name);

        if (index > -1) {
            const waiting = this.waiting[index];

            if (error) {
                waiting.reject(new Error(error));
            } else {
                waiting.resolve(data);
            }

            this.waiting.splice(index, 1);
            this.unsubscribe(event.name);
        } else {
            const mEvent = this.subscribed.find((ev) => ev.name === event.name);

            if (mEvent && mEvent.callback) {
                await mEvent.callback(cid, data);
            }
        }

        return res.status(200).send();
    }

    async subscribe(eventOptions: string | IClientEvent, callback: (data: any) => any = () => null) {
        let event: IClientEvent;
        if (typeof eventOptions !== 'object') {
            event = {
                name: eventOptions,
                mode: EventModeEnum.ACKNOWLEDGE
            };
        } else {
            event = {
                name: eventOptions.name,
                mode: eventOptions.mode
            };
        }

        await request.post(`${this.serverEndpoint}/subscribe`, {
            method: 'POST',
            body: {
                client: {
                    host: this.options.host,
                    port: this.options.port,
                    path: this.options.path
                },
                event
            },
            json: true
        });

        this.subscribed.push({
            name: event.name,
            mode: event.mode,
            callback: async (cid: string, data: any) => {
                try {
                    const result = await callback(data);

                    if (event.mode === EventModeEnum.LOAD_BALANCE) {
                        await this.returnData(cid, cid, null, result);
                    }
                } catch (error) {
                    if (event.mode === EventModeEnum.LOAD_BALANCE) {
                        await this.returnData(cid, cid, error.message, null);
                    }
                }
            }
        });
    }

    async returnData(eventName: string, cid: string, error: string | null, data: any) {
        const payload = {
            cid,
            event: {
                name: eventName
            },
            data,
            error
        };

        await request.post(`${this.serverEndpoint}/publish`, {
            method: 'POST',
            body: payload,
            json: true
        });
    }

    async unsubscribe(event: string) {
        const payload = {
            client: {
                host: this.options.host,
                port: this.options.port,
                path: this.options.path
            },
            event: {
                name: event
            }
        };

        await request.post(`${this.serverEndpoint}/unsubscribe`, {
            method: 'POST',
            body: payload,
            json: true
        });

        const index = this.subscribed.findIndex((ev) => ev.name === event);

        if (index > -1) {
            this.subscribed.splice(index, 1);
        }
    }
}