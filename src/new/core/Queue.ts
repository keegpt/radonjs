import monitor from "../monitor";

export default class Queue {
    options: IQueue;
    private messages: IMessage[] = [];

    constructor(options: IQueue) {
        this.options = {
            timeout: options.timeout || 0,
            delay: options.delay || 0
        }
    }

    enqueue(message: IMessage) {
        this.messages.push(message);

        monitor(`Message ${message.cid} enqueued`);
        
        // this.run();
    }

    private dequeue() {
        return this.messages.shift();
    }
}