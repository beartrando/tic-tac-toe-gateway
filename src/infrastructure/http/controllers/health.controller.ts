import wrapper from "./wrapper";

import FullHealthUseCase from "../../../application/use-cases/health/full-health";
import HealthUseCase from "../../../application/use-cases/health/health";
import StatusUseCase from "../../../application/use-cases/health/status";
import LivezUseCase from "../../../application/use-cases/health/livez";
import ReadyzUseCase from "../../../application/use-cases/health/readyz";

export class HealthController {

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

    constructor(
        private readonly fullHealthUseCase: FullHealthUseCase,
        private readonly healthUseCase: HealthUseCase,
        private readonly statusUseCase: StatusUseCase,
        private readonly livezUseCase: LivezUseCase,
        private readonly readyzUseCase: ReadyzUseCase,
    ) {
    }
}

export default HealthController;
