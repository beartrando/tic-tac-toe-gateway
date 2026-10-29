import wrapper from "./wrapper";

import DebugLogUseCase from "../../../application/use-cases/debug-log/debug-log";
import appConfig from "../../app/config";

export class GatewayController {

    debugLog = wrapper(async (req, res) => {
        if (!appConfig.debugLogEnabled) {
            res.status(404).end();
            return;
        }

        await this.debugLogUseCase.execute(req.body);
        res.status(204).end();
    });

    constructor(
        private readonly debugLogUseCase: DebugLogUseCase,
    ) {
    }
}

export default GatewayController;
