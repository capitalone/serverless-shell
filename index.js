'use strict';

const {spawnSync} = require('child_process');
const {Promise} = require('bluebird');
const _ = require('lodash');

/**
 * Plugin for Serverless 1.x that drops you to a shell with your env vars!
 */
class ServerlessLocalShell {
  /**
   * The plugin constructor
   * @param {Object} serverless
   * @param {Object} options
   * makes
   * @return {undefined}
   */
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider(
        this.serverless.service.provider.name);

    this.commands = {
      'shell': {
        usage: 'Drop to a REPL with your environment variables properly set',
        lifecycleEvents: [
          'shell',
        ],
        options: {
          function: {
            usage:
              'Specify the function whose environment you want (e.g. ' +
              '"--function myFunction")',
            shortcut: 'f',
            required: false,
            type: 'string',
          },
          shell: {
            usage: 'Specify a different shell (e.g. "--shell bash")',
            shortcut: 'S',
            required: false,
            type: 'string',
          },
          quiet: {
            usage:
              `Don't output anay log messages besides the subcommand's output`,
            shortcut: 'q',
            required: false,
            default: false,
            type: 'boolean',
          },
        },
      },
    };

    this.hooks = {
      'shell:shell': () => Promise.bind(this)
          .then(this.loadEnvVars)
          .then(this.shell),
    };
  }

  /**
   * cribbed from serverless's invoke local (except get rid of lodash)
   */
  loadEnvVars() {
    try {
      // from invoke local's extendedValidate
      this.options.functionObj = this.serverless.service.getFunction(
          this.options.function);
    } catch (e) {
      // skip if no function defined
      this.options.functionObj = {};
    }

    const lambdaName = this.options.functionObj.name;
    const memorySize = Number(this.options.functionObj.memorySize) ||
    Number(this.serverless.service.provider.memorySize) ||
    1024;

    const lambdaDefaultEnvVars = {
    // PATH: '/usr/local/lib64/node-v4.3.x/bin:/usr/local/bin:/usr/bin/:/bin',
      LANG: 'en_US.UTF-8',
      LD_LIBRARY_PATH: '/usr/local/lib64/node-v4.3.x/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib', // eslint-disable-line max-len
      LAMBDA_TASK_ROOT: '/var/task',
      LAMBDA_RUNTIME_DIR: '/var/runtime',
      AWS_REGION:
        this.options.region ||
        _.get(this.serverless, 'service.provider.region'),
      AWS_DEFAULT_REGION:
        this.options.region ||
        _.get(this.serverless, 'service.provider.region'),
      AWS_LAMBDA_LOG_GROUP_NAME:
        this.provider.naming.getLogGroupName(lambdaName),
      AWS_LAMBDA_LOG_STREAM_NAME:
      '2016/12/02/[$LATEST]f77ff5e4026c45bda9a9ebcec6bc9cad',
      AWS_LAMBDA_FUNCTION_NAME: lambdaName,
      AWS_LAMBDA_FUNCTION_MEMORY_SIZE: memorySize,
      AWS_LAMBDA_FUNCTION_VERSION: '$LATEST',
      NODE_PATH: '/var/runtime:/var/task:/var/runtime/node_modules',
    };

    const providerEnvVars = this.serverless.service.provider.environment || {};
    const functionEnvVars = this.options.functionObj.environment || {};

    const enterpriseCredsEnvVars = {};
    if (this.serverless.service.provider.name === 'aws') {
      const {cachedCredentials} = this.serverless.getProvider('aws');
      if (cachedCredentials) {
        enterpriseCredsEnvVars.AWS_ACCESS_KEY_ID =
          cachedCredentials.accessKeyId;
        enterpriseCredsEnvVars.AWS_SECRET_ACCESS_KEY =
          cachedCredentials.secretAccessKey;
        enterpriseCredsEnvVars.AWS_SESSION_TOKEN =
          cachedCredentials.sessionToken;
        enterpriseCredsEnvVars.AWS_REGION =
          cachedCredentials.region;
      }
    }

    Object.assign(
        process.env,
        lambdaDefaultEnvVars,
        providerEnvVars,
        functionEnvVars,
        enterpriseCredsEnvVars
    );
  }
  /**
   * load the right environment variables and start shell
   */
  shell() {
    let shellBinary;
    if (this.options.shell) {
      shellBinary = this.options.shell;
    } else if (_.has(this.serverless, 'service.custom.shellBinary')) {
      shellBinary = this.serverless.service.custom.shellBinary;
    } else if (this.serverless.service.provider.runtime.startsWith('nodejs')) {
      shellBinary = 'node';
    } else {
      shellBinary = this.serverless.service.provider.runtime;
    }
    if (!this.options.quiet) {
      this.serverless.cli.log(`Spawning ${shellBinary}...`);
    }
    if (process.env.SLS_DEBUG) {
      // eslint-disable-next-line no-console
      console.log(`Setting env: ${JSON.stringify(process.env, null, 2)}`);
    }
    spawnSync(shellBinary, [], {
      env: process.env,
      stdio: 'inherit',
      shell: true,
    });
  };

  /**
   * get the custom.pythonRequirements contents, with defaults set
   * @return {Object}
   */
  custom() {
    return Object.assign({
      zip: false,
      cleanupZipHelper: true,
    }, this.serverless.service.custom &&
    this.serverless.service.custom.pythonRequirements || {});
  }
}

module.exports = ServerlessLocalShell;
