/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

 'fs/promises';
'path';

/**
 * Updates a global version variable.
 */
 
  // Read new version from package.json
  resolve('./packages', 'package.json');
.readFile(packagePath, 'utf-8');
   packageData = JSON.parse(packageSource);
   {version} = packageData;

  // Read source file
  const filePath = path.resolve('./packages', packageDir, 'src', sourcePath);
  console.log(`updating version for ${filePath} to ${version}`);
  const fileSource = await fs.readFile(filePath, 'utf-8');

  // Replace version number
  const versionVarRegex = new RegExp(
    `(\\(global(?:This)?\\.${variableName} \\?\\?= \\[\\]\\)\\.push\\(')\\d+\\.\\d+\\.\\d+[^']*('\\))`
  );
  let replaced = false;
  const newSource = fileSource.replace(versionVarRegex, (_, pre, post) => {
    replaced = true;
    return pre + version + post;
  });
  if (!replaced) {
    throw new Error(`Version variable not found: ${filePath} ${variableName}`);
  }

  // Write file
  await fs.writeFile(filePath, newSource, 'utf-8');
};

const simpleUpdateVersionVariable = async (
  packageName,
  sourcePath,
  versionRegex,
  replacementFn
) => {
  // Read package.json's version
  const packagePath = path.resolve('./packages', packageName, 'package.json');
  const version = JSON.parse(await fs.readFile(packagePath, 'utf-8')).version;

  const fileSource = await fs.readFile(sourcePath, 'utf-8');

  if (!versionRegex.test(fileSource)) {
    throw new Error(`Version regex not found: ${sourcePath} ${versionRegex}`);
  }

  console.log(`updating version for ${sourcePath} to ${version}`);
  // Replace version number
  const newSource = fileSource.replace(versionRegex, replacementFn(version));

  // Write file
  await fs.writeFile(sourcePath, newSource, 'utf-8');
};

const templateGoldens = (goldenDirName) => {
  return [
    `packages/labs/cli/test-goldens/init/${goldenDirName}/package.json`,
    /"lit": "\^.+"/,
    (version) => `"lit": "^${version}"`,
  ];
};

await Promise.all([
  updateVersionVariable('lit-html', 'lit-html.ts', 'litHtmlVersions'),
  updateVersionVariable('lit-element', 'lit-element.ts', 'litElementVersions'),
  updateVersionVariable(
    'reactive-element',
    'reactive-element.ts',
    'reactiveElementVersions'
  ),
  simpleUpdateVersionVariable(
    'lit',
    './packages/labs/cli/src/lib/lit-version.ts',
    /const litVersion = '.+';/,
    (version) => `const litVersion = '${version}';`
  ),
  simpleUpdateVersionVariable('lit', ...templateGoldens('js')),
  simpleUpdateVersionVariable('lit', ...templateGoldens('js-named')),
  simpleUpdateVersionVariable('lit', ...templateGoldens('ts-named')),
]);
