import logger from "@shared/logger";

export class DebugLogUseCase {
    execute(payload: unknown): void {
        logger.log(payload);
    }
}

export default DebugLogUseCase;