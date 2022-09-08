const path = require('path');

// JS, HTML & CSS minification
const TerserPlugin = require("terser-webpack-plugin");

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

// Mobile/PWA offline access
const WorkboxPlugin = require('workbox-webpack-plugin');

const config = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|json)$/i,
        type: 'asset/resource',
        generator: {
            publicPath: '',
            filename: '[file]'
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "style.css",
      chunkFilename: "[id].css",
    }),
    new HtmlWebpackPlugin({
        title: 'Output Management',
        template: './public/index.html',
        favicon: './public/favicon.ico'
    }),
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
}

module.exports = (env, argv) => {

  // Add service worker for offline access via caching if building for prod
  if (argv.mode === 'production') {
    config.plugins.push(
      new WorkboxPlugin.GenerateSW({
        // Default settings, serve from cache first and avoid multiple SWs from running at same time
        clientsClaim: true,
        skipWaiting: true,

        // Serve from cache and update from network after
        runtimeCaching: [
          {
            urlPattern: RegExp('(.*?)'),
            handler: "StaleWhileRevalidate"
          } 
        ]
      }),
    );
  }

  return config;
};