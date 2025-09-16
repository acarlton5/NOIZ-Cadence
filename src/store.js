import { create } from "zustand";

import PocketBase from "pocketbase";
import { MeshStandardMaterial } from "three";
import { randInt } from "three/src/math/MathUtils.js";

const LAYER_KEYS = [
  "layer",
  "layerId",
  "layer_id",
  "layerName",
  "layer_name",
  "layerKey",
  "layer_key",
  "layerGroup",
  "layer_group",
  "layerCategory",
  "layer_category",
  "layerSlug",
  "layer_slug",
];

const resolveLayerValues = (value) => {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => resolveLayerValues(entry));
  }

  if (typeof value === "string" || typeof value === "number") {
    return [value];
  }

  if (typeof value === "object") {
    if ("id" in value && value.id) {
      return [value.id];
    }
    if ("name" in value && value.name) {
      return [value.name];
    }
    if ("slug" in value && value.slug) {
      return [value.slug];
    }
  }

  return [];
};

const getLayerIdsFrom = (item) => {
  if (!item) {
    return [];
  }

  if (typeof item === "string" || typeof item === "number") {
    return [item];
  }

  for (const key of LAYER_KEYS) {
    const layerValues = resolveLayerValues(item[key]);
    if (layerValues.length > 0) {
      return layerValues;
    }
  }

  if (item.expand?.layer) {
    const expandedLayers = resolveLayerValues(item.expand.layer);
    if (expandedLayers.length > 0) {
      return expandedLayers;
    }
  }

  return [];
};

const getLayerIds = (asset, category) => {
  const assetLayers = getLayerIdsFrom(asset);
  if (assetLayers.length > 0) {
    return assetLayers;
  }
  return getLayerIdsFrom(category);
};

const resolveGroupIdentifier = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    if ("id" in value && value.id) {
      return resolveGroupIdentifier(value.id);
    }
    if ("group" in value && value.group) {
      return resolveGroupIdentifier(value.group);
    }
    if ("name" in value && value.name) {
      return resolveGroupIdentifier(value.name);
    }
    if ("slug" in value && value.slug) {
      return resolveGroupIdentifier(value.slug);
    }
  }

  return null;
};

const findCategoryByIdentifier = (categories, identifier) => {
  if (identifier === null || identifier === undefined) {
    return null;
  }

  const normalized =
    typeof identifier === "string" ? identifier : String(identifier);

  return (
    categories.find((category) => category.id === normalized) ??
    categories.find((category) => category.name === normalized) ??
    categories.find((category) => category.slug === normalized)
  );
};

const clearLayerConflicts = (
  customization,
  categories,
  targetCategoryName,
  targetLayers
) => {
  if (!targetLayers || targetLayers.length === 0) {
    return customization;
  }

  const layerSet = new Set(targetLayers);
  let updated = customization;

  categories.forEach((category) => {
    if (category.name === targetCategoryName) {
      return;
    }

    const existingEntry = updated[category.name];
    if (!existingEntry?.asset) {
      return;
    }

    const existingLayers = getLayerIds(existingEntry.asset, category);
    if (existingLayers.some((layer) => layerSet.has(layer))) {
      if (updated === customization) {
        updated = { ...customization };
      }

      updated[category.name] = {
        ...existingEntry,
        asset: null,
      };
    }
  });

  return updated;
};

const applyLayerRules = (customization, categories) => {
  let updated = customization;
  const seenLayers = new Map();

  categories.forEach((category) => {
    const entry = updated[category.name];
    if (!entry?.asset) {
      return;
    }

    const layers = getLayerIds(entry.asset, category);
    if (layers.length === 0) {
      return;
    }

    const hasConflict = layers.some((layer) => {
      const keeper = seenLayers.get(layer);
      return keeper && keeper !== category.name;
    });

    if (hasConflict) {
      if (updated === customization) {
        updated = { ...customization };
      }

      const existingEntry = updated[category.name];
      updated[category.name] = {
        ...existingEntry,
        asset: null,
      };
      return;
    }

    layers.forEach((layer) => {
      seenLayers.set(layer, category.name);
    });
  });

  return updated;
};

const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL;
if (!pocketBaseUrl) {
  throw new Error("VITE_POCKETBASE_URL is required");
}

export const PHOTO_POSES = {
  Idle: "Idle",
  Chill: "Chill",
  Cool: "Cool",
  Punch: "Punch",
  Ninja: "Ninja",
  King: "King",
  Busy: "Busy",
};

export const UI_MODES = {
  PHOTO: "photo",
  CUSTOMIZE: "customize",
};

export const pb = new PocketBase(pocketBaseUrl);

export const useConfiguratorStore = create((set, get) => ({
  loading: true,
  mode: UI_MODES.CUSTOMIZE,
  setMode: (mode) => {
    set({ mode });
    if (mode === UI_MODES.CUSTOMIZE) {
      set({ pose: PHOTO_POSES.Idle });
    }
  },
  pose: PHOTO_POSES.Idle,
  setPose: (pose) => set({ pose }),
  categories: [],
  currentCategory: null,
  assets: [],
  lockedGroups: {},
  skin: new MeshStandardMaterial({ color: 0xf5c6a5, roughness: 1 }),
  customization: {},
  download: () => {},
  setDownload: (download) => set({ download }),
  screenshot: () => {},
  setScreenshot: (screenshot) => set({ screenshot }),
  updateColor: (color) => {
    set((state) => ({
      customization: {
        ...state.customization,
        [state.currentCategory.name]: {
          ...state.customization[state.currentCategory.name],
          color,
        },
      },
    }));
    if (get().currentCategory.name === "Head") {
      get().updateSkin(color);
    }
  },
  updateSkin: (color) => {
    get().skin.color.set(color);
  },
  fetchCategories: async () => {
    // you can also fetch all records at once via getFullList
    const categories = await pb.collection("CustomizationGroups").getFullList({
      sort: "+position",
      expand: "colorPalette,cameraPlacement",
    });
    const assets = await pb.collection("CustomizationAssets").getFullList({
      sort: "-created",
    });
    const customization = {};
    categories.forEach((category) => {
      category.assets = assets.filter((asset) => asset.group === category.id);

      const defaultColor = category.expand?.colorPalette?.colors?.[0] || "";
      const categoryCustomization = {
        color: defaultColor,
      };

      let defaultAsset = null;
      if (category.startingAsset) {
        defaultAsset = category.assets.find(
          (asset) => asset.id === category.startingAsset
        );
      }

      if (!defaultAsset) {
        defaultAsset =
          category.assets.find((asset) => asset?.isDefault) ??
          category.assets.find((asset) => asset?.type === "avatar") ??
          (!category.removable && category.assets.length > 0
            ? category.assets[0]
            : null);
      }

      if (defaultAsset) {
        categoryCustomization.asset = defaultAsset;
      }

      customization[category.name] = categoryCustomization;
    });

    const normalizedCustomization = applyLayerRules(customization, categories);

    const headColor =
      normalizedCustomization.Head?.color ??
      normalizedCustomization.head?.color;
    if (headColor) {
      get().updateSkin(headColor);
    }

    set({
      categories,
      currentCategory: categories[0],
      assets,
      customization: normalizedCustomization,
      loading: false,
    });
    get().applyLockedAssets();
  },
  setCurrentCategory: (category) => set({ currentCategory: category }),
  changeAsset: (categoryName, asset) => {
    set((state) => {
      const nextCustomization = {
        ...state.customization,
        [categoryName]: {
          ...state.customization[categoryName],
          asset,
        },
      };

      if (asset === null || asset === undefined) {
        return { customization: nextCustomization };
      }

      const targetCategory = state.categories.find(
        (category) => category.name === categoryName
      );
      const targetLayers = getLayerIds(asset, targetCategory);

      return {
        customization: clearLayerConflicts(
          nextCustomization,
          state.categories,
          categoryName,
          targetLayers
        ),
      };
    });
    get().applyLockedAssets();
  },
  randomize: () => {
    const categories = get().categories;
    const customization = {};

    categories.forEach((category) => {
      const availableAssets = category.assets || [];
      let randomAsset = null;

      if (availableAssets.length > 0) {
        randomAsset =
          availableAssets[randInt(0, availableAssets.length - 1)];

        if (category.removable && randInt(0, availableAssets.length) === 0) {
          randomAsset = null;
        }
      }

      const paletteColors = category.expand?.colorPalette?.colors;
      const randomColor =
        paletteColors && paletteColors.length > 0
          ? paletteColors[randInt(0, paletteColors.length - 1)]
          : "";

      customization[category.name] = {
        asset: randomAsset,
        color: randomColor,
      };
    });

    const normalizedCustomization = applyLayerRules(
      customization,
      categories
    );

    const headColor =
      normalizedCustomization.Head?.color ??
      normalizedCustomization.head?.color;
    if (headColor) {
      get().updateSkin(headColor);
    }

    set({ customization: normalizedCustomization });
    get().applyLockedAssets();
  },

  applyLockedAssets: () => {
    const customization = get().customization;
    const categories = get().categories;
    const lockedGroups = {};

    Object.entries(customization).forEach(([categoryName, entry]) => {
      const asset = entry.asset;
      if (!asset?.lockedGroups) {
        return;
      }

      const lockingCategory =
        findCategoryByIdentifier(categories, asset.group) ??
        categories.find((category) => category.name === categoryName);
      const lockingCategoryName = lockingCategory?.name ?? categoryName;

      const groupEntries = Array.isArray(asset.lockedGroups)
        ? asset.lockedGroups
        : [asset.lockedGroups];

      groupEntries.forEach((group) => {
        const identifier = resolveGroupIdentifier(group);
        if (!identifier) {
          return;
        }

        const targetCategory = findCategoryByIdentifier(categories, identifier);
        if (!targetCategory) {
          return;
        }

        if (targetCategory.name === lockingCategoryName) {
          return;
        }

        if (!lockedGroups[targetCategory.name]) {
          lockedGroups[targetCategory.name] = [];
        }

        const alreadyLocked = lockedGroups[targetCategory.name].some(
          (lockedEntry) =>
            lockedEntry.name === asset.name &&
            lockedEntry.categoryName === lockingCategoryName
        );

        if (!alreadyLocked) {
          lockedGroups[targetCategory.name].push({
            name: asset.name,
            categoryName: lockingCategoryName,
          });
        }
      });
    });

    set({ lockedGroups });
  },
}));

useConfiguratorStore.getState().fetchCategories();
