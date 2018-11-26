import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-re';
import typescript from 'rollup-plugin-typescript';

export default {
  input: './index.ts',
  output: {
    file: './dist/index.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
      preferBuiltins: true
    }),
    replace({
      // ... do replace before commonjs
      patterns: [
        {
          // regexp match with resolved path
          match: /formidable(\/|\\)lib/,
          // string or regexp
          test: 'if (global.GENTLY) require = GENTLY.hijack(require);',
          // string or function to replaced with
          replace: '',
        }
      ]
    }),
    commonjs({
      sourceMap: false,
      include: 'node_modules/**',
      exclude: [ 'node_modules/@types/**' ],
      extensions: [ '.js' ],
      ignoreGlobal: false,
      namedExports: {
        'nem2-sdk': [
          'Account',
          'AccountHttp',
          'Address',
          'AggregateTransaction',
          'Listener',
          'PublicAccount',
          'SignedTransaction',
          'TransactionHttp',
          'MultisigCosignatoryModification',
          'MultisigCosignatoryModificationType',
          'ModifyMultisigAccountTransaction',
          'Deadline',
          'PlainMessage',
          'TransferTransaction',
          'LockFundsTransaction',
          'Mosaic',
          'QueryParams',
          'UInt64',
          'NetworkType',
          'XEM'
        ],
        'lodash': [
          'drop'
        ]
      },
    }),
    json(),
    typescript()
  ]
}