const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const locations = {
  LogicCard: 'components/ui',
  OpponentCard: 'components/ui',
  BluffModal: 'components/modals',
  TruthTableProcessor: 'components/modals',
  RouletteScreen: 'components/modals',
  SurvivalReliefOverlay: 'components/modals',
  DoubtCalledOverlay: 'components/modals',
  SettingsInstructionsPanel: 'components/modals',
  PlayerEliminatedScreen: 'components/screens',
  VictoryScreen: 'components/screens',
  MainMenu: 'pages',
  Lobby: 'pages',
  MatchLobby: 'pages',
  GamePage: 'pages'
};

function getRelativePath(fromPath, targetModule) {
  const fromDir = path.dirname(fromPath);
  const targetDir = path.join(srcDir, locations[targetModule]);
  let rel = path.relative(fromDir, targetDir).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel + '/' + targetModule;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      Object.keys(locations).forEach(module => {
        // Regex para match imports falsos antigos como import { X } from "./X" ou "./components/X"
        // como os arquivos foram movidos, às vezes as paths originais eram "./ComponentName"
        const regex1 = new RegExp(`from\\s+['"]\\.[^'"]*${module}['"]`, 'g');
        if (regex1.test(content)) {
            const correctPath = getRelativePath(fullPath, module);
            content = content.replace(regex1, `from "${correctPath}"`);
            changed = true;
        }
      });

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated imports in ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log("Done fixing imports!");
