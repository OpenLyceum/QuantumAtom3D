/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { Property } from "scenerystack/axon";
import { HBox, RichText } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Dialog, onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { ComboBox, RectangularPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { AngularMomentumScreen } from "./angular-momentum/AngularMomentumScreen.js";
import { initializeGpuContext } from "./common/gpu/GpuContext.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS } from "./common/QuantumAtom3DButtonOptions.js";
import { StringManager } from "./i18n/StringManager.js";
import { OrbitalsScreen } from "./orbitals/OrbitalsScreen.js";
import { OscillatorScreen } from "./oscillator/OscillatorScreen.js";
import { QuantumAtom3DPreferencesModel } from "./preferences/QuantumAtom3DPreferencesModel.js";
import { QuantumAtom3DPreferencesNode } from "./preferences/QuantumAtom3DPreferencesNode.js";
import quantumAtom3DQueryParameters from "./preferences/quantumAtom3DQueryParameters.js";
import QuantumAtom3DColors from "./QuantumAtom3DColors.js";
import { SuperpositionScreen } from "./superposition/SuperpositionScreen.js";
import { ZeemanScreen } from "./zeeman/ZeemanScreen.js";

onReadyToLaunch(async () => {
  await initializeGpuContext(quantumAtom3DQueryParameters.forceCpu);
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from quantumAtom3DQueryParameters.
  const simPreferences = new QuantumAtom3DPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new OrbitalsScreen({
      preferences: simPreferences,
      name: stringManager.getScreenNames().orbitalsStringProperty,
      tandem: Tandem.ROOT.createTandem("orbitalsScreen"),
      backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
    }),
    new SuperpositionScreen({
      preferences: simPreferences,
      name: stringManager.getScreenNames().superpositionStringProperty,
      tandem: Tandem.ROOT.createTandem("superpositionScreen"),
      backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
    }),
    new AngularMomentumScreen({
      name: stringManager.getScreenNames().angularMomentumStringProperty,
      tandem: Tandem.ROOT.createTandem("angularMomentumScreen"),
      backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
    }),
    new ZeemanScreen({
      name: stringManager.getScreenNames().zeemanStringProperty,
      tandem: Tandem.ROOT.createTandem("zeemanScreen"),
      backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
    }),
    new OscillatorScreen({
      preferences: simPreferences,
      name: stringManager.getScreenNames().oscillatorStringProperty,
      tandem: Tandem.ROOT.createTandem("oscillatorScreen"),
      backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new QuantumAtom3DPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  // The framework footer follows the desktop scale. Supply full-size portrait navigation without
  // reaching into its private NavigationBar. These controls and their listeners live for the sim.
  let mobileSettings: Dialog | null = null;
  const mobileStrings = stringManager.getOrbitalStrings().mobile;
  let toolsReady = false;
  sim.screenBoundsProperty.lazyLink((bounds) => {
    if (!bounds || toolsReady) {
      return;
    }
    toolsReady = true;
    for (const screen of screens) {
      if (!sim.simScreens.includes(screen)) {
        continue;
      }
      const selected = new Property(sim.simScreens[0] ?? screen);
      sim.selectedScreenProperty.link((value) => {
        if (sim.simScreens.includes(value)) {
          selected.value = value;
        }
      });
      selected.lazyLink((value) => {
        sim.selectedScreenProperty.value = value;
      });
      const label = (text: import("scenerystack/axon").TReadOnlyProperty<string>) =>
        new RichText(text, {
          font: new PhetFont(13),
          fill: QuantumAtom3DColors.controlSurfaceTextColorProperty,
          maxWidth: 165,
        });
      const selector = new ComboBox(
        selected,
        sim.simScreens.map((value) => ({ value, createNode: () => label(value.nameProperty) })),
        screen.view,
        {
          accessibleName: mobileStrings.screenStringProperty,
        },
      );
      const settings = new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: label(mobileStrings.settingsStringProperty),
        accessibleName: mobileStrings.settingsStringProperty,
        listener: () => {
          mobileSettings ??= new Dialog(new QuantumAtom3DPreferencesNode(simPreferences, undefined, true), {
            accessibleName: mobileStrings.settingsStringProperty,
            layoutBounds: null,
            layoutStrategy: (dialog, _bounds, screenBounds) => {
              dialog.setScaleMagnitude(
                Math.min(
                  1,
                  (screenBounds.width - 24) / dialog.localBounds.width,
                  (screenBounds.height - 24) / dialog.localBounds.height,
                ),
              );
              dialog.center = screenBounds.center;
            },
          });
          mobileSettings.show();
        },
      });
      screen.view.setPortraitTools(new HBox({ spacing: 12, children: [selector, settings] }));
    }
  });
  sim.start();
});
