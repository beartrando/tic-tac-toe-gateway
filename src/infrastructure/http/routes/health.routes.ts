import {Router, type Router as ExpressRouter} from "express";
import GatewayController from "../controllers/gateway.controller";

export class HealthRouter {

    readonly router: ExpressRouter;

    constructor(
        private readonly healthController: GatewayController,
    ) {
        this.router = Router();
        this.router.get("/health", this.healthController.health,);
        this.router.get("/full-health", this.healthController.fullHealth,);
        this.router.get("/status", this.healthController.status,);
        this.router.get("/livez", this.healthController.livez,);
        this.router.get("/readyz", this.healthController.readyz,);
    }
}

export default HealthRouter;
