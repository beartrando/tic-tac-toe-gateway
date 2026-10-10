import * as healthProto from '../../../contracts/proto/common/health';
import HealthUseCase from './health';
import HealthAggregator from '../../../infrastructure/grpc/clients/health.aggregator';

describe('HealthUseCase', () => {
    let healthUseCase: HealthUseCase;
    let mockHealthAggregator: jest.Mocked<HealthAggregator>;

    beforeEach(() => {
        mockHealthAggregator = {
            checkAll: jest.fn(),
            check: jest.fn(),
        } as unknown as jest.Mocked<HealthAggregator>;

        healthUseCase = new HealthUseCase(mockHealthAggregator);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return HEALTH_STATUS_OK when all services are healthy', async () => {
        const mockReports = {
            auth: {
                service: 'auth',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {},
                timestamp: new Date(),
            },
            profile: {
                service: 'profile',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {},
                timestamp: new Date(),
            },
        };

        mockHealthAggregator.checkAll.mockResolvedValue(mockReports);

        const result = await healthUseCase.execute();

        expect(result.service).toBe('gateway');
        expect(result.status).toBe(healthProto.HealthStatus.HEALTH_STATUS_OK);
        expect(result.components.auth).toBe(healthProto.HealthStatus.HEALTH_STATUS_OK);
        expect(result.components.profile).toBe(healthProto.HealthStatus.HEALTH_STATUS_OK);
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(mockHealthAggregator.checkAll).toHaveBeenCalledTimes(1);
    });

    it('should return HEALTH_STATUS_FAIL when any service is unhealthy', async () => {
        const mockReports = {
            auth: {
                service: 'auth',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {},
                timestamp: new Date(),
            },
            profile: null, // Service down
        };

        mockHealthAggregator.checkAll.mockResolvedValue(mockReports);

        const result = await healthUseCase.execute();

        expect(result.status).toBe(healthProto.HealthStatus.HEALTH_STATUS_FAIL);
        expect(result.components.auth).toBe(healthProto.HealthStatus.HEALTH_STATUS_OK);
        expect(result.components.profile).toBe(healthProto.HealthStatus.HEALTH_STATUS_FAIL);
    });

    it('should return HEALTH_STATUS_FAIL when service returns non-OK status', async () => {
        const mockReports = {
            auth: {
                service: 'auth',
                status: healthProto.HealthStatus.HEALTH_STATUS_FAIL,
                components: {},
                timestamp: new Date(),
            },
            profile: {
                service: 'profile',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {},
                timestamp: new Date(),
            },
        };

        mockHealthAggregator.checkAll.mockResolvedValue(mockReports);

        const result = await healthUseCase.execute();

        expect(result.status).toBe(healthProto.HealthStatus.HEALTH_STATUS_FAIL);
        expect(result.components.auth).toBe(healthProto.HealthStatus.HEALTH_STATUS_FAIL);
        expect(result.components.profile).toBe(healthProto.HealthStatus.HEALTH_STATUS_OK);
    });

    it('should handle empty reports', async () => {
        mockHealthAggregator.checkAll.mockResolvedValue({});

        const result = await healthUseCase.execute();

        expect(result.status).toBe(healthProto.HealthStatus.HEALTH_STATUS_OK);
        expect(result.components).toEqual({});
    });
});
