import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PATHS = {
    APP_STATE: path.resolve(__dirname, '..', '..', 'data', 'app_config.json'),
    LOGO_CACHE_DIR: path.resolve(__dirname, '..', '..',  'images'),
    UI_DIST: path.resolve(__dirname, '..', '..', 'ui', 'dist', 'ui', 'browser'),
};
