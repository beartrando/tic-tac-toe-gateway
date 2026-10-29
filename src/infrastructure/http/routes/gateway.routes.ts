import {Router, type Router as ExpressRouter} from "express";
import GatewayController from "../controllers/gateway.controller";

export class GatewayRouter {

    readonly router: ExpressRouter;

    constructor(
        private readonly gatewayController: GatewayController,
    ) {
        this.router = Router();
        this.router.post("/log", this.gatewayController.debugLog);
    }
}

export default GatewayRouter;