/**
 * Configuración extra de Vitest (angular.json → test.options.runnerConfig).
 * Limita los workers y amplía el timeout para equipos modestos y WSL.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    maxWorkers: 2,
    testTimeout: 20_000,
  },
});
