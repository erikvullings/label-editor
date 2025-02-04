import { config } from 'dotenv';
import { resolve } from 'path';
import { Configuration } from '@rspack/cli';
import {
  DefinePlugin,
  HtmlRspackPlugin,
  HotModuleReplacementPlugin,
  SwcJsMinimizerRspackPlugin,
  LightningCssMinimizerRspackPlugin,
} from '@rspack/core';

config();

const isDev = (process.env as any).NODE_ENV === 'development';
const isProduction = !isDev;
const outputPath = resolve(__dirname, isProduction ? '../../docs' : 'dist');
const SERVER = process.env.SERVER || 'localhost';
const publicPath = isProduction ? 'https://erikvullings.github.io/label-editor/' : undefined;
const APP_TITLE = 'Label Editor';
const APP_DESC = 'A webapp for labelling data in your browser, no setup required.';
const APP_PORT = 3366;

console.log(
  `Running in ${
    isProduction ? 'production' : 'development'
  } mode, serving from ${SERVER} and public path ${publicPath}, output directed to ${outputPath}.`
);

const configuration: Configuration = {
  experiments: {
    css: true,
    asyncWebAssembly: true,
  },
  mode: isProduction ? 'production' : 'development',
  entry: {
    main: './src/app.ts',
  },
  devServer: {
    port: APP_PORT,
  },
  plugins: [
    new DefinePlugin({
      'process.env.SERVER': isProduction ? `'${publicPath}'` : '`http://localhost:${APP_PORT}`',
    }),
    new HtmlRspackPlugin({
      title: APP_TITLE,
      publicPath,
      scriptLoading: 'defer',
      minify: isProduction,
      favicon: './src/favicon.ico',
      meta: {
        viewport: 'width=device-width, initial-scale=1',
        'og:title': APP_TITLE,
        'og:description': APP_DESC,
        'og:url': publicPath || '',
        'og:site_name': APP_TITLE,
        'og:image:alt': APP_TITLE,
        'og:image': './src/assets/logo.svg',
        'og:image:type': 'image/svg',
        'og:image:width': '200',
        'og:image:height': '200',
      },
    }),
    new HotModuleReplacementPlugin(),
    new LightningCssMinimizerRspackPlugin({ removeUnusedLocalIdents: true }),
    new SwcJsMinimizerRspackPlugin({
      minimizerOptions: {
        compress: isProduction,
        minify: isProduction,
        // mangle: isProduction,
      },
    }),
  ],
  resolve: {
    extensions: ['...', '.ts', '*.wasm', '*.csv', '*.json'], // "..." means to extend from the default extensions
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              sourceMap: true,
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
              },
              env: {
                targets: ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14'],
              },
            },
          },
        ],
        // options: {
        //   sourceMap: true,
        //   jsc: {
        //     parser: {
        //       syntax: 'typescript',
        //     },
        //   },
        // },
        type: 'javascript/auto',
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /^BUILD_ID$/,
        type: 'asset/source',
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                modifyVars: {
                  // Options
                },
                javascriptEnabled: true,
              },
            },
          },
        ],
        type: 'css', // This is must, which tells rspack this is type of css resources
      },
    ],
  },
  output: {
    filename: '[id].bundle.js',
    // publicPath: '/',
    path: outputPath,
  },
};

export default configuration;
