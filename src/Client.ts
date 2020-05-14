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

                await request.post(`${this.serverEndpoint}/publish`, {
                    method: 'POST',
                    body: payload,
                    json: true
                });

                if (action === EventActionEnum.CONTINUE) {
                    return resolve();
                }

                this.wait(eventName, cid, resolve, reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    wait(eventName: string, cid: string, resolve: (data: any) => void, reject: (error: Error) => void) {
        this.waiting.push({
            cid,
            event: {
                name: eventName
            },
            resolve,
            reject
        })
    }

    async handleEvent(req: express.Request, res: express.Response, _next: express.NextFunction) {
        const { cid, event, data, error } = req.body;

        const index = this.waiting.findIndex((ev) => ev.cid === cid);

        if (index > -1) {
            const waiting = this.waiting[index];

            if (error) {
                waiting.reject(error);
            } else {
                waiting.resolve(data);
            }

            this.waiting.splice(index, 1);
        } else {
            const mEvent = this.subscribed.find((ev) => ev.name === event.name);

            if (mEvent && mEvent.callback) {
                await mEvent.callback(cid, data);
            }
        }

        return res.status(200).send();
    }

    async subscribe(eventOptions: string | IClientEvent, callback: (data: any) => any) {
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
                        await this.returnData(cid, null, result);
                    }
                } catch (error) {
                    if (event.mode === EventModeEnum.LOAD_BALANCE) {
                        await this.returnData(cid, error, null);
                    }
                }
            }
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