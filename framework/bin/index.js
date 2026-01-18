#!/usr/bin/env node

const commander = require('commander');
const fs = require('fs');

const {version} = require('../package.json');
const {SpecLoader} = require('../src');
const {convertOpenApiToAst, printAst} = require('./generateApi');

const program = new commander.Command()
  .name('esoft-service')
  .description('Framework tools')
  .version(version);

const logger = {
  // eslint-disable-next-line no-console
  info: (msg) => console.log(msg),
  // eslint-disable-next-line no-console
  warn: (msg) => console.warn(msg),
  // eslint-disable-next-line no-console
  error: (msg) => console.error(msg)
};

program
  .command('api:type-gen')
  .addOption(new commander.Option('-t, --type <type>')
    .choices(['client', 'server'])
    .default('client'))
  .addOption(new commander.Option('-f, --filename <filename>')
    .default('./types/api.d.ts'))
  .action(async(ctx) => {
    try {
      const loader = new SpecLoader(null, 'spec', {includeRefMetadata: true});
      const spec = await loader.resolve();
      const ast = convertOpenApiToAst(spec, {...ctx, logger});

      // При генерации могут нарушаться многие правила линта в том числе и те, которые
      // не удастся исправить простым способом, поэтому для нового файла выключаем линт
      await fs.promises.writeFile(ctx.filename, `/* eslint-disable */\n${printAst(ast)}`);
      process.exit(0);
    } catch(err) {
      logger.error(err);
      process.exit(1);
    }
  });

(async() => {
  await program.parseAsync();
})();
