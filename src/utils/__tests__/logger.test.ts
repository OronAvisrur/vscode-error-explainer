import { Logger, LogLevel } from '../logger';

describe('Logger', () => {
    let logger: Logger;
    let consoleLogSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        logger = Logger.getInstance();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return singleton instance', () => {
        const instance1 = Logger.getInstance();
        const instance2 = Logger.getInstance();

        expect(instance1).toBe(instance2);
    });

    describe('log levels', () => {
        it('should log debug messages when level is DEBUG', () => {
            logger.setLogLevel(LogLevel.DEBUG);
            logger.debug('test message');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[ErrorExplainer] [DEBUG]',
                'test message'
            );
        });

        it('should log info messages when level is INFO', () => {
            logger.setLogLevel(LogLevel.INFO);
            logger.info('test message');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[ErrorExplainer] [INFO]',
                'test message'
            );
        });

        it('should log warn messages when level is WARN', () => {
            logger.setLogLevel(LogLevel.WARN);
            logger.warn('test message');

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[ErrorExplainer] [WARN]',
                'test message'
            );
        });

        it('should log error messages when level is ERROR', () => {
            logger.setLogLevel(LogLevel.ERROR);
            logger.error('test message');

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[ErrorExplainer] [ERROR]',
                'test message'
            );
        });

        it('should not log debug when level is INFO', () => {
            logger.setLogLevel(LogLevel.INFO);
            logger.debug('test message');

            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it('should not log info when level is WARN', () => {
            logger.setLogLevel(LogLevel.WARN);
            logger.info('test message');

            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it('should not log anything when level is NONE', () => {
            logger.setLogLevel(LogLevel.NONE);
            logger.debug('test');
            logger.info('test');
            logger.warn('test');
            logger.error('test');

            expect(consoleLogSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });

    describe('additional arguments', () => {
        it('should pass additional arguments to console', () => {
            logger.setLogLevel(LogLevel.INFO);
            const obj = { key: 'value' };
            logger.info('test', obj, 123);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[ErrorExplainer] [INFO]',
                'test',
                obj,
                123
            );
        });
    });
});