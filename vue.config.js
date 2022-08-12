const { defineConfig } = require('@vue/cli-service')
const path = require('path')
module.exports = defineConfig({
	transpileDependencies: true,
	pluginOptions: {
		electronBuilder: {
			builderOptions: {
				productName: '查價',
				// appId: 'zhou.electron.price-check', // 認證的 appId
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
				}
			},
			nodeIntegration: true,

		}
	}
})
