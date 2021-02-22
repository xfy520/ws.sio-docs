// @ts-ignore
import plugin from 'wss-plugin';
import {
  appendFileSync, existsSync, statSync, readdirSync, unlinkSync, rmdirSync, mkdirSync, writeFileSync,
} from 'fs';
import { join } from 'path';
import envSchema from 'env-schema';

type routeOptionsType = {
  url: string,
  schema?: {
    request?: object,
    response?: object,
  },
  docs?: {
    name?: string,
    desc?: string,
    description?: string;
  }
}

export default plugin((instance, options, done) => {
  const isProd = () => {
    const SchemaOptions = {
      dotenv: true,
      schema: {
        type: 'object',
        properties: {
          NODE_ENV: {
            type: 'string',
          },
        },
      },
    };
    const nodeEnv = envSchema(SchemaOptions).NODE_ENV;
    return nodeEnv === 'production' || nodeEnv === 'prod';
  };

  if (isProd()) {
    instance.name ? instance.$log.info('Running in production environment, skipping the generate api docs') : instance.nsp.$log.info('Running in production environment, skipping the generate api docs');
    done();
    return;
  }

  if (options.enable === false) {
    instance.name ? instance.$log.info('skipping the generate api docs') : instance.nsp.$log.info('skipping the generate api docs');
    done();
    return;
  }

  const rootDir = process.cwd();
  const docsDir = join(rootDir, options.dir || 'apis');
  const readMeFilePath = join(docsDir, 'README.md');

  if (existsSync(docsDir)) {
    const stat = statSync(docsDir);
    if (stat.isDirectory()) {
      const deleteDir = (pth) => {
        const dirs = readdirSync(pth);
        // eslint-disable-next-line no-restricted-syntax
        for (const dir of dirs) {
          const fullPath = join(docsDir, dir);
          const stat1 = statSync(fullPath);
          if (stat1.isDirectory()) {
            deleteDir(fullPath);
          } else {
            unlinkSync(fullPath);
          }
        }
        rmdirSync(pth);
      };
      deleteDir(docsDir);
    }
  }
  mkdirSync(docsDir);
  writeFileSync(readMeFilePath, '# 接口文档 \r\n\r\n');

  instance.addHook('onRoute', (route: routeOptionsType) => {
    const docs = route.docs || {};
    const schema = route.schema || {};
    const url = route.url.replace(/.:/g, '.@');
    const fileName = url;
    const filePath = join(docsDir, `${fileName}.md`);
    const relativePath = filePath.replace(docsDir, '.');
    docs.name = docs.name || '未知接口';
    if (existsSync(filePath)) {
      return;
    }
    writeFileSync(filePath, `# ${docs.name || url} \r\n\r\n`);
    appendFileSync(filePath, `${docs.description || docs.desc || ''} \r\n\r\n`);
    appendFileSync(filePath, '## 基本 \r\n\r\n');
    appendFileSync(filePath, `* **URL**: **${url.replace(/.@/g, '.:')}** \r\n`);

    appendFileSync(filePath, '## 参数[body] \r\n\r\n');
    appendFileSync(filePath, '```json\r\n');
    appendFileSync(filePath, schema.request ? JSON.stringify(schema.request, null, ' ') : '');
    appendFileSync(filePath, '\r\n```\r\n\r\n');
    appendFileSync(filePath, '## 返回[response] \r\n\r\n');
    appendFileSync(filePath, '```json\r\n');
    appendFileSync(filePath, schema.response ? JSON.stringify(schema.response, null, ' ') : '');
    appendFileSync(filePath, '\r\n```\r\n\r\n');
    appendFileSync(readMeFilePath, `* [${docs.name}](${relativePath.replace(/\\/g, '/')})\r\n`);
  });
  done();
}, {
  name: 'wss-docs',
});
