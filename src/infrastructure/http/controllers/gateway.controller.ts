import wrapper from "./wrapper";

import FullHealthUseCase from "../../../application/use-cases/health/full-health";
import HealthUseCase from "../../../application/use-cases/health/health";
import StatusUseCase from "../../../application/use-cases/health/status";
import LivezUseCase from "../../../application/use-cases/health/livez";
import ReadyzUseCase from "../../../application/use-cases/health/readyz";
import DebugLogUseCase from "../../../application/use-cases/debug-log/debug-log";
import appConfig from "../../app/config";

export class GatewayController {

    health = wrapper(async (req, res) => {

        if (req.query.full) {
            return await this.fullHealthUseCase.execute();
        }

        return await this.healthUseCase.execute();
    });
    fullHealth = wrapper(async () => {
        return await this.fullHealthUseCase.execute();
    });
    status = wrapper(async () => {
        return await this.statusUseCase.execute();
    });
    livez = wrapper(async () => {
        return await this.livezUseCase.execute();
    });
    readyz = wrapper(async () => {
        return await this.readyzUseCase.execute();
    });

    debugLog = wrapper(async (req, res) => {
        if (!appConfig.debugLogEnabled) {
            res.status(404).end();
            return;
        }

        await this.debugLogUseCase.execute(req.body);
        res.status(204).end();
    });

    constructor(
        private readonly fullHealthUseCase: FullHealthUseCase,
        private readonly healthUseCase: HealthUseCase,
        private readonly statusUseCase: StatusUseCase,
        private readonly livezUseCase: LivezUseCase,
        private readonly readyzUseCase: ReadyzUseCase,
        private readonly debugLogUseCase: DebugLogUseCase,
    ) {
    }
}

export default GatewayController;