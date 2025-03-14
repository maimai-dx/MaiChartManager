import { computed } from "vue";
import { modInfo } from "@/store/refs";

function compareVersions(v1: string, v2: string) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0; // Default value is 0
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;  // v1 is greater than v2
    if (num1 < num2) return -1; // v1 is less than v2
  }

  return 0; // v1 is equal to v2
}

export const shouldShowUpdate = computed(() => {
  if (!modInfo.value?.aquaMaiInstalled) return true;
  if (!modInfo.value?.aquaMaiVersion) return true;
  let currentVersion = modInfo.value.aquaMaiVersion;
  if (currentVersion.includes('-')) {
    currentVersion = currentVersion.split('-')[0];
  }
  return compareVersions(currentVersion, modInfo.value!.bundledAquaMaiVersion!) < 0;
})
