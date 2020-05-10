interface Job {
    payload: any;
    timeout?: number
}

interface Options {
    handler: (payload: any, next: () => void, onCancel: (cb: () => void) => void) => void;
    concurrency?: number;
    timeout?: number;
}

export default class Queue {
    private jobs: Job[] = [];

    private handler: (payload: any, next: () => void, onCancel: (cb: () => void) => void) => void;
    private concurrency: number;
    private timeout: number;
    private pending: number = 0;
    private running: boolean = false;

    constructor(options: Options) {
        this.handler = options.handler;
        this.concurrency = options.concurrency || Infinity;
        this.timeout = options.timeout || 0;
    }

    enqueue(job: Job) {
        this.jobs.push(job);
        this.run();
    }

    dequeue() {
        return this.jobs.shift();
    }

    private run() {
        this.running = true;

        if (this.pending >= this.concurrency) {
            return;
        }

        if (this.jobs.length === 0) {
            if (this.pending === 0) {
                this.running = false;
            }
            return;
        }

        let timer: number;
        const job = this.dequeue()!;

        if (!job.timeout) {
            job.timeout = this.timeout;
        }

        let cancel: Function;

        this.handler(job.payload, next, onCancel);

        if (job.timeout) {
            timer = setTimeout(() => {
                if (cancel) {
                    cancel();
                }

                next();
            }, job.timeout);
        }

        const that = this;

        function next() {
            if (job.timeout) {
                clearTimeout(timer);
            }

            that.run();
        }

        function onCancel(cb: () => void) {
            cancel = cb;
        }
    }
}