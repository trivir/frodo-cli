const path = require('path');

module.exports = {
  entry: './src/app.ts',
  mode: 'production',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      'assert': false,
      'async_hooks': false,
      'buffer': false,
      'child_process': false,
      'constants': false,
      'crypto': false,
      'events': false,
      'fs': false,
      'http': false,
      'https': false,
      'net': false,
      'os': false,
      'path': false,
      'process': false,
      'querystring': false,
      'readline': false,
      'stream': false,
      'stream-http': false,
      'timers': false,
      'tls': false,
      'tty': false,
      'url': false, // temporary
      'util': false,
      'zlib': false,
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
