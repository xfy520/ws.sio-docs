"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wss_plugin_1 = __importDefault(require("wss-plugin"));
const fs_1 = require("fs");
const path_1 = require("path");
const env_schema_1 = __importDefault(require("env-schema"));
exports.default = wss_plugin_1.default((instance, options, done) => {
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
        const nodeEnv = env_schema_1.default(SchemaOptions).NODE_ENV;
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
    const docsDir = path_1.join(rootDir, options.dir || 'apis');
    const readMeFilePath = path_1.join(docsDir, 'README.md');
    if (fs_1.existsSync(docsDir)) {
        const stat = fs_1.statSync(docsDir);
        if (stat.isDirectory()) {
            const deleteDir = (pth) => {
                const dirs = fs_1.readdirSync(pth);
                for (const dir of dirs) {
                    const fullPath = path_1.join(docsDir, dir);
                    const stat1 = fs_1.statSync(fullPath);
                    if (stat1.isDirectory()) {
                        deleteDir(fullPath);
                    }
                    else {
                        fs_1.unlinkSync(fullPath);
                    }
                }
                fs_1.rmdirSync(pth);
            };
            deleteDir(docsDir);
        }
    }
    fs_1.mkdirSync(docsDir);
    fs_1.writeFileSync(readMeFilePath, '# 接口文档 \r\n\r\n');
    instance.addHook('onRoute', (route) => {
        const docs = route.docs || {};
        const schema = route.schema || {};
        const url = route.url.replace(/.:/g, '.@');
        const fileName = url;
        const filePath = path_1.join(docsDir, `${fileName}.md`);
        const relativePath = filePath.replace(docsDir, '.');
        docs.name = docs.name || '未知接口';
        if (fs_1.existsSync(filePath)) {
            return;
        }
        fs_1.writeFileSync(filePath, `# ${docs.name || url} \r\n\r\n`);
        fs_1.appendFileSync(filePath, `${docs.description || docs.desc || ''} \r\n\r\n`);
        fs_1.appendFileSync(filePath, '## 基本 \r\n\r\n');
        fs_1.appendFileSync(filePath, `* **URL**: **${url.replace(/.@/g, '.:')}** \r\n`);
        fs_1.appendFileSync(filePath, '## 参数[body] \r\n\r\n');
        fs_1.appendFileSync(filePath, '```json\r\n');
        fs_1.appendFileSync(filePath, schema.request ? JSON.stringify(schema.request, null, ' ') : '');
        fs_1.appendFileSync(filePath, '\r\n```\r\n\r\n');
        fs_1.appendFileSync(filePath, '## 返回[response] \r\n\r\n');
        fs_1.appendFileSync(filePath, '```json\r\n');
        fs_1.appendFileSync(filePath, schema.response ? JSON.stringify(schema.response, null, ' ') : '');
        fs_1.appendFileSync(filePath, '\r\n```\r\n\r\n');
        fs_1.appendFileSync(readMeFilePath, `* [${docs.name}](${relativePath.replace(/\\/g, '/')})\r\n`);
    });
    done();
}, {
    name: 'wss-docs',
});
