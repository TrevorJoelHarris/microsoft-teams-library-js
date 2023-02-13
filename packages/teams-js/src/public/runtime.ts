/* eslint-disable @typescript-eslint/ban-types */

import { errorRuntimeNotInitialized, errorRuntimeNotSupported } from '../internal/constants';
import { GlobalVars } from '../internal/globalVars';
import { getLogger } from '../internal/telemetry';
import { compareSDKVersions, deepFreeze } from '../internal/utils';
import { appEntity, conversations, logs, meetingRoom, notifications } from '../private';
import { appInstallDialog } from './appInstallDialog';
import { barCode } from './barCode';
import { calendar } from './calendar';
import { call } from './call';
import { chat } from './chat';
import { HostClientType } from './constants';
import { dialog } from './dialog';
import { geoLocation } from './geoLocation';
import { HostVersionsInfo } from './interfaces';
import { location } from './location';
import { mail } from './mail';
import { menus } from './menus';
import { monetization } from './monetization';
import { pages } from './pages';
import { people } from './people';

const runtimeLogger = getLogger('runtime');

export interface IBaseRuntime {
  readonly apiVersion: number;
  readonly hostVersionsInfo?: HostVersionsInfo;
  readonly isLegacyTeams?: boolean;
  readonly supports?: {};
}

/**
 * Latest runtime interface version
 */
export type Runtime = IRuntimeV2;

export const latestRuntimeApiVersion = 2;

function isLatestRuntimeVersion(runtime: IBaseRuntime): runtime is Runtime {
  return runtime.apiVersion === latestRuntimeApiVersion;
}

interface IRuntimeV1 extends IBaseRuntime {
  readonly apiVersion: 1;
  readonly isLegacyTeams?: boolean;
  readonly supports: {
    readonly appEntity?: {};
    readonly appInstallDialog?: {};
    readonly barCode?: {};
    readonly calendar?: {};
    readonly call?: {};
    readonly chat?: {};
    readonly conversations?: {};
    readonly dialog?: {
      readonly bot?: {};
      readonly update?: {};
    };
    readonly geoLocation?: {
      readonly map?: {};
    };
    readonly location?: {};
    readonly logs?: {};
    readonly mail?: {};
    readonly meetingRoom?: {};
    readonly menus?: {};
    readonly monetization?: {};
    readonly notifications?: {};
    readonly pages?: {
      readonly appButton?: {};
      readonly backStack?: {};
      readonly config?: {};
      readonly currentApp?: {};
      readonly fullTrust?: {};
      readonly tabs?: {};
    };
    readonly people?: {};
    readonly permissions?: {};
    readonly profile?: {};
    readonly remoteCamera?: {};
    readonly search?: {};
    readonly sharing?: {};
    readonly stageView?: {};
    readonly teams?: {
      readonly fullTrust?: {
        readonly joinedTeams?: {};
      };
    };
    readonly teamsCore?: {};
    readonly video?: {};
    readonly webStorage?: {};
  };
}

interface IRuntimeV2 extends IBaseRuntime {
  readonly apiVersion: 2;
  readonly hostVersionsInfo?: HostVersionsInfo;
  readonly isLegacyTeams?: boolean;
  readonly supports: {
    readonly appEntity?: {};
    readonly appInstallDialog?: {};
    readonly barCode?: {};
    readonly calendar?: {};
    readonly call?: {};
    readonly chat?: {};
    readonly conversations?: {};
    readonly dialog?: {
      readonly card?: {
        readonly bot?: {};
      };
      readonly url?: {
        readonly bot?: {};
      };
      readonly update?: {};
    };
    readonly geoLocation?: {
      readonly map?: {};
    };
    readonly location?: {};
    readonly logs?: {};
    readonly mail?: {};
    readonly meetingRoom?: {};
    readonly menus?: {};
    readonly monetization?: {};
    readonly notifications?: {};
    readonly pages?: {
      readonly appButton?: {};
      readonly backStack?: {};
      readonly config?: {};
      readonly currentApp?: {};
      readonly fullTrust?: {};
      readonly tabs?: {};
    };
    readonly people?: {};
    readonly permissions?: {};
    readonly profile?: {};
    readonly remoteCamera?: {};
    readonly search?: {};
    readonly sharing?: {};
    readonly stageView?: {};
    readonly teams?: {
      readonly fullTrust?: {
        readonly joinedTeams?: {};
      };
    };
    readonly teamsCore?: {};
    readonly video?: {};
    readonly webStorage?: {};
  };
}
// Constant used to set the runtime configuration
const _uninitializedRuntime: UninitializedRuntime = {
  apiVersion: -1,
  supports: {},
};

interface UninitializedRuntime extends IBaseRuntime {
  readonly apiVersion: -1;
  readonly supports: {};
}

/**
 * @hidden
 * Ensures that the runtime has been initialized

 * @returns True if the runtime has been initialized
 * @throws Error if the runtime has not been initialized
 *
 * @internal
 * Limited to Microsoft-internal use
 */
export function isRuntimeInitialized(runtime: IBaseRuntime): runtime is Runtime {
  if (isLatestRuntimeVersion(runtime)) {
    return true;
  } else if (runtime.apiVersion === -1) {
    throw new Error(errorRuntimeNotInitialized);
  } else {
    throw new Error(errorRuntimeNotSupported);
  }
}

export let runtime: Runtime | UninitializedRuntime = _uninitializedRuntime;

export const teamsRuntimeConfig: Runtime = {
  apiVersion: 2,
  hostVersionsInfo: undefined,
  isLegacyTeams: true,
  supports: {
    appInstallDialog: {},
    appEntity: {},
    call: {},
    chat: {},
    conversations: {},
    dialog: {
      url: {
        bot: {},
      },
      update: {},
    },
    logs: {},
    meetingRoom: {},
    menus: {},
    monetization: {},
    notifications: {},
    pages: {
      appButton: {},
      tabs: {},
      config: {},
      backStack: {},
      fullTrust: {},
    },
    remoteCamera: {},
    sharing: {},
    stageView: {},
    teams: {
      fullTrust: {},
    },
    teamsCore: {},
    video: {},
  },
};

interface ICapabilityReqs {
  readonly capability: object;
  readonly hostClientTypes: Array<string>;
}

export const v1HostClientTypes = [
  HostClientType.desktop,
  HostClientType.web,
  HostClientType.android,
  HostClientType.ios,
  HostClientType.rigel,
  HostClientType.surfaceHub,
  HostClientType.teamsRoomsWindows,
  HostClientType.teamsRoomsAndroid,
  HostClientType.teamsPhones,
  HostClientType.teamsDisplays,
];

/**
 * @hidden
 * `upgradeToNextVersion` transforms runtime of version `versionToUpgradeFrom` to the next higher version
 *
 * @internal
 * Limited to Microsoft-internal use
 */
interface IRuntimeUpgrade {
  versionToUpgradeFrom: number;
  upgradeToNextVersion: (previousVersionRuntime: IBaseRuntime) => IBaseRuntime;
}

/**
 * @hidden
 * Uses upgradeChain to transform an outdated runtime object to the latest format.
 * @param outdatedRuntime - The runtime object to be upgraded
 * @returns The upgraded runtime object
 * @throws Error if the runtime object could not be upgraded to the latest version
 *
 * @internal
 * Limited to Microsoft-internal use
 */
export function fastForwardRuntime(outdatedRuntime: IBaseRuntime): Runtime {
  let runtime = outdatedRuntime;
  if (runtime.apiVersion < latestRuntimeApiVersion) {
    upgradeChain.forEach((upgrade) => {
      if (runtime.apiVersion === upgrade.versionToUpgradeFrom) {
        runtime = upgrade.upgradeToNextVersion(runtime);
      }
    });
  }
  if (isLatestRuntimeVersion(runtime)) {
    return runtime;
  } else {
    throw new Error('Received a runtime that could not be upgraded to the latest version');
  }
}

/**
 * @hidden
 * List of transformations required to upgrade a runtime object from a previous version to the next higher version.
 * This list must be ordered from lowest version to highest version
 *
 * @internal
 * Limited to Microsoft-internal use
 */
export const upgradeChain: IRuntimeUpgrade[] = [
  // This upgrade has been included for testing, it may be removed when there is a real upgrade implemented
  {
    versionToUpgradeFrom: 1,
    upgradeToNextVersion: (previousVersionRuntime: IRuntimeV1): IRuntimeV2 => {
      return {
        apiVersion: 2,
        hostVersionsInfo: undefined,
        isLegacyTeams: previousVersionRuntime.isLegacyTeams,
        supports: {
          ...previousVersionRuntime.supports,
          dialog: previousVersionRuntime.supports.dialog
            ? {
                card: undefined,
                url: previousVersionRuntime.supports.dialog,
                update: previousVersionRuntime.supports.dialog?.update,
              }
            : undefined,
        },
      };
    },
  },
];

export const versionConstants: Record<string, Array<ICapabilityReqs>> = {
  '1.9.0': [
    {
      capability: { location: {} },
      hostClientTypes: v1HostClientTypes,
    },
  ],
  '2.0.0': [
    {
      capability: { people: {} },
      hostClientTypes: v1HostClientTypes,
    },
  ],
  '2.0.1': [
    {
      capability: { teams: { fullTrust: { joinedTeams: {} } } },
      hostClientTypes: [
        HostClientType.android,
        HostClientType.desktop,
        HostClientType.ios,
        HostClientType.teamsRoomsAndroid,
        HostClientType.teamsPhones,
        HostClientType.teamsDisplays,
        HostClientType.web,
      ],
    },
    {
      capability: { webStorage: {} },
      hostClientTypes: [HostClientType.desktop],
    },
  ],
  '2.0.5': [
    {
      capability: { webStorage: {} },
      hostClientTypes: [HostClientType.android, HostClientType.desktop, HostClientType.ios],
    },
  ],
};

const generateBackCompatRuntimeConfigLogger = runtimeLogger.extend('generateBackCompatRuntimeConfig');
/**
 * @internal
 * Limited to Microsoft-internal use
 *
 * Generates and returns a runtime configuration for host clients which are not on the latest host SDK version
 * and do not provide their own runtime config. Their supported capabilities are based on the highest
 * client SDK version that they can support.
 *
 * @param highestSupportedVersion - The highest client SDK version that the host client can support.
 * @returns runtime which describes the APIs supported by the legacy host client.
 */
export function generateBackCompatRuntimeConfig(highestSupportedVersion: string): Runtime {
  generateBackCompatRuntimeConfigLogger('generating back compat runtime config for %s', highestSupportedVersion);

  let newSupports = { ...teamsRuntimeConfig.supports };

  generateBackCompatRuntimeConfigLogger(
    'Supported capabilities in config before updating based on highestSupportedVersion: %o',
    newSupports,
  );

  Object.keys(versionConstants).forEach((versionNumber) => {
    if (compareSDKVersions(highestSupportedVersion, versionNumber) >= 0) {
      versionConstants[versionNumber].forEach((capabilityReqs) => {
        if (capabilityReqs.hostClientTypes.includes(GlobalVars.hostClientType)) {
          newSupports = {
            ...newSupports,
            ...capabilityReqs.capability,
          };
        }
      });
    }
  });

  const backCompatRuntimeConfig: Runtime = {
    apiVersion: 2,
    isLegacyTeams: true,
    supports: newSupports,
  };

  generateBackCompatRuntimeConfigLogger(
    'Runtime config after updating based on highestSupportedVersion: %o',
    backCompatRuntimeConfig,
  );

  return backCompatRuntimeConfig;
}

const applyRuntimeConfigLogger = runtimeLogger.extend('applyRuntimeConfig');
export function applyRuntimeConfig(runtimeConfig: IBaseRuntime): void {
  // Some hosts that have not adopted runtime versioning send a string for apiVersion, so we should handle those as v1 inputs
  if (typeof runtimeConfig.apiVersion === 'string') {
    applyRuntimeConfigLogger('Trying to apply runtime with string apiVersion, processing as v1: %o', runtimeConfig);
    runtimeConfig = {
      ...runtimeConfig,
      apiVersion: 1,
    };
  }
  applyRuntimeConfigLogger('Fast-forwarding runtime %o', runtimeConfig);
  const ffRuntimeConfig = fastForwardRuntime(runtimeConfig);
  applyRuntimeConfigLogger('Applying runtime %o', ffRuntimeConfig);
  runtime = deepFreeze(ffRuntimeConfig);
}

// // Some entries in supports don't match exactly to a capability name, this map can help keep track of those inconsistencies
// // Should only be needed if top level capability doesn't match name OR if there's a top level supports value with no matching
// // capability (like permissions)
// const capabilityToSupportsNameMapV2 = new Map([
//   // ['appEntity', appEntity as Object],
//   ['appInstallDialog', appInstallDialog as Object],
//   ['barCode', barCode as Object],
//   ['calendar', calendar as Object],
//   ['call', call as Object],
//   ['chat', chat as Object],
//   // ['conversations', conversations as Object],
//   ['dialog', dialog as Object],
//   ['geoLocation', geoLocation as Object],
//   ['location', location as Object],
//   // ['logs', logs as Object],
//   ['mail', mail as Object],
//   // ['meetingRoom', meetingRoom as Object],
//   ['menus', menus as Object],
//   ['monetization', monetization as Object],
//   ['notifications', notifications as Object],
//   ['pages', pages as Object],
//   ['people', pages as Object],
//   ['permissions', undefined], // permissions doesn't map to a capability
// ]);

// // TODO: The top-level capability comments get stripped out of this. These comments may need to live here or be copied here
// // for now
// // I wonder if there's some typedoc fanciness that will let me link to the other comments
// export interface SupportedCapabilities {
//   readonly appEntity: typeof appEntity;
//   readonly appInstallDialog: typeof appInstallDialog;
//   readonly barCode: typeof barCode;
//   readonly calendar: typeof calendar;
//   readonly call: typeof call;
//   readonly chat: typeof chat;
//   readonly conversations: typeof conversations;
//   readonly dialog: typeof dialog;
//   readonly geoLocation: typeof geoLocation;
//   readonly location: typeof location;
//   readonly logs: typeof logs;
//   readonly mail: typeof mail;
//   readonly meetingRoom: typeof meetingRoom;
//   readonly menus: typeof menus;
//   readonly monetization: typeof monetization;
//   readonly notifications: typeof notifications;
//   readonly pages: typeof pages;
//   readonly people: typeof people;
// }

// export function getSupportedCapabilities(runtime: IRuntimeV2): SupportedCapabilities {
//   let supportedCapabilities = {};

//   // Go through each value in the list of capabilities that the host supports, capturing the name and index of each
//   Object.keys(runtime.supports).forEach((capabilityName, capabilityIndex) => {
//     if (capabilityToSupportsNameMapV2.has(capabilityName)) {
//       const capability = capabilityToSupportsNameMapV2.get(capabilityName);
//       if (capability && Object.values(runtime.supports)[capabilityIndex]) {
//         supportedCapabilities = fillOutSupportedCapability(capabilityName, supportedCapabilities, capability);
//       }
//     }

//     // if (capabilityName === 'geoLocation' && Object.values(runtime.supports)[capabilityIndex]) {
//     //   supportedCapabilities = fillOutSupportedCapability(capabilityName, supportedCapabilities, geoLocation);
//     // } else if (capabilityName === 'dialog' && Object.values(runtime.supports)[capabilityIndex]) {
//     //   supportedCapabilities = fillOutSupportedCapability(capabilityName, supportedCapabilities, dialog);
//     // }
//   });

//   return supportedCapabilities as SupportedCapabilities;
// }

// function fillOutSupportedCapability(capabilityName: string, supportedCapabilities: Object, capability: Object): Object {
//   supportedCapabilities[capabilityName] = capability;
//   // Also, think about how to handle things like exported interfaces (which don't show up here)
//   Object.values(capability).forEach((value, index) => {
//     // Make sure that we only recursively check objects that contain definitions for isSupported
//     // (skip functions and enums for example and just leave those alone)
//     if (value && !(value instanceof Function) && value.isSupported) {
//       if (!value.isSupported()) {
//         // if a subcapability is not supported, remove all entries from it other than isSupported and namespaces
//         const subCapability = supportedCapabilities[capabilityName][Object.keys(capability)[index]];
//         Object.values(subCapability).forEach((subCapabilityEntry) => {
//           if (subCapabilityEntry instanceof Function && subCapabilityEntry.name !== 'isSupported') {
//             subCapability[subCapabilityEntry.name] = undefined;
//           }
//         });
//         supportedCapabilities[capabilityName][Object.keys(capability)[index]] = subCapability;
//       }

//       // recursively check subcapability for more subcapabilities
//       fillOutSupportedCapability(Object.keys(capability)[index], supportedCapabilities[capabilityName], value);
//     }
//   });
//   return supportedCapabilities;
// }

export function setUnitializedRuntime(): void {
  runtime = deepFreeze(_uninitializedRuntime);
}

/**
 * @hidden
 * Constant used to set minimum runtime configuration
 * while un-initializing an app in unit test case.
 *
 * @internal
 * Limited to Microsoft-internal use
 */
export const _minRuntimeConfigToUninitialize: Runtime = {
  apiVersion: 2,
  supports: {
    pages: {
      appButton: {},
      tabs: {},
      config: {},
      backStack: {},
      fullTrust: {},
    },
    teamsCore: {},
    logs: {},
  },
};
