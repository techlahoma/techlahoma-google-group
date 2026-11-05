import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';

const candidates =
  process.platform === 'darwin'
    ? [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        join(
          homedir(),
          'Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        ),
      ]
    : process.platform === 'win32'
      ? [
          process.env.PROGRAMFILES,
          process.env['PROGRAMFILES(X86)'],
          process.env.LOCALAPPDATA,
        ]
          .filter((directory): directory is string => Boolean(directory))
          .map(directory =>
            join(directory, 'Google/Chrome/Application/chrome.exe'),
          )
      : [Bun.which('google-chrome'), Bun.which('google-chrome-stable')].filter(
          (executable): executable is string => Boolean(executable),
        );
const executable = candidates.find(candidate => existsSync(candidate));
if (!executable) {
  process.stderr.write(
    'Installed Google Chrome was not found. Install regular Chrome; do not download Chrome for Testing.\n',
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Installed Google Chrome is available at ${executable}. No browser was launched or downloaded.\n`,
  );
}
