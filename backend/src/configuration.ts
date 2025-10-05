import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

/**
 * Load configuration. There are several options. When using yml-files ${ENV_VAR} values will be replaced by its equivalente environment variable or else with an empty string.
 * 1. As default config/dev.settings.yml will be loaded
 * 2. Set NODE_CONFIG environment variable to a JSON string
 * 3. Set NODE_CONFIG_FILE environment variable to a YAML file path
 * 4. Set NODE_ENV to "production" to load config/prod.settings.yml
 * @returns {object} Configuration object
 */
export default () => {
  const REGEX_ENV = /\$\{[^}]*}/gi; // match "${ENV_VAR}"
  //const __dirname = dirname(fileURLToPath(import.meta.url));

  let config = {};

  if (process.env.NODE_CONFIG) {
    config = JSON.parse(process.env.NODE_CONFIG);
  } else {
    let record = '';

    if (process.env.NODE_CONFIG_FILE) record = readFileSync(process.env.NODE_CONFIG_FILE, 'utf8');
    else if (process.env.NODE_ENV === 'production')
      record = readFileSync(join(__dirname, '../../config', 'prod.settings.yml'), 'utf8');
    else record = readFileSync(join(__dirname, '../../config', 'dev.settings.yml'), 'utf8');

    // Replace ${ENV_VAR} values with process.env.ENV_VAR
    const env = process.env;
    record = record.replaceAll(REGEX_ENV, (match) => {
      const key = match.substring(2, match.length - 1);
      return env[key] || '';
    });

    config = parse(record);
  }

  return config;
};
