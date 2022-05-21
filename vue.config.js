const { defineConfig } = require('@vue/cli-service')
const path=require('path')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
		electronBuilder: {
			builderOptions: {
				productName: '查價', 
				// appId: 'your.id', // 認證的 appId
				artifactName: '${productName}${version}.${ext}',
				copyright: 'Copyright©2022 zhou',
				npmRebuild: false,
				win: {
					icon: 'public/MavenOrb256.ico',
					requestedExecutionLevel: "highestAvailable",
					target: ['portable'],
				}
			},
			nodeIntegration: true,
		}
	}
})
