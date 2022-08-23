const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
	transpileDependencies: true,
	pluginOptions: {
		electronBuilder: {
			builderOptions: {
				productName: '查價',
				appId: 'com.electron.price-check', // 認證的 appId
				publish: ['github'],
				artifactName: '${productName}${version}.${ext}',
				copyright: 'Copyright©2022 zhou',
				npmRebuild: false,
				win: {
					icon: 'public/MavenOrb256.ico',
					requestedExecutionLevel: "highestAvailable",
					target: ['nsis']
				},
				nsis: {
					oneClick: false,
					perMachine: false,
					allowToChangeInstallationDirectory: true,
					installerIcon: 'public/MavenOrb256.ico',
					uninstallerIcon: 'public/MavenOrb256.ico',
					createDesktopShortcut: true,
				}
			},
			nodeIntegration: true,
		}
	},
	chainWebpack: config => {
		config.module
			.rule("vue")
			.use("vue-loader")
			.tap((options) => {
				options.compilerOptions = {
					...(options.compilerOptions),
					isCustomElement: (tag) => (tag === 'webview'),
				};
				return options;
			});
	}

})
