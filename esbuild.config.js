// esbuild.config.js
import * as esbuild from 'esbuild';
import { glob } from 'glob';

const isProd = process.env.NODE_ENV === 'production';

const componentEntries = await glob('./assets/js/components/**/*.js', {
    ignore: ['**/node_modules/**'],
    absolute: false,
    cwd: process.cwd()
});

async function build() {
    try {
        const ctx = await esbuild.context({
            entryPoints: [
                './assets/js/gsap/gsap.js',
                './assets/js/alpine/alpine.js',
                ...componentEntries
            ],
            bundle: true,
            sourcemap: !isProd,
            minify: isProd,
            outdir: 'static/js',
            entryNames: '[dir]/[name]',
            logLevel: 'debug',
            metafile: true,
        });

        const result = await ctx.rebuild();
        if (result.metafile) {
            console.log('Build analysis:', await esbuild.analyzeMetafile(result.metafile));
        }

        // Enable watch mode only in development
        if (isProd) {
            // Dispose of contexts in production
            // otherwise docker build will fail
            await ctx.dispose();
        } else {
            await ctx.watch();
            console.log('👀 Watching for changes...');
        }
    } catch (err) {
        console.error("Build failed: ", err);
        process.exit(1);
    }
}

build().then(() => console.log("Compiled successfully!"));