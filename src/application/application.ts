import logger from "@shared/logger";
import type {ElasticService} from "@shared/persistent-logger";
import GrpcService from "../infrastructure/grpc/service";
import HttpServerService from "../infrastructure/http/server.service";

export class Application {
    constructor(
        private readonly grpcService: GrpcService,
        private readonly httpService: HttpServerService,
        private readonly elasticService?: ElasticService,
    ) {
    }

    async start(): Promise<void> {
        const shutdown = async () => {
            logger.info("🛑 Shutting down...");

            await this.stop();

            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        try {

            await this.grpcService.start();
            await this.httpService.start();

            if (this.elasticService && !await this.elasticService.check()) {
                logger.warn(
                    '⚠️ Elasticsearch is unavailable, gateway logs will not be indexed',
                );
            }

            logger.info(
                '🚀 Gateway service started',
            );
        } catch (err) {
            logger.error(
                {err},
                '💥 Failed to start Gateway service',
            );
            process.exit(1);
        }
    }

    async stop() {
        await this.grpcService.stop();
        await this.httpService.stop();
        await this.elasticService?.stop();
    }
}

export default Application;
