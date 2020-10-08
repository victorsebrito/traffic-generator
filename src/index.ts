import { Command, flags } from '@oclif/command'
import Module from './module';
import api from './api';
import * as socket from './socket';
import * as http from 'http';
import DiameterModule from './modules/diameter/module';
import loggerConfig from './logger';
import * as winston from 'winston';
import * as path from 'path';
import config, { setConfigPath } from './config';

process.on("unhandledRejection", (err) => {
  winston.error(err);
});

class TrafficSimulator extends Command {
  static flags = {
    configPath: flags.string({
      char: 'c',
      default: path.join(process.cwd(), 'config')
    }),
    port: flags.integer({
      char: 'p',
      default: 8746
    }),
    // add --version flag to show CLI version
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' })
  }

  static async registerModule(name: string, module: Module) {
    if (module.apiRouter) {
      api.use(`/${name}`, module.apiRouter);
    }
    if (module.socketHandler) {
      socket.handlers[name] = module.socketHandler;
    }
    if (module.onRegistered) {
      module.onRegistered(config(`${name}.json`));
    }
  }

  async run() {
    const { flags } = this.parse(TrafficSimulator);
    setConfigPath(flags.configPath);    
    const server = http.createServer(api);
    
    winston.configure(loggerConfig);

    await TrafficSimulator.registerModule('diameter', DiameterModule);

    socket.bind(server);
    server.listen(flags.port, () => {
      winston.info(`Server running on ${flags.port}`);
    });
  }
}

export = TrafficSimulator