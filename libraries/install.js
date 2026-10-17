import { installGraphicsLibrary } from './standard/graphics.js';
import { installMathLibrary } from './standard/math.js';
import { installUtilLibrary } from './standard/util.js';
import { installKeyboardLibrary } from './standard/keyboard.js';
import { installMouseLibrary } from './standard/mouse.js';
import { installTypesLibrary } from './standard/types.js';
import { installCalendarLibrary } from './standard/calendar.js';
import { installTextLibrary } from './standard/text.js';
import { installFilesLibrary } from './standard/files.js';
import { installBrowserLibraries } from './browser.js';
import { installExtendedLibraries } from './extended.js';
import { installGraphicsBuffers } from './graphics/buffers.js';
import { installMouseCapture } from './input/mouse-capture.js';
import { installNavigatorLibrary } from './navigator.js';

export function installLibraries(runtime) {
  installGraphicsLibrary(runtime);
  installMathLibrary(runtime);
  installUtilLibrary(runtime);
  installKeyboardLibrary(runtime);
  installMouseLibrary(runtime);
  installTypesLibrary(runtime);
  installCalendarLibrary(runtime);
  installTextLibrary(runtime);
  installFilesLibrary(runtime);
  installBrowserLibraries(runtime);
  installExtendedLibraries(runtime);
  installGraphicsBuffers(runtime);
  installMouseCapture(runtime);
  installNavigatorLibrary(runtime);
}
