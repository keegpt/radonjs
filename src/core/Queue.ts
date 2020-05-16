import * as request from 'request-promise';
import monitor from "../monitor";
import ClientManager from "./ClientManager";
import Topic from "./Topic";

export default class Queue {
    private clientManager: ClientManager;
    private options: IQueueOptions;
    private topic: Topic;
    private processing: number = 0;
    private running: boolean = false;
    private messages: IMessage[] = [];

    constructor(options: IQueueOptions = {}, topic: Topic, clientManager: ClientManager) {
        this.clientManager = clientManager;
        this.topic = topic;
        this.options = {
            concurrency: options.concurrency || 0,
            timeout: options.timeout || 0,
            delay: options.delay || 0
        }
    }

    enqueue(message: IMessage) {
        this.messages.push(message);
        monitor(`Message ${message.cid} enqueued`);
        this.run();
    }

    private dequeue() {
        return this.messages.shift();
    }

    private async run() {
        this.running = true;

        if (this.options.concurrency && this.processing >= this.options.concurrency!) {
            return;
        }

        if (this.messages.length === 0) {
            if (this.processing === 0) {
                this.running = false;
            }
            return;
        }

        this.processing++;

        let timer: NodeJS.Timeout;
        const message = this.dequeue()!;

        monitor(`Message ${message.cid} started to be processed`);

        if (this.options.delay) {
            await new Promise((resolve) => setTimeout(resolve, this.options.delay));
        }

        let cancel: Function;

        this.processMessage(message, next, onCancel);

        if (this.options.timeout) {
            timer = setTimeout(() => {
                if (cancel) {
                    cancel();
                }

                next();
            }, this.options.timeout);
        }

        const that = this;

        function next() {
            if (that.options.timeout) {
                clearTimeout(timer);
            }

            that.processing--;
            that.run();
        }

        function onCancel(cb: () => void) {
            cancel = cb;
        }
    }

    async processMessage(message: IMessage, next: () => void, onCancel: (cb: () => void) => void) {
        const consumers = this.clientManager.filterClients(this.topic.getConsumers());
        const requests = [];

        onCancel(() => {
            //todo: if cancel, then abort all pending requests, and send new ones with timeout error
            monitor(`Message ${message.cid} is taking to long to be processed by someone... trying to stop requests`);
        });

        for (let i = 0; i < consumers.length; i++) {
            const consumer = consumers[i];

            if (consumer.uid === message.uid) {
                continue;
            }

            requests.push(request.post(`${consumer.host}:${consumer.port}${consumer.path}/onevent`, {
                method: 'POST',
                body: {
                    topic: this.topic.getName(),
                    error: null,
                    message
                },
                json: true
            }));
        }

        // function allSettled(promises: any[]) {
        //     let wrappedPromises = promises.map((p: any) => Promise.resolve(p)
        //         .then(
        //             val => ({ status: 'fulfilled', value: val }),
        //             err => ({ status: 'rejected', reason: err })));
        //     return Promise.all(wrappedPromises);
        // }

        // const results = await allSettled(requests);

        await Promise.all(requests);

        monitor(`Message ${message.cid} sent to consumers`);

        // todo: test results and stuff

        return next();
    }
}