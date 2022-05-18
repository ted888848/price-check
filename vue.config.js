const { defineConfig } = require('@vue/cli-service')
const path=require('path')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
		electronBuilder: {
			builderOptions: {
				productName: '查價', 
				artifactName: '${productName}${version}.${ext}',
				copyright: 'Copyright©2022 zhou',
				npmRebuild: false,
				win: {
					icon: 'public/MavenOrb256.ico',
					target: ['portable']
				},
				nsis: {
					oneClick: false, 
					perMachine: false, 
					allowToChangeInstallationDirectory: true, 
					createDesktopShortcut: true,
					createStartMenuShortcut: false,
					installerIcon: 'public/MavenOrb256.ico',
					language: '1028'
				}
			},
			nodeIntegration: true,
		}
	}
})
