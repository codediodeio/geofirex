// rollup.config.js
import bundleSize from 'rollup-plugin-bundle-size';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

import pkg from './package.json';

const globals = {
    rxjs: 'rxjs',
    'rxjs/operators': 'rxjs.operators',
}
const external = ['firebase/app', 'rxjs', 'rxjs/operators', 'firebase']

export default {
    input: './src/index.ts',
    output: [{
            file: pkg.main,
            format: 'cjs',
            name: 'gfx',

        },
        {
            file: pkg.module,
            format: 'es',
            name: 'gfx',
            globals,
        }
    ],
    external,
    plugins: [
        typescript(),
        resolve({
            only: [/^@turf\/.*$/]
        }),
        commonjs(),
        bundleSize()
    ]
};