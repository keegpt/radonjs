import * as request from 'request-promise';
import Queue from "./Queue";
import { EventModeEnum, IClient, IEventOptions, IQueueItemPayload, ISubscriber } from './types';

export default class Event {
    options: IEventOptions;
    queue: Queue;
    subscribers: ISubscriber[] = [];

    constructor(options: IEventOptions) {
        this.options = options;
        this.queue = new Queue({
            handler: async (payload, next, onCancel) => {
                onCancel(() => {
                    //todo: if cancel, then abort all pending requests, and send new ones with timeout error
                });

                const requests = [];
                let alreadySent2LoadBalance = false;

                const acknowledgers: ISubscriber[] = [];
                const loadBalancers: ISubscriber[] = [];

                for (let i = 0; i < this.subscribers.length; i++) {
                    const subscriber = this.subscribers[i];
                    if (subscriber.mode === EventModeEnum.LOAD_BALANCE) {
                        loadBalancers.push(subscriber);
                    } else {
                        acknowledgers.push(subscriber);
                    }
                }

                if (loadBalancers.length > 0) {
                    if (loadBalancers.length > 1) {
                        acknowledgers.push(loadBalancers[Math.floor(Math.random() * loadBalancers.length)]);
                    } else {
                        acknowledgers.push(loadBalancers[0]);
                    }
                }

                for (let i = 0; i < acknowledgers.length; i++) {
                    const subscriber = acknowledgers[i];

                    if (subscriber.mode === EventModeEnum.LOAD_BALANCE) {
                        if (alreadySent2LoadBalance) {
                            continue;
                        }

                        alreadySent2LoadBalance = true;
                    }

                    requests.push(request.post(`${subscriber.client.host}:${subscriber.client.port}${subscriber.client.path}/onevent`, {
                        method: 'POST',
                        body: { cid: payload.cid, event: { name: this.options.name }, data: payload.data, error: payload.error },
                        json: true
                    }));
                }

                // should i really wait for requests response?
                await Promise.all(requests); // bah, would be nice if allSettled worked in typescript

                return next();
            }
        });
    }

    subscribe(client: IClient, mode: EventModeEnum) {
        if (!this.subscribers.find((sub) => sub.client.host === client.host && sub.client.port === client.port && sub.client.path === client.path)) {
            this.subscribers.push({ client, mode });
        }
    }

    unsubscribe(client: IClient) {
        const index = this.subscribers.findIndex((sub) => sub.client.host === client.host && sub.client.port === client.port && sub.client.path === client.path);

        if (index > -1) {
            this.subscribers.splice(index, 1);
        }
    }

    publish(payload: IQueueItemPayload) {
        if (this.subscribers.length > 0) {
            this.queue.enqueue({ payload });
        }
    }
}