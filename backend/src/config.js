export const HOST = '127.0.0.1';
export const PORT = 3000;
export const FRONTEND_ROOT = 'frontend';

const OPTION_PATTERN = /^--([^=]+)(?:=(.*))?$/;

function readValue(argv, index, key, inlineValue) {
  if (inlineValue !== undefined) {
    return inlineValue;
  }

  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`Missing value for --${key}`);
  }

  return value;
}

export function resolveConfig(argv = []) {
  if (!Array.isArray(argv)) {
    throw new TypeError('argv must be an array of command-line arguments');
  }

  const config = {
    HOST,
    PORT,
    FRONTEND_ROOT
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (typeof argument !== 'string') {
      throw new TypeError('Each command-line argument must be a string');
    }

    const match = OPTION_PATTERN.exec(argument);
    if (!match) {
      throw new Error(`Unsupported argument: ${argument}`);
    }

    const key = match[1];
    const inlineValue = match[2];

    switch (key) {
      case 'root': {
        const root = readValue(argv, index, key, inlineValue);
        if (!root) {
          throw new Error('--root must not be empty');
        }
        config.FRONTEND_ROOT = root;
        if (inlineValue === undefined) {
          index += 1;
        }
        break;
      }
      case 'port': {
        const rawPort = readValue(argv, index, key, inlineValue);
        if (!/^\d+$/.test(rawPort)) {
          throw new Error(`Invalid port: ${rawPort}`);
        }

        const port = Number(rawPort);
        if (!Number.isInteger(port) || port < 0 || port > 65535) {
          throw new Error(`Port must be between 0 and 65535: ${rawPort}`);
        }

        config.PORT = port;
        if (inlineValue === undefined) {
          index += 1;
        }
        break;
      }
      case 'host': {
        const host = readValue(argv, index, key, inlineValue);
        if (!host) {
          throw new Error('--host must not be empty');
        }
        config.HOST = host;
        if (inlineValue === undefined) {
          index += 1;
        }
        break;
      }
      default:
        throw new Error(`Unsupported option: --${key}`);
    }
  }

  return config;
}
