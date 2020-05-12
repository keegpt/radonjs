import { IQueueItem, IQueueItemPayload, QueueOptions } from "./types";

export default class Queue {
    private items: IQueueItem[] = [];

    private handler: (payload: IQueueItemPayload, next: () => void, onCancel: (cb: () => void) => void) => void;
    private concurrency: number;
    private timeout: number;
    private delay: number;
    private processing: number = 0;
    private running: boolean = false;

    constructor(options: QueueOptions) {
        this.handler = options.handler;
        this.concurrency = options.concurrency || Infinity;
        this.timeout = options.timeout || 0;
        this.delay = options.delay || 0;
    }

    setConcurrency(concurrency: number) {
        this.concurrency = concurrency;
    }

    setTimeout(timeout: number) {
        this.timeout = timeout;
    }

    enqueue(item: IQueueItem) {
        this.items.push(item);
        this.run();
    }

    private dequeue() {
        return this.items.shift();
    }

    private async run() {
        this.running = true;

        if (this.processing >= this.concurrency) {
            return;
        }

        if (this.items.length === 0) {
            if (this.processing === 0) {
                this.running = false;
            }
            return;
        }

        this.processing++;

        if (this.delay) {
            await new Promise((resolve, reject) => setTimeout(resolve, this.delay));
        }

        let timer: NodeJS.Timeout;
        const item = this.dequeue()!;

        if (!item.timeout) {
            item.timeout = this.timeout;
        }

        let cancel: Function;

        this.handler(item.payload, next, onCancel);

        if (item.timeout) {
            timer = setTimeout(() => {
                if (cancel) {
                    cancel();
                }

                next();
            }, item.timeout);
        }

        const that = this;

        function next() {
            if (item.timeout) {
                clearTimeout(timer);
            }

            that.processing--;
            that.run();
        }

        function onCancel(cb: () => void) {
            cancel = cb;
        }
    }
}