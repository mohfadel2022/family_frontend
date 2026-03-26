const fs = require('fs');
const path = require('path');

const dirs = [
  'd:/QwenCoder/familiy2/frontend/src/app',
  'd:/QwenCoder/familiy2/frontend/src/components'
];

function replaceInFile(filePath) {
  let original = fs.readFileSync(filePath, 'utf8');
  let txt = original;

  // Backgrounds
  txt = txt.replace(/\bbg-white\b/g, 'bg-card');
  txt = txt.replace(/\bbg-slate-50\/50\b/g, 'bg-muted/30');
  txt = txt.replace(/\bbg-slate-50\/80\b/g, 'bg-muted/40');
  txt = txt.replace(/\bbg-slate-50\b/g, 'bg-muted/50');
  txt = txt.replace(/\bbg-slate-100\/50\b/g, 'bg-accent/50');
  txt = txt.replace(/\bbg-slate-100\b/g, 'bg-accent');
  
  // Borders
  txt = txt.replace(/\bborder-slate-50\b/g, 'border-border/50');
  txt = txt.replace(/\bborder-slate-100\/50\b/g, 'border-border/50');
  txt = txt.replace(/\bborder-slate-100\/80\b/g, 'border-border/80');
  txt = txt.replace(/\bborder-slate-100\b/g, 'border-border');
  txt = txt.replace(/\bborder-slate-200\b/g, 'border-input');
  
  // Text
  txt = txt.replace(/\btext-slate-950\b/g, 'text-foreground');
  txt = txt.replace(/\btext-slate-900\b/g, 'text-foreground');
  txt = txt.replace(/\btext-slate-800\b/g, 'text-foreground/90');
  txt = txt.replace(/\btext-slate-700\b/g, 'text-foreground/80');
  txt = txt.replace(/\btext-slate-600\b/g, 'text-muted-foreground');
  txt = txt.replace(/\btext-slate-500\b/g, 'text-muted-foreground/80');
  txt = txt.replace(/\btext-slate-400\b/g, 'text-muted-foreground/60');
  txt = txt.replace(/\btext-slate-300\b/g, 'text-muted-foreground/40');
  txt = txt.replace(/\btext-slate-200\b/g, 'text-muted-foreground/20');

  // Shadows
  txt = txt.replace(/\bshadow-slate-200\/50\b/g, 'shadow-slate-900/5');
  txt = txt.replace(/\bshadow-slate-100\b/g, 'shadow-sm');
  txt = txt.replace(/\bshadow-slate-200\b/g, 'shadow-md');

  // Hover states
  txt = txt.replace(/\bhover:bg-slate-50\b/g, 'hover:bg-muted/50');
  txt = txt.replace(/\bhover:bg-slate-100\b/g, 'hover:bg-accent');
  txt = txt.replace(/\bhover:bg-slate-200\b/g, 'hover:bg-accent/80');
  txt = txt.replace(/\bhover:text-slate-900\b/g, 'hover:text-foreground');
  txt = txt.replace(/\bhover:border-slate-200\b/g, 'hover:border-input');

  // Special case: text-white on color backgrounds might be replaced incorrectly if they were somehow text-white, but we didn't touch text-white. We only touched bg-white.
  
  if (original !== txt) {
    fs.writeFileSync(filePath, txt, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

for (const dir of dirs) {
  traverseDir(dir);
}

console.log('All done!');
