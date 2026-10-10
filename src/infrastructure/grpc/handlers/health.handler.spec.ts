import * as healthProto from '../../../contracts/proto/common/health';
import * as emptyProto from '../../../contracts/proto/common/empty';
import HealthHandler from './health.handler';
import HealthUseCase from '../../../application/use-cases/health/health';
import StatusUseCase from '../../../application/use-cases/health/status';
import LivezUseCase from '../../../application/use-cases/health/livez';
import ReadyzUseCase from '../../../application/use-cases/health/readyz';

describe('HealthHandler', () => {
    let healthHandler: HealthHandler;
    let mockHealthUseCase: jest.Mocked<HealthUseCase>;
    let mockStatusUseCase: jest.Mocked<StatusUseCase>;
    let mockLivezUseCase: jest.Mocked<LivezUseCase>;
    let mockReadyzUseCase: jest.Mocked<ReadyzUseCase>;
    let mockCall: any;
    let mockCallback: jest.Mock;

    beforeEach(() => {
        mockHealthUseCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<HealthUseCase>;

        mockStatusUseCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<StatusUseCase>;

        mockLivezUseCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<LivezUseCase>;

        mockReadyzUseCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<ReadyzUseCase>;

        healthHandler = new HealthHandler(
            mockHealthUseCase,
            mockStatusUseCase,
            mockLivezUseCase,
            mockReadyzUseCase,
        );

        mockCall = {
            request: {},
        };

        mockCallback = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('check', () => {
        it('should call healthUseCase and return response', async () => {
            const mockResponse: healthProto.HealthReport = {
                service: 'gateway',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {auth: healthProto.HealthStatus.HEALTH_STATUS_OK},
                timestamp: new Date(),
            };

            mockHealthUseCase.execute.mockResolvedValue(mockResponse);

            await healthHandler.check(mockCall, mockCallback);

            expect(mockHealthUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockCallback).toHaveBeenCalledWith(null, mockResponse);
        });

        it('should call callbackError on error', async () => {
            const error = new Error('Health check failed');
            mockHealthUseCase.execute.mockRejectedValue(error);

            await healthHandler.check(mockCall, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({code: expect.any(Number), details: 'Health check failed'}),
                null
            );
        });
    });

    describe('status', () => {
        it('should call statusUseCase and return response', async () => {
            const mockResponse: healthProto.ServiceStatus = {
                service: 'gateway',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                timestamp: new Date(),
            };

            mockStatusUseCase.execute.mockResolvedValue(mockResponse);

            await healthHandler.status(mockCall, mockCallback);

            expect(mockStatusUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockCallback).toHaveBeenCalledWith(null, mockResponse);
        });
    });

    describe('livez', () => {
        it('should call livezUseCase and return response', async () => {
            const mockResponse: healthProto.LiveStatus = {
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
            };

            mockLivezUseCase.execute.mockResolvedValue(mockResponse);

            await healthHandler.livez(mockCall, mockCallback);

            expect(mockLivezUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockCallback).toHaveBeenCalledWith(null, mockResponse);
        });
    });

    describe('readyz', () => {
        it('should call readyzUseCase and return response', async () => {
            const mockResponse: healthProto.ReadyStatus = {
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {db: healthProto.HealthStatus.HEALTH_STATUS_OK},
            };

            mockReadyzUseCase.execute.mockResolvedValue(mockResponse);

            await healthHandler.readyz(mockCall, mockCallback);

            expect(mockReadyzUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockCallback).toHaveBeenCalledWith(null, mockResponse);
        });
    });
});
