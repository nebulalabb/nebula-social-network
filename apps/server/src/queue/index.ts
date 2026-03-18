import { Queue, Worker, JobsOptions } from "bullmq";
import { redis } from "../config/redis";
import { logger } from "../utils/logger";

export const createQueue = (name: string) => {
  return new Queue(name, {
    connection: redis,
  });
};

// Ví dụ một queue mặc định cho Email hoặc Notifications
export const notificationQueue = createQueue("notifications");

export const addJob = async (queue: Queue, name: string, data: any, opts?: JobsOptions) => {
  await queue.add(name, data, opts);
  logger.info(`[Queue]: Job ${name} added to ${queue.name}`);
};
