import {DebugLogUseCase} from "./debug-log";

jest.mock("@shared/logger", () => ({
    log: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

import logger from "@shared/logger";

describe("DebugLogUseCase", () => {
    it("logs payload", () => {
        const useCase = new DebugLogUseCase();
        useCase.execute({foo: "bar"});
        expect(logger.log).toHaveBeenCalledWith({foo: "bar"});
    });
});