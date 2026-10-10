import * as healthProto from '../../../contracts/proto/common/health';
import * as emptyProto from '../../../contracts/proto/common/empty';
import HealthAggregator from './health.aggregator';
import {GrpcClientManager} from '@shared/grpc-client-manager';

// Mock the microservices config
jest.mock('../../../infrastructure/grpc/config/microservices.config', () => ({
    auth: {url: 'localhost:50051'},
    profile: {url: 'localhost:50052'},
}));

jest.mock('@shared/grpc-client-manager');
jest.mock('@shared/logger');

describe('HealthAggregator', () => {
    let healthAggregator: HealthAggregator;
    let mockGrpcClientManager: jest.Mocked<GrpcClientManager<healthProto.HealthClient>>;
    let mockHealthClient: jest.Mocked<healthProto.HealthClient>;

    beforeEach(() => {
        mockHealthClient = {
            check: jest.fn(),
        } as unknown as jest.Mocked<healthProto.HealthClient>;

        mockGrpcClientManager = {
            call: jest.fn(),
        } as unknown as jest.Mocked<GrpcClientManager<healthProto.HealthClient>>;

        (GrpcClientManager as jest.Mock).mockImplementation(() => mockGrpcClientManager);

        healthAggregator = new HealthAggregator();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create managers for all configured services', () => {
        expect(GrpcClientManager).toHaveBeenCalledTimes(2); // auth and profile
    });

    describe('check', () => {
        it('should return health report when service is healthy', async () => {
            const mockReport: healthProto.HealthReport = {
                service: 'auth',
                status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                components: {db: healthProto.HealthStatus.HEALTH_STATUS_OK},
                timestamp: new Date(),
            };

            mockGrpcClientManager.call.mockResolvedValue(mockReport);

            const result = await healthAggregator.check('auth');

            expect(result).toEqual(mockReport);
            expect(mockGrpcClientManager.call).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should return null when service check fails', async () => {
            mockGrpcClientManager.call.mockRejectedValue(new Error('Connection failed'));

            const result = await healthAggregator.check('auth');

            expect(result).toBeNull();
        });

        it('should throw error for unknown service', async () => {
            await expect(healthAggregator.check('unknown')).rejects.toThrow("Unknown service 'unknown'");
        });
    });

    describe('checkAll', () => {
        it('should return reports for all services', async () => {
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

            mockGrpcClientManager.call
                .mockResolvedValueOnce(mockReports.auth)
                .mockResolvedValueOnce(mockReports.profile);

            const result = await healthAggregator.checkAll();

            expect(result.auth).toEqual(mockReports.auth);
            expect(result.profile).toEqual(mockReports.profile);
        });

        it('should include null for failed services', async () => {
            mockGrpcClientManager.call
                .mockResolvedValueOnce({
                    service: 'auth',
                    status: healthProto.HealthStatus.HEALTH_STATUS_OK,
                    components: {},
                    timestamp: new Date(),
                })
                .mockRejectedValueOnce(new Error('Connection failed'));

            const result = await healthAggregator.checkAll();

            expect(result.auth).not.toBeNull();
            expect(result.profile).toBeNull();
        });
    });
});
