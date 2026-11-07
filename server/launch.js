export const LAUNCH_START = Date.parse('2026-11-16T00:00:00+01:00');
export const LAUNCH_END = Date.parse('2026-12-01T00:00:00+01:00');
export const LAUNCH_PRICE = 5990;
export const LAUNCH_VERSION = 'plate4-launch-2026-11';

export function launchPrice(env, now = Date.now()) {
 return env.PLATE4_LAUNCH_APPROVED === 'true' && now >= LAUNCH_START && now < LAUNCH_END;
}

export function launchTransition(env, now) {
 if(env.PLATE4_LAUNCH_APPROVED !== 'true')return null;
 return now < LAUNCH_START ? LAUNCH_START : now < LAUNCH_END ? LAUNCH_END : null;
}

export function seedplatePaused(env) {
 return env.SEEDPLATE_SALES_PAUSED === 'true';
}
