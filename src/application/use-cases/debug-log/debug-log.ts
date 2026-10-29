import logger from "@shared/logger";
import type {MessageLogger} from "@shared/persistent-logger";

export class DebugLogUseCase {
    constructor(
        private readonly messageLogger?: MessageLogger,
    ) {
    }

    execute(payload: unknown): void {
        logger.log(payload);

        // Передача тестового сообщения в Elasticsearch/OpenSearch
        // через существующий механизм persistent-logger.
        this.messageLogger?.logIn("gateway", payload).catch(() => {
            // Ошибки записи не должны ломать основной сценарий.
        });
    }
}

export default DebugLogUseCase;
