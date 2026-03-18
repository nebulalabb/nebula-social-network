import { Client } from "@elastic/elasticsearch";
import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

const esNode = process.env.ELASTICSEARCH_NODE || "http://localhost:9200";

export const esClient = new Client({
  node: esNode,
});

export const checkElasticsearch = async () => {
  try {
    await esClient.ping();
    logger.info("🔍 Connected to Elasticsearch");
  } catch (error) {
    logger.warn("⚠️ Elasticsearch not reachable, search features might be limited.");
  }
};
