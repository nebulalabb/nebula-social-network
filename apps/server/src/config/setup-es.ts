import { esClient } from "./elasticsearch";
import { logger } from "../utils/logger";

const setupElasticsearchIndices = async () => {
  try {
    // Anime Index
    const animeIndexExists = await esClient.indices.exists({ index: "anime" });
    if (!animeIndexExists) {
      await esClient.indices.create({
        index: "anime",
        body: {
          mappings: {
            properties: {
              title_en: { type: "text", analyzer: "english" },
              title_jp: { type: "text", analyzer: "japanese" },
              title_ro: { type: "text" },
              genres: { type: "keyword" },
              studios: { type: "keyword" },
              score: { type: "float" },
              type: { type: "keyword" },
              status: { type: "keyword" },
              aired_from: { type: "date" },
              popularity: { type: "integer" },
            },
          },
        },
      });
      logger.info("✔️ Elasticsearch index 'anime' created.");
    }

    // Users Index for search
    const usersIndexExists = await esClient.indices.exists({ index: "users" });
    if (!usersIndexExists) {
      await esClient.indices.create({
        index: "users",
        body: {
          mappings: {
            properties: {
              username: { type: "text" },
              display_name: { type: "text" },
              bio: { type: "text" },
            },
          },
        },
      });
      logger.info("✔️ Elasticsearch index 'users' created.");
    }
  } catch (error) {
    logger.error("❌ Error setting up Elasticsearch indices:", error);
  }
};

if (require.main === module) {
  setupElasticsearchIndices();
}

export { setupElasticsearchIndices };
