# Serverless Shell

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![npm](https://nodei.co/npm/serverless-shell.png?mini=true)](https://www.npmjs.com/package/serverless-shell)

A Serverless v1.x plugin to drop to a local shell with your environment
variables from `serverless.yml`.


## Install

```
npm install --save serverless-shell
```

Add the plugin and set some env vars in your `serverless.yml`:

```yaml
provider:
  name: aws
  environment:
    SOME_VAR: foobar
plugins:
  - serverless-shell
```

## Usage
Example in a python project
```
$ serverless shell
Serverless: Spawning python3.6...
Python 3.6.1 (default, Mar 22 2017, 06:17:05) 
[GCC 6.3.0 20170321] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import os
>>> os.environ['SOME_VAR']
'foobar'
```
and in a NodeJS project:
```
$ serverless shell
Serverless: Spawning node...
> process.env.SHELL
'foobar'
```

### Per function & stage specific env vars
Since the main reason for building this was to test code with the configs for
various stages, it supports properly building the environment. For example:
```
$ serverless -s staging shell -f status
```

## Custom shell (babel) support
If you want to launch a different shell than the runtime's default, you can
specify that with in the `custom` section of your config. This can be used
to for things like using `babel-node` instead of `node` or even dropping to
`bash` with the right env vars set.

Example:
```
  custom:
    shellBinary: babel-node
```

This feature can also be activated by a CLI switch:
```
$ sls shell -S bash
```
