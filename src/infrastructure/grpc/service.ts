import * as grpc from "@grpc/grpc-js";
import * as healthProto from '../../contracts/proto/common/health';
import logger from "@shared/logger";

export class GrpcService {
    private readonly server: grpc.Server;
    private readonly services: Array<{
        service: grpc.ServiceDefinition<grpc.UntypedServiceImplementation>;
        handlers: grpc.UntypedServiceImplementation;
    }> = [];

    constructor(private readonly grpcPort: number) {
        this.server = new grpc.Server();
    }

    async start(): Promise<void> {
        return new Promise<void>(
            (resolve, reject) => {
                this.addServices();
                this.server.bindAsync(
                    `0.0.0.0:${this.grpcPort}`,
                    grpc.ServerCredentials.createInsecure(),
                    (err, port) => {
                        if (err) {
                            logger.error(
                                {err},
                                '❌ Failed to start gRPC',
                            );

                            return reject(err);
                        }

                        logger.info(
                            `🟢 gRPC server started on port ${port}`,
                        );
                        resolve();
                    },
                );
            },
        );
    }

    stop() {
        this.server.forceShutdown();
    }

    // private registerHealthService() {
    //     this.registerService(healthProto.HealthService, {
    //         check: this.healthHandler.check.bind(this.healthHandler),
    //         status: this.healthHandler.status.bind(this.healthHandler),
    //         livez: this.healthHandler.livez.bind(this.healthHandler),
    //         readyz: this.healthHandler.readyz.bind(this.healthHandler),
    //     });
    // }

    registerService(
        service: grpc.ServiceDefinition<grpc.UntypedServiceImplementation>,
        handlers: grpc.UntypedServiceImplementation,
    ): void {
        this.services.push({ service, handlers });
    }

    private _registerService(
        service: grpc.ServiceDefinition<grpc.UntypedServiceImplementation>,
        handlers: grpc.UntypedServiceImplementation,
    ): void {
        this.server.addService(service, handlers);
    }

    private addServices() {
        this.services.forEach(({ service, handlers }) => {
            this._registerService(service, handlers);
        });
        // this.registerHealthService();
    }
}

export default GrpcService;
