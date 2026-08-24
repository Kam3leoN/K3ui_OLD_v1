/**
 * Tests unitaires pour LoggerManager
 * @description Tests de toutes les fonctionnalités du gestionnaire de logs
 */

import { LoggerManager, LogLevel } from '../../src/core/managers/LoggerManager';

/** Vérifie le message formaté actuel (`K3UI | LEVEL: … | métadonnées`). */
function expectFormattedLog(
    spy: jest.SpyInstance,
    level: string,
    message: string,
    ...extraArgs: unknown[]
): void {
    const expected = extraArgs.length > 0
        ? [expect.stringContaining(`${level}: ${message}`), ...extraArgs]
        : [expect.stringContaining(`${level}: ${message}`)];
    expect(spy).toHaveBeenCalledWith(...expected);
}

describe('LoggerManager', () => {
    let logger: LoggerManager;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        // Créer une nouvelle instance pour chaque test
        logger = new LoggerManager({
            level: LogLevel.DEBUG,
            prefix: '[TEST]',
            type: 'Component',
            timestamp: false,
            colors: false
        });

        // Spy sur console pour vérifier les appels
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'info').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'debug').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Construction et configuration', () => {
        test('devrait créer une instance avec les options par défaut', () => {
            const defaultLogger = new LoggerManager();
            expect(defaultLogger).toBeInstanceOf(LoggerManager);
        });

        test('devrait accepter des options personnalisées', () => {
            const customLogger = new LoggerManager({
                level: LogLevel.WARN,
                prefix: '[CUSTOM]',
                timestamp: true,
                colors: true
            });
            expect(customLogger).toBeInstanceOf(LoggerManager);
        });
    });

    describe('Niveaux de log', () => {
        test('devrait logger DEBUG quand le niveau est DEBUG', () => {
            logger.setLevel(LogLevel.DEBUG);
            logger.debug('Message debug');
            expectFormattedLog(console.debug as jest.SpyInstance, 'DEBUG', 'Message debug');
        });

        test('devrait logger INFO quand le niveau est INFO', () => {
            logger.setLevel(LogLevel.INFO);
            logger.info('Message info');
            expectFormattedLog(console.info as jest.SpyInstance, 'INFO', 'Message info');
        });

        test('devrait logger WARN quand le niveau est WARN', () => {
            logger.setLevel(LogLevel.WARN);
            logger.warn('Message warning');
            expectFormattedLog(console.warn as jest.SpyInstance, 'WARN', 'Message warning');
        });

        test('devrait logger ERROR quand le niveau est ERROR', () => {
            logger.setLevel(LogLevel.ERROR);
            logger.error('Message error');
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('ERROR: Message error'));
        });

        test('ne devrait pas logger DEBUG quand le niveau est INFO', () => {
            logger.setLevel(LogLevel.INFO);
            logger.debug('Message debug');
            expect(console.debug).not.toHaveBeenCalled();
        });

        test('ne devrait pas logger INFO quand le niveau est WARN', () => {
            logger.setLevel(LogLevel.WARN);
            logger.info('Message info');
            expect(console.info).not.toHaveBeenCalled();
        });

        test('ne devrait pas logger WARN quand le niveau est ERROR', () => {
            logger.setLevel(LogLevel.ERROR);
            logger.warn('Message warning');
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('ne devrait pas logger ERROR quand le niveau est NONE', () => {
            logger.setLevel(LogLevel.NONE);
            logger.error('Message error');
            expect(console.error).not.toHaveBeenCalled();
        });
    });

    describe('Méthodes de log spécialisées', () => {
        test('devrait logger SUCCESS avec le bon format', () => {
            logger.setLevel(LogLevel.INFO);
            logger.success('Opération réussie');
            expectFormattedLog(console.info as jest.SpyInstance, 'SUCCESS', 'Opération réussie');
        });

        test('devrait gérer les arguments supplémentaires', () => {
            logger.setLevel(LogLevel.INFO);
            logger.info('Message avec', 'arguments', { data: 'test' });
            expectFormattedLog(console.info as jest.SpyInstance, 'INFO', 'Message avec', 'arguments', { data: 'test' });
        });
    });

    describe('Gestion des groupes', () => {
        test('devrait créer un groupe de logs', () => {
            const groupSpy = jest.spyOn(console, 'group').mockImplementation();
            logger.setLevel(LogLevel.INFO);
            logger.group('Groupe de test');
            expect(groupSpy).toHaveBeenCalledWith('Groupe de test');
        });

        test('devrait créer un groupe collapsé', () => {
            const groupCollapsedSpy = jest.spyOn(console, 'groupCollapsed').mockImplementation();
            logger.setLevel(LogLevel.INFO);
            logger.group('Groupe collapsé', true);
            expect(groupCollapsedSpy).toHaveBeenCalledWith('Groupe collapsé');
        });

        test('devrait fermer un groupe', () => {
            const groupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
            logger.setLevel(LogLevel.INFO);
            logger.groupEnd();
            expect(groupEndSpy).toHaveBeenCalled();
        });
    });

    describe('Méthodes utilitaires', () => {
        test('devrait logger une table', () => {
            const tableSpy = jest.spyOn(console, 'table').mockImplementation();
            logger.setLevel(LogLevel.INFO);
            const data = [{ id: 1, name: 'Test' }];
            logger.table(data);
            expect(tableSpy).toHaveBeenCalledWith(data, undefined);
        });

        test('devrait logger une table avec colonnes spécifiques', () => {
            const tableSpy = jest.spyOn(console, 'table').mockImplementation();
            logger.setLevel(LogLevel.INFO);
            const data = [{ id: 1, name: 'Test' }];
            const columns = ['id'];
            logger.table(data, columns);
            expect(tableSpy).toHaveBeenCalledWith(data, columns);
        });

        test('devrait logger un objet avec label', () => {
            logger.setLevel(LogLevel.INFO);
            const obj = { test: 'data' };
            logger.object(obj, 'Mon objet');
            expect(console.log).toHaveBeenCalledWith('[TEST] Mon objet:', obj);
        });

        test('devrait logger un objet sans label', () => {
            logger.setLevel(LogLevel.INFO);
            const obj = { test: 'data' };
            logger.object(obj);
            expect(console.log).toHaveBeenCalledWith('[TEST] Object:', obj);
        });
    });

    describe('Mesure de temps', () => {
        test('devrait démarrer un timer', () => {
            const timeSpy = jest.spyOn(console, 'time').mockImplementation();
            logger.setLevel(LogLevel.INFO);
            logger.time('test-timer');
            expect(timeSpy).toHaveBeenCalledWith('[TEST] test-timer');
        });

        test('devrait arrêter un timer', () => {
            const timeEndSpy = jest.spyOn(console, 'timeEnd').mockImplementation();
            logger.setLevel(LogLevel.INFO);
            logger.timeEnd('test-timer');
            expect(timeEndSpy).toHaveBeenCalledWith('[TEST] test-timer');
        });
    });

    describe('Configuration dynamique', () => {
        test('devrait changer le niveau de log', () => {
            logger.setLevel(LogLevel.WARN);
            logger.info('Ne devrait pas apparaître');
            expect(console.info).not.toHaveBeenCalled();

            logger.setLevel(LogLevel.INFO);
            logger.info('Devrait apparaître');
            expectFormattedLog(console.info as jest.SpyInstance, 'INFO', 'Devrait apparaître');
        });

        test('devrait changer le préfixe', () => {
            logger.setPrefix('[NEW]');
            logger.info('Message avec nouveau préfixe');
            expect(console.info).toHaveBeenCalledWith(expect.stringContaining('INFO: Message avec nouveau préfixe'));
        });

        test('devrait activer/désactiver les timestamps', () => {
            logger.setTimestamp(true);
            // Note: Le test du timestamp nécessiterait de mocker Date
            logger.info('Message avec timestamp');
            expect(console.info).toHaveBeenCalled();
        });

        test('devrait activer/désactiver les couleurs', () => {
            logger.setColors(true);
            logger.info('Message avec couleurs');
            expect(console.info).toHaveBeenCalled();
        });
    });

    describe('Méthodes statiques', () => {
        test('devrait créer une instance avec create()', () => {
            const customLogger = LoggerManager.create('[STATIC]', { level: LogLevel.WARN });
            expect(customLogger).toBeInstanceOf(LoggerManager);
        });

        test('devrait avoir une instance globale', () => {
            expect(LoggerManager.global).toBeInstanceOf(LoggerManager);
        });
    });

    describe('Cas limites', () => {
        test('devrait gérer les messages vides', () => {
            logger.setLevel(LogLevel.INFO);
            logger.info('');
            expectFormattedLog(console.info as jest.SpyInstance, 'INFO', '');
        });

        test('devrait gérer les messages avec caractères spéciaux', () => {
            logger.setLevel(LogLevel.INFO);
            logger.info('Message avec émojis 🚀 et caractères spéciaux @#$%');
            expectFormattedLog(console.info as jest.SpyInstance, 'INFO', 'Message avec émojis 🚀 et caractères spéciaux @#$%');
        });

        test('devrait gérer les objets complexes', () => {
            logger.setLevel(LogLevel.INFO);
            const complexObj = {
                nested: { deep: { value: 'test' } },
                array: [1, 2, 3],
                func: () => 'test'
            };
            logger.info('Objet complexe', complexObj);
            expectFormattedLog(console.info as jest.SpyInstance, 'INFO', 'Objet complexe', complexObj);
        });
    });
});
