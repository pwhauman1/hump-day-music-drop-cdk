import { program, command } from 'bandersnatch';
import { copySync, removeSync, existsSync } from 'fs-extra';
import { join } from 'path';

const PATH_TO_LAMBDA_PROJECT = join('src', 'lib', 'lambda-project');
const PATH_TO_CDK_OURDIR = join('build');
const PATH_TO_LAMBDA_PROJECT_OUTDIR = join(PATH_TO_CDK_OURDIR,'lib', 'lambda-project');

const LAMBDA_NODE_MODULES_SRC_PATH = join(PATH_TO_LAMBDA_PROJECT, 'node_modules');
const LAMBDA_NODE_MODULES_TARGET_PATH = join(PATH_TO_LAMBDA_PROJECT_OUTDIR, 'node_modules');

const HANLEBARS_TEMPLATES_SRC_PATH = join(PATH_TO_LAMBDA_PROJECT, 'src', 'templates');
const HANDLEBARS_TEMPLATES_TARGET_PATH = join(PATH_TO_LAMBDA_PROJECT_OUTDIR, 'src', 'templates')

const nukeTarget = (path: string) => {
    console.log(`[INFO] Nuking ${path}`);
    removeSync(path);
}

const copy = (src: string, dest: string) => {
    if(existsSync(dest)) nukeTarget(dest);
    console.log(`[INFO] Copying ${src} into ${dest}`);
    copySync(src, dest);
}

const supplimentalCopyCommnad = command('supplimental-copy')
.description('Copies non-ts assets into our build folder')
.action(() => {
        console.log(`Current Working Directory: ${process.cwd()}`);
        copy(LAMBDA_NODE_MODULES_SRC_PATH, LAMBDA_NODE_MODULES_TARGET_PATH);
        copy(HANLEBARS_TEMPLATES_SRC_PATH, HANDLEBARS_TEMPLATES_TARGET_PATH);
    });

program().default(supplimentalCopyCommnad).run()
