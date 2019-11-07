import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json'
// import uglify from 'rollup-plugin-uglify';

import bundleSize from 'rollup-plugin-bundle-size';

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
        cjs(),
        bundleSize()
    ]
};