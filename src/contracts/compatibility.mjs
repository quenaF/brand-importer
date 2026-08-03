function major(version) {
  const match = String(version ?? '').match(/^(?:[~^])?(\d+)\./);
  return match ? Number(match[1]) : null;
}

export function isContractCompatible(actualVersion, acceptedRange) {
  const actualMajor = major(actualVersion);
  const acceptedMajor = major(acceptedRange);
  return actualMajor !== null && acceptedMajor !== null && actualMajor === acceptedMajor;
}

export function validateAdapterCompatibility({ runtimeBrand, experienceProfile, adapterManifest }) {
  const errors = [];
  if (!isContractCompatible(runtimeBrand?.contractVersion, adapterManifest?.accepts?.runtimeBrand)) {
    errors.push(`Runtime Brand ${runtimeBrand?.contractVersion ?? 'unknown'} is incompatible with adapter range ${adapterManifest?.accepts?.runtimeBrand ?? 'unknown'}.`);
  }
  if (!isContractCompatible(experienceProfile?.profileVersion, adapterManifest?.accepts?.experienceProfile)) {
    errors.push(`Experience Profile ${experienceProfile?.profileVersion ?? 'unknown'} is incompatible with adapter range ${adapterManifest?.accepts?.experienceProfile ?? 'unknown'}.`);
  }
  if (adapterManifest?.fallbackPolicy?.exampleTenantFallback !== 'forbidden') {
    errors.push('Domain Adapter must explicitly forbid example-tenant fallback.');
  }
  const supported = new Set(adapterManifest?.capabilities ?? []);
  const requested = new Set(experienceProfile?.brandInfluence ?? []);
  const unsupportedRequestedCapabilities = [...requested].filter((capability) => !supported.has(capability));
  return {
    compatible: errors.length === 0,
    errors,
    unsupportedRequestedCapabilities
  };
}
