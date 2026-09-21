// app/_utils/pagePermissions.ts
// Central definition of the vitals-flow test tabs and their permission keys.
// Order here IS the flow order: rapid -> eye -> colorblind -> hearing -> symptoms (vitals step 2).

export type TestTab = 'rapid' | 'eye' | 'colorblind' | 'hearing';

export const TEST_TAB_SEQUENCE: { tab: TestTab; permissionKey: string }[] = [
  { tab: 'rapid', permissionKey: 'rapidTesting' },
  { tab: 'eye', permissionKey: 'eyeTesting' },
  { tab: 'colorblind', permissionKey: 'colorBlindTesting' },
  { tab: 'hearing', permissionKey: 'hearingTesting' },
];

export function getNextTestTab(
  currentTab: TestTab,
  permissions: Record<string, boolean>
): TestTab | 'vitals' {
  const currentIndex = TEST_TAB_SEQUENCE.findIndex((t) => t.tab === currentTab);
  for (let i = currentIndex + 1; i < TEST_TAB_SEQUENCE.length; i++) {
    if (permissions[TEST_TAB_SEQUENCE[i].permissionKey]) {
      return TEST_TAB_SEQUENCE[i].tab;
    }
  }
  return 'vitals';
}

export function getPrevTestTab(
  currentTab: TestTab,
  permissions: Record<string, boolean>
): TestTab | 'vitals-step1' {
  const currentIndex = TEST_TAB_SEQUENCE.findIndex((t) => t.tab === currentTab);
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (permissions[TEST_TAB_SEQUENCE[i].permissionKey]) {
      return TEST_TAB_SEQUENCE[i].tab;
    }
  }
  return 'vitals-step1';
}

export function getFirstTestTab(permissions: Record<string, boolean>): TestTab | 'vitals' {
  const first = TEST_TAB_SEQUENCE.find((t) => permissions[t.permissionKey]);
  return first ? first.tab : 'vitals';
}