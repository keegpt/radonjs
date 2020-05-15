import { ActionEnum } from "../../@types/ActionEnum";
import { ModeEnum } from "../../@types/ModeEnum";
import Topic from './Topic';
import monitor from "../monitor";

export default class TopicManager {
    topics: Topic[] = [];

    constructor() {

    }

    findTopic(name: string) {
        return this.topics.find((topic) => topic.getName() === name);
    }

    publish(_uid: string, topicName: string, message: IMessage) {
        const topic = this.topics.find((topic => topic.getName() === topicName));
        
        if(!topic) {
            monitor(`Topic ${topicName} not found`);
            return;
        }

        topic.publish(message);
    }

    subscribe(uid: string, topic: string, mode: ModeEnum) {

    }

    unsubscribe(uid: string, topic: string) {

    }
}