import { useSyncExternalStore } from "react";

import { destinationById, START, type DestinationId, type Vec2 } from "./layout";

// State shared by the 3D scene and the HTML overlay.
//
// Values that change every frame (the car's position and speed) live in plain
// mutable objects so they never cause React renders. Discrete state (where the
// car is parked, where it's driving, which car you picked) goes through a tiny
// subscribable store.

export const VEHICLE_IDS = ["hatchback", "taxi", "jeep", "tempo", "motorbike", "bicycle"] as const;
export type VehicleId = (typeof VEHICLE_IDS)[number];

export interface CityState {
  /** Destination the car is parked at; its panel is open unless dismissed. */
  active: DestinationId | null;
  /** Destination whose panel the visitor closed (cleared on leaving it). */
  dismissed: DestinationId | null;
  /** Where the autopilot is heading, if anywhere. */
  driving: DestinationId | "point" | null;
  /** True once the visitor has driven or picked a destination; hides the welcome. */
  started: boolean;
  vehicle: VehicleId;
}

const initialState: CityState = {
  active: null,
  dismissed: null,
  driving: null,
  started: false,
  vehicle: "hatchback",
};

let state = initialState;
const listeners = new Set<() => void>();

export const cityStore = {
  get: () => state,
  set(patch: Partial<CityState>) {
    const keys = Object.keys(patch) as (keyof CityState)[];
    if (keys.every((k) => patch[k] === state[k])) return;
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useCity<T>(selector: (s: CityState) => T): T {
  return useSyncExternalStore(
    cityStore.subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}

/** The car, updated every frame by <Car>. Heading 0 faces +z (south). */
export const car = {
  x: START.x,
  z: START.z,
  heading: START.heading,
  speed: 0,
  steer: 0,
  /** Metres left on the current route, for the HUD. */
  remaining: 0,
  /** Distance driven so far; spins the wheels and a cyclist's pedals. */
  travelled: 0,
};

export const MIN_ZOOM = 0.6;
export const MAX_ZOOM = 1.8;

/** Camera zoom factor (1 = default distance), eased towards by the camera rig. */
export const view = { zoom: 1 };

export function zoomBy(factor: number) {
  view.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.zoom * factor));
}

// The chosen car is remembered in this browser only.
const VEHICLE_KEY = "st079-vehicle";

export function chooseVehicle(vehicle: VehicleId) {
  cityStore.set({ vehicle });
  try {
    localStorage.setItem(VEHICLE_KEY, vehicle);
  } catch {
    // Storage can be unavailable (private mode); the choice just isn't remembered.
  }
}

export function restoreVehicle() {
  try {
    const saved = VEHICLE_IDS.find((id) => id === localStorage.getItem(VEHICLE_KEY));
    if (saved) cityStore.set({ vehicle: saved });
  } catch {
    // Ignore: fall back to the default car.
  }
}

// Driving requests are picked up by <Car> on its next frame.
export type DriveRequest = { target: Vec2; destination: DestinationId | null } | "stop";
let pending: DriveRequest | null = null;

/** Drive along the paths to a destination's parking spot. */
export function driveTo(id: DestinationId) {
  pending = { target: destinationById[id].spot, destination: id };
  cityStore.set({ started: true });
}

/** Drive along the paths to the point nearest to (x, z). */
export function driveToPoint(x: number, z: number) {
  pending = { target: [x, z], destination: null };
  cityStore.set({ started: true });
}

export function stopDriving() {
  pending = "stop";
}

export function takeDriveRequest() {
  const request = pending;
  pending = null;
  return request;
}
