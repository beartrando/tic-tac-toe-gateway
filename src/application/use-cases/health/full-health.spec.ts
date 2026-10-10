import * as healthProto from '../../../contracts/proto/common/health';
import FullHealthUseCase from './full-health';
import HealthAggregator from '../../../infrastructure/grpc/clients/health.aggregator';

describe('FullHealthUseCase', () => {
    let fullHealthUseCase: FullHealthUseCase;
    let mockHealthAggregator: jest.Mocked<HealthAggregator>;

    beforeEach(() => {
        mockHealthAggregator = {
            checkAll: jest.fn(),
            check: jest.fn(),
        } as unknown as jest.Mocked<HealthAggregator>;

        fullHealthUseCase = new FullHealthUseCase(mockHealthAggregator);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return OK status when all services are healthy', async () => {
        const mockReports = {
            auth: {
                service: 'auth',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {db: healthProto.HealthStatus.HEALTH_STATUS_OK},
                timestamp: new Date(),
            },
            profile: {
                service: 'profile',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {db: healthProto.HealthStatus.HEALTH_STATUS_OK},
                timestamp: new Date(),
            },
        };

        mockHealthAggregator.checkAll.mockResolvedValue(mockReports);

        const result = await fullHealthUseCase.execute();

        expect(result.status).toBe(healthProto.HealthStatus.HEALTH_STATUS_OK);
        expect(result.components).toEqual(mockReports);
    });

    it('should return FAIL status when any service is unhealthy', async () => {
        const mockReports = {
            auth: {
                service: 'auth',
                status: healthProto.HealthStatus.HEALTH_STATUS_FAIL,
                components: {db: healthProto.HealthStatus.HEALTH_STATUS_FAIL},
                timestamp: new Date(),
            },
            profile: {
                service: 'profile',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {db: healthProto.HealthStatus.HEALTH_STATUS_OK},
                timestamp: new Date(),
            },
        };

        mockHealthAggregator.checkAll.mockResolvedValue(mockReports);

        const result = await fullHealthUseCase.execute();

        expect(result.status).toBe(healthProto.HealthStatus.HEALTH_STATUS_FAIL);
    });

    it('should return FAIL status when service returns null', async () => {
        const mockReports = {
            auth: null,
            profile: {
                service: 'profile',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {},
                timestamp: new Date(),
            },
        };

        mockHealthAggregator.checkAll.mockResolvedValue(mockReports);

        const result = await fullHealthUseCase.execute();

        expect(result.status).toBe(healthProto.HealthStatus.HEALTH_STATUS_FAIL);
    });

    it('should return OK status for empty reports', async () => {
        mockHealthAggregator.checkAll.mockResolvedValue({});

        const result = await fullHealthUseCase.execute();

        expect(result.status).toBe(healthProto.HealthStatus.HEALTH_STATUS_OK);
        expect(result.components).toEqual({});
    });
});
