/* jshint ignore:start */
'use strict';

const {spawnSync} = require('child_process');
const repl = require('repl');

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

    if (!_.get(this.serverless.service, 'package.exclude'))
      _.set(this.serverless.service, ['package', 'exclude'], []);
    this.serverless.service.package.exclude.push('.requirements/**');
    if (!_.get(this.serverless.service, 'package.include'))
      _.set(this.serverless.service, ['package', 'include'], []);

    this.commands = {
      'shell': {
         usage: 'Remove .requirements and requirements.zip',
         lifecycleEvents: [
           'shell',
         ],
      },
    };

    this.hooks = {
      'shell:shell': () => BbPromise.bind(this)
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
        this.options.f);
    } catch (e) {
      // skip if no function defined
      this.options.functionObj = {};
    }

    const lambdaName = this.options.functionObj.name;
    const memorySize = Number(this.options.functionObj.memorySize)
    || Number(this.serverless.service.provider.memorySize)
    || 1024;

    const lambdaDefaultEnvVars = {
    PATH: '/usr/local/lib64/node-v4.3.x/bin:/usr/local/bin:/usr/bin/:/bin',
    LANG: 'en_US.UTF-8',
    LD_LIBRARY_PATH: '/usr/local/lib64/node-v4.3.x/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib', // eslint-disable-line max-len
    LAMBDA_TASK_ROOT: '/var/task',
    LAMBDA_RUNTIME_DIR: '/var/runtime',
    AWS_REGION: this.options.region,
    AWS_DEFAULT_REGION: this.options.region,
    AWS_LAMBDA_LOG_GROUP_NAME: this.provider.naming.getLogGroupName(lambdaName),
    AWS_LAMBDA_LOG_STREAM_NAME:
      '2016/12/02/[$LATEST]f77ff5e4026c45bda9a9ebcec6bc9cad',
    AWS_LAMBDA_FUNCTION_NAME: lambdaName,
    AWS_LAMBDA_FUNCTION_MEMORY_SIZE: memorySize,
    AWS_LAMBDA_FUNCTION_VERSION: '$LATEST',
    NODE_PATH: '/var/runtime:/var/task:/var/runtime/node_modules',
    };

    const providerEnvVars = this.serverless.service.provider.environment || {};
    const functionEnvVars = this.options.functionObj.environment || {};

    Object.assign(
      process.env, lambdaDefaultEnvVars, providerEnvVars, functionEnvVars);
  }
  /**
   * load the right environment variables and start shell
   */
  shell() {
    if (this.serverless.service.provider.runtime.startsWith('nodejs')) {
      this.serverless.cli.log(`Dropping to repl...`);
      repl.start();
    } else {
      this.serverless.cli.log(
        `Spawning ${this.serverless.service.provider.runtime}...`);
      spawnSync(this.serverless.service.provider.runtime, [], {
        env: process.env,
        stdio: [0, 0, 0],
      });
    }
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
