const path = require("path");
module.exports = {
	pluginOptions: {
		electronBuilder: {
			// mainProcessFile: 'src/background.js', // 主進程進入點
			//rendererProcessFile: 'src/myMainRenderFile.js', // 渲染進程進入點
			// outputDir: 'electron-builder-output-dir', // 編譯資料夾
			//preload: 'src/preload.js', // preload 檔案位置
			builderOptions: {
				// asar: false, // 是否使用 asar 壓縮檔案
				// appId: 'your.id', // 認證的 appId
				productName: '查價', // 專案名稱
				artifactName: '${productName}${version}.${ext}', // 檔案名稱樣板，有 ESLint 記得關掉
				copyright: 'Copyright©2022 zhou', // 版權
				// Windows 相關設定
				npmRebuild: false,
				win: {
					// legalTrademarks: 'legalTrademarks', // 商標
					icon: 'public/MavenOrb256.ico',
					target: ['portable']
				},

				nsis: {
					oneClick: false, // 是否一鍵安裝
					perMachine: false, // 是否為每一台機器安裝
					allowToChangeInstallationDirectory: true, // 是否可更改安裝目錄
					createDesktopShortcut: true, // 是否建立桌面捷徑
					createStartMenuShortcut: false,
					installerIcon: 'public/MavenOrb256.ico',
					language: '1028'
				}
			},
			nodeIntegration: true,
			//preload: 'src/preload.js'
		}
	},
	// chainWebpack: config => {
	//   config.resolve.alias
	//     .set('@', resolve('src'))
	// }
	configureWebpack: {
		resolve: {
			alias: {
				"@": path.join(__dirname, 'src')
			},
			extensions: ['.js', '.vue', '.json']
		}
	}
}