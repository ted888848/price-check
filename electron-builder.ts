import { Configuration } from 'electron-builder'

export default {
  'appId': 'com.electron.price-check',
  'asar': true,
  'icon': 'public/SextantOrb256.ico',
  'directories': {
    'output': 'release/${version}'
  },
  'files': [
    'dist-electron',
    'dist'
  ],
  'artifactName': '${productName}${version}.${ext}',
  'copyright': 'Copyright©2024 zhou',
  'publish': [
    'github'
  ],
  'win': {
    'requestedExecutionLevel': 'requireAdministrator',
    'target': [
      {
        'target': 'nsis',
        'arch': [
          'x64'
        ]
      }
    ]
  },
  'nsis': {
    'oneClick': false,
    'perMachine': false,
    'allowToChangeInstallationDirectory': true,
    'createDesktopShortcut': true,
    'installerIcon': 'public/SextantOrb256.ico',
    'uninstallerIcon': 'public/SextantOrb256.ico',
    'deleteAppDataOnUninstall': true
  },
  'electronLanguages': [
    'zh-TW',
    'en-US'
  ]
} satisfies Configuration