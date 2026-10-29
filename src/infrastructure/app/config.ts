export const appConfig = {
    appName: process.env.APP_NAME ?? 'gateway',
    appVersion: process.env.APP_VERSION ?? 'undefined',
    appEnv: process.env.APP_ENV ?? 'production',
    get debugLogEnabled() {
        return process.env.DEBUG_LOG_ENABLED === 'true';
    },
};

export default appConfig;
