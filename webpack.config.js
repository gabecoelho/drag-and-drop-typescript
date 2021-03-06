const path = require('path');

module.exports = {
	mode: 'development',
	entry: './src/app.ts',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: 'dist'
	},
	devtool: 'inline-source-map',
	module: {
		rules: [
			{
				test: /\.ts$/, //Check for files that end with .ts
				use: 'ts-loader', // Any .ts file should be handled by the ts-loader module
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: ['.ts', '.js']
	}
}