import HealthUseCase from "../application/use-cases/health/health";
import StatusUseCase from "../application/use-cases/health/status";
import LivezUseCase from "../application/use-cases/health/livez";
import ReadyzUseCase from "../application/use-cases/health/readyz";
import HealthHandler from "../infrastructure/grpc/handlers/health.handler";
import GrpcService from "../infrastructure/grpc/service";
import HealthAggregator from "../infrastructure/grpc/clients/health.aggregator";
import grpcConfig from "../infrastructure/grpc/config/config";
import httpConfig from "../infrastructure/http/configs/http.server.config";
import FullHealthUseCase from "../application/use-cases/health/full-health";
import HealthController from "../infrastructure/http/controllers/gateway.controller";
import HttpServerService from "../infrastructure/http/server.service";
import OrchestrationService from "../infrastructure/orchestration/service";
import OrchestrationClient from "../infrastructure/grpc/clients/orchestration.client";
import ProxyController from "../infrastructure/http/controllers/proxy-controller";
import microservicesConfig from "../infrastructure/grpc/config/microservices.config";
import GatewayRouter from "../infrastructure/http/routes/health.routes";
import Application from "../application/application";
import * as healthProto from "../contracts/proto/common/health";

function buildApplication() {

    const healthAggregator = new HealthAggregator();

    const fullHealthUseCase = new FullHealthUseCase(healthAggregator);
    const healthUseCase = new HealthUseCase(healthAggregator);
    const statusUseCase = new StatusUseCase;
    const livezUseCase = new LivezUseCase;
    const readyzUseCase = new ReadyzUseCase;

    const healthHandler = new HealthHandler(
        healthUseCase,
        statusUseCase,
        livezUseCase,
        readyzUseCase,
    )

    const healthController = new HealthController(
        fullHealthUseCase,
        healthUseCase,
        statusUseCase,
        livezUseCase,
        readyzUseCase,
    );

    const gatewayRouter = new GatewayRouter(healthController);


    const orchestrationClient = new OrchestrationClient(microservicesConfig.orchestration.url);
    const orchestrationService = new OrchestrationService(orchestrationClient);
    const proxyController = new ProxyController(orchestrationService);


    const httpService = new HttpServerService(httpConfig.port);
    httpService.addRouter('/gateway', gatewayRouter.router);
    // Прокси монтируется на "/" последним, иначе он перехватывает /gateway/* (health и др.)
    httpService.addRouter(proxyController.proxy);
    const grpcService = new GrpcService(grpcConfig.port);
    grpcService.registerService(
        healthProto.HealthService,
        {
            check: healthHandler.check.bind(healthHandler),
            status: healthHandler.status.bind(healthHandler),
            livez: healthHandler.livez.bind(healthHandler),
            readyz: healthHandler.readyz.bind(healthHandler),
        }
    );

    const application = new Application(grpcService, httpService);

    return application;
}

export default buildApplication;
