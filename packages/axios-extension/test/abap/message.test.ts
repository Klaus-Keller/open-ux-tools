import type { ErrorMessage, SuccessMessage } from '../../src';
import { prettyPrintError, prettyPrintMessage, prettyPrintTimeInMs } from '../../src';
import { ToolsLogger } from '@sap-ux/logger';

describe('message helpers', () => {
    const log = new ToolsLogger();
    const host = 'http://host.example';

    describe('prettyPrintMessage', () => {
        test('convert JSON into messages', () => {
            const msg: SuccessMessage = {
                code: '200',
                message: '~message',
                'longtext_url': '/abc/de',
                details: [
                    { code: '1', message: '~message', severity: 'info' },
                    { code: '2', message: '~message', severity: 'warning' }
                ]
            };

            const infoMock = (log.info = jest.fn());
            const warningMock = (log.warn = jest.fn());
            prettyPrintMessage({ msg: JSON.stringify(msg), log, host });
            // log main message, two messages for the full url, and each detail
            expect(infoMock).toBeCalledTimes(4);
            expect(warningMock).toBeCalledTimes(1);
        });

        test('log none JSON message for debugging', () => {
            const msg = '<xml>~message</xml>';
            const debugMock = (log.debug = jest.fn());
            prettyPrintMessage({ msg, log, host });
            expect(debugMock).toBeCalledWith(msg);
        });
    });

    test('prettyPrintError', () => {
        const error: ErrorMessage = {
            code: '500',
            message: {
                value: '~message'
            },
            innererror: {
                transactionid: '~id',
                timestamp: '~time',
                'Error_Resolution': {
                    abc: '~message',
                    def: '~message'
                },
                errordetails: [
                    {
                        code: '1',
                        message: '~message',
                        severity: 'error',
                        longtext_url: '~longtext_url'
                    },
                    { code: '2', message: '~message', severity: 'error' }
                ]
            }
        };
        const errorMock = (log.error = jest.fn());
        const infoMock = (log.info = jest.fn());
        prettyPrintError({ error, log, host });
        // log message, each resolution and each error detail
        expect(errorMock).toBeCalledTimes(
            1 + Object.keys(error.innererror.Error_Resolution).length + error.innererror.errordetails.length
        );
        expect(infoMock).toBeCalledTimes(2);

        // Restrict to only errordetails, typical for deployment with test mode enabled
        errorMock.mockReset();
        infoMock.mockReset();
        prettyPrintError({ error, log, host }, false);
        expect(errorMock).toBeCalledTimes(Object.keys(error.innererror.Error_Resolution).length);
        expect(infoMock).toBeCalledTimes(2);
        expect(infoMock).toHaveBeenLastCalledWith(expect.stringMatching('http://host.example/~longtext_url'));

        delete error.message;
        delete error.innererror;
        errorMock.mockReset();
        infoMock.mockReset();
        prettyPrintError({ error, log, host });
        expect(errorMock).toBeCalledTimes(1);
        expect(infoMock).toBeCalledTimes(0);
    });

    test('prettyPrintTimeInMs', () => {
        // time in seconds
        expect(prettyPrintTimeInMs(7.5 * 1000)).toBe('7.5 seconds');
        // exactly one minute
        expect(prettyPrintTimeInMs(60 * 1000)).toBe('1 minute');
        // more than a minute rounded down
        expect(prettyPrintTimeInMs(13 * 60 * 1000 + 123)).toBe('13 minutes');
    });
});
